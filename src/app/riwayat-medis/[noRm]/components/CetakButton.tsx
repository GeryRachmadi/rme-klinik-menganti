"use client";

import { Printer } from "lucide-react";

/**
 * "Cetak" action — triggers the browser print dialog. The actual printed
 * content is the always-rendered <PrintableDocument /> (portaled to body,
 * shown only via @media print). Visibility (DOKTER/ADMIN + a SELESAI encounter
 * exists) is decided by the parent PatientHeader.
 */
interface CetakButtonProps {
  // "sm" (default) matches the riwayat-medis header; "lg" matches the larger
  // sibling buttons (CPPT / Lihat Detail Profil) in the asesmen header.
  size?: "sm" | "lg";
}

export default function CetakButton({ size = "sm" }: CetakButtonProps) {
  const isLg = size === "lg";
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`flex items-center gap-2 rounded-full border border-[#2BB5A0] text-[#2BB5A0] font-semibold hover:bg-[#E6F5F4] transition-colors shrink-0 ${
        isLg ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
      }`}
      style={{ fontFamily: "var(--font-poppins)" }}
    >
      <Printer size={isLg ? 20 : 15} strokeWidth={2} />
      Cetak
    </button>
  );
}
