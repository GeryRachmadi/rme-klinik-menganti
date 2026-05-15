'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectiveInitialForm, { SubjectiveInitialFormRef } from './SubjectiveInitialForm';
import ObjectivePhysicalForm, { ObjectivePhysicalFormRef } from './ObjectivePhysicalForm';
import SubjectiveObjectiveExtendedForm, { SubjectiveObjectiveExtendedFormRef } from './SubjectiveObjectiveExtendedForm';
import { AssessmentDiagnosisForm } from './AssessmentDiagnosisForm';
import PlanProcedureForm, { PlanProcedureFormRef } from './PlanProcedureForm';
import DraftFoundModal from './DraftFoundModal';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFormToast } from '@/hooks/useFormToast';
import { getAssessmentDraftKey, getPhysicalExamDraftKey, getHasilPeriksaDraftKey } from '@/lib/constants/storage-keys';
import MissingDataWarning from './MissingDataWarning';

export interface AsesmenDokterProps {
  encounterId: string;
  patient: Record<string, any>;
  encounter: Record<string, any>;
  session?: any;
  defaultValues?: Record<string, any>;
  isEditMode?: boolean;
  initialAssessment: { penyakit: string[]; alergi: string[]; obat: string[] } | null;
  initialPhysical: {
    systolic: number | null;
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
  } | null;
}

