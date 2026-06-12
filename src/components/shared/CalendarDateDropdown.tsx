"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const PRESETS = [
    { key: "semua",      label: "Semua Tanggal" },
    { key: "hari-ini",   label: "Hari Ini"      },
    { key: "minggu-ini", label: "Minggu Ini"    },
    { key: "bulan-ini",  label: "Bulan Ini"     },
    { key: "tahun-ini",  label: "Tahun Ini"     },
  ];

  return (
    <div
      className="flex flex-col bg-white rounded-[6.67px] shadow-[0px_6.67px_17.786px_0px_rgba(0,0,0,0.08)] overflow-clip"
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      {/* ── Body row: sidebar + calendar ── */}
      <div className="flex flex-row">
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[168px] flex-shrink-0 self-stretch border-r border-[#bec9c5] flex flex-col gap-[13px] px-[13px] py-[13px]">
          {/* Preset section */}
          <div className="flex flex-col gap-[2.2px]">
            <span className="text-[#006b5f] font-extrabold text-[10px] tracking-[0.5px] uppercase px-[8.9px]">
              Preset
            </span>
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectPreset(key)}
                className={`w-full text-left px-[8.9px] py-[6.5px] rounded-[4.4px] font-semibold text-[11.5px] tracking-[0.4px] text-[#3e4946] transition-colors cursor-pointer ${
                  activePreset === key
                    ? "bg-[#eafbf9] border border-[#b1f0e8]"
                    : "hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date range input section — pinned to bottom of sidebar */}
          <div className="mt-auto bg-[#eceef0] rounded-[6.67px] p-[8.9px] flex flex-col gap-[8.9px]">
            <span className="text-[#005147] font-bold text-[10px] tracking-[0.5px]">
              Pilih Rentang Waktu:
            </span>

            {/* Dari */}
            <div className="flex flex-col gap-[4.4px]">
              <label className="text-[#005147] font-bold text-[10.5px]">Dari</label>
              <input
                type="text"
                readOnly
                value={maskDisplay(startDigits)}
                onKeyDown={handleStartKeyDown}
                className={`bg-white border border-[#bec9c5] rounded-[4.4px] px-[9.4px] py-[7.5px] w-full font-normal text-[12.5px] outline-none cursor-text focus:border-[#2DD4BF] ${
                  startDigits ? "text-[#191c1e]" : "text-[#bec9c5]"
                }`}
              />
            </div>

            {/* Sampai */}
            <div className="flex flex-col gap-[4.4px]">
              <label className="text-[#005147] font-bold text-[10.5px]">Sampai</label>
              <input
                type="text"
                readOnly
                value={maskDisplay(endDigits)}
                onKeyDown={handleEndKeyDown}
                className={`bg-white border border-[#bec9c5] rounded-[4.4px] px-[9.4px] py-[7.5px] w-full font-normal text-[12.5px] outline-none cursor-text focus:border-[#2DD4BF] ${
                  endDigits ? "text-[#191c1e]" : "text-[#bec9c5]"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleSimpan}
              className="bg-[#005147] text-white rounded-[4.4px] py-[6.5px] w-full font-semibold text-[11.5px] tracking-[0.4px] text-center drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#0F766E] transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>

        {/* ── RIGHT MAIN AREA ── */}
        <div className="flex-1 bg-white px-[40px] py-[24px] flex flex-col justify-center">
          {/* Month navigation */}
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-[#F4F4F4] text-[#191c1e] cursor-pointer"
            >
              <ChevronLeft className="h-[24px] w-[22px]" />
            </button>
            <span className="font-bold text-[20px] text-[#191c1e] leading-[26px] select-none">
              {MONTHS_ID[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-[#F4F4F4] text-[#191c1e] cursor-pointer"
            >
              <ChevronRight className="h-[24px] w-[22px]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 pt-[8.9px]">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center font-semibold text-[13px] text-[#bec9c5] tracking-[0.4px] py-[6px] select-none"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="flex flex-col">
            {rows.map((row, rowIdx) => {
              const inRangeFlags = row.map(
                (d) =>
                  rangeStart !== null &&
                  rangeEnd !== null &&
                  d >= rangeStart &&
                  d <= rangeEnd
              );
              return (
                <div key={rowIdx} className="grid grid-cols-7">
                  {row.map((date, cellIdx) => {
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday        = toDateStr(date) === todayStr;
                    const isSelected     = selectedDate !== null && isSameDay(date, selectedDate);
                    const isCircle       = isToday || isSelected;

                    const inRange     = inRangeFlags[cellIdx];
                    const rangeRoundL  = inRange && (cellIdx === 0 || !inRangeFlags[cellIdx - 1]);
                    const rangeRoundR  = inRange && (cellIdx === 6 || !inRangeFlags[cellIdx + 1]);

                    // Wrapper handles the range band (full-width) + row-end rounding
                    let wrapperCls = "flex items-center justify-center py-[11px] cursor-pointer ";
                    if (inRange && !isCircle) {
                      wrapperCls += "bg-[rgba(98,250,227,0.4)] ";
                      if (rangeRoundL) wrapperCls += "rounded-l-[4.4px] ";
                      if (rangeRoundR) wrapperCls += "rounded-r-[4.4px] ";
                    }

                    // Inner day rendering — every cell uses the SAME fixed-size box
                    // so months with/without a circle keep identical dimensions.
                    const boxBase = "flex items-center justify-center size-[36px] rounded-full text-[16px] ";
                    let dayCls = "";
                    if (isToday) {
                      dayCls = boxBase + "bg-[#005147] text-white font-bold";
                    } else if (isSelected) {
                      dayCls = boxBase + "bg-[#C0FDF4] text-[#005147] font-bold";
                    } else if (isCurrentMonth) {
                      dayCls = boxBase + "text-[#191c1e] font-bold";
                    } else {
                      dayCls = boxBase + "text-[#b3b7bc] font-normal";
                    }

                    return (
                      <div
                        key={cellIdx}
                        className={wrapperCls}
                        onClick={() => handleCellClick(date)}
                      >
                        <span className={dayCls}>{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-[#bec9c5] bg-[rgba(242,244,246,0.2)] flex items-center justify-end gap-[8.9px] px-[13px] py-[13px]">
        <button
          type="button"
          onClick={onClose}
          className="border border-[#6e7976] rounded-[4.4px] px-[22px] py-[8.5px] text-[#6e7976] font-semibold text-[11.5px] tracking-[0.4px] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSimpan}
          className="bg-[#005147] text-white rounded-[4.4px] px-[22px] py-[8.5px] font-semibold text-[11.5px] tracking-[0.4px] shadow-[0px_5.6px_8.3px_-1.7px_rgba(0,0,0,0.1)] hover:bg-[#0F766E] transition-colors cursor-pointer"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
