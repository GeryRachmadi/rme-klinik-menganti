"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Control, Controller } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { MedicationFormValues } from "@/lib/schemas/plan-schema";
import { MEDICATIONS_MOCK } from "@/lib/constants/medications-mock";
import { BENTUK_SEDIAAN_MOCK } from "@/lib/constants/bentuk-sediaan-mock";
import { CategorizedSearchableSelect } from "@/components/ui/CategorizedSearchableSelect";
import { WaktuKonsumsiField } from "./WaktuKonsumsiField";

const JAKARTA = '"Plus Jakarta Sans", sans-serif';

interface NonRacikanItemRowProps {
  index: number;
  control: Control<MedicationFormValues>;
  onRemove: () => void;
  isReadOnly?: boolean;
}

const labelStyle = { fontFamily: JAKARTA, fontWeight: 700 } as const;
const inputStyle = { fontFamily: JAKARTA, fontWeight: 500 } as const;

function inputClass(isReadOnly: boolean) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors border-gray-200 focus:border-[#2BB5A0] ${
    isReadOnly ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50 text-gray-700 focus:bg-white"
  }`;
}

/**
 * Free-text Nama Obat input with type-ahead suggestions from MEDICATIONS_MOCK.
 * Suggestions only assist — the doctor can always type a custom name; picking a
 * suggestion merely fills the field (no locking, no manual-fallback mode).
 */
function NamaObatAutocomplete({
  value,
  onChange,
  isReadOnly,
}: {
  value: string;
  onChange: (val: string) => void;
  isReadOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const matches = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q) return [];
    return MEDICATIONS_MOCK.filter((m) => m.display.toLowerCase().includes(q)).slice(0, 8);
  }, [value]);

  const showDropdown = open && !isReadOnly && matches.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        disabled={isReadOnly}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Contoh: Paracetamol"
        className={inputClass(isReadOnly)}
        style={inputStyle}
      />
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-56 overflow-y-auto">
          {matches.map((m) => (
            <button
              key={m.display}
              type="button"
              onClick={() => {
                onChange(m.display);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-2"
              style={inputStyle}
            >
              <span className="truncate">{m.display}</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{m.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One Non-Racikan (single-drug) prescription row — a flat row with no nested
 * ingredients, unlike RacikanItemRow's container/ingredient split (Item 13
 * rebuild). Mirrors the pre-rebuild flat Racikan row shape, repurposed here.
 */
export default function NonRacikanItemRow({ index, control, onRemove, isReadOnly = false }: NonRacikanItemRowProps) {
  return (
    <div className="grid grid-cols-12 gap-3 items-end bg-white border border-gray-100 rounded-xl p-3">
      {/* Nama Obat */}
      <div className="col-span-12 md:col-span-2 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Nama Obat
        </label>
        <Controller
          control={control}
          name={`nonRacikanItems.${index}.namaObat`}
          render={({ field }) => (
            <NamaObatAutocomplete
              value={field.value ?? ""}
              onChange={field.onChange}
              isReadOnly={isReadOnly}
            />
          )}
        />
      </div>

      {/* Dosis */}
      <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Dosis
        </label>
        <Controller
          control={control}
          name={`nonRacikanItems.${index}.dosis`}
          render={({ field }) => (
            <input
              type="text"
              disabled={isReadOnly}
              autoComplete="off"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Contoh: 500mg"
              className={inputClass(isReadOnly)}
              style={inputStyle}
            />
          )}
        />
      </div>

      {/* Jumlah */}
      <div className="col-span-6 md:col-span-1 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Jumlah
        </label>
        <Controller
          control={control}
          name={`nonRacikanItems.${index}.jumlah`}
          render={({ field }) => (
            <input
              type="number"
              min={1}
              disabled={isReadOnly}
              autoComplete="off"
              value={Number.isFinite(field.value) ? field.value : ""}
              onChange={(e) => field.onChange(e.target.value === "" ? NaN : Number(e.target.value))}
              className={inputClass(isReadOnly)}
              style={inputStyle}
            />
          )}
        />
      </div>

      {/* Bentuk Sediaan */}
      <div className="col-span-8 md:col-span-2 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Bentuk Sediaan
        </label>
        <Controller
          control={control}
          name={`nonRacikanItems.${index}.bentukSediaan`}
          render={({ field }) => (
            <CategorizedSearchableSelect
              options={BENTUK_SEDIAAN_MOCK}
              value={field.value ?? ""}
              onChange={field.onChange}
              disabled={isReadOnly}
              placeholder="Pilih bentuk..."
            />
          )}
        />
      </div>

      {/* Aturan Pakai */}
      <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Aturan Pakai
        </label>
        <Controller
          control={control}
          name={`nonRacikanItems.${index}.aturanPakai`}
          render={({ field }) => (
            <input
              type="text"
              disabled={isReadOnly}
              autoComplete="off"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Contoh: 3 x 1"
              className={inputClass(isReadOnly)}
              style={inputStyle}
            />
          )}
        />
      </div>

      {/* Waktu Konsumsi */}
      <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
        <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Waktu Konsumsi
        </label>
        <WaktuKonsumsiField
          control={control}
          name={`nonRacikanItems.${index}.waktuKonsumsi`}
          isReadOnly={isReadOnly}
          inputClassName={inputClass(isReadOnly)}
          inputStyle={inputStyle}
        />
      </div>

      {/* Delete */}
      <div className="col-span-12 md:col-span-1 flex md:justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={isReadOnly}
          aria-label="Hapus obat"
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
            isReadOnly
              ? "border-gray-100 text-gray-300 cursor-not-allowed"
              : "border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
          }`}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
