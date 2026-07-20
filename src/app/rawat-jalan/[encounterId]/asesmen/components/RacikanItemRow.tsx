"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Control, Controller, useFieldArray } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import type { MedicationFormValues } from "@/lib/schemas/plan-schema";
import { MEDICATIONS_MOCK } from "@/lib/constants/medications-mock";
import { BENTUK_SEDIAAN_MOCK } from "@/lib/constants/bentuk-sediaan-mock";
import { CategorizedSearchableSelect } from "@/components/ui/CategorizedSearchableSelect";
import { WaktuKonsumsiField } from "./WaktuKonsumsiField";

const JAKARTA = '"Plus Jakarta Sans", sans-serif';

interface RacikanItemRowProps {
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
 * One Racikan container: bentuk sediaan / jumlah / aturan pakai / waktu konsumsi
 * at the container level, holding a sub-array of ingredients (namaObat + jumlah
 * + bentukSediaan each). Mirrors the container/ingredient split decided for Item 13's rebuild —
 * a container with zero ingredients is meaningless, so the ingredient list
 * always keeps at least one row (remove is disabled at the last row).
 */
export default function RacikanItemRow({ index, control, onRemove, isReadOnly = false }: RacikanItemRowProps) {
  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: `racikanItems.${index}.ingredients`,
  });

  return (
    <div className="flex flex-col gap-3 bg-white border border-gray-100 rounded-xl p-3">
      {/* Container header */}
      <div className="flex items-end gap-3">
        <span
          className="flex-shrink-0 inline-flex items-center justify-center h-[42px] px-2 rounded-lg bg-[#E6F5F4] text-[#0F766E] text-xs"
          style={labelStyle}
        >
          #{index + 1}
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
            Nama Racikan
          </label>
          <Controller
            control={control}
            name={`racikanItems.${index}.namaRacikan`}
            render={({ field }) => (
              <input
                type="text"
                disabled={isReadOnly}
                autoComplete="off"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Contoh: Puyer Batuk Pilek Anak"
                className={inputClass(isReadOnly)}
                style={inputStyle}
              />
            )}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={isReadOnly}
          aria-label="Hapus racikan"
          className={`flex-shrink-0 flex items-center justify-center w-[42px] h-[42px] rounded-lg border transition-colors ${
            isReadOnly
              ? "border-gray-100 text-gray-300 cursor-not-allowed"
              : "border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
          }`}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Container-level fields */}
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
            Bentuk Sediaan
          </label>
          <Controller
            control={control}
            name={`racikanItems.${index}.bentukSediaan`}
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

        <div className="col-span-4 md:col-span-2 flex flex-col gap-1">
          <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
            Jumlah
          </label>
          <Controller
            control={control}
            name={`racikanItems.${index}.jumlah`}
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

        <div className="col-span-8 md:col-span-3 flex flex-col gap-1">
          <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
            Aturan Pakai
          </label>
          <Controller
            control={control}
            name={`racikanItems.${index}.aturanPakai`}
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

        <div className="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label className="text-xs text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
            Waktu Konsumsi
          </label>
          <WaktuKonsumsiField
            control={control}
            name={`racikanItems.${index}.waktuKonsumsi`}
            isReadOnly={isReadOnly}
            inputClassName={inputClass(isReadOnly)}
            inputStyle={inputStyle}
          />
        </div>
      </div>

      {/* Ingredients sub-list */}
      <div className="flex flex-col gap-2 pl-3 border-l-2 border-[#E6F5F4]">
        <span className="text-[11px] text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
          Bahan Racikan
        </span>

        {ingredientFields.map((ingredientField, ingredientIndex) => (
          <div key={ingredientField.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5 flex flex-col gap-1">
              {ingredientIndex === 0 && (
                <label className="text-[10px] text-[#0F766E] uppercase tracking-wider" style={labelStyle}>
                  Nama Obat
                </label>
              )}
              <Controller
                control={control}
                name={`racikanItems.${index}.ingredients.${ingredientIndex}.namaObat`}
                render={({ field }) => (
                  <NamaObatAutocomplete
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    isReadOnly={isReadOnly}
                  />
                )}
              />
            </div>

            <div className="col-span-3 flex flex-col gap-1">
              {ingredientIndex === 0 && (
                <label className="text-[10px] text-gray-400 uppercase tracking-wider" style={labelStyle}>
                  Jumlah
                </label>
              )}
              <Controller
                control={control}
                name={`racikanItems.${index}.ingredients.${ingredientIndex}.jumlah`}
                render={({ field }) => (
                  <input
                    type="number"
                    min={1}
                    step={1}
                    disabled={isReadOnly}
                    autoComplete="off"
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? NaN : Number(e.target.value))}
                    placeholder="Contoh: 1"
                    className={inputClass(isReadOnly)}
                    style={inputStyle}
                  />
                )}
              />
            </div>

            <div className="col-span-3 flex flex-col gap-1">
              {ingredientIndex === 0 && (
                <label className="text-[10px] text-gray-400 uppercase tracking-wider" style={labelStyle}>
                  Bentuk Sediaan
                </label>
              )}
              <Controller
                control={control}
                name={`racikanItems.${index}.ingredients.${ingredientIndex}.bentukSediaan`}
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

            <div className={`col-span-1 flex justify-center ${ingredientIndex === 0 ? "self-end" : ""}`}>
              <button
                type="button"
                onClick={() => removeIngredient(ingredientIndex)}
                disabled={isReadOnly || ingredientFields.length <= 1}
                aria-label="Hapus bahan"
                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                  isReadOnly || ingredientFields.length <= 1
                    ? "border-gray-100 text-gray-300 cursor-not-allowed"
                    : "border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                }`}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => appendIngredient({ namaObat: "", jumlah: 1, bentukSediaan: "" })}
            className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#0F766E] text-[#0F766E] text-xs hover:bg-[#E6F5F4] transition-colors cursor-pointer"
            style={{ fontFamily: JAKARTA, fontWeight: 700 }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Tambah Bahan
          </button>
        )}
      </div>
    </div>
  );
}
