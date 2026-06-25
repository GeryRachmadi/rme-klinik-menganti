'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubjectiveInitialForm, { SubjectiveInitialFormRef } from './SubjectiveInitialForm';
import ObjectivePhysicalForm, { ObjectivePhysicalFormRef } from './ObjectivePhysicalForm';
import NursingDiagnosisForm, { NursingDiagnosisFormRef } from './NursingDiagnosisForm';
import SubjectiveObjectiveExtendedForm, { SubjectiveObjectiveExtendedFormRef } from './SubjectiveObjectiveExtendedForm';
import { AssessmentDiagnosisForm } from './AssessmentDiagnosisForm';
import PlanProcedureForm, { PlanProcedureFormRef } from './PlanProcedureForm';
import PlanMedicationForm, { PlanMedicationFormRef } from './PlanMedicationForm';
import PlanEducationForm, { PlanEducationFormRef } from './PlanEducationForm';
import PlanLabInstructionForm, { PlanLabInstructionFormRef } from './PlanLabInstructionForm';
import PlanReferralForm, { PlanReferralFormRef } from './PlanReferralForm';
import DraftFoundModal from './DraftFoundModal';
import { Loader2, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useFormToast } from '@/hooks/useFormToast';
import { getAssessmentDraftKey, getPhysicalExamDraftKey, getHasilPeriksaDraftKey, getProcedureDraftKey, getMedicationDraftKey, getEducationDraftKey, getLabInstructionDraftKey, getReferralDraftKey } from '@/lib/constants/storage-keys';
import { PlanFormSchema } from '@/lib/schemas/plan-schema';
import type { RacikanContainer } from '@/lib/utils/racikan-container';
import type { NonRacikanItem } from '@/lib/schemas/plan-schema';
import MissingDataWarning from './MissingDataWarning';

export interface AsesmenDokterProps {
  encounterId: string;
  patient: Record<string, any>;
  encounter: Record<string, any>;
  encounterStatus?: string;
  userRole?: string;
  defaultValues?: Record<string, any>;
  isEditMode?: boolean;
  initialAssessment: { penyakit: string[]; alergi: string[]; obat: string[] } | null;
  initialPhysical: {
    systolic: number | null;
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
  } | null;
  savedDiagnoses?: Array<{ code: string; display: string; notes?: string }>;
  savedHasilPeriksa?: { keluhanUtama: string; pemeriksaanFisikTambahan: string };
  savedPlan?: {
    procedures: Array<{ codeIcd9: string; display: string; notes: string }>;
    nonRacikanItems?: NonRacikanItem[];
    racikanItems?: RacikanContainer[];
    tidakAdaResep?: boolean;
    anjuranEdukasi: string;
    instruksiLab: string;
    rujukan: { isActive: boolean; tujuanRujukan: string; alasanRujukan: string };
  };
  syncStatus?: string;
  patientIhs?: string | null;
}

