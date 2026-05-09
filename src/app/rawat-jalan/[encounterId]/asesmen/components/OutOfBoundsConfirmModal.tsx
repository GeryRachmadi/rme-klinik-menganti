"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { VITAL_BOUNDS } from "@/lib/constants/assessment-validation";

interface OutOfBoundsConfirmModalProps {
  isOpen: boolean;
  outOfBoundsFields: string[];
  onPeriksaUlang: () => void;
  onSimpanTetap: () => void;
}

export default function OutOfBoundsConfirmModal({
  isOpen,
  outOfBoundsFields,
  onPeriksaUlang,
  onSimpanTetap,
}: OutOfBoundsConfirmModalProps) {
  if (!isOpen) return null;

  const formatFieldName = (key: string) => {
    switch (key) {
      case "tekananDarah": return "Tekanan Darah";
      case "suhu": return "Suhu";
      case "nadi": return "Nadi";
      case "napas": return "Napas";
      case "tinggiBadan": return "Tinggi Badan";
      case "beratBadan": return "Berat Badan";
      default: return key;
    }
  };

  const getBoundsString = (key: string) => {
    const bounds = (VITAL_BOUNDS as Record<string, any>)[key];
    if (!bounds) return "N/A";
    
    if (key === "tekananDarah") {
      return `${bounds.min} - ${bounds.max}`;
    }
    
    let unit = "";
    if (key === "suhu") unit = " °C";
    if (key === "nadi") unit = " bpm";
    if (key === "napas") unit = " x/min";
    if (key === "tinggiBadan") unit = " cm";
    if (key === "beratBadan") unit = " kg";

    return `${bounds.min} - ${bounds.max}${unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-lg shadow-lg p-8 w-[90%] max-w-[500px] mx-auto animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <AlertTriangle size={32} strokeWidth={2} className="text-yellow-600" />
          <h2 className="text-lg font-bold text-teal-700 font-poppins">
            ⚠️ Peringatan: Nilai Tanda Vital Tidak Normal
          </h2>
        </div>
        
        <p className="font-semibold text-gray-800 mb-4">
          Field yang melampaui batas normal:
        </p>
        
        <ul className="space-y-2 mb-8 bg-gray-50 p-4 rounded-md border border-gray-100">
          {outOfBoundsFields.map((field) => (
            <li key={field} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>
                <strong>{formatFieldName(field)}</strong> (Normal: {getBoundsString(field)})
              </span>
            </li>
          ))}
        </ul>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onPeriksaUlang}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors text-sm cursor-pointer"
          >
            Periksa Ulang
          </button>
          <button
            type="button"
            onClick={onSimpanTetap}
            className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md transition-colors text-sm cursor-pointer"
          >
            Simpan Tetap
          </button>
        </div>
      </div>
    </div>
  );
}
