'use client';

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicationFormSchema, type MedicationFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const getMedicationDraftKey = (encounterId: string) => `draft_medication_${encounterId}`;

export interface PlanMedicationFormRef {
  submitForm: () => Promise<MedicationFormValues | null>;
}

interface PlanMedicationFormProps {
  encounterId: string;
}

const PlanMedicationForm = forwardRef<PlanMedicationFormRef, PlanMedicationFormProps>(({
  encounterId,
}, ref) => {
  const draftKey = getMedicationDraftKey(encounterId);

  const { register, watch, reset, trigger, getValues } = useForm<MedicationFormValues>({
    resolver: zodResolver(MedicationFormSchema),
    mode: 'onChange',
    defaultValues: {
      medicationText: '',
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
      <h3
        className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3 mt-6"
        style={{ WebkitTextStroke: '0.2px #0F766E' }}
      >
        Resep Obat &amp; Edukasi
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
          Resep Obat
        </label>
        <textarea
          {...register('medicationText')}
          placeholder="Contoh: Paracetamol 500mg, 3x1 sehari, 7 hari"
          rows={3}
          className="w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] transition-colors focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
      </div>
    </div>
  );
});

PlanMedicationForm.displayName = 'PlanMedicationForm';

export default PlanMedicationForm;
