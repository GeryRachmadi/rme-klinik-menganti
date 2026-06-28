"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle, X } from "lucide-react";

interface MulaiAsesmenButtonProps {
  patientId: string;
  patientName: string;
}

/**
 * "Mulai Asesmen" action. On click it checks for an active encounter today
 * (status MENUNGGU or DIPERIKSA) via the active-encounter API:
 *  - found    → navigate to the asesmen SOAP page
 *  - not found → block navigation and show an error toast
 *
 * Visibility (PENDAFTARAN excluded) is decided by the parent PatientHeader.
 */
export default function MulaiAsesmenButton({
  patientId,
  patientName,
}: MulaiAsesmenButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/active-encounter`);
      const data = await res.json();
      if (data?.success && data.encounterId) {
        router.push(`/rawat-jalan/${data.encounterId}/asesmen`);
        return;
      }
      setError(`Tidak ada kunjungan untuk ${patientName} saat ini.`);
      setTimeout(() => setError(null), 4000);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="bg-white text-[#475569] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold shrink-0 transition-colors"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
        {isLoading ? "Memeriksa…" : "Mulai Asesmen"}
      </button>

      {error && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg max-w-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-poppins)" }}>
              Gagal Memulai Asesmen
            </p>
            <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
