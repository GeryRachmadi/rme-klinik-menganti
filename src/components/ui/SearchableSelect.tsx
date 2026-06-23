"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  hasError = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  // Focus the search field when opening
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const borderColor = hasError
    ? "border-red-400 focus-within:border-red-400"
    : "border-gray-200 focus-within:border-[#2BB5A0]";

  function selectOption(opt: string) {
    onChange(opt);
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border bg-gray-50 text-sm outline-none transition-colors ${borderColor} ${
          disabled
            ? "cursor-not-allowed text-gray-300 bg-gray-100"
            : "cursor-pointer text-gray-700 focus:bg-white"
        }`}
      >
        {/* Render value directly so an out-of-list value still displays */}
        <span className={value ? "text-gray-700 truncate" : "text-gray-300 truncate"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`ml-2 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-60 overflow-hidden flex flex-col">
          <div className="relative border-b border-gray-100 flex-shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              placeholder="Cari..."
              className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none bg-white"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan.</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectOption(opt)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${
                    opt === value ? "text-[#2BB5A0] font-medium" : "text-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
