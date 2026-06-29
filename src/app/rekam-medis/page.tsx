import { Metadata } from "next";
import { auth } from "@/lib/auth";
import DaftarPasien from "@/components/shared/DaftarPasien";

export const metadata: Metadata = {
  title: "Rekam Medis | RME Klinik Pratama Menganti",
};

export default async function RekamMedisPage() {
  const session = await auth();
  return <DaftarPasien role={session?.user?.role} />;
}
