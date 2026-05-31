"use client";

import ErrorState from "@/components/shared/ErrorState";

export default function RawatJalanError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      message="Gagal memuat antrean. Silakan muat ulang halaman."
      onRetry={reset}
    />
  );
}
