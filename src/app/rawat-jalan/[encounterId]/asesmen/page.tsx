import { type Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PatientAssessmentHeader from "./components/PatientAssessmentHeader";
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

      <div className="col-span-12 max-w-6xl mx-auto w-full px-4 py-2">
        <div className="h-px bg-gray-200 mb-6" />

        <div
          className="bg-slate-50 p-8 rounded-lg text-center text-gray-500 text-sm"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Formulir akan ditambahkan di TR-57
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled
            className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-full h-[44px]"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Simpan & Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}
