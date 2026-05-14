'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import AssessmentForm, { AssessmentFormRef } from './AssessmentForm';
import PhysicalExamForm, { PhysicalExamFormRef } from './PhysicalExamForm';
import { useFormToast } from '@/hooks/useFormToast';
import DraftFoundModal from './DraftFoundModal';
import { getAssessmentDraftKey, getPhysicalExamDraftKey } from '@/lib/constants/storage-keys';
import { deleteDraft } from '@/lib/utils/draft-utils';
import { parseAllergyChip, parseMedicationChip } from '@/lib/utils/assessment-parser';
import { handleApiError } from '@/lib/utils/api-error-handler';

export interface AsesmenPerawatProps {
  encounterId: string;
  patient: Record<string, any>;
  encounter: Record<string, any>;
  defaultValues?: Record<string, any>;
  isEditMode?: boolean;
}

export default function AsesmenPerawat({
  encounterId,
  patient,
  encounter,
  defaultValues,
  isEditMode = false,
}: AsesmenPerawatProps) {
  const router = useRouter();
  const { toast, showSuccess, showError } = useFormToast();
  
  const assessmentRef = useRef<AssessmentFormRef>(null);
  const physicalRef = useRef<PhysicalExamFormRef>(null);

  const [isSubmittingCentral, setIsSubmittingCentral] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<{
    assessment?: any;
    physical?: any;
  }>({});
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode) return; // Skip drafts if editing existing data

    const draftA = localStorage.getItem(getAssessmentDraftKey(encounterId));
    const draftP = localStorage.getItem(getPhysicalExamDraftKey(encounterId));

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
    setShowDraftModal(false);
    showSuccess('Draf berhasil dipulihkan.');
  };

  const handleRejectDraft = () => {
    localStorage.removeItem(getAssessmentDraftKey(encounterId));
    localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
    setShowDraftModal(false);
  };

  const handleCentralSubmit = async () => {
    setIsSubmittingCentral(true);
    try {
      const assessmentData = await assessmentRef.current?.submitForm() ?? null;
      const physicalData = await physicalRef.current?.submitForm() ?? null;

      console.log('[AsesmenPerawat] Validation results:', { assessmentData, physicalData });

      if (!assessmentData) {
        showError('Periksa kembali bagian Kajian Awal Keperawatan.');
        return;
      }
      if (!physicalData) {
        showError('Periksa kembali bagian Pemeriksaan Fisik.');
        return;
      }

      // Submit Kajian Awal Keperawatan
      const parsedAssessment = {
        penyakit: assessmentData.penyakit ?? [],
        alergi: (assessmentData.alergi ?? []).map(parseAllergyChip),
        obat: (assessmentData.obat ?? []).map(parseMedicationChip),
        tidakAdaPenyakit: assessmentData.tidakAdaPenyakit,
        tidakAdaAlergi: assessmentData.tidakAdaAlergi,
        tidakAdaObat: assessmentData.tidakAdaObat,
        catatanPenyakit: assessmentData.catatanPenyakit,
        catatanAlergi: assessmentData.catatanAlergi,
        catatanObat: assessmentData.catatanObat,
      };

      const resAssessment = await fetch(`/api/encounters/${encounterId}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedAssessment),
      });

      if (!resAssessment.ok) {
        const { message } = await handleApiError(resAssessment);
        throw new Error(`Kajian Awal: ${message}`);
      }

      // Submit Pemeriksaan Fisik
      const resPhysical = await fetch(`/api/encounters/${encounterId}/physical-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...physicalData, userConfirmedOutOfBounds: true }),
      });

      if (!resPhysical.ok) {
        const { message } = await handleApiError(resPhysical);
        throw new Error(`Pemeriksaan Fisik: ${message}`);
      }

      // Bersihkan draf
      deleteDraft(encounterId);
      localStorage.removeItem(getPhysicalExamDraftKey(encounterId));

      showSuccess('Asesmen perawatan berhasil disimpan.');
      router.push('/rawat-jalan');
    } catch (error: any) {
      console.error(error);
      showError(error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingCentral(false);
    }
  };

  return (
    <div className="w-full space-y-10 font-jakarta">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-[#E6F5F4] border border-[#B2DFDB]' : 'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} strokeWidth={2} className="text-[#0F766E] flex-shrink-0" />
          ) : (
            <AlertCircle size={20} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          )}
          <span className={`font-medium text-sm font-jakarta ${toast.type === 'success' ? 'text-[#0F766E]' : 'text-red-600'}`}>
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

      {/* Kajian Awal / Subjective */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <AssessmentForm
          ref={assessmentRef}
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          hideSubmitButton={true}
        />
      </div>

      {/* Pemeriksaan Fisik / Objective */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <PhysicalExamForm
          ref={physicalRef}
          encounterId={encounterId}
          isEditMode={isEditMode}
          canEdit={true}
          defaultValues={defaultValues}
          hideSubmitButton={true}
        />
      </div>

      {/* Unified action buttons */}
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
            'Simpan'
          )}
        </button>
      </div>
    </div>
  );
}
