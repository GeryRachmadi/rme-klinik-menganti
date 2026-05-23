'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HasilPeriksaSchema, type HasilPeriksaData } from '@/lib/schemas/hasil-periksa-schema';
import { getHasilPeriksaDraftKey } from '@/lib/constants/storage-keys';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';

export interface SubjectiveObjectiveExtendedFormRef {
  submitForm: () => Promise<HasilPeriksaData>;
  restoreDraft: (data: HasilPeriksaData) => void;
  resetForm: () => void;
}

export interface SubjectiveObjectiveExtendedFormProps {
  encounterId: string;
  hideSubmitButton?: boolean;
  /** When true, renders only the <form> fields without the outer h2 + white card wrapper */
  hideWrapper?: boolean;
  isReadOnly?: boolean;
  defaultValues?: { keluhanUtama?: string; pemeriksaanFisikTambahan?: string };
}

const SubjectiveObjectiveExtendedForm = forwardRef<SubjectiveObjectiveExtendedFormRef, SubjectiveObjectiveExtendedFormProps>(({
  encounterId,
  hideSubmitButton = false,
  hideWrapper = false,
  isReadOnly = false,
  defaultValues,
}, ref) => {
  const draftKey = getHasilPeriksaDraftKey(encounterId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    getValues,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<HasilPeriksaData>({
    resolver: zodResolver(HasilPeriksaSchema),
    mode: 'onChange',
    defaultValues: {
      keluhanUtama: defaultValues?.keluhanUtama ?? '',
      pemeriksaanFisikTambahan: defaultValues?.pemeriksaanFisikTambahan ?? '',
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isFormValid = await trigger();
      console.log('[SubjectiveObjectiveExtendedForm] Validation result:', { isFormValid, data: getValues() });
      if (!isFormValid) {
        throw new Error('Validasi form hasil periksa medis gagal. Mohon lengkapi data wajib.');
      }
      return getValues();
    },
    restoreDraft: (data: any) => {
      if (!data) return;
      setTimeout(() => {
        reset({ ...data });
      }, 0);
    },
    resetForm: () => {
      reset({ keluhanUtama: '', pemeriksaanFisikTambahan: '' });
    },
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData, isReadOnly, isDirty);

  const keluhanUtamaLength = currentFormData.keluhanUtama?.length || 0;
  const pemeriksaanFisikTambahanLength = currentFormData.pemeriksaanFisikTambahan?.length || 0;

  const formContent = (
    <>
      {/* Keluhan Utama */}
      <div className="flex flex-col">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Keluhan Utama
        </h3>
        <textarea
          id="keluhanUtama"
          rows={4}
          placeholder="Masukkan keluhan utama pasien…"
          disabled={isReadOnly}
          className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors placeholder-gray-400
            ${errors.keluhanUtama ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#0F766E] focus:border-[#0F766E]'}
            ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          {...register('keluhanUtama')}
        />
        <p className={`text-[12px] text-right mt-1 ${keluhanUtamaLength > 500 ? 'text-red-500' : 'text-gray-400'}`} style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {keluhanUtamaLength}/500 karakter
        </p>
        {errors.keluhanUtama && (
          <p className="text-red-500 text-[13px] mt-1.5">{errors.keluhanUtama.message}</p>
        )}
      </div>

      {/* Pemeriksaan Fisik Tambahan */}
      <div className="flex flex-col">
        <h3
          className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
          style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Pemeriksaan Fisik Tambahan
          <span className="text-gray-400 font-normal normal-case tracking-normal ml-1" style={{ WebkitTextStroke: '0' }}>(Opsional)</span>
        </h3>
        <textarea
          id="pemeriksaanFisikTambahan"
          rows={4}
          placeholder="Masukkan hasil pemeriksaan fisik tambahan…"
          disabled={isReadOnly}
          className={`w-full border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors placeholder-gray-400
            ${errors.pemeriksaanFisikTambahan ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#0F766E] focus:border-[#0F766E]'}
            ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          {...register('pemeriksaanFisikTambahan')}
        />
        <p className={`text-[12px] text-right mt-1 ${pemeriksaanFisikTambahanLength > 500 ? 'text-red-500' : 'text-gray-400'}`} style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {pemeriksaanFisikTambahanLength}/500 karakter
        </p>
        {errors.pemeriksaanFisikTambahan && (
          <p className="text-red-500 text-[13px] mt-1.5">{errors.pemeriksaanFisikTambahan.message}</p>
        )}
      </div>
    </>
  );

  if (hideWrapper) {
    return (
      <form id="form-hasil-periksa" className="flex flex-col gap-6">
        {formContent}
      </form>
    );
  }

  return (
    <div className="relative w-full font-sans">
      <h2
        className="mb-5 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
        style={{ WebkitTextStroke: '0.4px #0F766E' }}
      >
        Hasil Periksa Medis
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form id="form-hasil-periksa" className="flex flex-col gap-6">
          {formContent}
        </form>
      </div>
    </div>
  );
});

SubjectiveObjectiveExtendedForm.displayName = 'SubjectiveObjectiveExtendedForm';

export default SubjectiveObjectiveExtendedForm;
