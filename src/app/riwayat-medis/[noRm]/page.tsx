import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientHistoryTabs from "@/components/shared/PatientHistoryTabs";

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function genderLabel(g: string) {
  return g === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
}

export default async function RiwayatMedisPage({
  params,
}: {
  params: Promise<{ noRm: string }>;
}) {
  const { noRm } = await params;

  const patient = await prisma.patient.findUnique({ where: { noRm } });
  if (!patient) notFound();

  const dob = new Date(patient.tanggalLahir);

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
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {patient.namaLengkap}
            </h1>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                patient.jenisPasien === "UMUM"
                  ? "bg-green-50 text-green-600"
                  : "bg-blue-50 text-blue-500"
              }`}
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {patient.jenisPasien}
            </span>
          </div>
          <p
            className="text-sm text-gray-400"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            No. RM:{" "}
            <span className="font-bold text-[#2BB5A0]">{patient.noRm}</span>
            {" · "}
            {genderLabel(patient.jenisKelamin)}, {calcAge(dob)} tahun
          </p>
        </div>

        <div
          className="flex items-center justify-center w-14 h-14 rounded-full text-white text-xl font-bold flex-shrink-0"
          style={{ background: "#2BB5A0", fontFamily: "var(--font-poppins)" }}
        >
          {patient.namaLengkap
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("")}
        </div>
      </div>

      {/* Tabs */}
      <PatientHistoryTabs patient={patient} />

    </div>
  );
}
