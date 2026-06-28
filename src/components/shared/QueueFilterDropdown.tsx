"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import CalendarDateDropdown from "@/components/shared/CalendarDateDropdown";

interface Filters {
  prioritas: string;
  status: string;
  tanggal: string;
}

interface QueueFilterDropdownProps {
  onFilterChange: (filters: Filters) => void;
}

const PRIORITAS_OPTIONS = ["Semua", "Stabil", "Cukup Berisiko", "Berisiko", "Berisiko Tinggi"];
const STATUS_OPTIONS     = ["Semua", "Menunggu", "Diperiksa", "Selesai", "Batal"];

function tanggalLabel(v: string): string {
  if (v === "semua")       return "Semua Tanggal";
  if (v === "hari-ini")    return "Hari Ini";
  if (v === "minggu-lalu") return "Minggu Lalu";
  if (v === "bulan-lalu")  return "Bulan Lalu";
  if (v === "tahun-lalu")  return "Tahun Lalu";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

export default function QueueFilterDropdown({ onFilterChange }: QueueFilterDropdownProps) {
  const [mounted, setMounted]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [prioritas, setPrioritas]     = useState("Semua");
  const [status, setStatus]           = useState("Semua");
  const [tanggal, setTanggal]         = useState("semua");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarPos, setCalendarPos] = useState<{ top: number; left: number } | null>(null);

  const panelRef      = useRef<HTMLDivElement>(null);
  const tanggalBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close main panel on outside click — exclude calendar portal clicks
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      const inPanel    = panelRef.current?.contains(target);
      const inCalendar = !!target.closest("[data-calendar-portal]");
      if (!inPanel && !inCalendar) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // When main panel closes, also close calendar
  useEffect(() => {
    if (!open) {
      setCalendarOpen(false);
      setCalendarPos(null);
    }
  }, [open]);

  function openCalendar() {
    if (tanggalBtnRef.current) {
      const r = tanggalBtnRef.current.getBoundingClientRect();
      setCalendarPos({ top: r.bottom + 6, left: r.left });
    }
    setCalendarOpen(true);
  }

  function closeCalendar() {
    setCalendarOpen(false);
    setCalendarPos(null);
  }

  function toggleCalendar() {
    calendarOpen ? closeCalendar() : openCalendar();
  }

  function selectPrioritas(item: string) {
    const next = item === prioritas ? "Semua" : item;
    setPrioritas(next);
    onFilterChange({ prioritas: next, status, tanggal });
  }

  function selectStatus(item: string) {
    const next = item === status ? "Semua" : item;
    setStatus(next);
    onFilterChange({ prioritas, status: next, tanggal });
  }

  const isActive     = prioritas !== "Semua" || status !== "Semua" || tanggal !== "semua";
  const tanggalActive = tanggal !== "semua";

  const CHIP_ON  = "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]";
  const CHIP_OFF = "text-gray-600 hover:bg-[#F4F4F4] hover:text-[#50555C]";

  return (
    <div className="relative" ref={panelRef}>
      {/* Filter trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-white/30 text-[#475569] hover:bg-white/80 transition-colors"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <SlidersHorizontal size={12} strokeWidth={2.5} />
        Filter
        {isActive && (
          <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
        )}
      </button>

      {/* Filter panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-lg"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {/* Tanggal trigger row */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <button
              ref={tanggalBtnRef}
              type="button"
              onClick={toggleCalendar}
              className="w-full flex items-center justify-between gap-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Tanggal
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    tanggalActive
                      ? "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F]"
                      : "text-gray-400"
                  }`}
                >
                  {tanggalLabel(tanggal)}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-gray-400 transition-transform duration-150 ${calendarOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
          </div>

          {/* Prioritas + Status columns */}
          <div className="flex">
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
                    prioritas === item ? CHIP_ON : CHIP_OFF
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {item}
                </button>
              ))}
            </div>

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
                    status === item ? CHIP_ON : CHIP_OFF
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

      {/* Calendar portal — escapes overflow-hidden ancestors via document.body */}
      {mounted && calendarOpen && calendarPos &&
        createPortal(
          <div
            data-calendar-portal
            style={{
              position: "fixed",
              top: calendarPos.top,
              left: calendarPos.left,
              zIndex: 9999,
              fontFamily: "var(--font-jakarta)",
            }}
          >
            <CalendarDateDropdown
              value={tanggal}
              onChange={(v) => {
                setTanggal(v);
                onFilterChange({ prioritas, status, tanggal: v });
                closeCalendar();
              }}
              onClose={closeCalendar}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
