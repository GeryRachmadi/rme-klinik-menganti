'use client';

import React from 'react';

interface VitalSignInputProps {
  label: string;
  unit: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder: string;
  type: 'text' | 'number';
  error?: string;
  disabled?: boolean;
  step?: number;
}

function formatBloodPressure(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}/${digits.slice(3, 5)}`;
}

export default function VitalSignInput({
  label,
  unit,
  value,
  onChange,
  placeholder,
  type,
  error,
  disabled = false,
  step,
}: VitalSignInputProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatBloodPressure(e.target.value));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw === '' ? '' : Number(raw));
  };

  const displayValue = value === undefined || value === null ? '' : String(value);

  const inputClass = `
    flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-800 bg-gray-50
    placeholder-gray-400 outline-none transition-colors rounded-l-xl
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const groupBorder = error
    ? 'border-red-400 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400'
    : 'border-gray-200 focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E]';

  return (
    <div className="flex flex-col gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <label className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
        {label}
      </label>

      <div className={`flex items-stretch rounded-xl border overflow-hidden transition-colors ${groupBorder}`}>
        {type === 'text' ? (
          <input
            type="text"
            value={displayValue}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
          />
        ) : (
          <input
            type="number"
            value={displayValue}
            onChange={handleNumberChange}
            placeholder={placeholder}
            disabled={disabled}
            step={step ?? 1}
            min={0}
            autoComplete="off"
            className={inputClass}
          />
        )}

        <span className="flex items-center px-3 bg-gray-100 border-l border-gray-200 text-xs font-medium text-gray-500 shrink-0 whitespace-nowrap">
          {unit}
        </span>
      </div>

      {error && (
        <p className="text-red-500 text-[12px] leading-snug">{error}</p>
      )}
    </div>
  );
}
