'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { TimelineEncounter } from '@/lib/mappers/medical-records-mapper';
import CpptHistoryModal from './CpptHistoryModal';

interface CpptHistoryButtonProps {
  data: TimelineEncounter[];
  encounterStatus?: string;
}

/**
 * Header control (Item 12): "Lihat CPPT" button + the history modal, kept as a
 * self-contained client component so it can sit inside the server-rendered
 * PatientAssessmentHeader without lifting modal state across the boundary.
 * Auto-pops once on mount for DIPERIKSA encounters; reopenable anytime.
 */
export default function CpptHistoryButton({ data, encounterStatus }: CpptHistoryButtonProps) {
  const [showCpptModal, setShowCpptModal] = useState(false);

  // Empty deps: fires once on load, never re-pops if status changes client-side.
  useEffect(() => {
    if (encounterStatus === 'DIPERIKSA') {
      setShowCpptModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowCpptModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-[#475569] bg-white rounded-full hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <History className="w-5 h-5" />
        Lihat CPPT
      </button>

      <CpptHistoryModal
        isOpen={showCpptModal}
        onClose={() => setShowCpptModal(false)}
        data={data}
      />
    </>
  );
}