export default function AsesmenDokter({
  encounterId,
  patient,
  encounter,
  session,
  defaultValues,
  isEditMode = false,
  initialAssessment,
  initialPhysical,
}: AsesmenDokterProps) {
  const router = useRouter();
  const { toast, showSuccess, showError } = useFormToast();

  const missingAssessment =
    initialAssessment === null ||
    (initialAssessment.penyakit.length === 0 &&
      initialAssessment.alergi.length === 0 &&
      initialAssessment.obat.length === 0);

  const missingVitals =
    initialPhysical === null ||
    (!initialPhysical.systolic &&
      !initialPhysical.temperature &&
      !initialPhysical.heartRate &&
      !initialPhysical.respiratoryRate);

  console.log('[AsesmenDokter] Assessment missing:', missingAssessment);
  console.log('[AsesmenDokter] Vitals missing:', missingVitals);
  
  const assessmentRef = useRef<SubjectiveInitialFormRef>(null);
  const physicalRef = useRef<ObjectivePhysicalFormRef>(null);
  const hasilPeriksaRef = useRef<SubjectiveObjectiveExtendedFormRef>(null);
  const procedureRef = useRef<PlanProcedureFormRef>(null);

  const [isSubmittingCentral, setIsSubmittingCentral] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{code: string, display: string, notes?: string}>>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<{
    assessment?: any;
    physical?: any;
    hasilPeriksa?: any;
  }>({});
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode) return;

    const draftA = localStorage.getItem(getAssessmentDraftKey(encounterId));
    const draftP = localStorage.getItem(getPhysicalExamDraftKey(encounterId));
    const draftH = localStorage.getItem(getHasilPeriksaDraftKey(encounterId));

    const parsedDrafts: any = {};
    const types: string[] = [];

    if (draftA) {
      try {
        const payload = JSON.parse(draftA);
        if (payload.data) {
          parsedDrafts.assessment = payload.data;
          types.push('assessment');
        }
      } catch (e) {
        localStorage.removeItem(getAssessmentDraftKey(encounterId));
      }
    }

    if (draftP) {
      try {
        const payload = JSON.parse(draftP);
        if (payload.data) {
          parsedDrafts.physical = payload.data;
          types.push('physical');
        }
      } catch (e) {
        localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
      }
    }

    if (draftH) {
      try {
        const payload = JSON.parse(draftH);
        if (payload.data) {
          parsedDrafts.hasilPeriksa = payload.data;
          types.push('hasil-periksa');
        }
      } catch (e) {
        localStorage.removeItem(getHasilPeriksaDraftKey(encounterId));
      }
    }

    if (types.length > 0) {
      setAvailableDrafts(parsedDrafts);
      setDraftTypes(types);
      setShowDraftModal(true);
    }
  }, [encounterId, isEditMode]);

  const handleUseDraft = () => {
    if (availableDrafts.assessment && assessmentRef.current) {
      assessmentRef.current.restoreDraft(availableDrafts.assessment);
    }
    if (availableDrafts.physical && physicalRef.current) {
      physicalRef.current.restoreDraft(availableDrafts.physical);
    }
    if (availableDrafts.hasilPeriksa && hasilPeriksaRef.current) {
      hasilPeriksaRef.current.restoreDraft(availableDrafts.hasilPeriksa);
    }
    setShowDraftModal(false);
    showSuccess('Draf berhasil dipulihkan.');
  };

  const handleRejectDraft = () => {
    localStorage.removeItem(getAssessmentDraftKey(encounterId));
    localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
    localStorage.removeItem(getHasilPeriksaDraftKey(encounterId));
    setShowDraftModal(false);
  };

  const handleSelectDiagnosis = (code: string, display: string, notes?: string) => {
    if (code === 'MANUAL' || !selectedDiagnoses.find(d => d.code === code)) {
      setSelectedDiagnoses([...selectedDiagnoses, { code, display, notes }]);
    }
  };

  const handleRemoveDiagnosis = (code: string, idx: number) => {
    setSelectedDiagnoses(selectedDiagnoses.filter((_, i) => i !== idx));
  };

  const handleCentralSubmit = async () => {
    setIsSubmittingCentral(true);
    let saved = false;
    try {
      // Individually catch each submitForm so that FormHasilPeriksa's throw is
      // normalised to null (same as the null-returning forms) instead of
      // bubbling up as an unhandled rejection.
      let assessmentData: unknown = null;
      let physicalData: unknown = null;
      let hasilPeriksaData: unknown = null;

      try { assessmentData = await assessmentRef.current?.submitForm() ?? null; } catch { assessmentData = null; }
      try { physicalData = await physicalRef.current?.submitForm() ?? null; } catch { physicalData = null; }
      try { hasilPeriksaData = await hasilPeriksaRef.current?.submitForm() ?? null; } catch { hasilPeriksaData = null; }

      if (missingAssessment) console.log('[AsesmenDokter] Doctor is completing missing Assessment data');
      if (missingVitals) console.log('[AsesmenDokter] Doctor is completing missing Vitals data');
      console.log('[AsesmenDokter] Validation results:', { assessmentData, physicalData, hasilPeriksaData });

      if (!assessmentData) {
        showError('Periksa kembali bagian Kajian Awal Keperawatan.');
        return;
      }
      if (!physicalData) {
        showError('Periksa kembali bagian Pemeriksaan Fisik.');
        return;
      }
      if (!hasilPeriksaData) {
        showError('Periksa kembali bagian Hasil Periksa Medis.');
        return;
      }

      const response = await fetch(`/api/rawat-jalan/${encounterId}/asesmen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentData, physicalData, hasilPeriksaData, selectedDiagnoses }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError(result.error || 'Gagal menyimpan data ke server.');
        return;
      }

      saved = true;
      localStorage.removeItem(getAssessmentDraftKey(encounterId));
      localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
      localStorage.removeItem(getHasilPeriksaDraftKey(encounterId));
      showSuccess('Asesmen berhasil disimpan. Status kunjungan: SELESAI');
      setTimeout(() => router.push('/rawat-jalan'), 2000);

    } catch (error: any) {
      console.error(error);
      showError(error.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      if (!saved) setIsSubmittingCentral(false);
    }
  };

  return (
    <div className="w-full space-y-10 font-jakarta">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-[#E6F5F4] border border-[#B2DFDB]' :
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
          ) : (
            <AlertCircle size={20} strokeWidth={2} className={toast.type === 'warning' ? 'text-yellow-600 flex-shrink-0' : 'text-red-500 flex-shrink-0'} />
          )}
          <span className={`font-medium text-sm font-jakarta ${
            toast.type === 'success' ? 'text-[#0F766E]' :
            toast.type === 'warning' ? 'text-yellow-700' :
            'text-red-600'
          }`}>
            {toast.text}
          </span>
        </div>
      )}
      <DraftFoundModal
        isOpen={showDraftModal}
        draftTypes={draftTypes as any}
        onUseDraft={handleUseDraft}
        onRejectDraft={handleRejectDraft}
      />

      <MissingDataWarning missingAssessment={missingAssessment} missingVitals={missingVitals} />

      {/* Kajian Awal / Subjective (Editable by Doctor) */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <SubjectiveInitialForm
          ref={assessmentRef}
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          hideSubmitButton={true}
        />
      </div>

      {/* Pemeriksaan Fisik / Objective (Editable by Doctor) */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <ObjectivePhysicalForm
          ref={physicalRef}
          encounterId={encounterId}
          isEditMode={isEditMode}
          canEdit={true}
          defaultValues={defaultValues}
          hideSubmitButton={true}
        />
      </div>

      {/* Hasil Periksa Medis + Diagnosis — single combined card */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />

        <h2
          className="mb-5 text-[22px] font-bold text-[#0F766E] uppercase tracking-wide font-poppins"
          style={{ WebkitTextStroke: '0.4px #0F766E' }}
        >
          Hasil Periksa Medis
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
          {/* S/O Lanjutan fields — no outer card since we are already inside one */}
          <SubjectiveObjectiveExtendedForm
            ref={hasilPeriksaRef}
            encounterId={encounterId}
            hideSubmitButton={true}
            hideWrapper={true}
          />

          {/* Diagnosis Utama subsection */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-sm font-bold text-[#0F766E] uppercase tracking-wider font-poppins"
              style={{ WebkitTextStroke: '0.2px #0F766E' }}
            >
              Diagnosis Utama
            </h3>

            {/* Selected tags render ABOVE the search field — mirrors ChipsInput pattern */}
            {selectedDiagnoses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDiagnoses.map((diag, idx) => (
                  <span
                    key={`${diag.code}-${idx}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-medium border ${
                      diag.code === 'MANUAL'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : 'bg-teal-50 text-teal-700 border-teal-200'
                    }`}
                  >
                    <span className="font-semibold">[{diag.code}]</span>
                    <span>–</span>
                    <span>{diag.display}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiagnosis(diag.code, idx)}
                      aria-label={`Hapus diagnosis`}
                      className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 leading-none cursor-pointer"
                    >
                      <span className="text-base leading-none">×</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <AssessmentDiagnosisForm
              encounterId={encounterId}
              onSelectDiagnosis={handleSelectDiagnosis}
            />
            <button
              type="button"
              onClick={() => setSelectedDiagnoses([])}
              className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-2 self-end italic"
            >
              Kosongkan Input
            </button>
          </div>

          <PlanProcedureForm ref={procedureRef} encounterId={encounterId} />
        </div>
      </div>

      {/* Final Orchestration Action Buttons */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 pb-10">
        <button
          type="button"
          disabled={isSubmittingCentral}
          onClick={() => router.push('/rawat-jalan')}
          className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleCentralSubmit}
          disabled={isSubmittingCentral}
          className="px-8 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm min-w-[120px] flex justify-center items-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmittingCentral ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Menyimpan...
            </>
          ) : (
            'Simpan Asesmen'
          )}
        </button>
      </div>
    </div>
  );
}
