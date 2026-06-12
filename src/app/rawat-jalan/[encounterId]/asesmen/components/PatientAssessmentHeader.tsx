import { ExternalLink } from 'lucide-react';
import { formatDob } from '@/lib/utils/format-dob';

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
    practitioner?: { name: string } | null;
  };
  age: string;
  tanggalLahir?: Date | string | null;
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
}: PatientAssessmentHeaderProps) {
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
    <div className="col-span-12 bg-white rounded-3xl px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">

          <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-teal-500 bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {initials}
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="text-lg font-semibold text-gray-900 leading-tight"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {patient.namaLengkap}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="bg-[#006B4E] text-white px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {patient.noRm}
              </span>
              <span
                className="bg-gray-100 text-gray-600 px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                NIK: {patient.nik}
              </span>
              {tanggalLahir && (
                <span
                  className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-medium"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {formatDob(tanggalLahir)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-medium ${genderColor}`}
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {genderLabel}
              </span>
              <span
                className="bg-teal-50 text-teal-700 px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {age}
              </span>
            </div>

            <div
              className="mt-1 text-sm text-gray-500 space-y-0.5"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <p>
                <span className="font-medium text-gray-700">Kunjungan:</span>{' '}
                {formatEncounterDate(encounter.periodStart)}
              </p>
              {encounter.practitioner?.name && (
                <p>
                  <span className="font-medium text-gray-700">Dokter:</span>{' '}
                  {encounter.practitioner.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <a
          href={`/riwayat-medis/${patient.noRm}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#006B4E] rounded-full hover:opacity-90 transition-opacity shrink-0 self-center"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <ExternalLink className="w-5 h-5" />
          Lihat Detail Profil
        </a>

      </div>
    </div>
  );
}
