'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

export interface ChipsInputProps {
  label: string;
  addLabel?: string;
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  getChipColor?: (chip: string) => string;
  formatOnAdd?: (value: string) => string;
  extraInputNode?: React.ReactNode;
}

export default function ChipsInput({
  label,
  addLabel,
  value,
  onChange,
  placeholder,
  disabled = false,
  getChipColor,
  formatOnAdd,
  extraInputNode,
}: ChipsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const formatted = formatOnAdd ? formatOnAdd(trimmed) : trimmed;
    
    // Prevent exact duplicates
    if (!value.includes(formatted)) {
      onChange([...value, formatted]);
    }
    
    setInputValue('');
    setIsInputVisible(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleAdd();
    }
  };

  const handleRemove = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove));
  };

  return (
    <div className="flex flex-col w-full font-jakarta">
      {/* ROW 1: Label and Toggle Button */}
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-bold text-teal-800 uppercase tracking-wider font-poppins">
          {label}
        </label>
        {!disabled && !isInputVisible && (
          <button
            type="button"
            onClick={() => setIsInputVisible(true)}
            className="text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1"
          >
            + Tambah {addLabel || 'Riwayat'}
          </button>
        )}
      </div>

      {/* ROW 2: Input Area (When toggled) */}
      {isInputVisible && (
        <div className="flex gap-3 items-center mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
          />
          {extraInputNode}
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled || !inputValue.trim()}
            className="px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={16} /> Simpan
          </button>
          <button
            type="button"
            onClick={() => setIsInputVisible(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ROW 3: Chips Render */}
      <div className="flex flex-wrap gap-2 mb-1 min-h-[32px] items-center">
        {value.length > 0 ? (
          value.map((chip, index) => {
            const colorClass = getChipColor ? getChipColor(chip) : 'bg-teal-50 border-teal-200 text-teal-800';
            return (
              <span key={`${chip}-${index}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${colorClass}`}>
                {chip}
                {!disabled && (
                  <button type="button" onClick={() => handleRemove(chip)} className="hover:bg-black/10 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                )}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-gray-400 italic">Belum ada riwayat tercatat.</span>
        )}
      </div>
    </div>
  );
}
