'use client';

import React from 'react';
import AssessmentForm from './AssessmentForm';
import PhysicalExamForm from './PhysicalExamForm';
import type { DraftState } from './AsesmenPageClient';

/**
 * Props for the AsesmenPerawat wrapper component.
 */
export interface AsesmenPerawatProps {
  /** The ID of the current encounter */
  encounterId: string;
  /** Patient data object */
  patient: Record<string, any>;
  /** Encounter data object */
  encounter: Record<string, any>;
  /** Assessment form default values */
  defaultValues?: Record<string, any>;
  /** Whether the forms are in edit mode */
  isEditMode?: boolean;
  /** Draft state for the assessment form */
  assessmentDraftState?: DraftState;
  /** Draft state for the physical exam form */
  physicalDraftState?: DraftState;
}

/**
 * Wrapper component for the Nurse (PERAWAT) assessment view.
 * Renders the initial assessment (subjective) and physical exam (objective) forms in sequence.
 * Both forms are fully editable by the nurse role.
 */
export default function AsesmenPerawat({
  encounterId,
  patient,
  encounter,
  defaultValues,
  isEditMode = false,
  assessmentDraftState = 'no_draft',
  physicalDraftState = 'no_draft',
}: AsesmenPerawatProps) {
  return (
    <div className="w-full space-y-10">
      {/* Kajian Awal / Subjective */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <AssessmentForm
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          draftState={assessmentDraftState}
        />
      </div>

      {/* Pemeriksaan Fisik / Objective */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <PhysicalExamForm
          encounterId={encounterId}
          isEditMode={isEditMode}
          canEdit={true}
          draftState={physicalDraftState}
        />
      </div>
    </div>
  );
}
