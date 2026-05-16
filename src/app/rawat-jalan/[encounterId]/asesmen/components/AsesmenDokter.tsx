'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectiveInitialForm, { SubjectiveInitialFormRef } from './SubjectiveInitialForm';
import ObjectivePhysicalForm, { ObjectivePhysicalFormRef } from './ObjectivePhysicalForm';
import SubjectiveObjectiveExtendedForm, { SubjectiveObjectiveExtendedFormRef } from './SubjectiveObjectiveExtendedForm';
import { AssessmentDiagnosisForm } from './AssessmentDiagnosisForm';
import PlanProcedureForm, { PlanProcedureFormRef } from './PlanProcedureForm';
import PlanMedicationForm, { PlanMedicationFormRef } from './PlanMedicationForm';
import PlanEducationForm, { PlanEducationFormRef } from './PlanEducationForm';
import PlanReferralForm, { PlanReferralFormRef } from './PlanReferralForm';
import DraftFoundModal from './DraftFoundModal';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFormToast } from '@/hooks/useFormToast';
import { getAssessmentDraftKey, getPhysicalExamDraftKey, getHasilPeriksaDraftKey, getProcedureDraftKey, getMedicationDraftKey, getEducationDraftKey, getReferralDraftKey } from '@/lib/constants/storage-keys';
import { PlanFormSchema } from '@/lib/schemas/plan-schema';
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
  const medicationRef = useRef<PlanMedicationFormRef>(null);
  const educationRef = useRef<PlanEducationFormRef>(null);
  const referralRef = useRef<PlanReferralFormRef>(null);

  const [isSubmittingCentral, setIsSubmittingCentral] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{code: string, display: string, notes?: string}>>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<{
    assessment?: any;
    physical?: any;
    hasilPeriksa?: any;
    diagnoses?: any;
    plan?: any;
  }>({});
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  // Persist selectedDiagnoses whenever they change
  useEffect(() => {
    if (selectedDiagnoses.length > 0) {
      localStorage.setItem(`draft_diagnoses_${encounterId}`, JSON.stringify(selectedDiagnoses));
    }
  }, [selectedDiagnoses, encounterId]);

  useEffect(() => {
    // if (isEditMode) return; // temporarily disabled for debugging

    const parsedDrafts: any = {};
    const types: string[] = [];

    // Flexible helper: handles both { data: {...} } and raw { ... } structures
    const checkLegacyDraft = (key: string, typeName: string, stateKey: string) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        const validData = payload.data !== undefined ? payload.data : payload;
        if (validData && typeof validData === 'object' && Object.keys(validData).length > 0) {
          parsedDrafts[stateKey] = validData;
          if (!types.includes(typeName)) types.push(typeName);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    };

    checkLegacyDraft(getAssessmentDraftKey(encounterId), 'assessment', 'assessment');
    checkLegacyDraft(getPhysicalExamDraftKey(encounterId), 'physical', 'physical');
    checkLegacyDraft(getHasilPeriksaDraftKey(encounterId), 'hasil-periksa', 'hasilPeriksa');

    // Diagnosis draft — stored as a raw array, not an object
    try {
      const raw = localStorage.getItem(`draft_diagnoses_${encounterId}`);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d) && d.length > 0) {
          parsedDrafts.diagnoses = d;
          if (!types.includes('hasil-periksa')) types.push('hasil-periksa');
        } else {
          localStorage.removeItem(`draft_diagnoses_${encounterId}`);
        }
      }
    } catch {
      localStorage.removeItem(`draft_diagnoses_${encounterId}`);
    }

    // Plan drafts — each key has its own content check
    const planDraftChecks = [
      {
        key: `draft_procedure_${encounterId}`,
        hasContent: (d: any) => Array.isArray(d?.procedures) && d.procedures.length > 0,
      },
      {
        key: `draft_medication_${encounterId}`,
        hasContent: (d: any) => !!d?.medicationText,
      },
      {
        key: `draft_education_${encounterId}`,
        hasContent: (d: any) => !!d?.anjuranEdukasi,
      },
      {
        key: `draft_referral_${encounterId}`,
        hasContent: (d: any) => d?.isActive === true || !!d?.tujuanRujukan || !!d?.alasanRujukan,
      },
    ];
    const hasPlanDraft = planDraftChecks.some(({ key, hasContent }) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const payload = JSON.parse(raw);
        const d = payload.data ?? payload;
        if (hasContent(d)) return true;
        localStorage.removeItem(key);
        return false;
      } catch {
        localStorage.removeItem(key);
        return false;
      }
    });
    if (hasPlanDraft) types.push('plan');

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
    if (availableDrafts.diagnoses) {
      setSelectedDiagnoses(availableDrafts.diagnoses);
    }
    setShowDraftModal(false);
    showSuccess('Draf berhasil dipulihkan.');
  };

  const handleRejectDraft = () => {
    localStorage.removeItem(getAssessmentDraftKey(encounterId));
    localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
    localStorage.removeItem(getHasilPeriksaDraftKey(encounterId));
    localStorage.removeItem(`draft_diagnoses_${encounterId}`);
    hasilPeriksaRef.current?.resetForm();
    setSelectedDiagnoses([]);
    localStorage.removeItem(getProcedureDraftKey(encounterId));
    localStorage.removeItem(getMedicationDraftKey(encounterId));
    localStorage.removeItem(getEducationDraftKey(encounterId));
    localStorage.removeItem(getReferralDraftKey(encounterId));
    procedureRef.current?.resetForm();
    medicationRef.current?.resetForm();
    educationRef.current?.resetForm();
    referralRef.current?.resetForm();
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

      // Extract Plan data without triggering internal validation
      const planPayload = {
        procedure: procedureRef.current?.getValues ? procedureRef.current.getValues() : {},
        medication: medicationRef.current?.getValues ? medicationRef.current.getValues() : {},
        edukasi: educationRef.current?.getValues ? educationRef.current.getValues() : {},
        rujukan: referralRef.current?.getValues ? referralRef.current.getValues() : { isActive: false },
      };

      const planValidation = PlanFormSchema.safeParse(planPayload);
      if (!planValidation.success) {
        const errorMessage =
          planValidation.error?.issues?.[0]?.message ||
          planValidation.error?.errors?.[0]?.message ||
          'Tidak ada data untuk disimpan. Isi minimal satu tindakan, resep, rujukan, atau edukasi.';
        showError(errorMessage);
        setIsSubmittingCentral(false);
        return;
      }
      console.log('[AsesmenDokter] Validated Plan Data:', planValidation.data);
      showSuccess('Validasi Lolos! (Test Mode: Submit ke database dicegah sementara)');
      setIsSubmittingCentral(false);
      return;

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
      localStorage.removeItem(`draft_diagnoses_${encounterId}`);
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
              className="text-sm font-bold text-[#0F766E] uppercase tracking-wider"
              style={{ WebkitTextStroke: '0.2px #0F766E', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Diagnosis Utama
            </h3>

            {/* Selected tags render ABOVE the search field — mirrors ChipsInput pattern */}
            {selectedDiagnoses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDiagnoses.map((diag, idx) => (
                  <span
                    key={`${diag.code}-${idx}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-bold border ${
                      diag.code === 'MANUAL'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : 'bg-teal-50 text-[#006B5F] border-teal-200'
                    }`}
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    <span className="font-semibold">[{diag.code === 'MANUAL' ? 'Manual' : diag.code}]</span>
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

          <div className="flex flex-col gap-6">
            <PlanProcedureForm ref={procedureRef} encounterId={encounterId} />
            <PlanMedicationForm ref={medicationRef} encounterId={encounterId} />
            <PlanEducationForm ref={educationRef} encounterId={encounterId} />
            <PlanReferralForm ref={referralRef} encounterId={encounterId} />
          </div>
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
