import { Metadata } from "next";
import DaftarPasien from "@/components/shared/DaftarPasien";

export const metadata: Metadata = {
  title: "Rekam Medis | RME Klinik Pratama Menganti",
};

export default function RekamMedisPage() {
  return <DaftarPasien />;
}
