'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HasilPeriksaSchema, type HasilPeriksaData } from '@/lib/schemas/hasil-periksa-schema';
import { getHasilPeriksaDraftKey } from '@/lib/constants/storage-keys';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';

export interface FormHasilPeriksaRef {
  submitForm: () => Promise<HasilPeriksaData>;
  restoreDraft: (data: HasilPeriksaData) => void;
}

export interface FormHasilPeriksaProps {
  encounterId: string;
  hideSubmitButton?: boolean;
  /** When true, renders only the <form> fields without the outer h2 + white card wrapper */
  hideWrapper?: boolean;
}

const FormHasilPeriksa = forwardRef<FormHasilPeriksaRef, FormHasilPeriksaProps>(({
  encounterId,
  hideSubmitButton = false,
  hideWrapper = false,
}, ref) => {
  const draftKey = getHasilPeriksaDraftKey(encounterId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<HasilPeriksaData>({
    resolver: zodResolver(HasilPeriksaSchema),
    mode: 'onChange',
    defaultValues: {
      keluhanUtama: '',
      pemeriksaanFisikTambahan: '',
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isFormValid = await trigger();
      console.log('[FormHasilPeriksa] Validation result:', { isFormValid, data: getValues() });
      if (!isFormValid) {
        throw new Error('Validasi form hasil periksa medis gagal. Mohon lengkapi data wajib.');
      }
      return getValues();
    },
    restoreDraft: (data: HasilPeriksaData) => {
      reset(data);
    }
  }));

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData);

  const keluhanUtamaLength = currentFormData.keluhanUtama?.length || 0;
  const pemeriksaanFisikTambahanLength = currentFormData.pemeriksaanFisikTambahan?.length || 0;

  const formContent = (
    <>
      {/* Keluhan Utama */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3
            className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins"
            style={{ WebkitTextStroke: '0.2px #0F766E' }}
          >
            Keluhan Utama
          </h3>
          <span className={`text-[12px] font-sans font-medium ${keluhanUtamaLength > 500 ? 'text-red-500' : 'text-gray-400'}`}>
            {keluhanUtamaLength}/500 karakter
          </span>
        </div>
        <textarea
          id="keluhanUtama"
          rows={4}
          placeholder="Masukkan keluhan utama pasien..."
          className={`w-full border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 min-h-[90px] transition-colors bg-[#F9FAFB] text-gray-900 placeholder-gray-400
            ${errors.keluhanUtama ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#0F766E] focus:border-[#0F766E]'}`}
          {...register('keluhanUtama')}
        />
        {errors.keluhanUtama && (
          <p className="text-red-500 text-[13px] mt-1.5">{errors.keluhanUtama.message}</p>
        )}
      </div>

      {/* Pemeriksaan Fisik Tambahan */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3
            className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins"
            style={{ WebkitTextStroke: '0.2px #0F766E' }}
          >
            Pemeriksaan Fisik Tambahan
            <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(Opsional)</span>
          </h3>
          <span className={`text-[12px] font-medium ${pemeriksaanFisikTambahanLength > 500 ? 'text-red-500' : 'text-gray-400'}`}>
            {pemeriksaanFisikTambahanLength}/500 karakter
          </span>
        </div>
        <textarea
          id="pemeriksaanFisikTambahan"
          rows={4}
          placeholder="Masukkan hasil pemeriksaan fisik tambahan..."
          className={`w-full border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 min-h-[90px] transition-colors bg-[#F9FAFB] text-gray-900 placeholder-gray-400
            ${errors.pemeriksaanFisikTambahan ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#0F766E] focus:border-[#0F766E]'}`}
          {...register('pemeriksaanFisikTambahan')}
        />
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
    <div className="relative w-full font-jakarta">
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

FormHasilPeriksa.displayName = 'FormHasilPeriksa';

export default FormHasilPeriksa;
