import { getAssessmentDraftKey } from '@/lib/constants/storage-keys';

export function shouldRestoreDraft(encounterId: string): boolean {
  return localStorage.getItem(getAssessmentDraftKey(encounterId)) !== null;
}

export function deleteDraft(encounterId: string): void {
  localStorage.removeItem(getAssessmentDraftKey(encounterId));
}

export function readDraft<T>(encounterId: string): T | null {
  const raw = localStorage.getItem(getAssessmentDraftKey(encounterId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    deleteDraft(encounterId);
    return null;
  }
}
