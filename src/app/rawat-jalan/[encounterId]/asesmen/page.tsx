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
          conditionHistories: true,
          allergyIntolerances: true,
          medicationStatements: true,
        },
      },
      practitioner: {
        select: { name: true },
      },
      observations: true,
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

  const defaultValues: Record<string, any> = {
    penyakit: encounter.patient.conditionHistories
      ?.map((c) => c.description)
      .filter((v): v is string => Boolean(v)) ?? [],
    alergi: encounter.patient.allergyIntolerances
      ?.map((a) => `${a.description} (${a.reactionSeverity})`)
      .filter((v): v is string => Boolean(v)) ?? [],
    obat: encounter.patient.medicationStatements
      ?.map((m) => m.dosage ? `${m.description} (${m.dosage})` : m.description)
      .filter((v): v is string => Boolean(v)) ?? [],
    catatanPenyakit: "",
    catatanAlergi: "",
    catatanObat: "",
  };

  if (encounter.observations?.length > 0) {
    const obs = encounter.observations[0];
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
    penyakit: defaultValues.penyakit ?? [],
    alergi: defaultValues.alergi ?? [],
    obat: defaultValues.obat ?? [],
  };

  const initialPhysical = encounter.observations?.length > 0
    ? encounter.observations[0]
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
      />

      <div className="col-span-12 w-full pt-2 pb-10">
        {userRole === 'PERAWAT' ? (
          <AsesmenPerawat
            encounterId={encounterId}
            patient={encounter.patient}
            encounter={encounter}
            userRole={userRole}
            defaultValues={defaultValues}
            isEditMode={isEditMode}
          />
        ) : (
          <AsesmenDokter
            encounterId={encounterId}
            patient={encounter.patient}
            encounter={encounter}
            userRole={userRole}
            defaultValues={defaultValues}
            isEditMode={isEditMode}
            initialAssessment={initialAssessment}
            initialPhysical={initialPhysical}
          />
        )}
      </div>
    </div>
  );
}
