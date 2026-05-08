import { useEffect } from 'react';
import type { AssessmentFormValues } from '@/lib/schemas/assessment-schema';

export function useAutoSaveDraft(encounterId: string, data: AssessmentFormValues) {
  useEffect(() => {
    // Kita gunakan teknik "Debounce" menggunakan setTimeout.
    // Ini memastikan sistem tidak nge-save ke localStorage setiap detik perawat mengetik 1 huruf,
    // melainkan menunggu sampai perawat berhenti mengetik selama 1 detik (1000ms).
    const timeoutId = setTimeout(() => {
      // Kita bungkus datanya dengan timestamp agar nanti bisa dicek usianya
      const draftPayload = {
        data,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(`draft_asesmen_${encounterId}`, JSON.stringify(draftPayload));
      console.log('Draft otomatis tersimpan di localStorage'); // Bisa dihapus nanti kalau sudah aman
    }, 1000);

    // Cleanup function: membatalkan timer jika user mengetik lagi sebelum 1 detik
    return () => clearTimeout(timeoutId);
  }, [encounterId, data]); // Effect berjalan ulang setiap 'data' berubah
}