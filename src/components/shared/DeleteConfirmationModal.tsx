"use client";

import { Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center text-center"
          style={{ fontFamily: "var(--font-jakarta)" }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Icon */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-5">
            <Trash2 size={48} strokeWidth={1.5} className="text-red-500" />
          </div>

          {/* Title */}
          <h2
            className="text-xl font-bold text-gray-800 mb-3"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Hapus Akun
          </h2>

          {/* Body */}
          <p className="text-sm text-gray-500 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun{" "}
            <span className="font-bold text-gray-700">{userName}</span>?{" "}
            Tindakan ini tidak dapat dibatalkan.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mt-7 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menghapus..." : "Hapus"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
