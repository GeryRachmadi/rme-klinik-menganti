'use client';

import React, { useState, KeyboardEvent, useRef } from 'react';
import { X, Plus } from 'lucide-react';

export type ChipsInputMode = 'auto-commit' | 'pending-commit';

export interface ChipsInputProps {
  addLabel?: string;
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  getChipColor?: (chip: string) => string;
  formatOnAdd?: (value: string) => string;
  extraInputNode?: React.ReactNode;
  negationLabel?: string;
  negationChecked?: boolean;
  onNegationChange?: (checked: boolean) => void;
  /* FITUR BARU: Array untuk dropdown rekomendasi */
  suggestions?: string[];
  /**
   * 'auto-commit' (default): clicking a suggestion commits the chip immediately
   * (Riwayat Penyakit). 'pending-commit': clicking a suggestion only fills the
   * input so the user can set severity/dosage (via extraInputNode) before
   * committing with Simpan/Enter (Alergi & Pengobatan Rutin — BB-08.12).
   */
  mode?: ChipsInputMode;
}

export default function ChipsInput({
  addLabel,
  value,
  onChange,
  placeholder,
  disabled = false,
  getChipColor,
  formatOnAdd,
  extraInputNode,
  negationLabel,
  negationChecked,
  onNegationChange,
  suggestions = [],
  mode = 'auto-commit',
}: ChipsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter rekomendasi berdasarkan ketikan user & pastikan belum ada di daftar chip
  const filteredSuggestions = suggestions.filter(
    (item) => 
      item.toLowerCase().includes(inputValue.toLowerCase()) && 
      !value.some(v => v.toLowerCase().includes(item.toLowerCase()))
  );

  const handleAdd = (textToAdd: string = inputValue) => {
    const trimmed = textToAdd.trim();
    if (!trimmed) return;

    const formatted = formatOnAdd ? formatOnAdd(trimmed) : trimmed;
    
    if (!value.includes(formatted)) {
      onChange([...value, formatted]);
    }
    
    setInputValue('');
    setShowSuggestions(false);
    setIsInputVisible(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue('');
      setShowSuggestions(false);
      setIsInputVisible(false);
    }
  };

  const handleRemove = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove));
  };

  return (
    <div className="flex flex-col w-full font-jakarta">
      {/* ROW 1: Chips Render */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mb-3">
          {value.map((chip, index) => {
            const colorClass = getChipColor ? getChipColor(chip) : 'bg-[#E6F5F4] border-[#B2DFDB] text-[#006B5F]';
            return (
              <span key={chip} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-bold border ${colorClass}`} style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {chip}
                {!disabled && (
                  <button type="button" onClick={() => handleRemove(chip)} className="hover:bg-black/10 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* ROW 2: Checkbox & Toggle Button */}
      <div className="flex justify-between items-center mb-1">
        {negationLabel ? (
          <label className={`flex items-center gap-2.5 text-sm cursor-pointer ${disabled && !negationChecked ? 'opacity-50' : 'text-gray-700 hover:text-gray-900'}`}>
            <input 
              type="checkbox" 
              checked={negationChecked}
              onChange={(e) => onNegationChange && onNegationChange(e.target.checked)}
              className="rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E] w-4 h-4 cursor-pointer"
            />
            <span className="font-medium">{negationLabel}</span>
          </label>
        ) : <div />}

        {!disabled && !isInputVisible && (
          <button
            type="button"
            onClick={() => setIsInputVisible(true)}
            className="text-sm font-semibold text-[#0F766E] hover:text-teal-900 transition-colors whitespace-nowrap ml-4"
          >
            + Tambah {addLabel || 'Riwayat'}
          </button>
        )}
      </div>

      {/* ROW 3: Input Area dengan Autocomplete Dropdown */}
      {isInputVisible && (
        <div className="flex gap-3 items-center mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm relative">
          
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay kecil agar onClick item dropdown sempat terbaca
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white outline-none"
            />
            
            {/* DROPDOWN REKOMENDASI */}
            {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full left-0">
                {filteredSuggestions.map((suggestion, idx) => (
                  <li
                    key={suggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (mode === 'pending-commit') {
                        // Don't commit yet — fill the input so the user can set
                        // severity/dosage (extraInputNode) before pressing Simpan
                        // or Enter. Prevents bypassing the severity window (BB-08.12).
                        setInputValue(suggestion);
                        setShowSuggestions(false);
                      } else {
                        // auto-commit (Riwayat Penyakit): commit immediately.
                        // handleAdd applies formatOnAdd, dedups, clears + collapses.
                        handleAdd(suggestion);
                      }
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-[#E6F5F4] hover:text-[#0F766E] cursor-pointer transition-colors"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {extraInputNode}
          
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            disabled={disabled || !inputValue.trim()}
            className="px-5 py-2.5 bg-[#0F766E] text-white text-sm font-semibold rounded-lg hover:bg-teal-800 disabled:opacity-50 flex items-center gap-2"
          >
            Simpan
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
    </div>
  );
}