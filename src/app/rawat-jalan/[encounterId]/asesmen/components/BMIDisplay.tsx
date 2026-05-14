'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface BMIDisplayProps {
  bmi?: number;
  status?: string;
}

interface BMICategory {
  label: string;
  badgeClass: string;
  valueClass: string;
  icon?: React.ReactNode;
}

function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) {
    return {
      label: 'Berat badan kurang',
      badgeClass: 'bg-yellow-50 border-yellow-300 text-yellow-700',
      valueClass: 'text-yellow-600',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Normal',
      badgeClass: 'bg-green-50 border-green-300 text-green-700',
      valueClass: 'text-green-600',
      icon: <CheckCircle2 size={12} strokeWidth={2} />,
    };
  }
  if (bmi < 30) {
    return {
      label: 'Berat badan lebih',
      badgeClass: 'bg-orange-50 border-orange-300 text-orange-700',
      valueClass: 'text-orange-600',
    };
  }
  return {
    label: 'Obesitas',
    badgeClass: 'bg-red-50 border-red-300 text-red-700',
    valueClass: 'text-red-600',
    icon: <AlertTriangle size={12} strokeWidth={2} />,
  };
}

export default function BMIDisplay({ bmi, status }: BMIDisplayProps) {
  if (bmi === undefined || bmi === null || isNaN(bmi)) {
    return (
      <div
        className="flex items-center justify-center w-full h-[38px] rounded-xl bg-gray-50 border border-gray-200 px-3"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <p className="text-[11px] text-center text-gray-400 leading-snug">
          Isi tinggi &amp; berat badan terlebih dahulu
        </p>
      </div>
    );
  }

  const category = getBMICategory(bmi);
  const displayLabel = status ?? category.label;

  return (
    <div
      className="flex items-center justify-between w-full h-[38px] rounded-xl bg-gray-50 border border-gray-200 px-4"
      style={{ fontFamily: 'var(--font-jakarta)' }}
    >
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-bold leading-none ${category.valueClass}`}>
          {bmi.toFixed(1)}
        </span>
        <span className="text-[11px] font-medium text-gray-400 leading-none">
          kg/m²
        </span>
      </div>

      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${category.badgeClass}`}
      >
        {category.icon}
        {displayLabel}
      </span>
    </div>
  );
}
