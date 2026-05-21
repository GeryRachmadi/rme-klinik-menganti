import { type Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientAssessmentHeader from "./components/PatientAssessmentHeader";
import AsesmenPerawat from "./components/AsesmenPerawat";
import AsesmenDokter from "./components/AsesmenDokter";
import { calculateAge } from "@/lib/utils/date";

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
        select: { name: true },
      },
      observations: true,
      conditionDiagnoses: { orderBy: { id: 'asc' } },
      procedures: true,
      medicationRequests: { take: 1 },
      serviceRequests: { take: 1 },
    },
  });

  if (!encounter) notFound();

  if (!ACTIVE_STATUSES.includes(encounter.status)) {
    redirect("/rawat-jalan");
  }

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
    ?.map((a) => `${a.description} (${a.reactionSeverity})`)
    .filter((v): v is string => Boolean(v)) ?? [];
  const obatList = encounter.patient.medicationStatements
    ?.map((m) => m.dosage ? `${m.description} (${m.dosage})` : m.description)
    .filter((v): v is string => Boolean(v)) ?? [];

  const defaultValues: Record<string, any> = {
    penyakit: penyakitList,
    alergi: alergiList,
    obat: obatList,
    catatanPenyakit: "",
    catatanAlergi: "",
    catatanObat: "",
  };

  // Infer NKA/tidak-ada booleans for DIPERIKSA/SELESAI encounters
  // (when form was submitted, empty array means the "tidak ada" checkbox was checked)
  if (encounter.status !== 'MENUNGGU') {
    defaultValues.tidakAdaPenyakit = penyakitList.length === 0;
    defaultValues.tidakAdaAlergi = alergiList.length === 0;
    defaultValues.tidakAdaObat = obatList.length === 0;
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
    medicationText: encounter.medicationRequests?.[0]?.medication ?? '',
    anjuranEdukasi,
    rujukan: firstRujukan
      ? { isActive: true, tujuanRujukan: firstRujukan.intent, alasanRujukan: firstRujukan.note ?? '' }
      : { isActive: false, tujuanRujukan: '', alasanRujukan: '' },
  };

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
    </div>
  );
}
