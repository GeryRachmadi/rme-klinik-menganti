'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssessmentSchema, type AssessmentFormValues } from '@/lib/schemas/assessment-schema';
import ChipsInput from './ChipsInput';
import { useAutoSaveDraft } from '@/hooks/useAutoSaveDraft';
import { useFormToast } from '@/hooks/useFormToast';
import { parseAllergyChip, parseMedicationChip } from '@/lib/utils/assessment-parser';
import { deleteDraft } from '@/lib/utils/draft-utils';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { ASSESSMENT_CONFIG } from '@/lib/constants/assessment-validation';
import { getAssessmentDraftKey } from '@/lib/constants/storage-keys';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DraftState } from './AsesmenPageClient';

interface AssessmentFormProps {
  encounterId: string;
  defaultValues?: Partial<AssessmentFormValues>;
  isEditMode?: boolean;
  draftState: DraftState;
}

interface DraftPayload {
  data: AssessmentFormValues;
  timestamp: number;
}

const SUGGESTIONS_PENYAKIT = [
  'Hipertensi', 'Diabetes Melitus Tipe 2', 'Maag (Dispepsia)', 'Radang Tenggorokan (Faringitis)',
  'Asma', 'Asam Urat (Gout)', 'Kolesterol Tinggi', 'Tuberkulosis (TBC)', 'ISPA', 'Diare',
];
const SUGGESTIONS_ALERGI = [
  'Amoxicillin', 'Paracetamol', 'Ibuprofen', 'Seafood / Makanan Laut',
  'Kacang-kacangan', 'Telur', 'Debu', 'Cuaca Dingin', 'Susu Sapi', 'Penisilin',
];
const SUGGESTIONS_OBAT = [
  'Paracetamol', 'Amoxicillin', 'Metformin', 'Amlodipine', 'Simvastatin',
  'Omeprazole', 'Lansoprazole', 'Ibuprofen', 'Captopril', 'Antasida',
];

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-[13px] mt-1.5">{message}</p>;
}

