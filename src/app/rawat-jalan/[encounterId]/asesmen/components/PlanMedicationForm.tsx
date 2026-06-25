'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, FlaskConical } from 'lucide-react';
import { MedicationFormSchema, type MedicationFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import RacikanItemRow from './RacikanItemRow';
import NonRacikanItemRow from './NonRacikanItemRow';

const JAKARTA = '"Plus Jakarta Sans", sans-serif';

const getMedicationDraftKey = (encounterId: string) => `draft_medication_${encounterId}`;

// Empty non-racikan row matching NonRacikanItemSchema's shape. jumlah starts at
// 1 so the number input shows a sensible default; all text fields start blank
// (mandatory).
const emptyNonRacikanItem = () => ({
  namaObat: '',
  dosis: '',
  jumlah: 1,
  bentukSediaan: '',
  aturanPakai: '',
  waktuKonsumsi: '',
});

// Empty racikan container matching RacikanContainerSchema's shape. jumlah starts
// at 1 so the number input shows a sensible default; all text fields start blank
// (mandatory). Starts with one empty ingredient since a container needs at least
// one (Item 13 rebuild, Option A container/ingredient restructure).
const emptyRacikanItem = () => ({
  namaRacikan: '',
  bentukSediaan: '',
  jumlah: 1,
  aturanPakai: '',
  waktuKonsumsi: '',
  ingredients: [{ namaObat: '', dosis: '' }],
});

export interface PlanMedicationFormRef {
  submitForm: () => Promise<MedicationFormValues | null>;
  resetForm: () => void;
  getValues: () => MedicationFormValues;
}

interface PlanMedicationFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: { nonRacikanItems?: MedicationFormValues['nonRacikanItems']; racikanItems?: MedicationFormValues['racikanItems']; tidakAdaResep?: boolean };
  /** Validation error surfaced from the central PlanFormSchema (Resep is mandatory). */
  externalError?: string | null;
}

type MedicationTab = 'non-racikan' | 'racikan';

const PlanMedicationForm = forwardRef<PlanMedicationFormRef, PlanMedicationFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
  externalError,
}, ref) => {
  const draftKey = getMedicationDraftKey(encounterId);
  const [activeTab, setActiveTab] = useState<MedicationTab>('non-racikan');

  const { control, watch, setValue, reset, trigger, getValues, formState: { isDirty } } = useForm<MedicationFormValues>({
    resolver: zodResolver(MedicationFormSchema),
    mode: 'onChange',
    defaultValues: {
      nonRacikanItems: defaultValues?.nonRacikanItems ?? [],
      racikanItems: defaultValues?.racikanItems ?? [],
      tidakAdaResep: defaultValues?.tidakAdaResep ?? false,
    },
  });

  const tidakAdaResep = watch('tidakAdaResep');

  const { fields: nonRacikanFields, append: appendNonRacikan, remove: removeNonRacikan } = useFieldArray({ control, name: 'nonRacikanItems' });
  const { fields: racikanFields, append: appendRacikan, remove: removeRacikan } = useFieldArray({ control, name: 'racikanItems' });

  useEffect(() => {
    if (isReadOnly) return;
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const { data } = JSON.parse(saved);
      if (data) reset(data);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, reset, isReadOnly]);

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await trigger();
      if (!isValid) return null;
      // Always return BOTH panels' data regardless of the active tab — content in
      // the inactive panel is preserved (Item 13).
      return getValues();
    },
    resetForm: () => {
      reset({ nonRacikanItems: [], racikanItems: [], tidakAdaResep: false });
    },
    getValues: () => getValues(),
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: JAKARTA }}
        >
          Resep Obat
          <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
        </h3>

        {/* Tab switcher (Figma 880:1769) — both panels keep their data simultaneously */}
        <div className="flex items-center justify-between gap-3">
          {!tidakAdaResep && (
            <div className="inline-flex self-start gap-1 bg-[#e2e8f0] rounded-xl" style={{ padding: '5.153px' }}>
              {([
                { key: 'non-racikan', label: 'Non-Racikan' },
                { key: 'racikan', label: 'Racikan' },
              ] as const).map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-1.5 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-white text-[#0F766E] shadow-sm'
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ fontFamily: JAKARTA, fontWeight: active ? 700 : 500 }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {!isReadOnly && (
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none ml-auto">
              <input
                type="checkbox"
                checked={tidakAdaResep}
                onChange={(e) => setValue('tidakAdaResep', e.target.checked, { shouldDirty: true, shouldValidate: true })}
                className="w-4 h-4 accent-[#2BB5A0] cursor-pointer"
              />
              Tidak ada resep obat
            </label>
          )}
        </div>
      </div>

      {tidakAdaResep ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          Tidak ada resep obat untuk kunjungan ini.
        </p>
      ) : (
        <>
      {/* Non-Racikan panel — structured repeatable rows */}
      {activeTab === 'non-racikan' && (
        <div className="flex flex-col gap-3">
          {nonRacikanFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-gray-200 rounded-xl text-center">
              <FlaskConical size={28} className="text-gray-300" strokeWidth={1.5} />
              <p className="text-sm text-gray-400" style={{ fontFamily: JAKARTA, fontWeight: 500 }}>
                Belum ada obat non-racikan. Tambahkan obat di bawah.
              </p>
            </div>
          ) : (
            nonRacikanFields.map((field, index) => (
              <NonRacikanItemRow
                key={field.id}
                index={index}
                control={control}
                onRemove={() => removeNonRacikan(index)}
                isReadOnly={isReadOnly}
              />
            ))
          )}

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => appendNonRacikan(emptyNonRacikanItem())}
              className="inline-flex self-start items-center gap-2 px-4 py-2 rounded-full border border-[#0F766E] text-[#0F766E] text-sm hover:bg-[#E6F5F4] transition-colors cursor-pointer"
              style={{ fontFamily: JAKARTA, fontWeight: 700 }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Obat
            </button>
          )}
        </div>
      )}

      {/* Racikan panel — structured repeatable rows */}
      {activeTab === 'racikan' && (
        <div className="flex flex-col gap-3">
          {racikanFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-gray-200 rounded-xl text-center">
              <FlaskConical size={28} className="text-gray-300" strokeWidth={1.5} />
              <p className="text-sm text-gray-400" style={{ fontFamily: JAKARTA, fontWeight: 500 }}>
                Belum ada obat racikan. Tambahkan komponen racikan di bawah.
              </p>
            </div>
          ) : (
            racikanFields.map((field, index) => (
              <RacikanItemRow
                key={field.id}
                index={index}
                control={control}
                onRemove={() => removeRacikan(index)}
                isReadOnly={isReadOnly}
              />
            ))
          )}

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => appendRacikan(emptyRacikanItem())}
              className="inline-flex self-start items-center gap-2 px-4 py-2 rounded-full border border-[#0F766E] text-[#0F766E] text-sm hover:bg-[#E6F5F4] transition-colors cursor-pointer"
              style={{ fontFamily: JAKARTA, fontWeight: 700 }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Obat
            </button>
          )}
        </div>
      )}
        </>
      )}

      {externalError && <p className="text-red-500 text-[13px] mt-1">{externalError}</p>}
    </div>
  );
});

PlanMedicationForm.displayName = 'PlanMedicationForm';

export default PlanMedicationForm;
