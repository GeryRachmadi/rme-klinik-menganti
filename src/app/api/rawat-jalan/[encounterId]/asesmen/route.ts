import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeActivityLog } from "@/lib/activity-log";
import { parseAllergyChip, parseMedicationChip } from "@/lib/utils/assessment-parser";
import { serializeFamilyHistory } from "@/lib/utils/family-history";
import { serializeNursingAssessment } from "@/lib/utils/nursing-assessment";
import { serializeRacikanContainer, type RacikanContainer } from "@/lib/utils/racikan-container";
import type { NonRacikanItem } from "@/lib/schemas/plan-schema";

const DISCHARGE_DISPOSITION_ENUM: Record<string, string> = {
  "Pulang": "home",
  "Dirujuk ke Fasilitas Lain": "other_hcf",
  "Pulang Atas Permintaan Sendiri": "aadvice",
  "Meninggal Dunia": "exp",
  "Lain-lain": "oth",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role;
  if (!["DOKTER", "ADMIN"].includes(userRole)) {
    return Response.json(
      { error: "Hanya dokter yang dapat menyimpan diagnosis" },
      { status: 403 }
    );
  }

  const { encounterId } = await params;

  try {
    const body = await request.json();
    const { assessmentData, physicalData, hasilPeriksaData, nursingData, selectedDiagnoses, plan } = body;

    // Asesmen Keperawatan (Item 14) is SOFT on the doctor route — mirrors the
    // Kajian Awal override: the doctor may complete an encounter the nurse left
    // unassessed (e.g. covering for an absent nurse). No guard here; whatever value
    // is provided (including null) is serialized below. The NURSE route keeps the
    // hard mandatory guard.

    // Conditional Rencana Pemulangan guard: "Dirujuk" must carry both Tujuan and
    // Alasan — blocks empty ServiceRequest creation server-side (BB-11.14).
    // "Lain-lain" must carry a free-text dischargeReason.
    const rencanaLabel: string = plan?.rencanaPemulangan?.label ?? "";
    if (rencanaLabel === "Dirujuk ke Fasilitas Lain") {
      const tujuan = typeof plan.rencanaPemulangan.tujuanRujukan === "string" ? plan.rencanaPemulangan.tujuanRujukan.trim() : "";
      const alasan = typeof plan.rencanaPemulangan.alasanRujukan === "string" ? plan.rencanaPemulangan.alasanRujukan.trim() : "";
      if (!tujuan || !alasan) {
        return Response.json(
          { error: "Tujuan dan Alasan Rujukan wajib diisi" },
          { status: 400 }
        );
      }
    }
    if (rencanaLabel === "Lain-lain") {
      const reason = typeof plan.rencanaPemulangan.dischargeReason === "string" ? plan.rencanaPemulangan.dischargeReason.trim() : "";
      if (!reason) {
        return Response.json(
          { error: "Keterangan Rencana Pemulangan wajib diisi" },
          { status: 400 }
        );
      }
    }

    // Mandatory Plan content guard (H5 Sev2, PIC request): Tindakan, Resep, and
    // Edukasi are all required. Mirrors the client PlanFormSchema exactly — manual
    // tindakan entries live inside procedures (codeIcd9 "MANUAL"), so a non-empty
    // procedures array is the single definition of "Tindakan present" on both sides.
    if (!plan?.procedure?.procedures?.length) {
      return Response.json({ error: "Tindakan Medis wajib diisi" }, { status: 400 });
    }
    const hasNonRacikan = Array.isArray(plan?.medication?.nonRacikanItems)
      && plan.medication.nonRacikanItems.length > 0;
    const hasRacikan = Array.isArray(plan?.medication?.racikanItems)
      && plan.medication.racikanItems.length > 0;
    const tidakAdaResep = plan?.medication?.tidakAdaResep === true;
    if (!hasNonRacikan && !hasRacikan && !tidakAdaResep) {
      return Response.json({ error: "Resep Obat wajib diisi" }, { status: 400 });
    }
    if (!plan?.edukasi?.anjuranEdukasi?.trim()) {
      return Response.json({ error: "Edukasi / Anjuran wajib diisi" }, { status: 400 });
    }
    // Instruksi Lab (H2 Sev3) is a permanent, mandatory Plan fixture — mirrors the
    // Edukasi guard. The doctor must type something explicit (even "-"), never blank.
    if (!plan?.labInstruction?.instruksiLab?.trim()) {
      return Response.json({ error: "Instruksi Lab wajib diisi" }, { status: 400 });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: { select: { namaLengkap: true, noRm: true } } },
    });

    if (!encounter) {
      return Response.json({ error: "Data kunjungan tidak ditemukan" }, { status: 404 });
    }

    const allowedStatuses = userRole === 'ADMIN'
      ? ["MENUNGGU", "DIPERIKSA", "SELESAI"]
      : ["MENUNGGU", "DIPERIKSA"];
    if (!allowedStatuses.includes(encounter.status)) {
      return Response.json(
        { error: "Status kunjungan tidak valid untuk input diagnosis" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Step 0: Persist Kajian Awal chips (patient-scoped longitudinal records).
      // The doctor flow posts RAW, unparsed chips (e.g. "Amoxicillin (Tinggi)",
      // "Paracetamol (500mg)"), whereas the nurse route receives them pre-parsed —
      // so parse server-side here before writing. These models carry patientId and
      // NO encounterId, so a deleteMany({ patientId }) would wipe the patient's
      // history from OTHER visits. Instead, insert-if-not-exists keyed on
      // (patientId, description): the doctor form arrives pre-filled with the
      // nurse's chips, and dedup-on-bare-name prevents re-saves from duplicating
      // them. When a bare name already exists, allergy severity / medication dosage
      // is updated in place if it changed (so the doctor can correct what the nurse
      // entered) — ConditionHistory has no such field, so it stays skip-only.
      // Section-level catatan is persisted to the Encounter (Step 7), so chip rows
      // store notes: null to avoid double-writing stale notes on re-save.
      const patientId = encounter.patientId;

      const penyakitChips: string[] = Array.isArray(assessmentData?.penyakit) ? assessmentData.penyakit : [];
      const alergiChips: string[] = Array.isArray(assessmentData?.alergi) ? assessmentData.alergi : [];
      const obatChips: string[] = Array.isArray(assessmentData?.obat) ? assessmentData.obat : [];

      if (penyakitChips.length > 0) {
        const existing = await tx.conditionHistory.findMany({ where: { patientId }, select: { description: true } });
        const seen = new Set(existing.map((e) => e.description.trim().toLowerCase()));
        const rows: { patientId: string; description: string; clinicalStatus: string; notes: null }[] = [];
        for (const raw of penyakitChips) {
          const name = raw.trim();
          const key = name.toLowerCase();
          if (!name || seen.has(key)) continue;
          seen.add(key);
          rows.push({ patientId, description: name, clinicalStatus: "ACTIVE", notes: null });
        }
        if (rows.length > 0) await tx.conditionHistory.createMany({ data: rows });
      }

      if (alergiChips.length > 0) {
        const existing = await tx.allergyIntolerance.findMany({ where: { patientId }, select: { description: true, reactionSeverity: true } });
        // Map bareName(lowercase) → the stored row's exact description + severity.
        // We key on lowercase for case-insensitive matching but keep the original
        // description string for the updateMany filter so casing differences don't
        // miss the row.
        const stored = new Map<string, { description: string; severity: string | null }>();
        for (const e of existing) {
          stored.set(e.description.trim().toLowerCase(), { description: e.description, severity: e.reactionSeverity ?? null });
        }
        const rows: { patientId: string; description: string; reactionSeverity: string | null; notes: null }[] = [];
        for (const chip of alergiChips) {
          const { name, severity } = parseAllergyChip(chip);
          if (!name) continue;
          const key = name.toLowerCase();
          const incoming = severity || null;
          const prev = stored.get(key);
          if (prev) {
            // Existing allergen for this patient — update only when severity changed
            // (e.g. nurse left it blank, doctor corrects it); otherwise no-op skip.
            if (prev.severity !== incoming) {
              await tx.allergyIntolerance.updateMany({
                where: { patientId, description: prev.description },
                data: { reactionSeverity: incoming },
              });
              stored.set(key, { description: prev.description, severity: incoming });
            }
            continue;
          }
          stored.set(key, { description: name, severity: incoming });
          rows.push({ patientId, description: name, reactionSeverity: incoming, notes: null });
        }
        if (rows.length > 0) await tx.allergyIntolerance.createMany({ data: rows });
      }

      if (obatChips.length > 0) {
        const existing = await tx.medicationStatement.findMany({ where: { patientId }, select: { description: true, dosage: true } });
        // Same pattern as allergy: key on lowercase bare name, keep exact stored
        // description for the updateMany filter, update only when dosage changed.
        const stored = new Map<string, { description: string; dosage: string | null }>();
        for (const e of existing) {
          stored.set(e.description.trim().toLowerCase(), { description: e.description, dosage: e.dosage ?? null });
        }
        const rows: { patientId: string; description: string; dosage: string | null; notes: null }[] = [];
        for (const chip of obatChips) {
          const { name, dosage } = parseMedicationChip(chip);
          if (!name) continue;
          const key = name.toLowerCase();
          const incoming = dosage || null;
          const prev = stored.get(key);
          if (prev) {
            if (prev.dosage !== incoming) {
              await tx.medicationStatement.updateMany({
                where: { patientId, description: prev.description },
                data: { dosage: incoming },
              });
              stored.set(key, { description: prev.description, dosage: incoming });
            }
            continue;
          }
          stored.set(key, { description: name, dosage: incoming });
          rows.push({ patientId, description: name, dosage: incoming, notes: null });
        }
        if (rows.length > 0) await tx.medicationStatement.createMany({ data: rows });
      }

      // Step 1: Replace diagnoses (delete existing, insert new)
      await tx.conditionDiagnosis.deleteMany({ where: { encounterId } });
      if (selectedDiagnoses && selectedDiagnoses.length > 0) {
        await tx.conditionDiagnosis.createMany({
          data: selectedDiagnoses.map(
            (d: { code: string; display: string; notes?: string }, idx: number) => {
              const codeIcd10 = typeof d.code === 'string' && d.code ? d.code : 'MANUAL';
              if (codeIcd10 === 'MANUAL') {
                console.warn('[asesmen] diagnosis code missing or stale — stored as MANUAL. display:', d.display);
              }
              return {
                encounterId,
                codeIcd10,
                display: d.display,
                notes: d.notes ?? null,
                isPrimary: idx === 0,
              };
            }
          ),
        });
      }

      // Step 2: Replace main Observation (vitals + doctor notes) — delete non-education obs, re-create
      await tx.observation.deleteMany({
        where: { encounterId, NOT: { notes: { startsWith: '[Edukasi Pasien]:' } } },
      });
      const doctorNotes = hasilPeriksaData?.pemeriksaanFisikTambahan?.trim() || null;
      let systolic: number | null = null;
      let diastolic: number | null = null;
      if (physicalData?.tekananDarah) {
        const [sys, dias] = (physicalData.tekananDarah as string).split("/").map(Number);
        systolic = sys || null;
        diastolic = dias || null;
      }
      await tx.observation.create({
        data: {
          encounterId,
          systolic,
          diastolic,
          temperature: physicalData?.suhu ?? null,
          heartRate: physicalData?.nadi ?? null,
          respiratoryRate: physicalData?.napas ?? null,
          height: physicalData?.tinggiBadan ?? null,
          weight: physicalData?.beratBadan ?? null,
          bmi: physicalData?.bmi ?? null,
          notes: doctorNotes,
        },
      });

      // Step 3: Replace procedures (delete existing, insert new)
      await tx.procedure.deleteMany({ where: { encounterId } });
      const procedures: Array<{ codeIcd9: string; display: string; notes?: string }> =
        plan?.procedure?.procedures ?? [];
      if (procedures.length > 0) {
        await tx.procedure.createMany({
          data: procedures.map((p) => ({
            encounterId,
            codeIcd9: p.codeIcd9 === "MANUAL" ? null : p.codeIcd9,
            display: p.display,
            notes: p.notes || null,
          })),
        });
      }

      // Step 4: Replace medication (delete existing, insert new if provided).
      // Non-Racikan saves as one row PER drug (isRacikan: false, flat — no JSON,
      // the structured fields live directly in the dedicated columns); Racikan
      // saves as one row PER container (isRacikan: true) — both can coexist
      // (Item 13 rebuild, Option A non-racikan/racikan field-array split).
      await tx.medicationRequest.deleteMany({ where: { encounterId } });
      if (tidakAdaResep) {
        // Sentinel row (Item: "Tidak ada resep obat") — explicit record that the
        // doctor actively decided no medication was needed, distinct from an
        // unfilled/blocked form (page.tsx hydration detects this exact shape).
        await tx.medicationRequest.create({
          data: {
            encounterId,
            medication: 'Tidak ada',
            isRacikan: false,
          },
        });
      } else {
      const nonRacikanItems: NonRacikanItem[] =
        Array.isArray(plan?.medication?.nonRacikanItems) ? plan.medication.nonRacikanItems : [];
      for (const item of nonRacikanItems) {
        if (!item?.namaObat?.trim()) continue;
        await tx.medicationRequest.create({
          data: {
            encounterId,
            medication: item.namaObat.trim(),
            dosage: item.dosis?.trim() || null,
            isRacikan: false,
            bentukRacikan: item.bentukSediaan ?? null,
            jumlahRacikan: typeof item.jumlah === 'number' ? item.jumlah : null,
            aturanPakai: item.aturanPakai ?? null,
            waktuKonsumsi: item.waktuKonsumsi ?? null,
          },
        });
      }

      // One row per container: `medication` holds the full ingredients array as
      // JSON (single source of truth for ingredients), while the dedicated
      // columns also get the container-level fields — kept in sync since the
      // whole row is deleted+recreated on every save, so the two copies can't
      // drift. The columns stay populated for any other reader that expects
      // them directly (Item 13 rebuild, Option A container/ingredient split).
      const racikanItems: RacikanContainer[] =
        Array.isArray(plan?.medication?.racikanItems) ? plan.medication.racikanItems : [];
      for (const item of racikanItems) {
        const cleanIngredients = (item?.ingredients ?? []).filter((ing) => ing?.namaObat?.trim());
        if (cleanIngredients.length === 0) continue;
        await tx.medicationRequest.create({
          data: {
            encounterId,
            medication: serializeRacikanContainer({ ...item, ingredients: cleanIngredients }),
            isRacikan: true,
            bentukRacikan: item.bentukSediaan ?? null,
            jumlahRacikan: typeof item.jumlah === 'number' ? item.jumlah : null,
            aturanPakai: item.aturanPakai ?? null,
            waktuKonsumsi: item.waktuKonsumsi ?? null,
          },
        });
      }
      }

      // Step 5: Replace referral (delete existing; create only when the doctor
      // picked "Dirujuk ke Fasilitas Lain" — ServiceRequest is reserved for
      // genuine referrals so /rekam-medis's "Rujukan" display is never mislabeled
      // by a "Lain-lain" or other discharge outcome).
      await tx.serviceRequest.deleteMany({ where: { encounterId } });
      if (rencanaLabel === "Dirujuk ke Fasilitas Lain") {
        await tx.serviceRequest.create({
          data: {
            encounterId,
            intent: plan.rencanaPemulangan.tujuanRujukan?.trim() || "Tidak ditentukan",
            note: plan.rencanaPemulangan.alasanRujukan?.trim() || null,
          },
        });
      }

      // Step 6: Replace education observation (delete existing, insert new if provided)
      await tx.observation.deleteMany({
        where: { encounterId, notes: { startsWith: '[Edukasi Pasien]:' } },
      });
      const edikasiText: string | undefined = plan?.edukasi?.anjuranEdukasi?.trim();
      if (edikasiText) {
        await tx.observation.create({
          data: {
            encounterId,
            notes: `[Edukasi Pasien]: ${edikasiText}`,
          },
        });
      }

      // Step 7: Mark encounter as SELESAI + persist section-level Kajian Awal notes.
      // The doctor flow carries catatan in assessmentData; store it on the encounter
      // (independent of chips) so it survives to /rekam-medis (BB-08.6 / BB-08.17).
      await tx.encounter.update({
        where: { id: encounterId },
        data: {
          dischargeDisposition: rencanaLabel
            ? (DISCHARGE_DISPOSITION_ENUM[rencanaLabel] as any) ?? null
            : null,
          dischargeReason: rencanaLabel === "Lain-lain"
            ? (plan.rencanaPemulangan.dischargeReason?.trim() || null)
            : null,
          reasonCode: hasilPeriksaData?.keluhanUtama ?? null,
          instruksiLab: plan?.labInstruction?.instruksiLab?.trim() ? plan.labInstruction.instruksiLab.trim() : null,
          riwayatPenyakitNotes: assessmentData?.catatanPenyakit?.trim() ? assessmentData.catatanPenyakit : null,
          riwayatAlergiNotes: assessmentData?.catatanAlergi?.trim() ? assessmentData.catatanAlergi : null,
          pengobatanRutinNotes: assessmentData?.catatanObat?.trim() ? assessmentData.catatanObat : null,
          riwayatPenyakitKeluarga: serializeFamilyHistory(
            assessmentData?.keluarga,
            assessmentData?.tidakAdaKeluarga,
            assessmentData?.catatanKeluarga
          ),
          asesmenKeperawatan: serializeNursingAssessment(
            nursingData?.diagnoses,
            nursingData?.catatan
          ),
          status: "SELESAI",
          updatedAt: new Date(),
        },
      });
    });

    writeActivityLog(
      session.user.id,
      "SOAP_COMPLETED",
      "Asesmen SOAP diselesaikan",
      `Pasien ${encounter.patient.namaLengkap} (${encounter.queueNumber}) · ${encounter.patient.noRm}`
    );

    return Response.json(
      { success: true, message: "Asesmen dan rencana tindak lanjut berhasil disimpan." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[TR-76] Asesmen save error:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan data ke server.";
    return Response.json({ error: message }, { status: 500 });
  }
}
