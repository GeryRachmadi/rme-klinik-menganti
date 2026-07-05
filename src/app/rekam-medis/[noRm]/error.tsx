"use client";

import ErrorState from "@/components/shared/ErrorState";

export default function RiwayatMedisError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      message="Gagal memuat riwayat medis. Silakan muat ulang halaman."
      onRetry={reset}
    />
  );
}