export default function AsesmenDokter({
  encounterId,
  patient,
  encounter,
  encounterStatus,
  userRole,
  defaultValues,
  isEditMode = false,
  initialAssessment,
  initialPhysical,
  savedDiagnoses,
  savedHasilPeriksa,
  savedPlan,
  syncStatus,
  patientIhs,
}: AsesmenDokterProps) {
  const router = useRouter();
  const { toast, showSuccess, showError } = useFormToast();

  const isReadOnly = encounter?.status?.toUpperCase() === 'SELESAI' && userRole?.toUpperCase() !== 'ADMIN';

  // Item 14/19 added mandatory Kajian Awal fields (notes, nursing assessment,
  // family history) that live only on the encounter scalar columns — the
  // legacy penyakit/alergi/obat chip arrays no longer cover the full picture.
  // The nurse is considered "done" if ANY of these has content; only warn when
  // every single one is empty.
  const missingAssessment =
    initialAssessment === null
      ? !encounter?.riwayatPenyakitNotes &&
        !encounter?.riwayatAlergiNotes &&
        !encounter?.pengobatanRutinNotes &&
        !encounter?.asesmenKeperawatan &&
        !encounter?.riwayatPenyakitKeluarga
      : initialAssessment.penyakit.length === 0 &&
        initialAssessment.alergi.length === 0 &&
        initialAssessment.obat.length === 0 &&
        !encounter?.riwayatPenyakitNotes &&
        !encounter?.riwayatAlergiNotes &&
        !encounter?.pengobatanRutinNotes &&
        !encounter?.asesmenKeperawatan &&
        !encounter?.riwayatPenyakitKeluarga;

  const missingVitals =
    initialPhysical === null ||
    (!initialPhysical.systolic &&
      !initialPhysical.temperature &&
      !initialPhysical.heartRate &&
      !initialPhysical.respiratoryRate);

  // Asesmen Keperawatan (Item 14) is soft for the doctor — mirrors the Kajian Awal
  // override: if the nurse left it empty (legacy data / Dokter Override), warn but
  // never block. Computed from the page-hydrated defaultValues (load-time state).
  const missingNursing =
    !defaultValues?.nursingAssessment?.diagnoses ||
    defaultValues.nursingAssessment.diagnoses.length === 0;

  console.log('[AsesmenDokter] Assessment missing:', missingAssessment);
  console.log('[AsesmenDokter] Vitals missing:', missingVitals);
  
  const hasShownErrorRef = useRef(false);
  const assessmentRef = useRef<SubjectiveInitialFormRef>(null);
  const physicalRef = useRef<ObjectivePhysicalFormRef>(null);
  const nursingRef = useRef<NursingDiagnosisFormRef>(null);
  const hasilPeriksaRef = useRef<SubjectiveObjectiveExtendedFormRef>(null);
  const procedureRef = useRef<PlanProcedureFormRef>(null);
  const medicationRef = useRef<PlanMedicationFormRef>(null);
  const educationRef = useRef<PlanEducationFormRef>(null);
  const labInstructionRef = useRef<PlanLabInstructionFormRef>(null);
  const referralRef = useRef<PlanReferralFormRef>(null);

  const [isSubmittingCentral, setIsSubmittingCentral] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Array<{code: string, display: string, notes?: string}>>(savedDiagnoses ?? []);
  const [showDraftModal, setShowDraftModal] = useState(false);
  // Per-field Plan validation errors surfaced from the central PlanFormSchema
  // safeParse (Tindakan/Resep/Edukasi are all mandatory). Cleared on each submit
  // attempt and on success; the Rujukan form shows its own native errors.
  const [planErrors, setPlanErrors] = useState<{ procedure: string | null; medication: string | null; edukasi: string | null; instruksiLab: string | null }>({ procedure: null, medication: null, edukasi: null, instruksiLab: null });

  // SATUSEHAT submission state
  const [localSyncStatus, setLocalSyncStatus] = useState(syncStatus ?? 'UNSYNCED');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<{
    assessment?: any;
    physical?: any;
    hasilPeriksa?: any;
    diagnoses?: any;
    plan?: any;
  }>({});
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  // Auto-show Error modal if this encounter previously failed SATUSEHAT sync (once only)
  useEffect(() => {
    if (hasShownErrorRef.current) return;
    if (syncStatus === 'FAILED_SYNC') {
      hasShownErrorRef.current = true;
      setSubmitState('error');
      setErrorMessage('Sinkronisasi sebelumnya gagal. Silakan kirim ulang.');
    }
  }, [syncStatus]);

  // Persist selectedDiagnoses whenever they change
  useEffect(() => {
    if (selectedDiagnoses.length > 0) {
      localStorage.setItem(`draft_diagnoses_${encounterId}`, JSON.stringify(selectedDiagnoses));
    }
  }, [selectedDiagnoses, encounterId]);

  // Clear stale draft keys for SELESAI encounters regardless of role
  useEffect(() => {
    if (encounterStatus?.toUpperCase() !== 'SELESAI') return;
    [
      getAssessmentDraftKey(encounterId),
      getPhysicalExamDraftKey(encounterId),
      getHasilPeriksaDraftKey(encounterId),
      `draft_diagnoses_${encounterId}`,
      getProcedureDraftKey(encounterId),
      getMedicationDraftKey(encounterId),
      getEducationDraftKey(encounterId),
      getLabInstructionDraftKey(encounterId),
      getReferralDraftKey(encounterId),
      `draft_nursing_${encounterId}`,
    ].forEach(key => localStorage.removeItem(key));
  }, [encounterId, encounterStatus]);

  useEffect(() => {
    if (encounterStatus?.toUpperCase() === 'SELESAI') return;
    if (isReadOnly) return;
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
          // Migrate legacy drafts that used `codeIcd10` instead of `code`
          parsedDrafts.diagnoses = d.map((item: Record<string, unknown>) => ({
            ...item,
            code: item.code ?? item.codeIcd10 ?? 'MANUAL',
          }));
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
        key: `draft_labInstruction_${encounterId}`,
        hasContent: (d: any) => !!d?.instruksiLab,
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
  }, [encounterId, encounterStatus, isEditMode, isReadOnly]);

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
    localStorage.removeItem(getLabInstructionDraftKey(encounterId));
    localStorage.removeItem(getReferralDraftKey(encounterId));
    localStorage.removeItem(`draft_nursing_${encounterId}`);
    procedureRef.current?.resetForm();
    medicationRef.current?.resetForm();
    educationRef.current?.resetForm();
    labInstructionRef.current?.resetForm();
    referralRef.current?.resetForm();
    nursingRef.current?.resetForm();
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

  const handleSatuSehatSubmit = async () => {
    setSubmitState('loading');
    setErrorMessage(null);
    setTransactionId(null);
    try {
      const response = await fetch('/api/satusehat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounterId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error || 'Terjadi kesalahan sinkronisasi.');
        setSubmitState('error');
        return;
      }
      setTransactionId(result.transactionId ?? null);
      setLocalSyncStatus('SUCCESS');
      setSubmitState('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server.');
      setSubmitState('error');
    }
  };

  const handleCentralSubmit = async () => {
    setIsSubmittingCentral(true);
    let saved = false;
    setPlanErrors({ procedure: null, medication: null, edukasi: null, instruksiLab: null });
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

      // Asesmen Keperawatan is SOFT for the doctor — read values directly (no
      // validating submitForm, so no inline "wajib diisi" error is raised) and
      // never block. Serialize whatever the doctor optionally provided.
      const nursingData = nursingRef.current?.getValues() ?? null;

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

      if (!selectedDiagnoses || selectedDiagnoses.length === 0) {
        showError('Diagnosis Utama (ICD-10) wajib diisi!');
        setIsSubmittingCentral(false);
        return;
      }

      // Referral is the one Plan subsection with conditional validation: when the
      // toggle is ON, Tujuan + Alasan are mandatory. submitForm() runs trigger()
      // so per-field errors surface in the form, and returns null when invalid.
      let rujukanData: { isActive?: boolean; tujuanRujukan?: string; alasanRujukan?: string } = { isActive: false };
      if (referralRef.current) {
        const validatedReferral = await referralRef.current.submitForm();
        if (validatedReferral === null) {
          showError('Lengkapi data Rujukan: Tujuan dan Alasan Rujukan wajib diisi.');
          setIsSubmittingCentral(false);
          return;
        }
        rujukanData = validatedReferral;
      }

      // Extract remaining Plan data without triggering internal validation
      const planPayload = {
        procedure: procedureRef.current?.getValues ? procedureRef.current.getValues() : {},
        medication: medicationRef.current?.getValues ? medicationRef.current.getValues() : {},
        edukasi: educationRef.current?.getValues ? educationRef.current.getValues() : {},
        labInstruction: labInstructionRef.current?.getValues ? labInstructionRef.current.getValues() : {},
        rujukan: rujukanData,
      };

      const planValidation = PlanFormSchema.safeParse(planPayload);
      if (!planValidation.success) {
        // Map each per-field issue back to its form so the message renders below
        // the relevant input (Tindakan / Resep / Edukasi are all mandatory now).
        const issues = planValidation.error.issues;
        const msgFor = (a: string, b: string) =>
          issues.find((i) => i.path[0] === a && i.path[1] === b)?.message ?? null;
        const procErr = msgFor('procedure', 'procedures');
        const medErr = msgFor('medication', 'medicationText');
        const eduErr = msgFor('edukasi', 'anjuranEdukasi');
        const labErr = msgFor('labInstruction', 'instruksiLab');
        setPlanErrors({ procedure: procErr, medication: medErr, edukasi: eduErr, instruksiLab: labErr });
        // Fire a summary toast (same showError utility/style as the Rujukan guard)
        // so an empty field is noticed even when scrolled away — alongside the
        // per-field inline errors. Lists only the fields that are actually empty.
        const emptyFields = [
          procErr ? 'Tindakan Medis' : null,
          medErr ? 'Resep Obat' : null,
          eduErr ? 'Edukasi' : null,
          labErr ? 'Instruksi Lab' : null,
        ].filter(Boolean);
        showError(
          emptyFields.length > 0
            ? `Periksa kembali bagian: ${emptyFields.join(', ')} wajib diisi.`
            : 'Lengkapi Rencana Asesmen sebelum menyimpan.'
        );
        setIsSubmittingCentral(false);
        return;
      }
      setPlanErrors({ procedure: null, medication: null, edukasi: null, instruksiLab: null });
      console.log('[AsesmenDokter] Validated Plan Data:', planValidation.data);

      const response = await fetch(`/api/rawat-jalan/${encounterId}/asesmen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentData,
          physicalData,
          hasilPeriksaData,
          nursingData,
          selectedDiagnoses,
          plan: planValidation.data,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError(result.error || 'Gagal menyimpan data ke server.');
        return;
      }

      saved = true;
      const keysToRemove = [
        getAssessmentDraftKey(encounterId),
        getPhysicalExamDraftKey(encounterId),
        getHasilPeriksaDraftKey(encounterId),
        `draft_diagnoses_${encounterId}`,
        `draft_procedure_${encounterId}`,
        `draft_medication_${encounterId}`,
        `draft_education_${encounterId}`,
        `draft_labInstruction_${encounterId}`,
        `draft_referral_${encounterId}`,
        `draft_nursing_${encounterId}`,
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      showSuccess('Asesmen dan rencana tindak lanjut berhasil disimpan!');

      if (patientIhs) {
        await handleSatuSehatSubmit();
        setIsSubmittingCentral(false);
      } else {
        setTimeout(() => router.push('/rawat-jalan'), 2000);
      }

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

      {/* SATUSEHAT Submission Modals */}
      {submitState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 font-jakarta">

            {/* LOADING */}
            {submitState === 'loading' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-teal-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800 font-poppins">Menyimpan & Mengirim Data…</p>
                  <p className="text-sm text-gray-500 mt-1.5">Mohon tunggu sebentar, sistem sedang memvalidasi data klinis.</p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {submitState === 'success' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                  <CheckCircle2 size={36} className="text-teal-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800 font-poppins">Berhasil Disimpan & Dikirim!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {patient?.namaLengkap} — <span className="font-semibold text-[#0F766E]">{patient?.noRm}</span>
                  </p>
                </div>
                <div className="w-full bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-left">
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">ID Transaksi Kemenkes</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{transactionId ?? '—'}</p>
                </div>
                <div className="flex gap-3 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => setSubmitState('idle')}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/rawat-jalan')}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            )}

            {/* ERROR */}
            {submitState === 'error' && (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800 font-poppins">Gagal Sinkronisasi dengan SATUSEHAT!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {patient?.namaLengkap} — <span className="font-semibold text-[#0F766E]">{patient?.noRm}</span>
                  </p>
                  {errorMessage && <p className="text-sm text-red-600 mt-1.5">{errorMessage}</p>}
                </div>
                <div className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left flex flex-col gap-1">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider">STATUS: Gagal Sinkronisasi</p>
                  <p className="text-xs text-gray-500">Data tersimpan di Lokal & Masuk Antrian (Retry Queue)</p>
                </div>
                <div className="flex gap-3 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => setSubmitState('idle')}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSatuSehatSubmit}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Kirim Ulang
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 font-jakarta">Asesmen Sudah Selesai</p>
            <p className="text-sm text-blue-700 font-jakarta">Hubungi Admin jika perlu mengubah data.</p>
          </div>
        </div>
      )}

      <MissingDataWarning missingAssessment={missingAssessment} missingVitals={missingVitals} missingNursing={missingNursing} />

      {/* Kajian Awal / Subjective (Editable by Doctor) */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <SubjectiveInitialForm
          ref={assessmentRef}
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          hideSubmitButton={true}
          isReadOnly={isReadOnly}
          keluhanUtama={encounter?.reasonCode ?? ''}
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
          isReadOnly={isReadOnly}
        />
      </div>

      {/* Asesmen Keperawatan / Nursing Assessment (SDKI) — distinct block */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <NursingDiagnosisForm
          ref={nursingRef}
          encounterId={encounterId}
          defaultValues={defaultValues?.nursingAssessment}
          isReadOnly={isReadOnly}
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
            isReadOnly={isReadOnly}
            defaultValues={savedHasilPeriksa}
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
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDiagnosis(diag.code, idx)}
                        aria-label={`Hapus diagnosis`}
                        className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 leading-none cursor-pointer"
                      >
                        <span className="text-base leading-none">×</span>
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            <AssessmentDiagnosisForm
              encounterId={encounterId}
              onSelectDiagnosis={handleSelectDiagnosis}
              isReadOnly={isReadOnly}
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setSelectedDiagnoses([])}
                className="text-blue-500 hover:text-blue-700 underline cursor-pointer font-medium text-sm mt-2 self-end italic"
              >
                Kosongkan Input
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <PlanProcedureForm ref={procedureRef} encounterId={encounterId} isReadOnly={isReadOnly} defaultValues={savedPlan?.procedures} externalError={planErrors.procedure} />
            <PlanMedicationForm ref={medicationRef} encounterId={encounterId} isReadOnly={isReadOnly} defaultValues={{ nonRacikanItems: savedPlan?.nonRacikanItems ?? [], racikanItems: savedPlan?.racikanItems ?? [], tidakAdaResep: savedPlan?.tidakAdaResep ?? false }} externalError={planErrors.medication} />
            <PlanEducationForm ref={educationRef} encounterId={encounterId} isReadOnly={isReadOnly} defaultValues={{ anjuranEdukasi: savedPlan?.anjuranEdukasi ?? '' }} externalError={planErrors.edukasi} />
            <PlanLabInstructionForm ref={labInstructionRef} encounterId={encounterId} isReadOnly={isReadOnly} defaultValues={{ instruksiLab: savedPlan?.instruksiLab ?? '' }} externalError={planErrors.instruksiLab} />
            <PlanReferralForm ref={referralRef} encounterId={encounterId} isReadOnly={isReadOnly} defaultValues={savedPlan?.rujukan} />
          </div>
        </div>
      </div>

      {/* Final Orchestration Action Buttons */}
      <div className="flex flex-col items-end gap-1 mt-8 pt-6 border-t border-gray-200 pb-10">
        <div className="flex gap-3 items-center">
          <button
            type="button"
            disabled={isSubmittingCentral}
            onClick={() => router.push('/rawat-jalan')}
            className="px-8 py-2.5 min-w-[120px] flex justify-center items-center bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <div title={isReadOnly ? 'Asesmen sudah selesai dan tidak dapat diedit.' : undefined}>
            <button
              type="button"
              onClick={handleCentralSubmit}
              disabled={isSubmittingCentral || isReadOnly}
              className={`px-8 py-2.5 min-w-[120px] flex justify-center items-center bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm ${isSubmittingCentral || isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
        {/* SATUSEHAT status hint — below the button row */}
        {localSyncStatus === 'SUCCESS' ? (
          <p className="text-xs text-green-600 font-medium">Terkirim ke SATUSEHAT · ID: {transactionId}</p>
        ) : localSyncStatus === 'FAILED_SYNC' ? (
          <p className="text-xs text-red-500 font-medium">Gagal dikirim ke SATUSEHAT</p>
        ) : patientIhs ? (
          <p className="text-xs text-teal-600 font-medium">Data akan dikirim ke SATUSEHAT secara otomatis</p>
        ) : (
          <p className="text-xs text-gray-400">Pasien tidak terdaftar di SATUSEHAT</p>
        )}
      </div>
    </div>
  );
}
