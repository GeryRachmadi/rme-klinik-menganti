'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HasilPeriksaSchema, type HasilPeriksaData } from '@/lib/schemas/hasil-periksa-schema';
import { getHasilPeriksaDraftKey } from '@/lib/constants/storage-keys';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';
import DraftFoundModal from './DraftFoundModal';

export interface FormHasilPeriksaProps {
  encounterId: string;
  onSubmit: (data: HasilPeriksaData) => void;
}

export default function FormHasilPeriksa({ encounterId, onSubmit }: FormHasilPeriksaProps) {
  const draftKey = getHasilPeriksaDraftKey(encounterId);
  const { showSuccess } = useFormToast();
  
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<HasilPeriksaData>({
    resolver: zodResolver(HasilPeriksaSchema),
    mode: 'onChange',
    defaultValues: {
      keluhanUtama: '',
      pemeriksaanFisikTambahan: '',
    },
  });

  const currentFormData = watch();
  useAutoSaveDraft(draftKey, currentFormData);

  // Watch for character counts
  const keluhanUtamaLength = currentFormData.keluhanUtama?.length || 0;
  const pemeriksaanFisikTambahanLength = currentFormData.pemeriksaanFisikTambahan?.length || 0;

  // Hydration and draft check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const raw = localStorage.getItem(draftKey);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const data = payload.data as HasilPeriksaData;
      
      const hasContent = !!data.keluhanUtama || !!data.pemeriksaanFisikTambahan;
      
      if (hasContent) {
        setShowDraftModal(true);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [isHydrated, draftKey]);

  const handleUseDraft = () => {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      try {
        const payload = JSON.parse(raw);
        reset(payload.data);
        showSuccess('Draf berhasil dipulihkan');
      } catch {
        // ignore error
      }
    }
    setShowDraftModal(false);
  };

  const handleRejectDraft = () => {
    localStorage.removeItem(draftKey);
    setShowDraftModal(false);
  };

  const submitHandler = async (data: HasilPeriksaData) => {
    // Calling the onSubmit prop
    await onSubmit(data);
    
    // Clear draft upon successful submission
    localStorage.removeItem(draftKey);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <DraftFoundModal
        isOpen={showDraftModal}
        draftTypes={['hasil-periksa']}
        onUseDraft={handleUseDraft}
        onRejectDraft={handleRejectDraft}
      />

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#E6F5F4] text-[#0F766E] flex items-center justify-center font-bold text-sm">
          S/O
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
            Hasil Pemeriksaan Dokter
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Tambahan catatan subjektif dan objektif (opsional)
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          
          {/* Keluhan Utama */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="keluhanUtama" className="block text-[14px] font-semibold text-gray-700">
                Keluhan Utama
                <span className="text-gray-400 font-normal ml-1">(Opsional)</span>
              </label>
              <span className={`text-[12px] font-medium ${keluhanUtamaLength > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {keluhanUtamaLength}/500 karakter
              </span>
            </div>
            <textarea
              id="keluhanUtama"
              rows={4}
              placeholder="Masukkan keluhan utama pasien..."
              className={`w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400
                ${errors.keluhanUtama ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-[#0F766E] focus:ring-[#E6F5F4]'}
              `}
              {...register('keluhanUtama')}
            />
            {errors.keluhanUtama && (
              <p className="text-red-500 text-[13px] mt-1.5">{errors.keluhanUtama.message}</p>
            )}
          </div>

          {/* Pemeriksaan Fisik Tambahan */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="pemeriksaanFisikTambahan" className="block text-[14px] font-semibold text-gray-700">
                Pemeriksaan Fisik Tambahan
                <span className="text-gray-400 font-normal ml-1">(Opsional)</span>
              </label>
              <span className={`text-[12px] font-medium ${pemeriksaanFisikTambahanLength > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {pemeriksaanFisikTambahanLength}/500 karakter
              </span>
            </div>
            <textarea
              id="pemeriksaanFisikTambahan"
              rows={4}
              placeholder="Masukkan hasil pemeriksaan fisik tambahan..."
              className={`w-full px-4 py-3 rounded-xl border text-[14px] focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400
                ${errors.pemeriksaanFisikTambahan ? 'border-red-300 focus:ring-red-100' : 'border-gray-300 focus:border-[#0F766E] focus:ring-[#E6F5F4]'}
              `}
              {...register('pemeriksaanFisikTambahan')}
            />
            {errors.pemeriksaanFisikTambahan && (
              <p className="text-red-500 text-[13px] mt-1.5">{errors.pemeriksaanFisikTambahan.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-6 py-2.5 bg-[#0F766E] text-white font-medium rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
            >
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
