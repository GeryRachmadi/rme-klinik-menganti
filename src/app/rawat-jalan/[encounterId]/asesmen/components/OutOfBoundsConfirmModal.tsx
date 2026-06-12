"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface OutOfBoundsConfirmModalProps {
  isOpen: boolean;
  violations: string[];
  onKembali: () => void;
  onLanjut: () => void;
}

export default function OutOfBoundsConfirmModal({
  isOpen,
  violations,
  onKembali,
  onLanjut,
}: OutOfBoundsConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div
        className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50 mx-auto mb-5">
          <AlertTriangle size={22} strokeWidth={2} className="text-yellow-600" />
        </div>
        <h2 className="text-center text-[18px] font-bold text-gray-800 mb-2 font-poppins">
          Input di Luar Batas Normal
        </h2>
        <p className="text-center text-[14px] text-gray-500 mb-4">
          Nilai berikut berada di luar batas normal:
        </p>
        <ul className="space-y-1.5 mb-8 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
          {violations.map((v) => (
            <li key={v} className="text-[13px] text-yellow-800 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
        <p className="text-center text-[13px] text-gray-400 mb-6">
          Apakah Anda yakin ingin meneruskan?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onKembali}
            className="flex-1 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onLanjut}
            className="flex-1 px-5 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}
