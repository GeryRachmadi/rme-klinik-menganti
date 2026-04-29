"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Loader2, X, CheckCircle2 } from "lucide-react";
import type { Patient } from "@/generated/prisma";

interface PatientDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export default function PatientDeleteModal({
  isOpen,
  onClose,
  patient,
  onSuccess,
}: PatientDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  }

  if (!isOpen || !patient) return null;

  async function handleDelete() {
    if (!patient) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patients/${patient.noRm}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          showToast("Pasien tidak dapat dihapus karena memiliki data terkait.", "error");
          return;
        }
        if (res.status === 404) {
          showToast("Pasien sudah dihapus atau tidak ditemukan.", "error");
          return;
        }
        throw new Error(json?.error || json?.message || "Terjadi kesalahan server.");
      }

      showToast("Data pasien berhasil dihapus.", "success");
      onSuccess?.();
      // Beri jeda sedikit agar user bisa melihat toast sukses sebelum modal tertutup
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      if (error.message === "Failed to fetch") {
        showToast("Koneksi terputus. Periksa jaringan internet Anda.", "error");
      } else {
        showToast(error.message || "Terjadi kesalahan tidak terduga.", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={!isDeleting ? onClose : undefined} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center text-center relative"
          style={{ fontFamily: "var(--font-jakarta)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-5">
            <Trash2 size={36} strokeWidth={1.5} className="text-red-500" />
          </div>

          {/* Title */}
          <h2
            className="text-xl font-bold text-gray-800 mb-1"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Hapus Data Pasien
          </h2>

          {/* Patient identity */}
          <p className="text-sm font-semibold text-[#2BB5A0] mb-4">
            {patient.namaLengkap} <span className="font-normal text-gray-400">— {patient.noRm}</span>
          </p>

          {/* Confirmation message */}
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            Apakah Anda yakin ingin menghapus data pasien ini? Tindakan ini{" "}
            <span className="font-semibold text-gray-700">tidak dapat dibatalkan</span>.
          </p>

          {/* Warning about linked records */}
          <div className="w-full flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left mb-6">
            <AlertTriangle size={16} strokeWidth={2} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Pasien tidak dapat dihapus jika memiliki data terkait (encounter / kunjungan).
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification (Lokal di dalam modal) */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            toast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {toast.type === "error" ? (
            <X size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}
    </>
  );
}