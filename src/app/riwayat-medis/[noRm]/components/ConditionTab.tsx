import { MappedCondition } from '@/lib/mappers/medical-records-mapper';
import { Activity, Pencil, CheckCircle2 } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

interface ConditionTabProps {
  data?: MappedCondition[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date)
    .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
}

export default function ConditionTab({ data }: ConditionTabProps) {
  return (
    <div className="w-full">
      <h2
        className="text-[20px] font-bold text-[#006b5f] uppercase tracking-[0.578px] mb-6"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Riwayat Penyakit
      </h2>

      {!data || data.length === 0 ? (
        <EmptyTabState
          icon={Activity}
          title="Belum Ada Riwayat Penyakit"
          description="Pasien ini belum memiliki riwayat penyakit yang tercatat dalam sistem."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
          {data.map((condition, index) => (
            <div
              key={condition.id || `condition-${index}`}
              className="bg-white border border-[#e5e7eb] rounded-[19.5px] shadow-[0px_0.812px_0.812px_rgba(0,0,0,0.05)] p-[21px] flex flex-col gap-[13px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-[#191c1d] text-[14.6px]"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {condition.name}
                </span>
                <div className="flex items-center gap-[3px] bg-[#006b4e] px-[8px] py-[3px] rounded-[4.9px] shrink-0">
                  <div className="w-[4.9px] h-[4.9px] rounded-full bg-[#10b981]" />
                  <span
                    className="text-white text-[11px] font-bold"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Aktif
                  </span>
                </div>
              </div>

              {/* ICD-10 */}
              {condition.icd10 && (
                <div
                  className="text-[#334155] text-[11px] font-bold uppercase"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  ICD-10: {condition.icd10}
                </div>
              )}

              {/* Chips + Catatan */}
              <div className="flex flex-col gap-[9.7px]">
                <div className="bg-[rgba(216,226,255,0.3)] rounded-[19.5px] px-[13px] py-[9px] min-h-[35.7px] flex items-center">
                  <span
                    className="text-[#2170e4] text-[11px] font-bold uppercase"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Didiagnosis: {formatDate(condition.dateDiagnosed)}
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
                    {condition.notes || '-'}
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
          ))}
        </div>
      )}
    </div>
  );
}
