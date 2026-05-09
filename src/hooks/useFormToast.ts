'use client';

import { useState, useEffect, useRef } from 'react';
import { ASSESSMENT_CONFIG } from '@/lib/constants/assessment-validation';

export type ToastType = 'success' | 'error';

export interface ToastState {
  type: ToastType;
  text: string;
}

export function useFormToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => setToast(null),
        ASSESSMENT_CONFIG.toastDurationMs
      );
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  return {
    toast,
    showSuccess: (text: string) => setToast({ type: 'success', text }),
    showError: (text: string) => setToast({ type: 'error', text }),
    clearToast: () => setToast(null),
  };
}
