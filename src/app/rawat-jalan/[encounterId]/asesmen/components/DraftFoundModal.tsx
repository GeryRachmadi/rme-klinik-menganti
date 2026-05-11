'use client';

import { FileText } from 'lucide-react';

interface DraftFoundModalProps {
  isOpen: boolean;
  draftTypes: Array<'assessment' | 'physical'>;
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

  const hasAssessment = draftTypes.includes('assessment');
  const hasPhysical = draftTypes.includes('physical');

  let message: string;
  if (hasAssessment && hasPhysical) {
    message = 'Draf pengisian kajian awal dan pemeriksaan fisik sebelumnya ditemukan (belum tersimpan ke server).\nLanjutkan pengisian draf ini?';
  } else if (hasAssessment) {
    message = 'Draf pengisian kajian awal sebelumnya ditemukan (belum tersimpan ke server).\nLanjutkan pengisian draf ini?';
  } else {
    message = 'Draf pemeriksaan fisik sebelumnya ditemukan (belum tersimpan ke server).\nLanjutkan pengisian draf ini?';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E6F5F4] mx-auto mb-5">
          <FileText size={22} strokeWidth={2} className="text-[#0F766E]" />
        </div>
        <h2 className="text-center text-[17px] font-bold text-gray-800 mb-2 font-poppins">
          Draf Ditemukan
        </h2>
        <p className="text-center text-sm text-gray-500 leading-relaxed mb-7 whitespace-pre-line">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRejectDraft}
            className="flex-1 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            Mulai Baru
          </button>
          <button
            type="button"
            onClick={onUseDraft}
            className="flex-1 px-5 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
          >
            Lanjutkan Draf
          </button>
        </div>
      </div>
    </div>
  );
}
