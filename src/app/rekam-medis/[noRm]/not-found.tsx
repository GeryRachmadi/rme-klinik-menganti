import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function RiwayatMedisNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ background: "#E6F5F4" }}
      >
        <FileSearch size={36} strokeWidth={1.5} className="text-[#2BB5A0]" />
      </div>

      <h1
        className="text-2xl font-bold text-gray-800 mb-2"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        Pasien Tidak Ditemukan
      </h1>

      <p
        className="text-sm text-gray-400 max-w-sm leading-relaxed mb-8"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        Nomor rekam medis yang Anda akses tidak terdaftar dalam sistem. Pastikan
        nomor rekam medis sudah benar.
      </p>

      <Link
        href="/rekam-medis"
        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
      >
        Kembali ke Daftar Rekam Medis Pasien
      </Link>
    </div>
  );
}
