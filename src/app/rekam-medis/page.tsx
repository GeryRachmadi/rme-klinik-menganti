import { Metadata } from "next";
import DaftarPasien from "@/components/shared/DaftarPasien";
import { prisma as db } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Rekam Medis | RME Klinik Pratama Menganti",
};

export default async function RekamMedisPage() {
  const patients = await db.patient.findMany({ orderBy: { createdAt: "desc" } });
  return <DaftarPasien patients={patients} />;
}
