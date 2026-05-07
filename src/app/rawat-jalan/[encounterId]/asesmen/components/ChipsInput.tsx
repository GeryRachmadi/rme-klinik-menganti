'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

export interface ChipsInputProps {
  label: string;
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
  value,
  onChange,
  placeholder,
  disabled = false,
  getChipColor,
  formatOnAdd,
  extraInputNode,
}: ChipsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const formatted = formatOnAdd ? formatOnAdd(trimmed) : trimmed;
    
    // Prevent exact duplicates
    if (!value.includes(formatted)) {
      onChange([...value, formatted]);
    }
    
    setInputValue('');
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
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        />
        {extraInputNode}
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((chip, index) => {
            const colorClass = getChipColor 
              ? getChipColor(chip) 
              : 'bg-teal-100 text-teal-800';
            
            return (
              <span
                key={`${chip}-${index}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${colorClass}`}
              >
                {chip}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(chip)}
                    className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
                    aria-label={`Hapus ${chip}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
