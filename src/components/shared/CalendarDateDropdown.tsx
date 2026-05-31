"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const DAYS_SHORT = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

export interface CalendarDateDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDMY(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// Returns 8 raw digits for a date: DDMMYYYY
function dateToDigits(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
}

// Formats up-to-8 digits as dd/mm/yyyy mask with placeholder chars
function maskDisplay(digits: string): string {
  const ph = "ddmmyyyy";
  const d  = digits.padEnd(8, " "); // pad with space to index safely
  const dd   = digits[0] ?? ph[0];
  const dd2  = digits[1] ?? ph[1];
  const mm   = digits[2] ?? ph[2];
  const mm2  = digits[3] ?? ph[3];
  const yyyy = [
    digits[4] ?? ph[4],
    digits[5] ?? ph[5],
    digits[6] ?? ph[6],
    digits[7] ?? ph[7],
  ].join("");
  void d; // suppress unused-var warning
  return `${dd}${dd2}/${mm}${mm2}/${yyyy}`;
}

function makePresetRanges(today: Date) {
  const dow = (today.getDay() + 6) % 7;
  const thisMon = new Date(today); thisMon.setDate(today.getDate() - dow);
  const thisSun = new Date(thisMon); thisSun.setDate(thisMon.getDate() + 6);
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfThisMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstOfThisYear  = new Date(today.getFullYear(), 0, 1);
  const lastOfThisYear   = new Date(today.getFullYear(), 11, 31);
  return { thisMon, thisSun, firstOfThisMonth, lastOfThisMonth, firstOfThisYear, lastOfThisYear };
}

function buildInitState(value: string, today: Date) {
  const { thisMon, thisSun, firstOfThisMonth, lastOfThisMonth, firstOfThisYear, lastOfThisYear } = makePresetRanges(today);

  if (value && value.includes("|")) {
    const [s, e] = value.split("|");
    const rs = new Date(s + "T00:00:00"); rs.setHours(0, 0, 0, 0);
    const re = new Date(e + "T00:00:00"); re.setHours(0, 0, 0, 0);
    return { preset: "custom", rangeStart: rs, rangeEnd: re, view: new Date(rs.getFullYear(), rs.getMonth(), 1) };
  }
  if (value === "hari-ini") {
    return { preset: "hari-ini", rangeStart: new Date(today), rangeEnd: new Date(today), view: new Date(today.getFullYear(), today.getMonth(), 1) };
  }
  if (value === "minggu-ini") {
    return { preset: "minggu-ini", rangeStart: new Date(thisMon), rangeEnd: new Date(thisSun), view: new Date(thisMon.getFullYear(), thisMon.getMonth(), 1) };
  }
  if (value === "bulan-ini") {
    return { preset: "bulan-ini", rangeStart: new Date(firstOfThisMonth), rangeEnd: new Date(lastOfThisMonth), view: new Date(today.getFullYear(), today.getMonth(), 1) };
  }
  if (value === "tahun-ini") {
    return { preset: "tahun-ini", rangeStart: new Date(firstOfThisYear), rangeEnd: new Date(lastOfThisYear), view: new Date(today.getFullYear(), 0, 1) };
  }
  if (value && value !== "semua" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return { preset: "custom", rangeStart: date, rangeEnd: null, view: new Date(y, m - 1, 1) };
  }
  return { preset: "semua", rangeStart: null, rangeEnd: null, view: new Date(today.getFullYear(), today.getMonth(), 1) };
}

export default function CalendarDateDropdown({ value, onChange, onClose }: CalendarDateDropdownProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  const { thisMon, thisSun, firstOfThisMonth, lastOfThisMonth, firstOfThisYear, lastOfThisYear } = makePresetRanges(today);

  const init = buildInitState(value, today);
  const [viewDate, setViewDate]         = useState<Date>(init.view);
  const [rangeStart, setRangeStart]     = useState<Date | null>(init.rangeStart);
  const [rangeEnd, setRangeEnd]         = useState<Date | null>(init.rangeEnd);
  const [activePreset, setActivePreset] = useState<string>(init.preset);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDigits, setStartDigits]   = useState<string>(init.rangeStart ? dateToDigits(init.rangeStart) : "");
  const [endDigits, setEndDigits]       = useState<string>(init.rangeEnd   ? dateToDigits(init.rangeEnd)   : "");

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); }

  function tryParseStart(digits: string) {
    if (digits.length === 8) {
      const dd = Number(digits.slice(0, 2));
      const mm = Number(digits.slice(2, 4));
      const yyyy = Number(digits.slice(4, 8));
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const parsed = new Date(yyyy, mm - 1, dd);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          setRangeStart(parsed);
          setActivePreset("custom");
          setViewDate(new Date(yyyy, mm - 1, 1));
          return;
        }
      }
    }
    setRangeStart(null);
  }

  function tryParseEnd(digits: string) {
    if (digits.length === 8) {
      const dd = Number(digits.slice(0, 2));
      const mm = Number(digits.slice(2, 4));
      const yyyy = Number(digits.slice(4, 8));
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const parsed = new Date(yyyy, mm - 1, dd);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          setRangeEnd(parsed);
          setActivePreset("custom");
          return;
        }
      }
    }
    setRangeEnd(null);
  }

  function handleStartKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.key === "Backspace") {
      const next = startDigits.slice(0, -1);
      setStartDigits(next);
      tryParseStart(next);
    } else if (/^\d$/.test(e.key) && startDigits.length < 8) {
      const next = startDigits + e.key;
      setStartDigits(next);
      tryParseStart(next);
    }
  }

  function handleEndKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.key === "Backspace") {
      const next = endDigits.slice(0, -1);
      setEndDigits(next);
      tryParseEnd(next);
    } else if (/^\d$/.test(e.key) && endDigits.length < 8) {
      const next = endDigits + e.key;
      setEndDigits(next);
      tryParseEnd(next);
    }
  }

  function selectPreset(key: string) {
    setActivePreset(key);
    setSelectedDate(null);
    if (key === "semua") {
      setRangeStart(null); setRangeEnd(null);
      setStartDigits(""); setEndDigits("");
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (key === "hari-ini") {
      setRangeStart(new Date(today)); setRangeEnd(new Date(today));
      setStartDigits(dateToDigits(today)); setEndDigits(dateToDigits(today));
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (key === "minggu-ini") {
      setRangeStart(new Date(thisMon)); setRangeEnd(new Date(thisSun));
      setStartDigits(dateToDigits(thisMon)); setEndDigits(dateToDigits(thisSun));
      setViewDate(new Date(thisMon.getFullYear(), thisMon.getMonth(), 1));
    } else if (key === "bulan-ini") {
      setRangeStart(new Date(firstOfThisMonth)); setRangeEnd(new Date(lastOfThisMonth));
      setStartDigits(dateToDigits(firstOfThisMonth)); setEndDigits(dateToDigits(lastOfThisMonth));
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (key === "tahun-ini") {
      setRangeStart(new Date(firstOfThisYear)); setRangeEnd(new Date(lastOfThisYear));
      setStartDigits(dateToDigits(firstOfThisYear)); setEndDigits(dateToDigits(lastOfThisYear));
      setViewDate(new Date(today.getFullYear(), 0, 1));
    }
    // "custom": keep current range/view/digits
  }

  // Cell click: highlight only, no immediate filter
  function handleCellClick(date: Date) {
    const clicked = new Date(date);
    clicked.setHours(0, 0, 0, 0);
    setSelectedDate(clicked);
    setActivePreset("custom");
    if (date.getMonth() !== month) {
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function handleSimpan() {
    if      (activePreset === "semua")      onChange("semua");
    else if (activePreset === "hari-ini")   onChange("hari-ini");
    else if (activePreset === "minggu-ini") onChange("minggu-ini");
    else if (activePreset === "bulan-ini")  onChange("bulan-ini");
    else if (activePreset === "tahun-ini")  onChange("tahun-ini");
    else if (activePreset === "custom") {
      if (selectedDate && !rangeStart && !rangeEnd) {
        onChange(toDateStr(selectedDate));
      } else if (rangeStart && rangeEnd) {
        onChange(`${toDateStr(rangeStart)}|${toDateStr(rangeEnd)}`);
      } else if (rangeStart) {
        onChange(toDateStr(rangeStart));
      } else {
        onChange("semua");
      }
    } else {
      onChange("semua");
    }
    onClose();
  }

  // Build 42-cell grid (Monday-start)
  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month,     0).getDate();
  const offset          = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: Date[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    cells.push(new Date(year, month - 1, daysInPrevMonth - i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length < 42) {
    cells.push(new Date(year, month + 1, cells.length - offset - daysInMonth + 1));
  }
  const rows: Date[][] = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const CHIP_ON  = "bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[#006B5F] font-bold";
  const CHIP_OFF = "text-[#50555C] font-medium hover:bg-[#F4F4F4]";
  const PILL_ACTIVE = "border-[#2DD4BF] bg-[#E6F5F4] text-[#006B5F] font-semibold";
  const PILL_EMPTY  = "border-gray-200 bg-white text-gray-400";

  const PRESETS = [
    { key: "semua",      label: "Semua Tanggal", icon: false },
    { key: "hari-ini",   label: "Hari Ini",      icon: true  },
    { key: "minggu-ini", label: "Minggu Ini",    icon: false },
    { key: "bulan-ini",  label: "Bulan Ini",     icon: false },
    { key: "tahun-ini",  label: "Tahun Ini",     icon: false },
    { key: "custom",     label: "Custom",        icon: false },
  ];

  return (
    <div
      className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm"
      style={{ minWidth: 480, fontFamily: "var(--font-jakarta)" }}
    >
      {/* ── Range bar — masked inputs ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <input
          type="text"
          readOnly
          value={maskDisplay(startDigits)}
          onKeyDown={handleStartKeyDown}
          className={`flex-1 px-4 py-2 rounded-full border text-sm text-center outline-none cursor-text transition-colors focus:ring-2 focus:ring-[#2DD4BF]/40 ${
            rangeStart ? PILL_ACTIVE : PILL_EMPTY
          }`}
        />
        <span className="text-gray-400 text-sm font-bold flex-shrink-0">→</span>
        <input
          type="text"
          readOnly
          value={maskDisplay(endDigits)}
          onKeyDown={handleEndKeyDown}
          className={`flex-1 px-4 py-2 rounded-full border text-sm text-center outline-none cursor-text transition-colors focus:ring-2 focus:ring-[#2DD4BF]/40 ${
            rangeEnd ? PILL_ACTIVE : PILL_EMPTY
          }`}
        />
      </div>

      {/* ── Panels row ── */}
      <div className="flex flex-row">
        {/* Left panel */}
        <div className="flex flex-col border-r border-gray-100 p-2 gap-0.5 flex-shrink-0" style={{ width: 140 }}>
          {PRESETS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPreset(key)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer text-xs transition-colors ${
                activePreset === key ? CHIP_ON : CHIP_OFF
              }`}
            >
              <span>{label}</span>
              {icon && <RefreshCw size={11} className="flex-shrink-0 opacity-70" />}
            </button>
          ))}

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleSimpan}
            className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-[#006B5F] hover:bg-[#0F766E] transition-colors mt-1"
          >
            Simpan
          </button>
        </div>

        {/* Right panel — calendar */}
        <div className="flex-1 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-0.5 rounded hover:bg-[#F4F4F4] text-[#50555C] cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <span className="font-extrabold text-xs text-[#50555C] text-center flex-1 select-none">
              {MONTHS_ID[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="p-0.5 rounded hover:bg-[#F4F4F4] text-[#50555C] cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#94979A] py-0.5 select-none">
                {d}
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {rows.map((row, rowIdx) => {
              const rowIsThisWeek = activePreset === "minggu-ini" &&
                row.some((d) => d >= thisMon && d <= thisSun);
              return (
                <div
                  key={rowIdx}
                  className={`grid grid-cols-7 ${rowIsThisWeek ? "bg-[#B9F4ED] rounded-[2px]" : ""}`}
                >
                  {row.map((date, cellIdx) => {
                    const dateStr        = toDateStr(date);
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday        = dateStr === todayStr;

                    const isRangeStart = activePreset === "custom" && rangeStart !== null && isSameDay(date, rangeStart);
                    const isRangeEnd   = activePreset === "custom" && rangeEnd   !== null && isSameDay(date, rangeEnd);
                    const isInRange    = activePreset === "custom" && rangeStart !== null && rangeEnd !== null &&
                      date > rangeStart && date < rangeEnd;
                    const isPendingSel = activePreset === "custom" && selectedDate !== null &&
                      !isToday && isSameDay(date, selectedDate);

                    const isInMingguIni = activePreset === "minggu-ini" && date >= thisMon && date <= thisSun;
                    const isInBulanIni  = activePreset === "bulan-ini"  && date >= firstOfThisMonth && date <= lastOfThisMonth;
                    const isInTahunIni  = activePreset === "tahun-ini"  && date >= firstOfThisYear && date <= lastOfThisYear;
                    const isHariIni     = activePreset === "hari-ini"   && isToday;

                    let cls = "flex items-center justify-center text-[11px] cursor-pointer transition-colors relative z-10 ";

                    if (isRangeStart && rangeEnd) {
                      cls += "w-full h-7 rounded-l-full bg-[#2DD4BF]/30 text-[#006B5F] font-bold";
                    } else if (isRangeStart && !rangeEnd) {
                      cls += "w-7 h-7 my-0.5 rounded-full bg-[#2DD4BF]/30 text-[#006B5F] font-bold";
                    } else if (isRangeEnd) {
                      cls += "w-full h-7 rounded-r-full bg-[#2DD4BF]/30 text-[#006B5F] font-bold";
                    } else if (isInRange) {
                      cls += "w-full h-7 rounded-none bg-[#B9F4ED] text-[#006B5F] font-semibold";
                    } else if (isHariIni || isToday) {
                      cls += "w-7 h-7 my-0.5 rounded-full bg-[#006B5F] text-white font-bold";
                    } else if (isPendingSel) {
                      cls += "w-7 h-7 my-0.5 rounded-full ring-2 ring-[#2DD4BF] text-[#006B5F] font-bold";
                    } else if (isInMingguIni) {
                      cls += "w-7 h-7 my-0.5 rounded-full font-semibold " + (isCurrentMonth ? "text-[#303336]" : "text-[#B3B7BC]");
                    } else if (isInBulanIni) {
                      cls += "w-7 h-7 my-0.5 rounded-sm bg-[#B9F4ED]/60 text-[#006B5F] font-semibold";
                    } else if (isInTahunIni) {
                      cls += "w-7 h-7 my-0.5 rounded-sm bg-[#B9F4ED]/40 text-[#303336] font-semibold";
                    } else if (isCurrentMonth) {
                      cls += "w-7 h-7 my-0.5 rounded-full text-[#303336] font-semibold hover:bg-[#E6F5F4]";
                    } else {
                      cls += "w-7 h-7 my-0.5 rounded-full text-[#B3B7BC] font-semibold hover:bg-[#F4F4F4]";
                    }

                    return (
                      <div key={cellIdx} className="flex items-center justify-center">
                        <button
                          type="button"
                          className={cls}
                          onClick={() => handleCellClick(date)}
                        >
                          {date.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
