import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { assessmentData, physicalData, hasilPeriksaData, selectedDiagnoses, plan } = body;

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
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

      // Step 4: Replace medication (delete existing, insert new if provided)
      await tx.medicationRequest.deleteMany({ where: { encounterId } });
      const medicationText: string | undefined = plan?.medication?.medicationText?.trim();
      if (medicationText) {
        await tx.medicationRequest.create({
          data: {
            encounterId,
            medication: medicationText,
          },
        });
      }

      // Step 5: Replace referral (delete existing; create only if isActive=true)
      await tx.serviceRequest.deleteMany({ where: { encounterId } });
      if (plan?.rujukan?.isActive === true) {
        await tx.serviceRequest.create({
          data: {
            encounterId,
            intent: plan.rujukan.tujuanRujukan?.trim() || "Tidak ditentukan",
            note: plan.rujukan.alasanRujukan?.trim() || null,
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

      // Step 7: Mark encounter as SELESAI
      await tx.encounter.update({
        where: { id: encounterId },
        data: {
          reasonCode: hasilPeriksaData?.keluhanUtama ?? null,
          status: "SELESAI",
          updatedAt: new Date(),
        },
      });
    });

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
