export interface Icd9CmEntry {
  code: string;
  display: string;
  category: string;
}

export const ICD9CM_MOCK: Icd9CmEntry[] = [
  // Wawancara & Konsultasi
  { code: '89.02', display: 'Wawancara dan evaluasi komprehensif', category: 'Consultation' },
  { code: '89.03', display: 'Wawancara dan evaluasi komprehensif (Gigi)', category: 'Consultation' },

  // Laboratorium & Darah
  { code: '90.59', display: 'Pemeriksaan mikroskopis darah (Lainnya)', category: 'Laboratory' },
  { code: '90.53', display: 'Pemeriksaan mikroskopis darah (Kultur)', category: 'Laboratory' },

  // Radiologi / Imaging
  { code: '87.44', display: 'Rontgen dada rutin (X-Ray Thorax)', category: 'Imaging' },
  { code: '87.21', display: 'Rontgen gigi (Dental X-Ray)', category: 'Imaging' },

  // Tindakan Medis Ringan (Minor)
  { code: '86.04', display: 'Insisi dan drainase kulit / jaringan subkutan lainnya', category: 'Minor Procedures' },
  { code: '86.59', display: 'Penjahitan kulit dan jaringan subkutan', category: 'Minor Procedures' },
  { code: '99.21', display: 'Injeksi antibiotik', category: 'Minor Procedures' },
  { code: '99.11', display: 'Pemberian vaksin / imunisasi', category: 'Minor Procedures' },

  // Tindakan Gigi
  { code: '23.09', display: 'Ekstraksi gigi lainnya (Cabut gigi biasa)', category: 'Dental Procedures' },
  { code: '23.11', display: 'Pengangkatan sisa akar gigi', category: 'Dental Procedures' },
  { code: '23.2', display: 'Restorasi gigi dengan amalgam (Tambal)', category: 'Dental Procedures' },
  { code: '24.31', display: 'Eksisi lesi gigi (Pembersihan karang/Scaling)', category: 'Dental Procedures' },
];
