'use client';

import { useState } from 'react';
import { TimelineEncounter } from '@/lib/mappers/medical-records-mapper';
import { ChevronDown, FileX } from 'lucide-react';
import { formatDoctorName } from '@/lib/utils/format-doctor-name';
import EmptyTabState from './EmptyTabState';
import MedicationDisplayCard from './MedicationDisplayCard';

// Project tokens: Manrope role → Poppins (headings), Inter role → Jakarta (body).
const POPPINS = { fontFamily: 'var(--font-poppins)' } as const;
const JAKARTA = { fontFamily: 'var(--font-jakarta)' } as const;

const WIB = 'Asia/Jakarta';

function dateParts(value: Date | string | null) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) {
    return { month: '-', day: '-', year: '-', time: '-' };
  }
  return {
    month: d
      .toLocaleDateString('id-ID', { month: 'short', timeZone: WIB })
      .replace('.', '')
      .toUpperCase(),
    day: d.toLocaleDateString('id-ID', { day: 'numeric', timeZone: WIB }),
    year: d.toLocaleDateString('id-ID', { year: 'numeric', timeZone: WIB }),
    time: d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: WIB,
    }),
  };
}

// BMI category — thresholds mirror Ringkasan/asesmen; badge stays green per spec.
function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Kurus';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Gemuk';
  return 'Obesitas';
}

// "[code]–display", gracefully degrading when either part is missing.
function formatCoded(code: string | null, display: string, fallback: string): string {
  const text = display || fallback;
  return code ? `[${code}]–${text}` : text;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-extrabold text-[13px] text-[#006b5f] uppercase tracking-[1.4px]"
      style={POPPINS}
    >
      {children}
    </p>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] text-[#94a3b8] italic" style={JAKARTA}>
      {children}
    </p>
  );
}

// ── PEMERIKSAAN FISIK — vital sign tiles ──
function VitalTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      className="bg-[#f8fafc] border border-gray-200 rounded-[9px] p-[15px] flex flex-col gap-1"
      style={JAKARTA}
    >
      <span className="font-bold text-[11px] text-[#64748b]">{label}</span>
      <span className="font-bold text-[16px] text-[#0f172a]">
        {value}
        {unit && (
          <span className="ml-1 text-[11px] font-normal text-[#64748b]">{unit}</span>
        )}
      </span>
    </div>
  );
}

