"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AsesmenError({ error, reset }: ErrorProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-5">

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div>
          <h2
            className="text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Gagal Memuat Data Asesmen
          </h2>
          <p
            className="text-sm text-gray-500"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            {error.message || "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-full transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-full transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Kembali
          </button>
        </div>

      </div>
    </div>
  );
}
