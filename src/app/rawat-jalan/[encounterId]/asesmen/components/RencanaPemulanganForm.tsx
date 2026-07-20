'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  DISCHARGE_DISPOSITION_OPTIONS,
  DischargeDispositionFormSchema,
  type DischargeDispositionFormValues,
} from '@/lib/schemas/plan-schema';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';
import { getRencanaPemulanganDraftKey } from '@/lib/constants/storage-keys';

export interface RencanaPemulanganFormRef {
  submitForm: () => Promise<DischargeDispositionFormValues | null>;
  resetForm: () => void;
  getValues: () => DischargeDispositionFormValues;
}

interface RencanaPemulanganFormProps {
  encounterId: string;
  isReadOnly?: boolean;
  defaultValues?: {
    label?: string;
    tujuanRujukan?: string;
    alasanRujukan?: string;
    dischargeReason?: string;
  };
}

const EMPTY_VALUES: DischargeDispositionFormValues = {
  label: '',
  tujuanRujukan: '',
  alasanRujukan: '',
  dischargeReason: '',
};

const RencanaPemulanganForm = forwardRef<RencanaPemulanganFormRef, RencanaPemulanganFormProps>(({
  encounterId,
  isReadOnly = false,
  defaultValues,
}, ref) => {
  const draftKey = getRencanaPemulanganDraftKey(encounterId);
  const { toast, showWarning } = useFormToast();
  const isMountedRef = useRef(false);

  const { register, watch, reset, trigger, getValues, setValue, formState: { errors, isDirty } } = useForm<DischargeDispositionFormValues>({
    resolver: zodResolver(DischargeDispositionFormSchema),
    mode: 'onChange',
    defaultValues: {
      label: (defaultValues?.label as DischargeDispositionFormValues['label']) ?? '',
      tujuanRujukan: defaultValues?.tujuanRujukan ?? '',
      alasanRujukan: defaultValues?.alasanRujukan ?? '',
      dischargeReason: defaultValues?.dischargeReason ?? '',
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
      reset(EMPTY_VALUES);
    },
    getValues: () => getValues(),
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  const label = watch('label');
  const isRujukan = label === 'Dirujuk ke Fasilitas Lain';
  const isLainLain = label === 'Lain-lain';
  const tujuanValue = watch('tujuanRujukan');
  const alasanValue = watch('alasanRujukan');

  // Cross-field re-validation mirrors PlanReferralForm: the refine() error for
  // Tujuan lives on tujuanRujukan's path, so filling Alasan alone won't clear it.
  useEffect(() => {
    if (isRujukan) trigger('tujuanRujukan');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alasanValue]);

  useEffect(() => {
    if (isRujukan) trigger('alasanRujukan');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tujuanValue]);

  // When the doctor switches away from "Dirujuk", clear its Tujuan/Alasan fields
  // so a stale value from a previous selection can't be silently resubmitted.
  // Catatan Tambahan is hidden specifically for "Dirujuk" (it already has its
  // own Tujuan/Alasan fields), so switching INTO "Dirujuk" clears it too —
  // otherwise a hidden field's leftover text would still get silently saved.
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (isReadOnly) return;
    const hadRujukanData = !isRujukan && (!!getValues('tujuanRujukan')?.trim() || !!getValues('alasanRujukan')?.trim());
    const hadCatatanData = isRujukan && !!getValues('dischargeReason')?.trim();
    if (!isRujukan) {
      setValue('tujuanRujukan', '', { shouldDirty: false });
      setValue('alasanRujukan', '', { shouldDirty: false });
    }
    if (isRujukan) {
      setValue('dischargeReason', '', { shouldDirty: false });
    }
    if (hadRujukanData || hadCatatanData) {
      showWarning('Data rencana pemulangan disetel ulang');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          toast.type === 'success' ? 'bg-[#E6F5F4] border border-[#B2DFDB]' :
          'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
          ) : (
            <AlertCircle size={20} strokeWidth={2} className={
              toast.type === 'warning' ? 'text-yellow-600 flex-shrink-0' : 'text-red-500 flex-shrink-0'
            } />
          )}
          <span className={`font-medium text-sm ${
            toast.type === 'warning' ? 'text-yellow-700' :
            toast.type === 'success' ? 'text-[#0F766E]' :
            'text-red-600'
          }`}>
            {toast.text}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Rencana Pemulangan
          <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
        </h3>
        <SearchableSelect
          options={[...DISCHARGE_DISPOSITION_OPTIONS]}
          value={label ?? ''}
          onChange={(val) => setValue('label', val as DischargeDispositionFormValues['label'], { shouldValidate: true, shouldDirty: true })}
          placeholder="Pilih Rencana Pemulangan..."
          disabled={isReadOnly}
          hasError={!!errors.label}
        />
        {errors.label && (
          <p className="text-red-500 text-[13px] mt-1">{errors.label.message}</p>
        )}
      </div>

      {isRujukan && (
        <div className="flex flex-col gap-1.5">
          <h3
            className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
            style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Tujuan Rujukan
          </h3>
          <input
            type="text"
            {...register('tujuanRujukan')}
            placeholder="Contoh: RSUD Ibnu Sina Gresik"
            disabled={isReadOnly}
            className={`block w-full px-3 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 font-sans focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] text-sm transition-colors ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          />
          {errors.tujuanRujukan && (
            <p className="text-red-500 text-[13px] mt-1">{errors.tujuanRujukan.message}</p>
          )}
        </div>
      )}

      {isRujukan && (
        <div className="flex flex-col gap-1.5">
          <h3
            className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
            style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Alasan Rujukan
          </h3>
          <textarea
            {...register('alasanRujukan')}
            placeholder="Pertimbangan Medis…"
            rows={3}
            disabled={isReadOnly}
            className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200 transition-colors placeholder-gray-400 ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          />
          {errors.alasanRujukan && (
            <p className="text-red-500 text-[13px] mt-1">{errors.alasanRujukan.message}</p>
          )}
        </div>
      )}

      {!!label && !isRujukan && (
        <div className="flex flex-col gap-1.5">
          <h3
            className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
            style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Catatan Tambahan
            {isLainLain ? (
              <span className="text-red-500 ml-1" style={{ WebkitTextStroke: '0' }}>*</span>
            ) : (
              <span className="normal-case font-medium text-gray-400 ml-1">(Opsional)</span>
            )}
          </h3>
          <textarea
            {...register('dischargeReason')}
            placeholder="Jelaskan rencana pemulangan…"
            rows={3}
            disabled={isReadOnly}
            className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[80px] focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200 transition-colors placeholder-gray-400 ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          />
          {errors.dischargeReason && (
            <p className="text-red-500 text-[13px] mt-1">{errors.dischargeReason.message}</p>
          )}
        </div>
      )}
    </div>
  );
});

RencanaPemulanganForm.displayName = 'RencanaPemulanganForm';

export default RencanaPemulanganForm;
