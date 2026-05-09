import { useEffect } from 'react';
import { ASSESSMENT_CONFIG } from '@/lib/constants/assessment-validation';

export function useAutoSaveDraft(storageKey: string, data: unknown) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    }, ASSESSMENT_CONFIG.autoSaveDebounceMs);

    return () => clearTimeout(timeoutId);
  }, [storageKey, data]);
}
