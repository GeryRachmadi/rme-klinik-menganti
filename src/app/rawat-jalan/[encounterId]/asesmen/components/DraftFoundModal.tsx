'use client';

import { FileText } from 'lucide-react';

interface DraftFoundModalProps {
  isOpen: boolean;
  draftTypes: Array<'assessment' | 'physical' | 'hasil-periksa' | 'plan'>;
  onUseDraft: () => void;
  onRejectDraft: () => void;
}

export default function DraftFoundModal({
  isOpen,
  draftTypes,
  onUseDraft,
  onRejectDraft,
}: DraftFoundModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div
        className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E6F5F4] mx-auto mb-5">
          <FileText size={22} strokeWidth={2} className="text-[#0F766E]" />
        </div>
        <h2 className="text-center text-[18px] font-bold text-gray-800 mb-2 font-poppins">
          Draf pengisian sebelumnya ditemukan
        </h2>
        <p className="text-center text-[14px] text-gray-500 mb-8">
          Lanjutkan pengisian draf ini?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRejectDraft}
            className="flex-1 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            Hapus Draf
          </button>
          <button
            type="button"
            onClick={onUseDraft}
            className="flex-1 px-5 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

