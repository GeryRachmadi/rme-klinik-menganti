import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientHistoryTabs from "@/components/shared/PatientHistoryTabs";
import PatientHeader from "./components/PatientHeader";
import { auth } from "@/lib/auth";
import { mapPatientMedicalRecords, mapRingkasanData } from "@/lib/mappers/medical-records-mapper";

export default async function RiwayatMedisPage({
  params,
}: {
  params: Promise<{ noRm: string }>;
}) {
  const { noRm } = await params;

  const session = await auth();
  const userRole = (session?.user as any)?.role || "";

  const patient = await prisma.patient.findUnique({
    where: { noRm },
    include: {
      conditionHistories: true,
      allergyIntolerances: true,
      medicationStatements: true,
      encounters: {
        take: 50,
        orderBy: { periodStart: "desc" },
        include: {
          practitioner: true,
          observations: {
            orderBy: { createdAt: "desc" },
          },
          conditionDiagnoses: true,
          medicationRequests: true,
          procedures: true,
        },
      },
    },
  });
  if (!patient) notFound();

  const mappedData = mapPatientMedicalRecords(patient, userRole);
  const ringkasanData = mapRingkasanData(patient);

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Rekam Medis", href: "/rekam-medis" },
          { label: patient.noRm },
        ]}
      />

      {/* Page Header */}
      <PatientHeader patient={patient} userRole={userRole} />

      {/* Tabs */}
      <PatientHistoryTabs 
        patient={patient} 
        hasMedicalRecord={mappedData.hasMedicalRecord}
        clinicalSummary={mappedData.clinicalSummary}
        encounters={mappedData.encounters}
        conditions={mappedData.conditions}
        allergies={mappedData.allergies}
        medications={mappedData.medications}
        ringkasan={ringkasanData}
        userRole={userRole}
      />

    </div>
  );
}