'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import OutOfBoundsConfirmModal from './OutOfBoundsConfirmModal';
import type { DraftState } from './AsesmenPageClient';

// ─── Prop types ──────────────────────────────────────────────────────────────

interface PhysicalExamFormProps {
  encounterId: string;
  isEditMode?: boolean;
  canEdit?: boolean;
  draftState: DraftState;
}

// ─── Draft payload ────────────────────────────────────────────────────────────

interface DraftPayload {
  data: PhysicalExamData;
  timestamp: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PhysicalExamForm({
  encounterId,
  isEditMode = false,
  canEdit = true,
  draftState,
}: PhysicalExamFormProps) {
  const router = useRouter();
  const draftKey = getPhysicalExamDraftKey(encounterId);

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showSuccess, showError, showWarning } = useFormToast();

  const [outOfBoundsFields, setOutOfBoundsFields] = useState<string[]>([]);
  const [showOutOfBoundsModal, setShowOutOfBoundsModal] = useState(false);
  const [userConfirmedSubmit, setUserConfirmedSubmit] = useState(false);

  const {
    control,
    register,
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<PhysicalExamData>({
    resolver: zodResolver(PhysicalExamSchema),
    mode: 'onChange',
    defaultValues: {
      tekananDarah: '',
      suhu: '' as any,
      nadi: '' as any,
      napas: '' as any,
      tinggiBadan: '' as any,
      beratBadan: '' as any,
      bmi: undefined,
      catatan: '',
    },
  });

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

  // Restore draft from localStorage when parent signals 'use'
  useEffect(() => {
    if (draftState !== 'use') return;
    if (isEditMode) {
      localStorage.removeItem(draftKey);
      setDraftLoaded(true);
      return;
    }
    const raw = localStorage.getItem(draftKey);
    if (!raw) {
      console.log('[PhysicalExamForm] draftState=use but no localStorage data found');
      setDraftLoaded(true);
      return;
    }
    try {
      const payload: DraftPayload = JSON.parse(raw);
      if (payload.data) {
        reset(payload.data);
        console.log('[PhysicalExamForm] ✓ Draft restored from localStorage');
      }
    } catch {
      localStorage.removeItem(draftKey);
      console.error('[PhysicalExamForm] Draft JSON corrupted — discarding');
    }
    setDraftLoaded(true);
  }, [draftState, encounterId, draftKey, isEditMode, reset]);

  // Mark as loaded immediately when no restoration is needed
  useEffect(() => {
    if (draftState === 'no_draft') {
      if (isEditMode) localStorage.removeItem(draftKey);
      setDraftLoaded(true);
    }
  }, [draftState, draftKey, isEditMode]);

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

  const onSubmitForm = async (data: PhysicalExamData) => {
    if (!canEdit) {
      showError("Anda tidak memiliki izin untuk menyimpan pemeriksaan fisik.");
      return;
    }

    const outOfBounds = getOutOfBoundsFields(data);

    if (outOfBounds.length > 0 && !userConfirmedSubmit) {
      setShowOutOfBoundsModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/encounters/${encounterId}/physical-exam`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userConfirmedOutOfBounds: userConfirmedSubmit
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          showError("Data tidak valid. Periksa kembali nilai tanda vital.");
        } else if (response.status === 401) {
          showError("Sesi Anda telah berakhir. Silakan login ulang.");
        } else if (response.status === 403) {
          showError("Hanya perawat dan dokter yang dapat menyimpan pemeriksaan fisik.");
        } else if (response.status === 404) {
          showError("Kunjungan tidak ditemukan.");
        } else {
          showError(errorData.error || "Gagal menyimpan pemeriksaan fisik.");
        }
        return;
      }

      showSuccess("Pemeriksaan fisik berhasil disimpan");
      localStorage.removeItem(draftKey);

      setTimeout(() => {
        router.push(`/rawat-jalan`);
      }, 1500);
    } catch (error: unknown) {
      console.error("Submission error:", error);
      showError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePeriksaUlang = () => {
    setShowOutOfBoundsModal(false);
    setUserConfirmedSubmit(false);
  };

  const handleSimpanTetap = () => {
    setUserConfirmedSubmit(true);
    setShowOutOfBoundsModal(false);
    showWarning("Data tanda vital di luar batas normal. Melanjutkan penyimpanan...");

    // Using a timeout to ensure state update, then re-submit
    setTimeout(() => {
      onSubmitForm(getValues() as PhysicalExamData);
    }, 100);
  };

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

  if (draftState === 'checking' || draftState === 'pending' || !draftLoaded) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Memuat form pemeriksaan fisik...
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <OutOfBoundsConfirmModal
        isOpen={showOutOfBoundsModal}
        outOfBoundsFields={outOfBoundsFields}
        onPeriksaUlang={handlePeriksaUlang}
        onSimpanTetap={handleSimpanTetap}
      />

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
        onSubmit={(e) => {
          e.preventDefault();
          // By passing the current form values directly, we allow submission even if Zod schema has bounds warnings.
          // This fulfills the requirement "Form still allows submission with invalid data (modal blocks, not schema)"
          onSubmitForm(getValues() as PhysicalExamData);
        }}
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
                render={({ field }) => (
                  <VitalSignInput
                    label="Tekanan Darah"
                    unit="mmHg"
                    type="text"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="130/85"
                    warning={outOfBoundsFields.includes('tekananDarah')}
                  />
                )}
              />
              <Controller
                name="suhu"
                control={control}
                render={({ field }) => (
                  <VitalSignInput
                    label="Suhu"
                    unit="°C"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="36.5"
                    warning={outOfBoundsFields.includes('suhu')}
                  />
                )}
              />
              <Controller
                name="nadi"
                control={control}
                render={({ field }) => (
                  <VitalSignInput
                    label="Nadi"
                    unit="bpm"
                    type="number"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="80"
                    warning={outOfBoundsFields.includes('nadi')}
                  />
                )}
              />
              <Controller
                name="napas"
                control={control}
                render={({ field }) => (
                  <VitalSignInput
                    label="Napas"
                    unit="x/mnt"
                    type="number"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="20"
                    warning={outOfBoundsFields.includes('napas')}
                  />
                )}
              />
            </div>

            {/* Row 2: Tinggi Badan | Berat Badan | BMI | (empty) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <Controller
                name="tinggiBadan"
                control={control}
                render={({ field }) => (
                  <VitalSignInput
                    label="Tinggi Badan"
                    unit="cm"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="170"
                    warning={outOfBoundsFields.includes('tinggiBadan')}
                  />
                )}
              />
              <Controller
                name="beratBadan"
                control={control}
                render={({ field }) => (
                  <VitalSignInput
                    label="Berat Badan"
                    unit="kg"
                    type="number"
                    step={0.1}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="65"
                    warning={outOfBoundsFields.includes('beratBadan')}
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
              </label>
              <textarea
                {...register('catatan')}
                placeholder="Catatan tambahan pemeriksaan fisik (opsional)"
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] min-h-[100px] transition-colors"
              />
              <p className="text-[12px] text-gray-400 text-right">
                {catatan.length}/500 karakter
              </p>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8 mb-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push('/rawat-jalan')}
            className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canEdit}
            className="px-8 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm min-w-[120px] flex justify-center items-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