function FormToast({ toast }: { toast: { type: 'success' | 'error' | 'warning'; text: string } | null }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all animate-in slide-in-from-top-5 duration-300 ${
      isSuccess ? 'bg-[#E6F5F4] border border-[#B2DFDB]' : 'bg-red-50 border border-red-200'
    }`}>
      {isSuccess ? (
        <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
      ) : (
        <AlertCircle size={20} strokeWidth={2} className="text-red-500 flex-shrink-0" />
      )}
      <span
        className={`font-medium text-sm ${isSuccess ? 'text-[#0F766E]' : 'text-red-600'}`}
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        {toast.text}
      </span>
    </div>
  );
}

export default function AssessmentForm({
  encounterId,
  defaultValues,
  isEditMode = false,
  draftState,
}: AssessmentFormProps) {
  const router = useRouter();
  const [alergiSeverity, setAlergiSeverity] = useState('Sedang');
  const [obatDosage, setObatDosage] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { toast, showSuccess, showError } = useFormToast();

  const { control, handleSubmit, register, watch, setValue, reset, formState: { errors } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: {
      penyakit: defaultValues?.penyakit ?? [],
      alergi: defaultValues?.alergi ?? [],
      obat: defaultValues?.obat ?? [],
      catatanPenyakit: defaultValues?.catatanPenyakit ?? '',
      catatanAlergi: defaultValues?.catatanAlergi ?? '',
      catatanObat: defaultValues?.catatanObat ?? '',
      tidakAdaPenyakit: defaultValues?.tidakAdaPenyakit ?? false,
      tidakAdaAlergi: defaultValues?.tidakAdaAlergi ?? false,
      tidakAdaObat: defaultValues?.tidakAdaObat ?? false,
    },
  });

  const currentFormData = watch();
  useAutoSaveDraft(getAssessmentDraftKey(encounterId), currentFormData);

  // Restore draft from localStorage when parent signals 'use'
  useEffect(() => {
    if (draftState !== 'use') return;
    const raw = localStorage.getItem(getAssessmentDraftKey(encounterId));
    if (!raw) {
      console.log('[AssessmentForm] draftState=use but no localStorage data found');
      setDraftLoaded(true);
      return;
    }
    try {
      const payload: DraftPayload = JSON.parse(raw);
      if (payload.data) {
        reset({
          ...payload.data,
          penyakit: payload.data.penyakit ?? [],
          alergi: payload.data.alergi ?? [],
          obat: payload.data.obat ?? [],
        });
        console.log('[AssessmentForm] ✓ Draft restored from localStorage');
      }
    } catch {
      localStorage.removeItem(getAssessmentDraftKey(encounterId));
      console.error('[AssessmentForm] Draft JSON corrupted — discarding');
    }
    setDraftLoaded(true);
  }, [draftState, encounterId, reset]);

  // Mark as loaded immediately when no restoration is needed
  useEffect(() => {
    if (draftState === 'no_draft') {
      setDraftLoaded(true);
    }
  }, [draftState]);

  const isPenyakitNull = watch('tidakAdaPenyakit');
  const isAlergiNull = watch('tidakAdaAlergi');
  const isObatNull = watch('tidakAdaObat');

  const onSubmitForm = async (formData: AssessmentFormValues) => {
    try {
      const parsedData = {
        penyakit: formData.penyakit ?? [],
        alergi: (formData.alergi ?? []).map(parseAllergyChip),
        obat: (formData.obat ?? []).map(parseMedicationChip),
        tidakAdaPenyakit: formData.tidakAdaPenyakit,
        tidakAdaAlergi: formData.tidakAdaAlergi,
        tidakAdaObat: formData.tidakAdaObat,
        catatanPenyakit: formData.catatanPenyakit,
        catatanAlergi: formData.catatanAlergi,
        catatanObat: formData.catatanObat,
      };

      const response = await fetch(`/api/encounters/${encounterId}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        const { message } = await handleApiError(response);
        throw new Error(message);
      }

      deleteDraft(encounterId);
      showSuccess('Asesmen keperawatan berhasil disimpan.');

      setTimeout(() => {
        router.push('/rawat-jalan');
      }, ASSESSMENT_CONFIG.redirectDelayMs);

    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'Terjadi kesalahan sistem.');
    }
  };

  if (draftState === 'checking' || draftState === 'pending' || !draftLoaded) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Memuat form asesmen...</div>;
  }

  return (
    <div className="relative w-full">
      <FormToast toast={toast} />

      <form onSubmit={handleSubmit(onSubmitForm)} className="w-full font-jakarta">
        <h2
          className="mb-5 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
          style={{ WebkitTextStroke: '0.4px #0F766E' }}
        >
          Kajian Awal Keperawatan
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col gap-10">

            {/* SECTION: PENYAKIT */}
            <div className="flex flex-col">
              <h3
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E' }}
              >
                Riwayat Penyakit Terdahulu
              </h3>
              <Controller
                name="penyakit"
                control={control}
                render={({ field }) => (
                  <ChipsInput
                    addLabel="Riwayat"
                    value={field.value ?? []}
                    suggestions={SUGGESTIONS_PENYAKIT}
                    disabled={isPenyakitNull}
                    negationLabel="Pasien menyangkal ada riwayat penyakit"
                    negationChecked={isPenyakitNull}
                    onNegationChange={(checked) => {
                      setValue('tidakAdaPenyakit', checked, { shouldValidate: true });
                      if (checked) {
                        setValue('penyakit', [], { shouldValidate: true });
                        setValue('catatanPenyakit', '', { shouldValidate: true });
                      }
                    }}
                    onChange={(newVal) => {
                      field.onChange(newVal);
                      if (newVal.length > 0) setValue('tidakAdaPenyakit', false, { shouldValidate: true });
                    }}
                    placeholder="Contoh: Maag, Radang Tenggorokan"
                  />
                )}
              />
              <textarea
                {...register('catatanPenyakit')}
                disabled={isPenyakitNull}
                placeholder={isPenyakitNull ? 'Tidak ada catatan' : 'Tambahkan catatan disini...'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 min-h-[90px] transition-colors
                  ${errors.penyakit ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isPenyakitNull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] text-gray-900 placeholder-gray-400'}`}
              />
              <FieldErrorMessage message={errors.penyakit?.message} />
            </div>

            {/* SECTION: ALERGI */}
            <div className="flex flex-col">
              <h3
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E' }}
              >
                Riwayat Alergi
              </h3>
              <Controller
                name="alergi"
                control={control}
                render={({ field }) => (
                  <ChipsInput
                    addLabel="Riwayat"
                    value={field.value ?? []}
                    suggestions={SUGGESTIONS_ALERGI}
                    disabled={isAlergiNull}
                    negationLabel="No Known Allergies (NKA)"
                    negationChecked={isAlergiNull}
                    onNegationChange={(checked) => {
                      setValue('tidakAdaAlergi', checked, { shouldValidate: true });
                      if (checked) {
                        setValue('alergi', [], { shouldValidate: true });
                        setValue('catatanAlergi', '', { shouldValidate: true });
                      }
                    }}
                    onChange={(newVal) => {
                      field.onChange(newVal);
                      if (newVal.length > 0) setValue('tidakAdaAlergi', false, { shouldValidate: true });
                    }}
                    placeholder="Contoh: Amoxicillin"
                    extraInputNode={
                      <select
                        value={alergiSeverity}
                        onChange={(e) => setAlergiSeverity(e.target.value)}
                        disabled={isAlergiNull}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] bg-white disabled:bg-gray-100"
                      >
                        <option>Tinggi</option>
                        <option>Sedang</option>
                        <option>Rendah</option>
                      </select>
                    }
                    formatOnAdd={(val) => `${val} (${alergiSeverity})`}
                    getChipColor={(chip) =>
                      chip.includes('Tinggi') ? 'bg-red-50 border-red-200 text-red-800' :
                      chip.includes('Sedang') ? 'bg-orange-50 border-orange-200 text-orange-800' :
                      chip.includes('Rendah') ? 'bg-blue-50 border-blue-200 text-blue-800' :
                      'bg-[#E6F5F4] border-[#B2DFDB] text-[#0F766E]'
                    }
                  />
                )}
              />
              <textarea
                {...register('catatanAlergi')}
                disabled={isAlergiNull}
                placeholder={isAlergiNull ? 'Tidak ada catatan' : 'Tambahkan catatan disini...'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 min-h-[90px] transition-colors
                  ${errors.alergi ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isAlergiNull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] text-gray-900 placeholder-gray-400'}`}
              />
              <FieldErrorMessage message={errors.alergi?.message} />
            </div>

            {/* SECTION: OBAT */}
            <div className="flex flex-col">
              <h3
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E' }}
              >
                Pengobatan Rutin
              </h3>
              <Controller
                name="obat"
                control={control}
                render={({ field }) => (
                  <ChipsInput
                    addLabel="Riwayat"
                    value={field.value ?? []}
                    suggestions={SUGGESTIONS_OBAT}
                    disabled={isObatNull}
                    negationLabel="Tidak ada pengobatan rutin"
                    negationChecked={isObatNull}
                    onNegationChange={(checked) => {
                      setValue('tidakAdaObat', checked, { shouldValidate: true });
                      if (checked) {
                        setValue('obat', [], { shouldValidate: true });
                        setValue('catatanObat', '', { shouldValidate: true });
                      }
                    }}
                    onChange={(newVal) => {
                      field.onChange(newVal);
                      if (newVal.length > 0) setValue('tidakAdaObat', false, { shouldValidate: true });
                    }}
                    placeholder="Contoh: Paracetamol"
                    extraInputNode={
                      <input
                        type="text"
                        value={obatDosage}
                        onChange={(e) => setObatDosage(e.target.value)}
                        placeholder="Dosis (opsional)"
                        disabled={isObatNull}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] w-36 disabled:bg-gray-100"
                      />
                    }
                    formatOnAdd={(val) => obatDosage ? `${val} (${obatDosage})` : val}
                  />
                )}
              />
              <textarea
                {...register('catatanObat')}
                disabled={isObatNull}
                placeholder={isObatNull ? 'Tidak ada catatan' : 'Tambahkan catatan disini...'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-1 min-h-[90px] transition-colors
                  ${errors.obat ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isObatNull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#F9FAFB] text-gray-900 placeholder-gray-400'}`}
              />
              <FieldErrorMessage message={errors.obat?.message} />
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
