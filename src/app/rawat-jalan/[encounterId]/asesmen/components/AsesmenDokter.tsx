'use client';

import React from 'react';
import AssessmentForm from './AssessmentForm';
import PhysicalExamForm from './PhysicalExamForm';
import type { DraftState } from './AsesmenPageClient';

/**
 * Props for the AsesmenDokter wrapper component.
 */
export interface AsesmenDokterProps {
  /** The ID of the current encounter */
  encounterId: string;
  /** Patient data object */
  patient: Record<string, any>;
  /** Encounter data object */
  encounter: Record<string, any>;
  /** User session object */
  session?: any;
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
 * Wrapper component for the Doctor (DOKTER) assessment view.
 * Renders the initial assessment (subjective) and physical exam (objective) forms in sequence,
 * making them editable so doctors can review and modify the nurse's S/O data.
 * Also includes a placeholder for Diagnosis & Plan components.
 */
export default function AsesmenDokter({
  encounterId,
  patient,
  encounter,
  session,
  defaultValues,
  isEditMode = false,
  assessmentDraftState = 'no_draft',
  physicalDraftState = 'no_draft',
}: AsesmenDokterProps) {
  return (
    <div className="w-full space-y-10">
      {/* Kajian Awal / Subjective (Editable by Doctor) */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <AssessmentForm
          encounterId={encounterId}
          defaultValues={defaultValues}
          isEditMode={isEditMode}
          draftState={assessmentDraftState}
        />
      </div>

      {/* Pemeriksaan Fisik / Objective (Editable by Doctor) */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        <PhysicalExamForm
          encounterId={encounterId}
          isEditMode={isEditMode}
          canEdit={true}
          draftState={physicalDraftState}
        />
      </div>

      {/* Diagnosis & Plan Section Placeholder */}
      <div>
        <div className="h-px bg-gray-200 mb-6" />
        {/* Diagnosis & Plan section will be added here in TR-66-70 */}
        <div className="mt-6 p-4 bg-gray-50 border border-dashed border-gray-300 rounded">
          <p className="text-gray-500 text-sm">Placeholder for Diagnosis &amp; Plan components</p>
        </div>
      </div>
    </div>
  );
}
