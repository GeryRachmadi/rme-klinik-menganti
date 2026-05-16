'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ReferralFormSchema, type ReferralFormValues } from '@/lib/schemas/plan-schema';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';

const getReferralDraftKey = (encounterId: string) => `draft_referral_${encounterId}`;

export interface PlanReferralFormRef {
  submitForm: () => Promise<ReferralFormValues | null>;
  resetForm: () => void;
  getValues: () => ReferralFormValues;
}

interface PlanReferralFormProps {
  encounterId: string;
}

const PlanReferralForm = forwardRef<PlanReferralFormRef, PlanReferralFormProps>(({
  encounterId,
}, ref) => {
  const draftKey = getReferralDraftKey(encounterId);
  const { toast, showWarning } = useFormToast();
  const isMountedRef = useRef(false);

  const { register, watch, reset, trigger, getValues, setValue, formState: { errors } } = useForm<ReferralFormValues>({
    resolver: zodResolver(ReferralFormSchema),
    mode: 'onChange',
    defaultValues: {
      isActive: false,
      tujuanRujukan: '',
      alasanRujukan: '',
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
    resetForm: () => {
      reset({ isActive: false, tujuanRujukan: '', alasanRujukan: '' });
    },
    getValues: () => getValues(),
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData);

  const isActive = watch('isActive');

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (!isActive) {
      setValue('tujuanRujukan', '', { shouldDirty: false });
      setValue('alasanRujukan', '', { shouldDirty: false });
      showWarning('Data rujukan disetel ulang');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

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

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue('isActive', !isActive, { shouldValidate: true })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isActive ? 'bg-teal-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm font-bold text-gray-800" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Rujuk ke Fasilitas Lain</span>
        </div>

        {isActive && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F766E] uppercase tracking-wider" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Tujuan Rujukan
              </label>
              <input
                type="text"
                {...register('tujuanRujukan')}
                placeholder="Contoh: RSUD Ibnu Sina Gresik"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] text-sm transition-colors"
              />
              {errors.tujuanRujukan && (
                <p className="text-red-500 text-[13px] mt-1">{errors.tujuanRujukan.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F766E] uppercase tracking-wider" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Alasan Rujukan
              </label>
              <textarea
                {...register('alasanRujukan')}
                placeholder="Pertimbangan Medis..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 min-h-[80px] focus:ring-[#0F766E] focus:border-[#0F766E] transition-colors"
              />
              {errors.alasanRujukan && (
                <p className="text-red-500 text-[13px] mt-1">{errors.alasanRujukan.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PlanReferralForm.displayName = 'PlanReferralForm';

export default PlanReferralForm;
