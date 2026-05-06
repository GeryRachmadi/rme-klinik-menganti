import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientHistoryTabs from "@/components/shared/PatientHistoryTabs";
import PatientHeader from "./components/PatientHeader";
import { auth } from "@/lib/auth";

export default async function RiwayatMedisPage({
  params,
}: {
  params: Promise<{ noRm: string }>;
}) {
  const { noRm } = await params;

  const session = await auth();
  const userRole = (session?.user as any)?.role || "";

  const patient = await prisma.patient.findUnique({ where: { noRm } });
  if (!patient) notFound();

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
      <PatientHistoryTabs patient={patient} />

    </div>
  );
}