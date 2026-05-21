'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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

export interface SubjectiveInitialFormRef {
  submitForm: () => Promise<AssessmentFormValues | null>;
  restoreDraft: (data: AssessmentFormValues) => void;
}

interface SubjectiveInitialFormProps {
  encounterId: string;
  defaultValues?: Partial<AssessmentFormValues>;
  isEditMode?: boolean;
  hideSubmitButton?: boolean;
  draftState?: DraftState;
  isReadOnly?: boolean;
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
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {toast.text}
      </span>
    </div>
  );
}

const SubjectiveInitialForm = forwardRef<SubjectiveInitialFormRef, SubjectiveInitialFormProps>(({
  encounterId,
  defaultValues,
  isEditMode = false,
  hideSubmitButton = false,
  isReadOnly = false,
}, ref) => {
  const router = useRouter();
  const [alergiSeverity, setAlergiSeverity] = useState('Sedang');
  const [obatDosage, setObatDosage] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { toast, showSuccess, showError } = useFormToast();

  const { control, handleSubmit, register, watch, setValue, reset, trigger, getValues, formState: { errors, isDirty } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: {
      penyakit: Array.from(new Set(defaultValues?.penyakit ?? [])),
      alergi: Array.from(new Set(defaultValues?.alergi ?? [])),
      obat: Array.from(new Set(defaultValues?.obat ?? [])),
      catatanPenyakit: defaultValues?.catatanPenyakit ?? '',
      catatanAlergi: defaultValues?.catatanAlergi ?? '',
      catatanObat: defaultValues?.catatanObat ?? '',
      tidakAdaPenyakit: defaultValues?.tidakAdaPenyakit ?? false,
      tidakAdaAlergi: defaultValues?.tidakAdaAlergi ?? false,
      tidakAdaObat: defaultValues?.tidakAdaObat ?? false,
    },
  });

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await trigger();
      console.log('[SubjectiveInitialForm] Validation result:', { isValid, data: getValues() });
      if (!isValid) return null;
      return getValues();
    },
    restoreDraft: (data: any) => {
      if (!data) return;
      setTimeout(() => {
        reset({
          ...data,
          penyakit: Array.from(new Set(data.penyakit ?? [])),
          alergi: Array.from(new Set(data.alergi ?? [])),
          obat: Array.from(new Set(data.obat ?? [])),
          catatanPenyakit: data.catatanPenyakit ?? '',
          catatanAlergi: data.catatanAlergi ?? '',
          catatanObat: data.catatanObat ?? '',
          tidakAdaPenyakit: data.tidakAdaPenyakit ?? false,
          tidakAdaAlergi: data.tidakAdaAlergi ?? false,
          tidakAdaObat: data.tidakAdaObat ?? false,
        });
      }, 0);
    }
  }));

  const currentFormData = watch();
  useAutoSaveDraft(getAssessmentDraftKey(encounterId), currentFormData, isReadOnly, isDirty);

  const isPenyakitNull = watch('tidakAdaPenyakit');
  const isAlergiNull = watch('tidakAdaAlergi');
  const isObatNull = watch('tidakAdaObat');

  return (
    <div className="relative w-full">
      <FormToast toast={toast} />

      <form id="form-assessment" className="w-full font-sans">
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
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
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
                    disabled={isPenyakitNull || isReadOnly}
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
                disabled={isPenyakitNull || isReadOnly}
                placeholder={isPenyakitNull ? 'Tidak ada catatan' : 'Tambahkan Catatan Disini (Opsional)'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors
                  ${errors.penyakit ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isPenyakitNull || isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800 placeholder-gray-400'}`}
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => { setValue('penyakit', [], { shouldValidate: true }); setValue('catatanPenyakit', '', { shouldValidate: true }); }}
                  className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-2 self-end italic"
                >
                  Kosongkan Input
                </button>
              )}
              <FieldErrorMessage message={errors.penyakit?.message} />
            </div>

            {/* SECTION: ALERGI */}
            <div className="flex flex-col">
              <h3
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
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
                    disabled={isAlergiNull || isReadOnly}
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
                        disabled={isAlergiNull || isReadOnly}
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
                disabled={isAlergiNull || isReadOnly}
                placeholder={isAlergiNull ? 'Tidak ada catatan' : 'Tambahkan Catatan Disini (Opsional)'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors
                  ${errors.alergi ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isAlergiNull || isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800 placeholder-gray-400'}`}
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => { setValue('alergi', [], { shouldValidate: true }); setValue('catatanAlergi', '', { shouldValidate: true }); }}
                  className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-2 self-end italic"
                >
                  Kosongkan Input
                </button>
              )}
              <FieldErrorMessage message={errors.alergi?.message} />
            </div>

            {/* SECTION: OBAT */}
            <div className="flex flex-col">
              <h3
                className="text-sm font-bold text-[#0F766E] uppercase tracking-wider mb-3"
                style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
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
                    disabled={isObatNull || isReadOnly}
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
                        disabled={isObatNull || isReadOnly}
                        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] w-36 disabled:bg-gray-100"
                      />
                    }
                    formatOnAdd={(val) => obatDosage ? `${val} (${obatDosage})` : val}
                  />
                )}
              />
              <textarea
                {...register('catatanObat')}
                disabled={isObatNull || isReadOnly}
                placeholder={isObatNull ? 'Tidak ada catatan' : 'Tambahkan Catatan Disini (Opsional)'}
                className={`w-full mt-2 border rounded-xl p-4 text-sm font-sans resize-y focus:outline-none focus:ring-1 min-h-[100px] transition-colors
                  ${errors.obat ? 'border-red-500 focus:ring-red-500' : 'focus:ring-[#0F766E] focus:border-[#0F766E] border-gray-200'}
                  ${isObatNull || isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800 placeholder-gray-400'}`}
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => { setValue('obat', [], { shouldValidate: true }); setValue('catatanObat', '', { shouldValidate: true }); }}
                  className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-2 self-end italic"
                >
                  Kosongkan Input
                </button>
              )}
              <FieldErrorMessage message={errors.obat?.message} />
            </div>

          </div>
        </div>
      </form>
    </div>
  );
});

SubjectiveInitialForm.displayName = 'SubjectiveInitialForm';

export default SubjectiveInitialForm;
