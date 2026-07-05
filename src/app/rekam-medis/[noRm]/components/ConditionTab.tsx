import { MappedCondition } from '@/lib/mappers/medical-records-mapper';
import type { FamilyHistory } from '@/lib/utils/family-history';
import { ICD10_MOCK_DATA, CONDITION_NAME_TO_ICD10 } from '@/lib/constants/icd10-mock';
import { Activity, Pencil, CheckCircle2, Users } from 'lucide-react';
import EmptyTabState from './EmptyTabState';

interface ConditionTabProps {
  data?: MappedCondition[];
  sectionNote?: string | null;
  sectionNoteDate?: Date | string | null;
  familyHistory?: FamilyHistory | null;
  familyHistoryDate?: Date | string | null;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date)
    .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
}

export default function ConditionTab({ data, sectionNote, sectionNoteDate, familyHistory, familyHistoryDate }: ConditionTabProps) {
  const hasChips = data && data.length > 0;
  const hasNote = !!(sectionNote && sectionNote.trim());
  const hasFamily = !!familyHistory &&
    (familyHistory.chips.length > 0 || familyHistory.tidakAda || !!familyHistory.catatan.trim());

  return (
    <div className="w-full">
      <h2
        className="text-[20px] font-bold text-[#006b5f] uppercase tracking-[0.578px] mb-6"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Riwayat Penyakit
      </h2>

      {!hasChips && !hasNote && !hasFamily && (
        <EmptyTabState
          icon={Activity}
          title="Belum Ada Riwayat Penyakit"
          description="Pasien ini belum memiliki riwayat penyakit yang tercatat dalam sistem."
        />
      )}

      {(hasChips || hasNote) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
          {data && data.map((condition, index) => {
            const icd10Code = condition.icd10 || CONDITION_NAME_TO_ICD10[condition.name] || null;
            const icd10Name = icd10Code
              ? (ICD10_MOCK_DATA.find(item => item.code === icd10Code)?.display ?? null)
              : null;
            return (
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

                {/* ICD-10 subtitle */}
                {icd10Code && (
                  <div
                    className="text-[#334155] text-[11px] font-bold uppercase"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    ICD-10: {icd10Code}{icd10Name ? ` (${icd10Name})` : ''}
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

      {/* Riwayat Penyakit Keluarga (UAT Phase 2 Item 19) — subsection styled like
          the Catatan Klinis card pattern above. */}
      {hasFamily && familyHistory && (
        <div className="mt-8">
          <h3
            className="text-[15px] font-bold text-[#006b5f] uppercase tracking-[0.4px] mb-4 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <Users className="w-[15px] h-[15px]" />
            Riwayat Penyakit Keluarga
          </h3>

          <div className="bg-white border border-[#e5e7eb] rounded-[19.5px] shadow-[0px_0.812px_0.812px_rgba(0,0,0,0.05)] p-[21px] flex flex-col gap-[13px] max-w-[520px]">
            {/* Date pill */}
            <div className="bg-[rgba(216,226,255,0.3)] rounded-[19.5px] px-[13px] py-[9px] min-h-[35.7px] flex items-center">
              <span
                className="text-[#2170e4] text-[11px] font-bold uppercase"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Dicatat: {formatDate(familyHistoryDate ?? null)}
              </span>
            </div>

            {/* Condition chips, or the negation statement when none */}
            {familyHistory.chips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {familyHistory.chips.map((chip, idx) => (
                  <span
                    key={`family-${idx}`}
                    className="inline-flex items-center rounded-full px-3.5 py-1 text-[12px] font-bold border bg-[#E6F5F4] border-[#B2DFDB] text-[#0F766E]"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : familyHistory.tidakAda && !familyHistory.catatan.trim() ? (
              <span
                className="text-[#334155] text-[12px] font-semibold"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Tidak ada riwayat penyakit keluarga.
              </span>
            ) : null}

            {/* Catatan */}
            {!!familyHistory.catatan.trim() && (
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
                  {familyHistory.catatan}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
