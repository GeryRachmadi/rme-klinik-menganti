"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

const JAKARTA = '"Plus Jakarta Sans", sans-serif';

export interface CategorizedOption {
  display: string;
  category: string;
}

interface CategorizedSearchableSelectProps {
  options: CategorizedOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

// Tints cycle by the order a category first appears, so this stays generic for
// any categorized list. For Bentuk Sediaan (Item 13) the order is PADAT (teal),
// CAIR (blue), SETENGAH PADAT (amber), BENTUK KHUSUS (gray) — matching Figma.
const CATEGORY_TINTS = [
  "bg-teal-50 text-teal-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-gray-100 text-gray-600",
];

/**
 * Sibling of <SearchableSelect /> with category-grouped rendering: the dropdown
 * shows a colored header per category and a single search input that filters
 * across all categories at once (empty categories are hidden). Mirrors the same
 * trigger / search / click-outside / auto-focus interaction model.
 */
export function CategorizedSearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  hasError = false,
  className = "",
}: CategorizedSearchableSelectProps) {
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

  // Group the (filtered) options by category, preserving first-seen order so the
  // tint assignment is stable regardless of the search query.
  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const order: string[] = [];
    const map = new Map<string, string[]>();
    for (const opt of options) {
      if (q && !opt.display.toLowerCase().includes(q)) continue;
      if (!map.has(opt.category)) {
        map.set(opt.category, []);
        order.push(opt.category);
      }
      map.get(opt.category)!.push(opt.display);
    }
    return order.map((category) => ({ category, items: map.get(category)! }));
  }, [options, searchQuery]);

  // Stable tint per category across the full list (not just filtered view).
  const tintByCategory = useMemo(() => {
    const seen: string[] = [];
    for (const opt of options) {
      if (!seen.includes(opt.category)) seen.push(opt.category);
    }
    const m = new Map<string, string>();
    seen.forEach((cat, i) => m.set(cat, CATEGORY_TINTS[i % CATEGORY_TINTS.length]));
    return m;
  }, [options]);

  const borderColor = hasError
    ? "border-red-400 focus-within:border-red-400"
    : "border-gray-200 focus-within:border-[#2BB5A0]";

  function selectOption(opt: string) {
    onChange(opt);
    setIsOpen(false);
    setSearchQuery("");
  }

  const hasResults = grouped.length > 0;

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
        style={{ fontFamily: JAKARTA, fontWeight: 500 }}
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
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-72 overflow-hidden flex flex-col">
          <div className="relative border-b border-gray-100 flex-shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              placeholder="Cari bentuk sediaan..."
              className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none bg-white"
              style={{ fontFamily: JAKARTA, fontWeight: 500 }}
            />
          </div>
          <div className="overflow-y-auto">
            {!hasResults ? (
              <p
                className="px-4 py-3 text-sm text-gray-400 text-center"
                style={{ fontFamily: JAKARTA, fontWeight: 500 }}
              >
                Tidak ditemukan.
              </p>
            ) : (
              grouped.map(({ category, items }) => (
                <div key={category}>
                  <div
                    className={`px-4 py-1.5 text-xs uppercase tracking-wider sticky top-0 ${
                      tintByCategory.get(category) ?? "bg-gray-100 text-gray-600"
                    }`}
                    style={{ fontFamily: JAKARTA, fontWeight: 700 }}
                  >
                    {category}
                  </div>
                  {items.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => selectOption(opt)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${
                        opt === value ? "text-[#2BB5A0]" : "text-gray-700"
                      }`}
                      style={{ fontFamily: JAKARTA, fontWeight: opt === value ? 700 : 500 }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
