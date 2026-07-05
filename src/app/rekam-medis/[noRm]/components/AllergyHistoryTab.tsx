import { MappedAllergy } from '@/lib/mappers/medical-records-mapper';
import { ShieldAlert, Pencil, CheckCircle2 } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

interface AllergyHistoryTabProps {
  data?: MappedAllergy[];
  sectionNote?: string | null;
  sectionNoteDate?: Date | string | null;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date)
    .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
}

function getSeverityBadge(severity: string): { bg: string; text: string; label: string } {
  const s = (severity || '').toLowerCase();
  if (s === 'tinggi' || s === 'severe' || s === 'high') {
    return { bg: 'bg-[#93000a]', text: 'text-white', label: 'Tinggi' };
  }
  if (s === 'sedang' || s === 'moderate' || s === 'medium') {
    return { bg: 'bg-[#fbe9b9]', text: 'text-[#634900]', label: 'Sedang' };
  }
  if (s === 'rendah' || s === 'mild' || s === 'low') {
    return { bg: 'bg-[#006b4e]', text: 'text-white', label: 'Rendah' };
  }
  return { bg: 'bg-gray-200', text: 'text-gray-700', label: severity || 'Tidak Diketahui' };
}

export default function AllergyHistoryTab({ data, sectionNote, sectionNoteDate }: AllergyHistoryTabProps) {
  const hasChips = data && data.length > 0;
  const hasNote = !!(sectionNote && sectionNote.trim());

  return (
    <div className="w-full">
      <h2
        className="text-[20px] font-bold text-[#006b5f] uppercase tracking-[0.578px] mb-6"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Riwayat Alergi
      </h2>

      {!hasChips && !hasNote && (
        <EmptyTabState
          icon={ShieldAlert}
          title="Tidak Ada Riwayat Alergi"
          description="Berdasarkan rekam medis, pasien ini tidak memiliki riwayat alergi terhadap obat, makanan, maupun lingkungan."
        />
      )}

      {(hasChips || hasNote) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
          {data && data.map((allergy, index) => {
            const badge = getSeverityBadge(allergy.severity);
            return (
              <div
                key={allergy.id || `allergy-${index}`}
                className="bg-white border border-[#e5e7eb] rounded-[19.5px] shadow-[0px_0.812px_0.812px_rgba(0,0,0,0.05)] p-[21px] flex flex-col gap-[13px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-bold text-[#191c1d] text-[14.6px]"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {allergy.allergen}
                  </span>
                  <div className={`flex items-center px-[8px] py-[3px] rounded-[4.9px] shrink-0 ${badge.bg}`}>
                    <span
                      className={`text-[11px] font-bold ${badge.text}`}
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Chips + Catatan */}
                <div className="flex flex-col gap-[9.7px]">
                  <div className="bg-[rgba(216,226,255,0.3)] rounded-[19.5px] px-[13px] py-[9px] min-h-[35.7px] flex items-center">
                    <span
                      className="text-[#2170e4] text-[11px] font-bold uppercase"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      Didiagnosis: {formatDate(allergy.dateDiscovered)}
                    </span>
                  </div>

                  <div className="bg-[#f3f4f5] rounded-[19.5px] p-[13px] flex flex-col gap-[3.25px]">
                    <span
                      className="text-[#94a3b8] text-[11px] font-bold uppercase"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      Catatan Klinis
                    </span>
                    <span
                      className="text-[#334155] text-[12px] font-semibold leading-[1.5]"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {allergy.notes || allergy.reaction || '-'}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[rgba(217,218,219,0.3)] pt-[10.5px] flex justify-end gap-[6.5px]">
                  <button className="p-[4.9px] rounded-[4.9px] hover:bg-gray-100 transition-colors">
                    <Pencil className="w-[11px] h-[11px] text-gray-400" />
                  </button>
                  <button className="p-[4.9px] rounded-[4.9px] hover:bg-gray-100 transition-colors">
                    <CheckCircle2 className="w-[12px] h-[12px] text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}

          {hasNote && (
            <div className="bg-white border border-[#e5e7eb] rounded-[19.5px] shadow-[0px_0.812px_0.812px_rgba(0,0,0,0.05)] p-[21px] flex flex-col gap-[13px]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-[#191c1d] text-[14.6px]"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Tidak Tercatat
                </span>
                <div className="flex items-center px-[8px] py-[3px] rounded-[4.9px] shrink-0 bg-[#e2e8f0]">
                  <span
                    className="text-[#64748b] text-[11px] font-bold"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Catatan
                  </span>
                </div>
              </div>

              {/* Chips + Catatan */}
              <div className="flex flex-col gap-[9.7px]">
                <div className="bg-[rgba(216,226,255,0.3)] rounded-[19.5px] px-[13px] py-[9px] min-h-[35.7px] flex items-center">
                  <span
                    className="text-[#2170e4] text-[11px] font-bold uppercase"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Didiagnosis: {formatDate(sectionNoteDate ?? null)}
                  </span>
                </div>

                <div className="bg-[#f3f4f5] rounded-[19.5px] p-[13px] flex flex-col gap-[3.25px]">
                  <span
                    className="text-[#94a3b8] text-[11px] font-bold uppercase"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Catatan Klinis
                  </span>
                  <span
                    className="text-[#334155] text-[12px] font-semibold leading-[1.5]"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {sectionNote}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[rgba(217,218,219,0.3)] pt-[10.5px] flex justify-end gap-[6.5px]">
                <button className="p-[4.9px] rounded-[4.9px] hover:bg-gray-100 transition-colors">
                  <Pencil className="w-[11px] h-[11px] text-gray-400" />
                </button>
                <button className="p-[4.9px] rounded-[4.9px] hover:bg-gray-100 transition-colors">
                  <CheckCircle2 className="w-[12px] h-[12px] text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
