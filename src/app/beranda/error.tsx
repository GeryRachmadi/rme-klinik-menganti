"use client";

import { AlertTriangle } from "lucide-react";

export default function BerandaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#F8FAFC]"
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      <div className="flex flex-col items-center gap-4 p-10 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h2
          className="text-lg font-semibold text-gray-800"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          Gagal Memuat Data
        </h2>
        <p className="text-sm text-[#64748B]">
          Gagal memuat data. Silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="mt-2 px-6 py-2.5 rounded-full bg-[#2BB5A0] hover:bg-[#009E95] text-white text-sm font-semibold transition-colors"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
