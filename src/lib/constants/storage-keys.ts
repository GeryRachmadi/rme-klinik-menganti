export function getAssessmentDraftKey(encounterId: string): string {
  return `draft_asesmen_${encounterId}`;
}

export function getPhysicalExamDraftKey(encounterId: string): string {
  return `draft_fisik_${encounterId}`;
}
