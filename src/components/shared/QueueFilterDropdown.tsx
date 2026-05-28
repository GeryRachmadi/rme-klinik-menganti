"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

interface Filters {
  prioritas: string;
  status: string;
}

interface QueueFilterDropdownProps {
  onFilterChange: (filters: Filters) => void;
}

const PRIORITAS_OPTIONS = ["Semua", "Stabil", "Cukup Berisiko", "Berisiko", "Berisiko Tinggi"];
const STATUS_OPTIONS     = ["Semua", "Menunggu", "Diperiksa", "Selesai", "Batal"];

export default function QueueFilterDropdown({ onFilterChange }: QueueFilterDropdownProps) {
  const [open, setOpen]           = useState(false);
  const [prioritas, setPrioritas] = useState("Semua");
  const [status, setStatus]       = useState("Semua");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function selectPrioritas(item: string) {
    const next = item === prioritas ? "Semua" : item;
    setPrioritas(next);
    onFilterChange({ prioritas: next, status });
  }

  function selectStatus(item: string) {
    const next = item === status ? "Semua" : item;
    setStatus(next);
    onFilterChange({ prioritas, status: next });
  }

  const isActive = prioritas !== "Semua" || status !== "Semua";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <SlidersHorizontal size={12} strokeWidth={2.5} />
        Filter
        {isActive && (
          <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-lg"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          <div className="flex">
            {/* Column 1 — Prioritas */}
            <div className="px-4 py-3 border-r border-gray-100" style={{ minWidth: 160 }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Prioritas
              </p>
              {PRIORITAS_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectPrioritas(item)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    prioritas === item
                      ? "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]"
                      : "text-gray-600 hover:bg-[#F4F4F4] hover:text-[#50555C]"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Column 2 — Status */}
            <div className="px-4 py-3" style={{ minWidth: 150 }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Status
              </p>
              {STATUS_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectStatus(item)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    status === item
                      ? "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]"
                      : "text-gray-600 hover:bg-[#F4F4F4] hover:text-[#50555C]"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
