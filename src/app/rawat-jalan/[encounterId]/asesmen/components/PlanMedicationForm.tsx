'use client';

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicationFormSchema, type MedicationFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const getMedicationDraftKey = (encounterId: string) => `draft_medication_${encounterId}`;

export interface PlanMedicationFormRef {
  submitForm: () => Promise<MedicationFormValues | null>;
  resetForm: () => void;
  getValues: () => MedicationFormValues;
}

interface PlanMedicationFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: { medicationText?: string };
}

const PlanMedicationForm = forwardRef<PlanMedicationFormRef, PlanMedicationFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
}, ref) => {
  const draftKey = getMedicationDraftKey(encounterId);

  const { register, watch, reset, trigger, getValues, formState: { isDirty } } = useForm<MedicationFormValues>({
    resolver: zodResolver(MedicationFormSchema),
    mode: 'onChange',
    defaultValues: {
      medicationText: defaultValues?.medicationText ?? '',
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
      reset({ medicationText: '' });
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
          Resep Obat
        </h3>
        <textarea
          {...register('medicationText')}
          placeholder="Contoh: Paracetamol 500mg, 3x1 sehari, 7 hari"
          rows={3}
          disabled={isReadOnly}
          className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] transition-colors focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200 placeholder-gray-400 ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
      </div>
    </div>
  );
});

PlanMedicationForm.displayName = 'PlanMedicationForm';

export default PlanMedicationForm;
