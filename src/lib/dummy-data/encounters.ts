export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  weight?: number; // in kg
  height?: number; // in cm
}

export interface Diagnosis {
  code: string; // ICD-10 Code
  name: string;
  type: 'PRIMARY' | 'SECONDARY';
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export interface MedicalRecord {
  id: string;
  subjective: string;
  objective: string;
  vitalSigns?: VitalSigns;
  assessment: string;
  plan: string;
  diagnoses: Diagnosis[];
}

export interface Encounter {
  id: string;
  patientId: string;
  date: string; // ISO 8601 string
  clinic: string;
  doctor: Doctor;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  medicalRecord?: MedicalRecord;
}

// Array of mock encounters ordered newest to oldest
export const dummyEncounters: Encounter[] = [
  {
    id: 'ENC-2023-1105',
    patientId: 'PAT-12345',
    date: '2026-05-02T09:30:00Z',
    clinic: 'Poli Umum',
    status: 'COMPLETED',
    doctor: {
      id: 'DOC-001',
      name: 'dr. Andi Pratama',
      specialization: 'Dokter Umum',
    },
    medicalRecord: {
      id: 'MR-2023-1105',
      subjective: 'Pasien mengeluh demam sejak 3 hari yang lalu, disertai batuk berdahak kekuningan dan hidung tersumbat. Pasien juga merasa nyeri pada persendian, lemas, dan nafsu makan menurun.',
      objective: 'Keadaan umum tampak sakit sedang. Faring hiperemis (+), tonsil T1-T1 memerah. Suara napas vesikuler, ronchi (-), wheezing (-).',
      vitalSigns: {
        bloodPressure: '110/70',
        heartRate: 92,
        respiratoryRate: 20,
        temperature: 38.5,
        weight: 65,
        height: 170,
      },
      assessment: 'Infeksi Saluran Pernapasan Akut (ISPA).',
      plan: '1. Paracetamol 500mg 3x1 (k/p demam)\n2. Ambroxol 30mg 3x1\n3. Vitamin C 500mg 1x1\n4. Edukasi: Istirahat yang cukup, perbanyak minum air putih hangat, dan makan bergizi. Kontrol kembali jika keluhan tidak membaik dalam 3 hari.',
      diagnoses: [
        {
          code: 'J06.9',
          name: 'Acute upper respiratory infection, unspecified',
          type: 'PRIMARY',
        },
      ],
    },
  },
  {
    id: 'ENC-2023-0814',
    patientId: 'PAT-12345',
    date: '2025-12-14T14:15:00Z',
    clinic: 'Poli Gigi',
    status: 'COMPLETED',
    doctor: {
      id: 'DOC-002',
      name: 'drg. Budi Santoso',
      specialization: 'Dokter Gigi',
    },
    medicalRecord: {
      id: 'MR-2023-0814',
      subjective: 'Nyeri pada gigi geraham kiri bawah (gigi 36) sejak 2 hari yang lalu. Nyeri dirasakan berdenyut, menjalar hingga ke telinga, dan memberat terutama saat minum dingin atau manis serta saat mengunyah.',
      objective: 'Ekstraoral: asimetri wajah (-), pembengkakan kelenjar getah bening (-).\nIntraoral: Gigi 36 karies profunda mencapai pulpa. Perkusi (+), palpasi (+), mobilitas (-). Gusi di sekitarnya tampak sedikit hiperemis.',
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 85,
        respiratoryRate: 18,
        temperature: 36.8,
        weight: 65,
        height: 170,
      },
      assessment: 'Pulpitis ireversibel gigi 36.',
      plan: '1. Dilakukan pembukaan atap pulpa (trepanasi) untuk drainase.\n2. Aplikasi medikasi Eugenol pada kapas kecil dan ditutup tumpatan sementara.\n3. Resep: Asam Mefenamat 500mg 3x1 (sesudah makan).\n4. Jadwalkan kontrol 3 hari lagi untuk rencana Perawatan Saluran Akar (PSA).',
      diagnoses: [
        {
          code: 'K04.0',
          name: 'Pulpitis',
          type: 'PRIMARY',
        },
      ],
    },
  },
  {
    id: 'ENC-2023-0520',
    patientId: 'PAT-12345',
    date: '2025-06-20T10:00:00Z',
    clinic: 'Poli Umum',
    status: 'COMPLETED',
    doctor: {
      id: 'DOC-003',
      name: 'dr. Citra Lestari',
      specialization: 'Dokter Umum',
    },
    medicalRecord: {
      id: 'MR-2023-0520',
      subjective: 'Kontrol rutin bulanan untuk hipertensi. Saat ini tidak ada keluhan pusing, tegang di tengkuk, atau dada berdebar. Obat rutin (Amlodipine) masih diminum teratur setiap pagi.',
      objective: 'Keadaan umum baik, compos mentis. Mata: konjungtiva anemis (-), sklera ikterik (-). Dada: cor/pulmo dalam batas normal. Ekstremitas: edema perifer (-).',
      vitalSigns: {
        bloodPressure: '130/85',
        heartRate: 76,
        respiratoryRate: 16,
        temperature: 36.5,
        weight: 66,
        height: 170,
      },
      assessment: 'Hipertensi esensial, terkontrol.',
      plan: '1. Lanjutkan terapi Amlodipine 5mg 1x1 setiap pagi.\n2. Edukasi: Pertahankan gaya hidup sehat, kurangi asupan garam (diet rendah garam), dan olahraga ringan teratur 3-4x seminggu.\n3. Kontrol kembali 1 bulan ke depan atau jika ada keluhan.',
      diagnoses: [
        {
          code: 'I10',
          name: 'Essential (primary) hypertension',
          type: 'PRIMARY',
        },
      ],
    },
  },
];
