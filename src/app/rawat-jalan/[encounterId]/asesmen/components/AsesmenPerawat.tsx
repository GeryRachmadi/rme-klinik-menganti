'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import SubjectiveInitialForm, { SubjectiveInitialFormRef } from './SubjectiveInitialForm';
import ObjectivePhysicalForm, { ObjectivePhysicalFormRef } from './ObjectivePhysicalForm';
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
  encounterStatus?: string;
  userRole?: string;
  defaultValues?: Record<string, any>;
  isEditMode?: boolean;
}

export default function AsesmenPerawat({
  encounterId,
  patient,
  encounter,
  encounterStatus,
  userRole,
  defaultValues,
  isEditMode = false,
}: AsesmenPerawatProps) {
  const router = useRouter();
  const { toast, showSuccess, showError } = useFormToast();

  const isReadOnly = encounter?.status?.toUpperCase() === 'SELESAI' && userRole?.toUpperCase() !== 'ADMIN';
  
  const assessmentRef = useRef<SubjectiveInitialFormRef>(null);
  const physicalRef = useRef<ObjectivePhysicalFormRef>(null);

  const [isSubmittingCentral, setIsSubmittingCentral] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<{
    assessment?: any;
    physical?: any;
  }>({});
  const [draftTypes, setDraftTypes] = useState<string[]>([]);

  // Clear stale draft keys for SELESAI encounters regardless of role
  useEffect(() => {
    if (encounterStatus?.toUpperCase() !== 'SELESAI') return;
    localStorage.removeItem(getAssessmentDraftKey(encounterId));
    localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
  }, [encounterId, encounterStatus]);

  useEffect(() => {
    if (isEditMode) return;
    if (isReadOnly) return;

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
  }, [encounterId, isEditMode, isReadOnly]);

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

      const errors: string[] = [];
      if (!assessmentData) errors.push('Kajian Awal Keperawatan');
      if (!physicalData) errors.push('Pemeriksaan Fisik');
      if (errors.length > 0) {
        showError(`Periksa kembali bagian: ${errors.join(' dan ')}.`);
        return;
      }

      // Both forms passed — non-null assertions safe here
      const validAssessment = assessmentData!;
      const validPhysical = physicalData!;

      // Submit Kajian Awal Keperawatan
      const parsedAssessment = {
        penyakit: validAssessment.penyakit ?? [],
        alergi: (validAssessment.alergi ?? []).map(parseAllergyChip),
        obat: (validAssessment.obat ?? []).map(parseMedicationChip),
        tidakAdaPenyakit: validAssessment.tidakAdaPenyakit,
        tidakAdaAlergi: validAssessment.tidakAdaAlergi,
        tidakAdaObat: validAssessment.tidakAdaObat,
        catatanPenyakit: validAssessment.catatanPenyakit,
        catatanAlergi: validAssessment.catatanAlergi,
        catatanObat: validAssessment.catatanObat,
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
        body: JSON.stringify({ ...validPhysical, userConfirmedOutOfBounds: true }),
      });

      if (!resPhysical.ok) {
        const { message } = await handleApiError(resPhysical);
        throw new Error(`Pemeriksaan Fisik: ${message}`);
      }

      // Bersihkan draf
      deleteDraft(encounterId);
      localStorage.removeItem(getPhysicalExamDraftKey(encounterId));

      showSuccess('Asesmen perawatan berhasil disimpan.');
      setTimeout(() => router.push('/rawat-jalan'), 1500);
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

      {isReadOnly && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 font-jakarta">Asesmen Sudah Selesai</p>
            <p className="text-sm text-blue-700 font-jakarta">Hubungi Admin jika perlu mengubah data.</p>
          </div>
        </div>
      )}

      {/* Kajian Awal / Subjective */}
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

      {/* Pemeriksaan Fisik / Objective */}
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
        {!isReadOnly && (
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
        )}
      </div>
    </div>
  );
}