function PemeriksaanFisik({ vitals }: { vitals: TimelineEncounter['vitals'] }) {
  if (!vitals) {
    return <EmptyText>Belum ada pemeriksaan fisik tercatat</EmptyText>;
  }

  const tiles: React.ReactNode[] = [];
  if (vitals.systolic != null && vitals.diastolic != null) {
    tiles.push(
      <VitalTile key="td" label="TD:" value={`${vitals.systolic}/${vitals.diastolic}`} unit="mmHg" />
    );
  }
  if (vitals.heartRate != null)
    tiles.push(<VitalTile key="nadi" label="Nadi:" value={`${vitals.heartRate} x/mnt`} />);
  if (vitals.temperature != null)
    tiles.push(<VitalTile key="suhu" label="Suhu:" value={`${vitals.temperature} °C`} />);
  if (vitals.respiratoryRate != null)
    tiles.push(
      <VitalTile key="rr" label="Pernapasan:" value={`${vitals.respiratoryRate} x/mnt`} />
    );
  if (vitals.height != null)
    tiles.push(<VitalTile key="tb" label="Tinggi Badan:" value={`${vitals.height} cm`} />);
  if (vitals.weight != null)
    tiles.push(<VitalTile key="bb" label="Berat Badan:" value={`${vitals.weight} kg`} />);

  if (tiles.length === 0 && vitals.bmi == null) {
    return <EmptyText>Belum ada pemeriksaan fisik tercatat</EmptyText>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[14px]">
      {tiles}
      {vitals.bmi != null && (
        <div
          className="bg-[#f6fefa] border border-gray-200 rounded-[9px] p-[15px] flex items-center justify-between"
          style={JAKARTA}
        >
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[11px] text-[#64748b]">BMI:</span>
            <span className="font-bold text-[16px] text-[#0f172a]">
              {vitals.bmi}
              <span className="ml-1 text-[11px] font-normal text-[#64748b]">kg/m²</span>
            </span>
          </div>
          <span className="bg-[#10b981] text-white rounded px-2 py-0.5 text-[11px] font-bold">
            {bmiLabel(Number(vitals.bmi))}
          </span>
        </div>
      )}
    </div>
  );
}

// ── DIAGNOSA UTAMA ──
function DiagnosaUtama({ encounter }: { encounter: TimelineEncounter }) {
  const diagnoses = encounter.diagnoses;
  const primary = diagnoses.find((d) => d.isPrimary) ?? diagnoses[0] ?? null;
  const secondary = diagnoses.filter((d) => d !== primary);

  if (!primary) {
    return (
      <div className="flex flex-col gap-2">
        <SectionLabel>Diagnosa Utama</SectionLabel>
        <EmptyText>Belum ada diagnosis tercatat</EmptyText>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-[#f1f7fe] border border-[#dbeafe] rounded-[13px] p-[24px] flex flex-col gap-2">
        <p
          className="font-extrabold text-[13px] text-[#2563eb] uppercase tracking-[1.4px]"
          style={POPPINS}
        >
          Diagnosa Utama
        </p>
        <p className="font-bold text-[17px] text-[#1d4ed8]" style={JAKARTA}>
          {formatCoded(primary.code || null, primary.display, 'Diagnosis')}
        </p>
        {encounter.primaryDiagnosisNote && (
          <p className="text-[13px]" style={JAKARTA}>
            <span className="font-bold text-[#334155]">Catatan:</span>{' '}
            <span className="font-normal text-[#475569]">
              {encounter.primaryDiagnosisNote}
            </span>
          </p>
        )}
        {secondary.length > 0 && (
          <div className="flex flex-col gap-1 pt-2 border-t border-[#dbeafe]">
            <p
              className="font-extrabold text-[11px] text-[#2563eb]/70 uppercase tracking-wide"
              style={POPPINS}
            >
              Diagnosis Sekunder
            </p>
            {secondary.map((d, i) => (
              <p
                key={`${d.code}-${i}`}
                className="font-semibold text-[14px] text-[#475569]"
                style={JAKARTA}
              >
                {formatCoded(d.code || null, d.display, 'Diagnosis')}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ASESMEN KEPERAWATAN (SDKI) — nurse's clinical judgment, per-visit ──
function AsesmenKeperawatan({
  nursingAssessment,
}: {
  nursingAssessment: TimelineEncounter['nursingAssessment'];
}) {
  if (!nursingAssessment || (nursingAssessment.diagnoses.length === 0 && !nursingAssessment.catatan)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Asesmen Keperawatan</SectionLabel>
      <div className="bg-[#f0fdfa] border border-[#99f6e4] rounded-[13px] p-[24px] flex flex-col gap-3">
        <p
          className="font-extrabold text-[11px] text-[#0d9488] uppercase tracking-wide"
          style={POPPINS}
        >
          Diagnosis Keperawatan
        </p>
        {nursingAssessment.diagnoses.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {nursingAssessment.diagnoses.map((d, i) => (
              <p
                key={`${d.code}-${i}`}
                className="font-bold text-[16px] text-[#0f766e]"
                style={JAKARTA}
              >
                {formatCoded(d.code === 'MANUAL' ? null : d.code, d.display, 'Diagnosis')}
              </p>
            ))}
          </div>
        ) : (
          <EmptyText>Tidak ada diagnosis keperawatan tercatat</EmptyText>
        )}
        {nursingAssessment.catatan && (
          <p className="text-[13px] pt-1" style={JAKARTA}>
            <span className="font-bold text-[#334155]">Catatan:</span>{' '}
            <span className="font-normal text-[#475569]">{nursingAssessment.catatan}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── TINDAKAN ──
function Tindakan({ procedures }: { procedures: TimelineEncounter['procedures'] }) {
  const primary = procedures[0] ?? null;
  const secondary = procedures.slice(1);

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Tindakan</SectionLabel>
      {!primary ? (
        <EmptyText>Tidak ada tindakan yang dicatat</EmptyText>
      ) : (
        <>
          <div className="bg-[#f0fdf4] border border-[#a7f3d0] rounded-[13px] p-[24px] flex flex-col gap-2">
            <p
              className="font-extrabold text-[11px] text-[#059669] uppercase tracking-wide"
              style={POPPINS}
            >
              Tindakan Utama
            </p>
            <p className="font-bold text-[17px] text-[#047857]" style={JAKARTA}>
              {formatCoded(primary.code, primary.display, 'Tindakan')}
            </p>
          </div>
          {secondary.map((p, i) => (
            <div
              key={`${p.code}-${i}`}
              className="bg-[#f0fdf4] border border-[#a7f3d0] rounded-[13px] p-[24px] flex flex-col gap-2"
            >
              <p
                className="font-extrabold text-[11px] text-[#059669] uppercase tracking-wide"
                style={POPPINS}
              >
                Tindakan Tambahan
              </p>
              <p className="font-bold text-[17px] text-[#047857]" style={JAKARTA}>
                {formatCoded(p.code, p.display, 'Tindakan')}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── PERENCANAAN MEDIS (Resep Obat + Edukasi/Anjuran) ──
function PerencanaanMedis({ encounter }: { encounter: TimelineEncounter }) {
  const medications = encounter.medications;
  const education = encounter.education;
  const instruksiLab = encounter.instruksiLab;

  if (medications.length === 0 && !education && !instruksiLab) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Perencanaan Medis</SectionLabel>

      {medications.length > 0 && (
        <div className="bg-[#f3f4f5] border border-dashed border-[#999] rounded-[13px] p-[23px] flex flex-col gap-2">
          <p
            className="font-extrabold text-[11px] text-[#94a3b8] uppercase tracking-wide"
            style={POPPINS}
          >
            Resep Obat
          </p>
          <div className="flex flex-col gap-3">
            {medications.map((m, i) => (
              <MedicationDisplayCard key={i} item={m} />
            ))}
          </div>
        </div>
      )}

      {education && (
        <div className="bg-[#f3f4f5] border border-dashed border-[#999] rounded-[13px] p-[23px] flex flex-col gap-2">
          <p
            className="font-extrabold text-[11px] text-[#94a3b8] uppercase tracking-wide"
            style={POPPINS}
          >
            Edukasi / Anjuran
          </p>
          <p className="italic font-bold text-[17px] text-[#334155] leading-[26px]" style={JAKARTA}>
            &ldquo;{education}&rdquo;
          </p>
        </div>
      )}

      {instruksiLab && (
        <div className="bg-[#f3f4f5] border border-dashed border-[#999] rounded-[13px] p-[23px] flex flex-col gap-2">
          <p
            className="font-extrabold text-[11px] text-[#94a3b8] uppercase tracking-wide"
            style={POPPINS}
          >
            Instruksi Lab
          </p>
          <p className="font-bold text-[17px] text-[#334155] leading-[26px]" style={JAKARTA}>
            {instruksiLab}
          </p>
        </div>
      )}
    </div>
  );
}

// ── RUJUKAN (ServiceRequest) ──
function Rujukan({ referral }: { referral: TimelineEncounter['referral'] }) {
  if (!referral) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Rujukan</SectionLabel>
      <div className="bg-[#f3f4f5] border border-dashed border-[#999] rounded-[13px] p-[23px] flex flex-col gap-2">
        <p
          className="font-extrabold text-[11px] text-[#94a3b8] uppercase tracking-wide"
          style={POPPINS}
        >
          Rujuk ke Fasilitas Lain
        </p>
        <p className="font-bold text-[17px] text-[#334155] leading-[26px]" style={JAKARTA}>
          Tujuan: {referral.tujuan || '—'}
        </p>
        {referral.alasan && (
          <p className="text-[14px] text-[#475569] leading-[22px]" style={JAKARTA}>
            <span className="font-bold text-[#334155]">Alasan:</span> {referral.alasan}
          </p>
        )}
      </div>
    </div>
  );
}

export function EncounterCard({
  encounter,
  defaultExpanded = false,
}: {
  encounter: TimelineEncounter;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { month, day, year, time } = dateParts(encounter.encounterDate);
  const isBatal = encounter.status === 'BATAL';

  return (
    <div className="relative">
      {/* Timeline dot — red for BATAL, teal for SELESAI */}
      <div
        className={`absolute -left-[32px] sm:-left-[44px] top-[28px] w-[18px] h-[18px] rounded-full border-4 border-white box-content shadow-sm ${
          isBatal ? 'bg-[#dc2626]' : 'bg-[#006b5f]'
        }`}
      />

      <div
        className={`bg-white rounded-[13px] overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border ${
          isBatal ? 'border-[#fca5a5]' : 'border-[rgba(225,227,228,0.2)]'
        }`}
      >
        {/* Header — button for SELESAI (collapsible), div for BATAL (static) */}
        <button
          type="button"
          onClick={() => { if (!isBatal) setIsExpanded(!isExpanded); }}
          className={`w-full text-left px-[27px] py-[19px] flex items-center justify-between gap-4 focus:outline-none ${
            isBatal ? 'cursor-default' : ''
          }`}
          aria-expanded={isBatal ? undefined : isExpanded}
        >
          <div className="flex items-center gap-[18px] min-w-0">
            {/* Date box */}
            <div
              className="bg-[#f8f9fa] border border-[rgba(225,227,228,0.6)] rounded-[9px] px-[15px] py-[8px] flex flex-col items-center flex-shrink-0"
              style={POPPINS}
            >
              <span className="font-bold text-[11px] text-[#3c4a46] uppercase tracking-wide">
                {month}
              </span>
              <span className="font-extrabold text-[23px] text-[#191c1d] leading-none my-0.5">
                {day}
              </span>
              <span className="font-bold text-[11px] text-[#3c4a46] uppercase tracking-wide">
                {year}
              </span>
            </div>

            {/* Title (Poli) + subtitle */}
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[20px] text-[#191c1d]" style={POPPINS}>
                {encounter.poli}
              </span>
              <span className="font-medium text-[13px] text-[#3c4a46] truncate" style={JAKARTA}>
                {encounter.practitionerName
                  ? formatDoctorName(encounter.practitionerName, encounter.practitionerSpeciality)
                  : 'Dokter Tidak Diketahui'} &mdash; {time} WIB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isBatal ? (
              <span
                className="hidden sm:inline-block bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5] rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={JAKARTA}
              >
                Batal
              </span>
            ) : (
              <>
                <span
                  className="hidden sm:inline-block bg-[#e0f2f1] text-[#00695c] rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                  style={JAKARTA}
                >
                  Selesai
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#64748b] transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </div>
        </button>

        {/* Expanded content — SELESAI only */}
        {!isBatal && (
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-[rgba(225,227,228,0.4)] px-[27px] py-[27px] flex flex-col gap-[37px]">
                {/* KELUHAN AWAL */}
                <div className="flex flex-col gap-3">
                  <SectionLabel>Keluhan Awal</SectionLabel>
                  {encounter.keluhanAwal ? (
                    <p className="text-[17px] text-[#191c1d] leading-[28px]" style={JAKARTA}>
                      {encounter.keluhanAwal}
                    </p>
                  ) : (
                    <EmptyText>Tidak ada keluhan tercatat</EmptyText>
                  )}
                </div>

                {/* PEMERIKSAAN FISIK */}
                <div className="flex flex-col gap-3">
                  <SectionLabel>Pemeriksaan Fisik</SectionLabel>
                  <PemeriksaanFisik vitals={encounter.vitals} />
                </div>

                {/* DIAGNOSA UTAMA */}
                <DiagnosaUtama encounter={encounter} />

                {/* ASESMEN KEPERAWATAN (SDKI) */}
                <AsesmenKeperawatan nursingAssessment={encounter.nursingAssessment} />

                {/* TINDAKAN */}
                <Tindakan procedures={encounter.procedures} />

                {/* PERENCANAAN MEDIS */}
                <PerencanaanMedis encounter={encounter} />

                {/* RUJUKAN */}
                <Rujukan referral={encounter.referral} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EncounterHistoryTabProps {
  data?: TimelineEncounter[];
}

export default function EncounterHistoryTab({ data }: EncounterHistoryTabProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full py-2">
        <EmptyTabState
          icon={FileX}
          title="Belum Ada CPPT"
          description="Belum ada riwayat kunjungan tercatat. Silakan selesaikan asesmen untuk memulai pencatatan SOAP."
        />
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="relative pl-7 sm:pl-10 py-2">
        {/* Teal timeline line — left-[8px] centers it (9px) under the dot at both breakpoints */}
        <div className="absolute left-[8px] top-8 bottom-8 w-0.5 bg-[#006b5f]" />

        <div className="space-y-6">
          {data.map((encounter) => (
            <EncounterCard
              key={encounter.id}
              encounter={encounter}
              defaultExpanded={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
