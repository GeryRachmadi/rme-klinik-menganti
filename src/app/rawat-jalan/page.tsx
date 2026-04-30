import { Metadata } from "next";
import DaftarAntrean from "@/components/shared/DaftarAntrean"; // Kita akan buat komponen ini setelah ini

export const metadata: Metadata = {
  title: "Rawat Jalan | RME Klinik Pratama Menganti",
};

export default function RawatJalanPage() {
  return <DaftarAntrean />;
}