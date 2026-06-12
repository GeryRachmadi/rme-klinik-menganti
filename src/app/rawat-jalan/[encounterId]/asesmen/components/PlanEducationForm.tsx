'use client';

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EducationFormSchema, type EducationFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const getEducationDraftKey = (encounterId: string) => `draft_education_${encounterId}`;

export interface PlanEducationFormRef {
  submitForm: () => Promise<EducationFormValues | null>;
  resetForm: () => void;
  getValues: () => EducationFormValues;
}

interface PlanEducationFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: { anjuranEdukasi?: string };
  /** Validation error surfaced from the central PlanFormSchema (Edukasi is mandatory). */
  externalError?: string | null;
}

const PlanEducationForm = forwardRef<PlanEducationFormRef, PlanEducationFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
  externalError,
}, ref) => {
  const draftKey = getEducationDraftKey(encounterId);

  const { register, watch, reset, trigger, getValues, formState: { isDirty } } = useForm<EducationFormValues>({
    resolver: zodResolver(EducationFormSchema),
    mode: 'onChange',
    defaultValues: {
      anjuranEdukasi: defaultValues?.anjuranEdukasi ?? '',
    },
  });

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
      return getValues();
    },
    resetForm: () => {
      reset({ anjuranEdukasi: '' });
    },
    getValues: () => getValues(),
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Edukasi / Anjuran
          <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
        </h3>
        <textarea
          {...register('anjuranEdukasi')}
          placeholder="Contoh: Istirahat, hindari aktivitas berat…"
          rows={3}
          disabled={isReadOnly}
          className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] transition-colors placeholder-gray-400 ${externalError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'} ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
        {externalError && <p className="text-red-500 text-[13px] mt-1.5">{externalError}</p>}
      </div>
    </div>
  );
});

PlanEducationForm.displayName = 'PlanEducationForm';

export default PlanEducationForm;
