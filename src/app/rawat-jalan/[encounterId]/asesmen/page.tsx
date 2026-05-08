import { type Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientAssessmentHeader from "./components/PatientAssessmentHeader";
import AssessmentForm from "./components/AssessmentForm";
import { calculateAge } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Asesmen | RME Klinik Pratama Menganti",
};

const ALLOWED_ROLES = ["ADMIN", "DOKTER", "PERAWAT"];
const ACTIVE_STATUSES = ["MENUNGGU", "DIPERIKSA"];

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
    },
  });

  if (!encounter) notFound();

  if (!ACTIVE_STATUSES.includes(encounter.status)) {
    redirect("/rawat-jalan");
  }

  const age = calculateAge(encounter.patient.tanggalLahir);

  const defaultValues = {
    penyakit: encounter.patient.conditionHistories?.map((c: any) => c.name) || [],
    alergi: encounter.patient.allergyIntolerances?.map((a: any) => `${a.name} (${a.criticality})`) || [],
    obat: encounter.patient.medicationStatements?.map((m: any) => `${m.name} (${m.dosage})`) || [],
    catatanPenyakit: "",
    catatanAlergi: "",
    catatanObat: "",
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

      {/* Kita hapus max-w-6xl, mx-auto, dan px-4 agar rata dengan Header */}
      <div className="col-span-12 w-full pt-2 pb-10">
        <div className="h-px bg-gray-200 mb-6" />

        <AssessmentForm encounterId={encounterId} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
