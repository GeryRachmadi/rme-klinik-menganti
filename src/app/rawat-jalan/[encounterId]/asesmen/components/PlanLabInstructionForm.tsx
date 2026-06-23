'use client';

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabInstructionFormSchema, type LabInstructionFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';

const getLabInstructionDraftKey = (encounterId: string) => `draft_labInstruction_${encounterId}`;

export interface PlanLabInstructionFormRef {
  submitForm: () => Promise<LabInstructionFormValues | null>;
  resetForm: () => void;
  getValues: () => LabInstructionFormValues;
}

interface PlanLabInstructionFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: { instruksiLab?: string };
  /** Validation error surfaced from the central PlanFormSchema (Instruksi Lab is mandatory). */
  externalError?: string | null;
}

const PlanLabInstructionForm = forwardRef<PlanLabInstructionFormRef, PlanLabInstructionFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
  externalError,
}, ref) => {
  const draftKey = getLabInstructionDraftKey(encounterId);

  const { register, watch, reset, trigger, getValues, formState: { isDirty } } = useForm<LabInstructionFormValues>({
    resolver: zodResolver(LabInstructionFormSchema),
    mode: 'onChange',
    defaultValues: {
      instruksiLab: defaultValues?.instruksiLab ?? '',
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
      reset({ instruksiLab: '' });
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
          Instruksi Lab <span className="normal-case font-medium text-gray-400">(Penunjang Medis Eksternal)</span>
          <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
        </h3>
        <textarea
          {...register('instruksiLab')}
          placeholder="Contoh: Cek darah lengkap, urinalisis, atau tulis 'Tidak ada' jika tidak diperlukan"
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

PlanLabInstructionForm.displayName = 'PlanLabInstructionForm';

export default PlanLabInstructionForm;
