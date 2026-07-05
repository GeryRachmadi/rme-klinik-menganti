import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientHistoryTabs from "@/components/shared/PatientHistoryTabs";
import PatientHeader from "./components/PatientHeader";
import PrintableDocument from "./components/PrintableDocument";
import { auth } from "@/lib/auth";
import { mapPatientMedicalRecords, mapRingkasanData, mapEncounterTimeline } from "@/lib/mappers/medical-records-mapper";

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
          serviceRequests: true,
        },
      },
    },
  });
  if (!patient) notFound();

  // Front desk (PENDAFTARAN) gets demographic data only — clinical records are
  // never serialized to their browser (least-privilege / medical privacy).
  const isPendaftaran = userRole.toUpperCase() === "PENDAFTARAN";

  const mappedData = mapPatientMedicalRecords(patient, userRole);
  const ringkasanData = mapRingkasanData(patient);
  const encounterTimeline = mapEncounterTimeline(patient);

  // Latest Diagnosis & Treatment summary for the Patient Header banner (UAT H6 Sev2).
  const latestDiagnosis = ringkasanData.episodic?.diagnoses?.[0]
    ? `${ringkasanData.episodic.diagnoses[0].code} — ${ringkasanData.episodic.diagnoses[0].display}`
    : null;
  const firstMedication = ringkasanData.episodic?.medications?.[0] ?? null;
  const latestTreatment =
    ringkasanData.episodic?.procedures?.[0]?.display ??
    (firstMedication
      ? firstMedication.type === "racikan"
        ? firstMedication.namaRacikan
        : firstMedication.type === "non-racikan"
          ? firstMedication.namaObat
          : null
      : null) ??
    null;

  // Components only need demographic scalars — strip the included clinical
  // relations so they are never serialized into the client payload.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { conditionHistories, allergyIntolerances, medicationStatements, encounters, ...patientDemographic } = patient;

  const clinicalProps = isPendaftaran
    ? {}
    : {
        hasMedicalRecord: mappedData.hasMedicalRecord,
        clinicalSummary: mappedData.clinicalSummary,
        encounterTimeline,
        conditions: mappedData.conditions,
        allergies: mappedData.allergies,
        medications: mappedData.medications,
        conditionNote: mappedData.conditionNote,
        conditionNoteDate: mappedData.conditionNoteDate,
        allergyNote: mappedData.allergyNote,
        allergyNoteDate: mappedData.allergyNoteDate,
        medicationNote: mappedData.medicationNote,
        medicationNoteDate: mappedData.medicationNoteDate,
        familyHistory: mappedData.familyHistory,
        familyHistoryDate: mappedData.familyHistoryDate,
        ringkasan: ringkasanData,
      };

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
      <PatientHeader
        patient={patientDemographic}
        userRole={userRole}
        latestDiagnosis={isPendaftaran ? null : latestDiagnosis}
        latestTreatment={isPendaftaran ? null : latestTreatment}
      />

      {/* Tabs */}
      <PatientHistoryTabs
        patient={patientDemographic}
        userRole={userRole}
        {...clinicalProps}
      />

      {/* Print-only document (portaled to <body>, shown via @media print).
          Gated identically to the Cetak button: clinicians/admin + a completed
          visit (latestDiagnosis non-null). */}
      {!isPendaftaran && latestDiagnosis && (
        <PrintableDocument patient={patientDemographic} data={ringkasanData} />
      )}

    </div>
  );
}