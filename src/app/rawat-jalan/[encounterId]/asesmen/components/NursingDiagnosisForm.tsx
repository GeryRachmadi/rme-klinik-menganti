'use client';

import React, { useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { NursingDiagnosisAutocomplete, type SelectedNursingDiagnosis } from './NursingDiagnosisAutocomplete';
import type { NursingAssessment, NursingDiagnosisItem } from '@/lib/utils/nursing-assessment';

const getNursingDraftKey = (encounterId: string) => `draft_nursing_${encounterId}`;

const MANDATORY_ERROR = 'Asesmen Keperawatan wajib diisi — pilih minimal 1 diagnosis SDKI.';

export interface NursingDiagnosisFormRef {
  /** Returns the validated nursing assessment, or null when no diagnosis is
   *  selected (mandatory — at least 1 SDKI diagnosis required). */
  submitForm: () => Promise<NursingAssessment | null>;
  resetForm: () => void;
  getValues: () => NursingAssessment;
}

interface NursingFormValues {
  diagnoses: NursingDiagnosisItem[];
  catatan: string;
}

interface NursingDiagnosisFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: { diagnoses: NursingDiagnosisItem[]; catatan: string };
  /** Validation error surfaced from a parent central-submit flow. */
  externalError?: string | null;
}

const NursingDiagnosisForm = forwardRef<NursingDiagnosisFormRef, NursingDiagnosisFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
  externalError,
}, ref) => {
  const draftKey = getNursingDraftKey(encounterId);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    watch,
    setValue,
    reset,
    register,
    getValues,
    formState: { isDirty },
  } = useForm<NursingFormValues>({
    mode: 'onChange',
    defaultValues: {
      diagnoses: defaultValues?.diagnoses ?? [],
      catatan: defaultValues?.catatan ?? '',
    },
  });

  // Self-load any saved draft on mount (mirrors PlanProcedureForm).
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

  const diagnoses = watch('diagnoses') ?? [];

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const data = getValues();
      if (!data.diagnoses || data.diagnoses.length === 0) {
        setLocalError(MANDATORY_ERROR);
        return null;
      }
      setLocalError(null);
      return { diagnoses: data.diagnoses, catatan: data.catatan ?? '' };
    },
    resetForm: () => {
      reset({ diagnoses: [], catatan: '' });
    },
    getValues: () => {
      const data = getValues();
      return { diagnoses: data.diagnoses ?? [], catatan: data.catatan ?? '' };
    },
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  const handleDiagnosisChange = (diag: SelectedNursingDiagnosis) => {
    // Dedup non-manual entries by code; manual entries are always appended.
    if (diag.code !== 'MANUAL' && diagnoses.some((d) => d.code === diag.code)) return;
    const updated: NursingDiagnosisItem[] = [...diagnoses, {
      code: diag.code,
      display: diag.display,
      category: diag.category,
    }];
    setValue('diagnoses', updated, { shouldDirty: true });
    setLocalError(null);
  };

  const handleRemoveDiagnosis = (index: number) => {
    const updated = diagnoses.filter((_, i) => i !== index);
    setValue('diagnoses', updated, { shouldDirty: true });
  };

  const errorMessage = localError ?? externalError ?? null;

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="mb-1 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
        style={{ WebkitTextStroke: '0.4px #0F766E' }}
      >
        Asesmen Keperawatan
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-4">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Diagnosis Keperawatan
          <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
        </h3>

        {/* Selected diagnosis chips */}
        {diagnoses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {diagnoses.map((diag, index) => (
              <span
                key={`${diag.code}-${diag.display}-${index}`}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-bold border ${
                  diag.code === 'MANUAL'
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : 'bg-[#F0FDFA] text-[#006B5F] border-[#14B8A6]'
                }`}
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                <span className="font-semibold">[{diag.code === 'MANUAL' ? 'Manual' : diag.code}]</span>
                <span>–</span>
                <span>{diag.display}</span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnosis(index)}
                    aria-label="Hapus diagnosis keperawatan"
                    className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 leading-none cursor-pointer"
                  >
                    <span className="text-base leading-none">×</span>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {!isReadOnly && (
          <>
            <NursingDiagnosisAutocomplete onDiagnosisChange={handleDiagnosisChange} />
            <button
              type="button"
              onClick={() => setValue('diagnoses', [], { shouldDirty: true })}
              className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-1 self-end italic"
            >
              Kosongkan Input
            </button>
          </>
        )}

        {errorMessage && <p className="text-red-500 text-[13px] mt-1.5">{errorMessage}</p>}

        {/* Optional catatan */}
        <textarea
          {...register('catatan')}
          disabled={isReadOnly}
          placeholder={isReadOnly ? 'Tidak ada catatan' : 'Tambahkan Catatan Keperawatan Disini (Opsional)'}
          className={`w-full mt-2 border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors border-gray-200 focus:ring-[#0F766E] focus:border-[#0F766E]
            ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800 placeholder-gray-400'}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
      </div>
    </div>
  );
});

NursingDiagnosisForm.displayName = 'NursingDiagnosisForm';

export default NursingDiagnosisForm;
