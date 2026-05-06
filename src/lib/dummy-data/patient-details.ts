export interface Condition {
  name: string;
  icd10: string;
  status: 'Aktif' | 'Sembuh';
  dateDiagnosed: string;
  notes?: string;
}

export interface Allergy {
  allergen: string;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  reaction: string;
  dateDiscovered: string;
}

export interface RoutineMedDetail {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  status: 'Aktif' | 'Dihentikan';
}

export const dummyConditions: Condition[] = [
  {
    name: 'Hipertensi',
    icd10: 'I10',
    status: 'Aktif',
    dateDiagnosed: '2023-05-15',
    notes: 'Terkontrol dengan pengobatan rutin',
  },
  {
    name: 'Asma Bronkial',
    icd10: 'J45.9',
    status: 'Aktif',
    dateDiagnosed: '2020-02-10',
    notes: 'Kambuh saat terpapar udara dingin',
  },
  {
    name: 'Demam Tifoid',
    icd10: 'A01.0',
    status: 'Sembuh',
    dateDiagnosed: '2022-08-20',
    notes: 'Dirawat inap selama 5 hari',
  },
];

export const dummyAllergies: Allergy[] = [
  {
    allergen: 'Amoxicillin',
    severity: 'Tinggi',
    reaction: 'Ruam kulit kemerahan seluruh tubuh, gatal',
    dateDiscovered: '2015-06-12',
  },
  {
    allergen: 'Seafood (Udang)',
    severity: 'Sedang',
    reaction: 'Gatal-gatal pada area wajah dan leher',
    dateDiscovered: '2018-11-05',
  },
];

export const dummyMeds: RoutineMedDetail[] = [
  {
    name: 'Amlodipine',
    dosage: '5 mg',
    frequency: '1x1 (Malam)',
    prescribedBy: 'dr. Budi Santoso, Sp.PD',
    startDate: '2023-05-16',
    status: 'Aktif',
  },
  {
    name: 'Salbutamol Inhaler',
    dosage: '100 mcg/puff',
    frequency: 'Prn (Jika sesak)',
    prescribedBy: 'dr. Siti Aminah, Sp.P',
    startDate: '2020-02-12',
    status: 'Aktif',
  },
  {
    name: 'Paracetamol',
    dosage: '500 mg',
    frequency: '3x1 (Bila demam)',
    prescribedBy: 'dr. Andi Wijaya',
    startDate: '2022-08-20',
    status: 'Dihentikan',
  },
];
