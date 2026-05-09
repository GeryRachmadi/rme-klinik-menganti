import { type Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientAssessmentHeader from "./components/PatientAssessmentHeader";
import AssessmentForm from "./components/AssessmentForm";
import PhysicalExamForm from "./components/PhysicalExamForm";
import { calculateAge } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Asesmen | RME Klinik Pratama Menganti",
};

const ALLOWED_ROLES = ["ADMIN", "DOKTER", "PERAWAT", "PENDAFTARAN"];
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

  const canEditAssessment = ['DOKTER', 'PERAWAT', 'ADMIN'].includes(userRole);

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

      <div className="col-span-12 w-full pt-2 pb-10 space-y-10">
        <div>
          <div className="h-px bg-gray-200 mb-6" />
          <AssessmentForm
            encounterId={encounterId}
            defaultValues={defaultValues}
            isEditMode={encounter.status === 'DIPERIKSA'}
          />
        </div>

        <div>
          <div className="h-px bg-gray-200 mb-6" />
          <PhysicalExamForm
            encounterId={encounterId}
            patient={{
              namaLengkap: encounter.patient.namaLengkap,
              noRm: encounter.patient.noRm,
            }}
            encounter={{
              periodStart: encounter.periodStart,
              reasonCode: encounter.reasonCode,
            }}
            isEditMode={encounter.status === 'DIPERIKSA'}
            canEdit={canEditAssessment}
          />
        </div>
      </div>
    </div>
  );
}
