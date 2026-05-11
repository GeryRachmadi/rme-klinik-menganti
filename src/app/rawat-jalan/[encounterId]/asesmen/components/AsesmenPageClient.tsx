'use client';

import React, { useEffect, useState } from 'react';
import AssessmentForm from './AssessmentForm';
import PhysicalExamForm from './PhysicalExamForm';
import DraftFoundModal from './DraftFoundModal';
import { getAssessmentDraftKey, getPhysicalExamDraftKey } from '@/lib/constants/storage-keys';

// Shared type used by both child forms to drive their loading/restore behavior.
export type DraftState = 'checking' | 'pending' | 'use' | 'no_draft';

export interface AsesmenPageClientProps {
  encounterId: string;
  isEditMode: boolean;
  canEdit: boolean;
  defaultValues: {
    penyakit: string[];
    alergi: string[];
    obat: string[];
    catatanPenyakit: string;
    catatanAlergi: string;
    catatanObat: string;
  };
}

export default function AsesmenPageClient({
  encounterId,
  isEditMode,
  canEdit,
  defaultValues,
}: AsesmenPageClientProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [assessmentDraftState, setAssessmentDraftState] = useState<DraftState>('checking');
  const [physicalDraftState, setPhysicalDraftState] = useState<DraftState>('checking');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Assessment draft check
  useEffect(() => {
    if (!isHydrated) return;
    if (isEditMode) {
      console.log('[AsesmenPageClient] Edit mode — skipping assessment draft check');
      setAssessmentDraftState('no_draft');
      return;
    }
    const key = getAssessmentDraftKey(encounterId);
    console.log('[AsesmenPageClient] Checking assessment draft:', key);
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.log('[AsesmenPageClient] No assessment draft found');
      setAssessmentDraftState('no_draft');
      return;
    }
    try {
      const payload = JSON.parse(raw);
      const d = payload.data;
      const hasContent =
        (Array.isArray(d?.penyakit) && d.penyakit.length > 0) ||
        (Array.isArray(d?.alergi) && d.alergi.length > 0) ||
        (Array.isArray(d?.obat) && d.obat.length > 0) ||
        d?.tidakAdaPenyakit === true ||
        d?.tidakAdaAlergi === true ||
        d?.tidakAdaObat === true ||
        !!d?.catatanPenyakit ||
        !!d?.catatanAlergi ||
        !!d?.catatanObat;
      if (hasContent) {
        console.log('[AsesmenPageClient] ✓ Valid assessment draft found, showing modal');
        setAssessmentDraftState('pending');
      } else {
        console.log('[AsesmenPageClient] Assessment draft is empty — discarding');
        localStorage.removeItem(key);
        setAssessmentDraftState('no_draft');
      }
    } catch {
      console.error('[AsesmenPageClient] Assessment draft JSON corrupted — discarding');
      localStorage.removeItem(key);
      setAssessmentDraftState('no_draft');
    }
  }, [encounterId, isEditMode, isHydrated]);

  // Physical exam draft check
  useEffect(() => {
    if (!isHydrated) return;
    if (isEditMode) {
      console.log('[AsesmenPageClient] Edit mode — skipping physical draft check');
      setPhysicalDraftState('no_draft');
      return;
    }
    const key = getPhysicalExamDraftKey(encounterId);
    console.log('[AsesmenPageClient] Checking physical exam draft:', key);
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.log('[AsesmenPageClient] No physical exam draft found');
      setPhysicalDraftState('no_draft');
      return;
    }
    try {
      const payload = JSON.parse(raw);
      const d = payload.data;
      const hasContent =
        !!d?.tekananDarah ||
        !!d?.suhu ||
        !!d?.nadi ||
        !!d?.napas ||
        !!d?.tinggiBadan ||
        !!d?.beratBadan ||
        !!d?.catatan;
      if (hasContent) {
        console.log('[AsesmenPageClient] ✓ Valid physical exam draft found, showing modal');
        setPhysicalDraftState('pending');
      } else {
        console.log('[AsesmenPageClient] Physical exam draft is empty — discarding');
        localStorage.removeItem(key);
        setPhysicalDraftState('no_draft');
      }
    } catch {
      console.error('[AsesmenPageClient] Physical exam draft JSON corrupted — discarding');
      localStorage.removeItem(key);
      setPhysicalDraftState('no_draft');
    }
  }, [encounterId, isEditMode, isHydrated]);

  const assessmentPending = assessmentDraftState === 'pending';
  const physicalPending = physicalDraftState === 'pending';
  const showModal = assessmentPending || physicalPending;

  const pendingDraftTypes = [
    ...(assessmentPending ? ['assessment' as const] : []),
    ...(physicalPending ? ['physical' as const] : []),
  ];

  const handleUseDraft = () => {
    console.log('[AsesmenPageClient] User chose to use drafts:', pendingDraftTypes);
    if (assessmentPending) setAssessmentDraftState('use');
    if (physicalPending) setPhysicalDraftState('use');
  };

  const handleRejectDraft = () => {
    console.log('[AsesmenPageClient] User rejected drafts:', pendingDraftTypes);
    if (assessmentPending) {
      localStorage.removeItem(getAssessmentDraftKey(encounterId));
      setAssessmentDraftState('no_draft');
    }
    if (physicalPending) {
      localStorage.removeItem(getPhysicalExamDraftKey(encounterId));
      setPhysicalDraftState('no_draft');
    }
  };

  return (
    <div className="col-span-12 w-full pt-2 pb-10 space-y-10">
      <DraftFoundModal
        isOpen={showModal}
        draftTypes={pendingDraftTypes}
        onUseDraft={handleUseDraft}
        onRejectDraft={handleRejectDraft}
      />

      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <AssessmentForm
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          draftState={assessmentDraftState}
        />
      </div>

      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <PhysicalExamForm
          encounterId={encounterId}
          isEditMode={isEditMode}
          canEdit={canEdit}
          draftState={physicalDraftState}
        />
      </div>
    </div>
  );
}
