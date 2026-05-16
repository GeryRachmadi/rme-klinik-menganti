'use client';

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EducationFormSchema, type EducationFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const getEducationDraftKey = (encounterId: string) => `draft_education_${encounterId}`;

export interface PlanEducationFormRef {
  submitForm: () => Promise<EducationFormValues | null>;
}

interface PlanEducationFormProps {
  encounterId: string;
}

const PlanEducationForm = forwardRef<PlanEducationFormRef, PlanEducationFormProps>(({
  encounterId,
}, ref) => {
  const draftKey = getEducationDraftKey(encounterId);

  const { register, watch, reset, trigger, getValues } = useForm<EducationFormValues>({
    resolver: zodResolver(EducationFormSchema),
    mode: 'onChange',
    defaultValues: {
      anjuranEdukasi: '',
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const { data } = JSON.parse(saved);
      if (data) reset(data);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, reset]);

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await trigger();
      if (!isValid) return null;
      return getValues();
    },
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
          Edukasi / Anjuran Istirahat{' '}
          <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(Opsional)</span>
        </label>
        <textarea
          {...register('anjuranEdukasi')}
          placeholder="Contoh: Istirahat, hindari aktivitas berat..."
          rows={3}
          className="w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] transition-colors focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
      </div>
    </div>
  );
});

PlanEducationForm.displayName = 'PlanEducationForm';

export default PlanEducationForm;
