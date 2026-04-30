import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DaftarAntrean from "@/components/shared/DaftarAntrean";

export const metadata: Metadata = {
  title: "Rawat Jalan | RME Klinik Pratama Menganti",
};

export default async function RawatJalanPage() {
  // Ambil sesi user yang sedang login
  const session = await auth();

  // Kalau belum login, lempar ke halaman login
  if (!session) {
    redirect("/login");
  }

  // Ambil role-nya
  const userRole = session.user?.role as string;

  // Kirim role sebagai props
  return <DaftarAntrean userRole={userRole} />;
}