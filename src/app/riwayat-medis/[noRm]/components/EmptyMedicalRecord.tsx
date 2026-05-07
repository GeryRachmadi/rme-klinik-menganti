"use client";

import { useState } from "react";
import { FolderOpen, Plus, Loader2 } from "lucide-react";

interface EmptyMedicalRecordProps {
  userRole: string;
  onCreateEncounterClick?: () => Promise<void>;
}

const ALLOWED_ASSESSMENT_ROLES = ["ADMIN", "DOKTER", "PERAWAT"];

export default function EmptyMedicalRecord({
  userRole,
  onCreateEncounterClick,
}: EmptyMedicalRecordProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStartAssessment =
    ALLOWED_ASSESSMENT_ROLES.includes(userRole?.toUpperCase()) &&
    onCreateEncounterClick !== undefined;

  async function handleClick() {
    if (!onCreateEncounterClick) return;
    setIsLoading(true);
    setError(null);
    try {
      await onCreateEncounterClick();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg p-12 shadow-sm max-w-md mx-auto mt-8 text-center border border-gray-100">
      <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />

      <h2
        className="text-xl font-semibold text-gray-900 mb-2"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        Belum Ada Riwayat Medis
      </h2>

      <p
        className="text-sm text-gray-600 mb-6"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        Pasien ini belum memiliki catatan kunjungan atau rekam medis di klinik.
      </p>

      {error && (
        <p
          className="text-sm text-red-600 mb-4"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {error}
        </p>
      )}

      {canStartAssessment && (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors mx-auto"
          style={{ fontFamily: "var(--font-poppins)" }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {isLoading ? "Memeriksa..." : "Mulai Asesmen Pertama"}
        </button>
      )}
    </div>
  );
}
