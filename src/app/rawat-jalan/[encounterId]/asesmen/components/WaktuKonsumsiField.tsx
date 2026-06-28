"use client";

import { useState, useEffect } from "react";
import { Control, FieldPath, useController } from "react-hook-form";
import type { MedicationFormValues } from "@/lib/schemas/plan-schema";
import { WAKTU_KONSUMSI_MOCK } from "@/lib/constants/waktu-konsumsi-mock";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const WAKTU_KONSUMSI_OPTIONS = WAKTU_KONSUMSI_MOCK.map((w) => w.display);

interface WaktuKonsumsiFieldProps {
  control: Control<MedicationFormValues>;
  name: FieldPath<MedicationFormValues>;
  isReadOnly: boolean;
  inputClassName: string;
  inputStyle: React.CSSProperties;
}

/**
 * Local isCustomWaktu state lives here (one instance per row) so each
 * Non-Racikan / Racikan container toggles independently.
 */
export function WaktuKonsumsiField({ control, name, isReadOnly, inputClassName, inputStyle }: WaktuKonsumsiFieldProps) {
  const { field } = useController({ control, name });
  const value = (field.value as string) ?? "";
  const [isCustomWaktu, setIsCustomWaktu] = useState(false);

  useEffect(() => {
    if (value && !WAKTU_KONSUMSI_OPTIONS.includes(value)) {
      setIsCustomWaktu(true);
    }
  }, [value]);

  if (isCustomWaktu) {
    return (
      <div className="flex flex-col gap-1">
        <input
          type="text"
          disabled={isReadOnly}
          autoComplete="off"
          value={value}
          onChange={(e) => field.onChange(e.target.value)}
          placeholder="Contoh: 2 jam setelah makan besar"
          className={inputClassName}
          style={inputStyle}
        />
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => {
              field.onChange("");
              setIsCustomWaktu(false);
            }}
            className="self-start text-xs text-[#0F766E] hover:underline cursor-pointer"
            style={inputStyle}
          >
            &larr; Pilih dari daftar
          </button>
        )}
      </div>
    );
  }

  return (
    <SearchableSelect
      options={WAKTU_KONSUMSI_OPTIONS}
      value={value}
      onChange={(val) => {
        if (val === "Lainnya") {
          field.onChange("");
          setIsCustomWaktu(true);
        } else {
          field.onChange(val);
        }
      }}
      disabled={isReadOnly}
      placeholder="Pilih waktu..."
    />
  );
}
