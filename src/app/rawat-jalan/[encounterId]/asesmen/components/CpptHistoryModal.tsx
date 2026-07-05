'use client';

import { X } from 'lucide-react';
import type { TimelineEncounter } from '@/lib/mappers/medical-records-mapper';
import EncounterHistoryTab from '@/app/rekam-medis/[noRm]/components/EncounterHistoryTab';

interface CpptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TimelineEncounter[];
}

export default function CpptHistoryModal({ isOpen, onClose, data }: CpptHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 font-poppins">
            Riwayat CPPT Pasien
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <EncounterHistoryTab data={data} />
        </div>
      </div>
    </div>
  );
}
