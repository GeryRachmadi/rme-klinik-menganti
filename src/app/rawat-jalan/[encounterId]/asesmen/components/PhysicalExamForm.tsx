'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { PhysicalExamSchema, type PhysicalExamData } from '@/lib/schemas/physical-exam-schema';
import { getOutOfBoundsFields } from '@/lib/utils/bounds-validator';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';
import { getPhysicalExamDraftKey } from '@/lib/constants/storage-keys';
import { calculateBMI, getBMIStatus } from '@/lib/utils/bmi-calculator';
import VitalSignInput from './VitalSignInput';
import BMIDisplay from './BMIDisplay';
import type { DraftState } from './AsesmenPageClient';

// ─── Prop types ──────────────────────────────────────────────────────────────

export interface PhysicalExamFormRef {
  submitForm: () => Promise<PhysicalExamData | null>;
  restoreDraft: (data: PhysicalExamData) => void;
}

interface PhysicalExamFormProps {
  encounterId: string;
  isEditMode?: boolean;
  canEdit?: boolean;
  defaultValues?: Record<string, any>;
  hideSubmitButton?: boolean;
  draftState?: DraftState;
}

// ─── Draft payload ────────────────────────────────────────────────────────────

interface DraftPayload {
  data: PhysicalExamData;
  timestamp: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

const PhysicalExamForm = forwardRef<PhysicalExamFormRef, PhysicalExamFormProps>(({
  encounterId,
  isEditMode = false,
  canEdit = true,
  draftState,
  defaultValues,
  hideSubmitButton = false,
}, ref) => {
  const router = useRouter();
  const draftKey = getPhysicalExamDraftKey(encounterId);

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { toast, showSuccess, showError, showWarning } = useFormToast();

  const [outOfBoundsFields, setOutOfBoundsFields] = useState<string[]>([]);

  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState,
  } = useForm<PhysicalExamData>({
    resolver: zodResolver(PhysicalExamSchema) as Resolver<PhysicalExamData>,
    mode: 'onChange',
    defaultValues: {
      tekananDarah: defaultValues?.tekananDarah ?? '',
      suhu: defaultValues?.suhu ?? ('' as any),
      nadi: defaultValues?.nadi ?? ('' as any),
      napas: defaultValues?.napas ?? ('' as any),
      tinggiBadan: defaultValues?.tinggiBadan ?? ('' as any),
      beratBadan: defaultValues?.beratBadan ?? ('' as any),
      bmi: defaultValues?.bmi,
      catatan: defaultValues?.catatan ?? '',
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await trigger();
      console.log('[PhysicalExamForm] Validation result:', { isValid, data: getValues(), errors: formState.errors });
      if (!isValid) return null;
      // Re-parse through schema so coerced numbers are returned, not raw strings
      const parsed = PhysicalExamSchema.safeParse(getValues());
      return parsed.success ? parsed.data : null;
    },
    restoreDraft: (data: PhysicalExamData) => {
      reset(data);
    }
  }), [formState, trigger, getValues, reset]);

  // Individual field watches — avoids passing watch() (new object each render) as a dependency
  const tekananDarah = watch('tekananDarah');
  const suhu = watch('suhu');
  const nadi = watch('nadi');
  const napas = watch('napas');
  const tinggiBadan = watch('tinggiBadan');
  const beratBadan = watch('beratBadan');
  const bmi = watch('bmi');
  const catatan = watch('catatan') ?? '';

  useAutoSaveDraft(draftKey, { tekananDarah, suhu, nadi, napas, tinggiBadan, beratBadan, bmi, catatan });

  useEffect(() => {
    const outOfBounds = getOutOfBoundsFields(
      { tekananDarah, suhu, nadi, napas, tinggiBadan, beratBadan, bmi, catatan } as PhysicalExamData
    );
    setOutOfBoundsFields(outOfBounds);
  }, [tekananDarah, suhu, nadi, napas, tinggiBadan, beratBadan, bmi, catatan]);

  // Real-time BMI calculation
  useEffect(() => {
    const h = Number(tinggiBadan);
    const w = Number(beratBadan);
    if (h > 0 && w > 0) {
      setValue('bmi', calculateBMI(h, w), { shouldDirty: false, shouldValidate: false });
    } else {
      setValue('bmi', undefined, { shouldDirty: false, shouldValidate: false });
    }
  }, [tinggiBadan, beratBadan, setValue]);

  const bmiStatus = bmi !== undefined ? getBMIStatus(bmi).status : undefined;

  if (!canEdit) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">
          Hanya perawat dan dokter yang dapat mengedit pemeriksaan fisik.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ fontFamily: 'var(--font-jakarta)' }}>
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-[#E6F5F4] border border-[#B2DFDB]' :
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
            : toast.type === 'warning'
            ? <AlertCircle size={20} strokeWidth={2} className="text-yellow-600 flex-shrink-0" />
            : <AlertCircle size={20} strokeWidth={2} className="text-red-500 flex-shrink-0" />}
          <span className={`font-medium text-sm ${
            toast.type === 'success' ? 'text-[#0F766E]' :
            toast.type === 'warning' ? 'text-yellow-700' :
            'text-red-600'
          }`}>
            {toast.text}
          </span>
        </div>
      )}

      <form
        id="form-physical-exam"
        className="w-full"
      >
        <h2
          className="mb-5 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
          style={{ WebkitTextStroke: '0.4px #0F766E' }}
        >
          Pemeriksaan Fisik
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col gap-8">

            {/* Row 1: Tekanan Darah | Suhu | Nadi | Napas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Controller
                name="tekananDarah"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Tekanan Darah"
                    unit="mmHg"
                    type="text"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="130/85"
                    warning={outOfBoundsFields.includes('tekananDarah')}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="suhu"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Suhu"
                    unit="°C"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="36.5"
                    warning={outOfBoundsFields.includes('suhu')}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="nadi"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Nadi"
                    unit="bpm"
                    type="number"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="80"
                    warning={outOfBoundsFields.includes('nadi')}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="napas"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Napas"
                    unit="x/mnt"
                    type="number"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="20"
                    warning={outOfBoundsFields.includes('napas')}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Row 2: Tinggi Badan | Berat Badan | BMI | (empty) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <Controller
                name="tinggiBadan"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Tinggi Badan"
                    unit="cm"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="170"
                    warning={outOfBoundsFields.includes('tinggiBadan')}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="beratBadan"
                control={control}
                render={({ field, fieldState }) => (
                  <VitalSignInput
                    label="Berat Badan"
                    unit="kg"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="65"
                    warning={outOfBoundsFields.includes('beratBadan')}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                    BMI
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    (Otomatis)
                  </span>
                </div>
                <BMIDisplay bmi={bmi} status={bmiStatus} />
              </div>
              <div />
            </div>

            {/* Row 3: Catatan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                Catatan
                <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(Opsional)</span>
              </label>
              <textarea
                {...register('catatan')}
                placeholder="Catatan tambahan pemeriksaan fisik..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[100px] transition-colors"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              />
              <p className="text-[12px] text-gray-400 text-right" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {catatan.length}/500 karakter
              </p>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
});

PhysicalExamForm.displayName = 'PhysicalExamForm';

export default PhysicalExamForm;
