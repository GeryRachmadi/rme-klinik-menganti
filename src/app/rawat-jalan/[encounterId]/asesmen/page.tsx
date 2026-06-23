import { type Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientAssessmentHeader from "./components/PatientAssessmentHeader";
import AsesmenPerawat from "./components/AsesmenPerawat";
import AsesmenDokter from "./components/AsesmenDokter";
import PrintableDocument from "@/app/riwayat-medis/[noRm]/components/PrintableDocument";
import { mapRingkasanData, mapEncounterTimeline } from "@/lib/mappers/medical-records-mapper";
import { calculateAge } from "@/lib/utils/date";
import { parseFamilyHistory } from "@/lib/utils/family-history";
import { parseNursingAssessment } from "@/lib/utils/nursing-assessment";
import { parseRacikanContainer } from "@/lib/utils/racikan-container";

export const metadata: Metadata = {
  title: "Asesmen | RME Klinik Pratama Menganti",
};

const ALLOWED_ROLES = ["ADMIN", "DOKTER", "PERAWAT", "PENDAFTARAN"];
const ACTIVE_STATUSES = ["MENUNGGU", "DIPERIKSA", "SELESAI"];

export default async function AsesmenPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/");

  const userRole = session.user?.role as string;
  if (!ALLOWED_ROLES.includes(userRole)) redirect("/");

  const { encounterId } = await params;

  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: {
        select: {
          noRm: true,
          namaLengkap: true,
          tanggalLahir: true,
          jenisKelamin: true,
          nik: true,
          ihs: true,
          conditionHistories: true,
          allergyIntolerances: true,
          medicationStatements: true,
        },
      },
      practitioner: {
        select: { name: true, speciality: true },
      },
      observations: true,
      conditionDiagnoses: { orderBy: { id: 'asc' } },
      procedures: true,
      medicationRequests: true,
      serviceRequests: { take: 1 },
    },
  });

  if (!encounter) notFound();

  if (!ACTIVE_STATUSES.includes(encounter.status)) {
    redirect("/rawat-jalan");
  }

  // Item 17 data-isolation: a nurse may only open encounters explicitly
  // assigned to them. ADMIN and DOKTER bypass this check. perawatId === null
  // (unassigned) is correctly rejected by the strict !== comparison below.
  if (userRole === "PERAWAT") {
    const account = await prisma.account.findUnique({
      where: { username: session.user?.username as string },
      include: { practitioner: true },
    });
    if (encounter.perawatId !== account?.practitioner?.id) {
      redirect("/");
    }
  }

  // CPPT history (Item 12) — past visit timeline for the auto-popup modal shown
  // to the doctor before assessing. mapEncounterTimeline filters to SELESAI/BATAL
  // only, so the current DIPERIKSA encounter is naturally excluded.
  const patientWithHistory = await prisma.patient.findUnique({
    where: { id: encounter.patientId },
    include: {
      encounters: {
        include: {
          practitioner: true,
          observations: true,
          conditionDiagnoses: true,
          procedures: true,
          medicationRequests: true,
          serviceRequests: true,
        },
      },
    },
  });
  const cpptTimeline = patientWithHistory
    ? mapEncounterTimeline(patientWithHistory)
    : [];

  // Role check for assessment access
  if (!["PERAWAT", "DOKTER", "ADMIN"].includes(userRole)) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg text-red-600">
        <h2 className="text-lg font-bold mb-2">Unauthorized access</h2>
        <p>Anda tidak memiliki izin untuk mengakses halaman asesmen.</p>
      </div>
    );
  }

  const age = calculateAge(encounter.patient.tanggalLahir);

  const penyakitList = encounter.patient.conditionHistories
    ?.map((c) => c.description)
    .filter((v): v is string => Boolean(v)) ?? [];
  const alergiList = encounter.patient.allergyIntolerances
    ?.map((a) => a.reactionSeverity ? `${a.description} (${a.reactionSeverity})` : a.description)
    .filter((v): v is string => Boolean(v)) ?? [];
  const obatList = encounter.patient.medicationStatements
    ?.map((m) => m.dosage ? `${m.description} (${m.dosage})` : m.description)
    .filter((v): v is string => Boolean(v)) ?? [];

  // Hydrate section-level catatan from this encounter's own fields (BB-08.15).
  // These live on the Encounter (episodic), independent of chip rows, so a
  // catatan-only submission round-trips correctly.
  const catatanPenyakit = encounter.riwayatPenyakitNotes ?? "";
  const catatanAlergi = encounter.riwayatAlergiNotes ?? "";
  const catatanObat = encounter.pengobatanRutinNotes ?? "";

  // Family history (UAT Phase 2 Item 19) is stored as a single JSON string on
  // the encounter — parse it back into chips + catatan + tidakAda.
  const familyHistory = parseFamilyHistory(encounter.riwayatPenyakitKeluarga);
  const keluargaList = familyHistory?.chips ?? [];
  const catatanKeluarga = familyHistory?.catatan ?? "";

  // Asesmen Keperawatan (UAT Phase 2 Item 14) — parse the JSON string into
  // structured form for NursingDiagnosisForm hydration.
  const nursingAssessment = parseNursingAssessment(encounter.asesmenKeperawatan);

  const defaultValues: Record<string, any> = {
    penyakit: penyakitList,
    alergi: alergiList,
    obat: obatList,
    keluarga: keluargaList,
    catatanPenyakit,
    catatanAlergi,
    catatanObat,
    catatanKeluarga,
    nursingAssessment: {
      diagnoses: nursingAssessment?.diagnoses ?? [],
      catatan: nursingAssessment?.catatan ?? "",
    },
  };

  // Infer NKA/tidak-ada booleans for DIPERIKSA/SELESAI encounters.
  // A section is "tidak ada" only when it has NO chips AND NO catatan — a
  // catatan-only section was deliberate input, not a negation (BB-08.6).
  if (encounter.status !== 'MENUNGGU') {
    defaultValues.tidakAdaPenyakit = penyakitList.length === 0 && !catatanPenyakit;
    defaultValues.tidakAdaAlergi = alergiList.length === 0 && !catatanAlergi;
    defaultValues.tidakAdaObat = obatList.length === 0 && !catatanObat;
    // Family history persists its negation flag explicitly in the JSON, so use it
    // directly rather than inferring (an empty parse yields false).
    defaultValues.tidakAdaKeluarga = familyHistory?.tidakAda ?? false;
  }

  const mainObs = encounter.observations?.find(
    (o) => !o.notes?.startsWith('[Edukasi Pasien]:')
  ) ?? null;

  if (mainObs) {
    const obs = mainObs;
    if (obs.systolic !== null && obs.diastolic !== null) {
      defaultValues.tekananDarah = `${obs.systolic}/${obs.diastolic}`;
    }
    if (obs.temperature !== null) defaultValues.suhu = obs.temperature.toString();
    if (obs.heartRate !== null) defaultValues.nadi = obs.heartRate.toString();
    if (obs.respiratoryRate !== null) defaultValues.napas = obs.respiratoryRate.toString();
    if (obs.height !== null) defaultValues.tinggiBadan = obs.height.toString();
    if (obs.weight !== null) defaultValues.beratBadan = obs.weight.toString();
    if (obs.bmi !== null) defaultValues.bmi = obs.bmi;
  }

  if (encounter.pemeriksaanFisikNotes) {
    defaultValues.catatan = encounter.pemeriksaanFisikNotes;
  }

  const isEditMode = encounter.status === 'DIPERIKSA';

  const initialAssessment = {
    penyakit: penyakitList,
    alergi: alergiList,
    obat: obatList,
  };

  const initialPhysical = mainObs;

  // Parse saved clinical data for SELESAI read-only view
  let pemeriksaanFisikTambahan = '';
  if (mainObs?.notes) {
    const marker = '\n\n[Catatan Dokter]: ';
    const idx = mainObs.notes.indexOf(marker);
    if (idx !== -1) pemeriksaanFisikTambahan = mainObs.notes.slice(idx + marker.length);
  }

  const savedHasilPeriksa = {
    keluhanUtama: encounter.reasonCode ?? '',
    pemeriksaanFisikTambahan,
  };

  const eduObs = encounter.observations?.find((o) =>
    o.notes?.startsWith('[Edukasi Pasien]: ')
  );
  const anjuranEdukasi = eduObs?.notes
    ? eduObs.notes.slice('[Edukasi Pasien]: '.length)
    : '';

  const savedDiagnoses = encounter.conditionDiagnoses?.map((d) => ({
    code: d.codeIcd10,
    display: d.display,
    notes: d.notes ?? undefined,
  })) ?? [];

  const savedProcedures = encounter.procedures?.map((p) => ({
    codeIcd9: p.codeIcd9 ?? 'MANUAL',
    display: p.display,
    notes: p.notes ?? '',
  })) ?? [];

  const firstRujukan = encounter.serviceRequests?.[0] ?? null;
  const savedPlan = {
    procedures: savedProcedures,
    // Non-Racikan: one MedicationRequest row per drug, flat (no JSON) — the
    // dedicated columns hold the structured fields directly. Legacy rows saved
    // under the old free-text textarea have no structured columns populated, so
    // they surface as a single item with the old text as namaObat and blank
    // structured fields (the doctor fills those in before resaving).
    nonRacikanItems: encounter.medicationRequests
      ?.filter((m) => !m.isRacikan)
      .map((m) => ({
        namaObat: m.medication,
        dosis: m.dosage ?? '',
        jumlah: m.jumlahRacikan ?? 1,
        bentukSediaan: m.bentukRacikan ?? '',
        aturanPakai: m.aturanPakai ?? '',
        waktuKonsumsi: m.waktuKonsumsi ?? '',
      })) ?? [],
    // Container-level fields prefer the dedicated DB columns (always populated,
    // both for new JSON-in-`medication` rows and legacy single-drug rows).
    // Ingredients come from parsing `medication`: new rows hold the full
    // ingredients array as JSON; legacy rows fall back to a single ingredient
    // built from the old flat drug-name string (Item 13 rebuild).
    racikanItems: encounter.medicationRequests
      ?.filter((m) => m.isRacikan)
      .map((m) => {
        const parsed = parseRacikanContainer(m.medication);
        return {
          namaRacikan: parsed?.namaRacikan ?? '',
          bentukSediaan: m.bentukRacikan ?? parsed?.bentukSediaan ?? '',
          jumlah: m.jumlahRacikan ?? parsed?.jumlah ?? 1,
          aturanPakai: m.aturanPakai ?? parsed?.aturanPakai ?? '',
          waktuKonsumsi: m.waktuKonsumsi ?? parsed?.waktuKonsumsi ?? '',
          ingredients: parsed?.ingredients ?? [{ namaObat: m.medication, dosis: '' }],
        };
      }) ?? [],
    anjuranEdukasi,
    instruksiLab: encounter.instruksiLab ?? '',
    rujukan: firstRujukan
      ? { isActive: true, tujuanRujukan: firstRujukan.intent, alasanRujukan: firstRujukan.note ?? '' }
      : { isActive: false, tujuanRujukan: '', alasanRujukan: '' },
  };

  // Print document (Cetak) is available only once the encounter is SELESAI,
  // and only for clinicians/admin (mirrors the riwayat-medis restriction —
  // perawat is excluded).
  // Reuse mapRingkasanData by handing it a patient-shaped object whose single
  // encounter is THIS visit — the mapper snapshots the latest SELESAI encounter
  // into the same RingkasanData the riwayat-medis print document consumes.
  const canPrint =
    encounter.status === 'SELESAI' &&
    ['DOKTER', 'ADMIN'].includes(userRole);
  const printRingkasan = canPrint
    ? mapRingkasanData({
        encounters: [encounter],
        conditionHistories: encounter.patient.conditionHistories,
        allergyIntolerances: encounter.patient.allergyIntolerances,
        medicationStatements: encounter.patient.medicationStatements,
      })
    : null;

  return (
    <div className="grid grid-cols-12 gap-6">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/beranda" },
          { label: "Rawat Jalan", href: "/rawat-jalan" },
          { label: "Daftar Antrean", href: "/rawat-jalan" },
          { label: encounter.patient.namaLengkap },
          { label: "Asesmen" },
        ]}
      />

      <PatientAssessmentHeader
        patient={{
          namaLengkap: encounter.patient.namaLengkap,
          noRm: encounter.patient.noRm,
          nik: encounter.patient.nik,
          jenisKelamin: encounter.patient.jenisKelamin,
        }}
        encounter={{
          periodStart: encounter.periodStart,
          reasonCode: encounter.reasonCode,
          practitioner: encounter.practitioner,
        }}
        age={age}
        tanggalLahir={encounter.patient.tanggalLahir}
        canPrint={canPrint}
        cpptTimeline={cpptTimeline}
        encounterStatus={encounter.status}
        userRole={userRole}
      />

      <div className="col-span-12 w-full pt-2 pb-10">
        {userRole === 'PERAWAT' ? (
          <AsesmenPerawat
            encounterId={encounterId}
            patient={encounter.patient}
            encounter={encounter}
            encounterStatus={encounter.status}
            userRole={userRole}
            defaultValues={defaultValues}
            isEditMode={isEditMode}
          />
        ) : (
          <AsesmenDokter
            encounterId={encounterId}
            patient={encounter.patient}
            encounter={encounter}
            encounterStatus={encounter.status}
            userRole={userRole}
            defaultValues={defaultValues}
            isEditMode={isEditMode}
            initialAssessment={initialAssessment}
            initialPhysical={initialPhysical}
            savedDiagnoses={savedDiagnoses}
            savedHasilPeriksa={savedHasilPeriksa}
            savedPlan={savedPlan}
            syncStatus={encounter.syncStatus}
            patientIhs={encounter.patient.ihs ?? null}
          />
        )}
      </div>

      {/* Print-only document (portaled to <body>, shown via @media print).
          Triggered by the Cetak button in the header when SELESAI. */}
      {canPrint && printRingkasan && (
        <PrintableDocument
          patient={{
            namaLengkap: encounter.patient.namaLengkap,
            noRm: encounter.patient.noRm,
            nik: encounter.patient.nik,
            tanggalLahir: encounter.patient.tanggalLahir,
            jenisKelamin: encounter.patient.jenisKelamin,
          }}
          data={printRingkasan}
        />
      )}
    </div>
  );
}
