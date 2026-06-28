import { ExternalLink } from 'lucide-react';
import { formatDob } from '@/lib/utils/format-dob';
import { formatDoctorName } from '@/lib/utils/format-doctor-name';
import CetakButton from '@/app/riwayat-medis/[noRm]/components/CetakButton';
import CpptHistoryButton from './CpptHistoryButton';
import type { TimelineEncounter } from '@/lib/mappers/medical-records-mapper';

interface PatientAssessmentHeaderProps {
  patient: {
    namaLengkap: string;
    noRm: string;
    nik: string;
    jenisKelamin: string;
  };
  encounter: {
    periodStart: Date;
    reasonCode: string | null;
    practitioner?: { name: string; speciality?: string | null } | null;
  };
  age: string;
  tanggalLahir?: Date | string | null;
  // Show the "Cetak" action only for a completed (SELESAI) encounter. The
  // printed document is rendered by <PrintableDocument /> on the page.
  canPrint?: boolean;
  // CPPT history (Item 12) — past visit timeline + the doctor's role/status so the
  // "Lihat CPPT" control can scope itself (doctor-only, auto-popup on DIPERIKSA).
  cpptTimeline?: TimelineEncounter[];
  encounterStatus?: string;
  userRole?: string;
}

function formatEncounterDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export default function PatientAssessmentHeader({
  patient,
  encounter,
  age,
  tanggalLahir,
  canPrint = false,
  cpptTimeline = [],
  encounterStatus,
  userRole,
}: PatientAssessmentHeaderProps) {
  // Doctor-only (and Admin), and only while the encounter is being examined
  // (DIPERIKSA): the nurse view shares this header but must not get the CPPT
  // control/auto-popup, and there is no CPPT to show before/after examination.
  const showCppt =
    userRole?.toUpperCase() !== 'PERAWAT' && encounterStatus === 'DIPERIKSA';
  const initials = patient.namaLengkap
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const genderLabel =
    patient.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan';
  const genderColor =
    patient.jenisKelamin === 'LAKI_LAKI'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-pink-100 text-pink-700';

  return (
    <div className="col-span-12 bg-[#009E95] rounded-3xl px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">

          <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-[#10B981] bg-white flex items-center justify-center text-[#10B981] font-bold text-2xl flex-shrink-0"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {initials}
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="text-lg font-semibold text-white leading-tight"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {patient.namaLengkap}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="bg-white text-[#475569] px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {patient.noRm}
              </span>
              <span
                className="bg-white text-[#475569] px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                NIK: {patient.nik}
              </span>
              {tanggalLahir && (
                <span
                  className="bg-white text-[#475569] px-3 py-0.5 rounded-full text-xs font-medium"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {formatDob(tanggalLahir)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-0.5 rounded-full text-xs font-medium bg-white text-[#475569]"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {genderLabel}
              </span>
              <span
                className="bg-white text-[#475569] px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {age}
              </span>
            </div>

            <div
              className="mt-1 text-sm text-white/80 space-y-0.5"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <p>
                <span className="font-medium text-white">Kunjungan:</span>{' '}
                {formatEncounterDate(encounter.periodStart)}
              </p>
              {encounter.practitioner?.name && (
                <p>
                  <span className="font-medium text-white">Dokter:</span>{' '}
                  {formatDoctorName(encounter.practitioner.name, encounter.practitioner.speciality)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-center">
          {canPrint && <CetakButton size="lg" />}

          {showCppt && (
            <CpptHistoryButton data={cpptTimeline} encounterStatus={encounterStatus} />
          )}

          <a
            href={`/riwayat-medis/${patient.noRm}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-[#475569] bg-white rounded-full hover:opacity-90 transition-opacity shrink-0"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <ExternalLink className="w-5 h-5" />
            Lihat Detail Profil
          </a>
        </div>

      </div>
    </div>
  );
}
