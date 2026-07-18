export function getAssessmentDraftKey(encounterId: string): string {
  return `draft_asesmen_${encounterId}`;
}

export function getPhysicalExamDraftKey(encounterId: string): string {
  return `draft_fisik_${encounterId}`;
}

export function getHasilPeriksaDraftKey(encounterId: string): string {
  return `draft_hasilperiks_${encounterId}`;
}

export function getProcedureDraftKey(encounterId: string): string {
  return `draft_procedure_${encounterId}`;
}

export function getMedicationDraftKey(encounterId: string): string {
  return `draft_medication_${encounterId}`;
}

export function getEducationDraftKey(encounterId: string): string {
  return `draft_education_${encounterId}`;
}

export function getReferralDraftKey(encounterId: string): string {
  return `draft_referral_${encounterId}`;
}

export function getRencanaPemulanganDraftKey(encounterId: string): string {
  return `draft_rencanaPemulangan_${encounterId}`;
}

export function getLabInstructionDraftKey(encounterId: string): string {
  return `draft_labInstruction_${encounterId}`;
}
