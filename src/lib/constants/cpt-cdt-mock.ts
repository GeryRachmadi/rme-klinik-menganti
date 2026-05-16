export interface CptCdtEntry {
  code: string;
  display: string;
  category: string;
}

export const CPT_CDT_MOCK: CptCdtEntry[] = [
  // Office Visits
  { code: '99201', display: 'Kunjungan Pasien Baru - Level 1 (Ringan)', category: 'Office Visits' },
  { code: '99202', display: 'Kunjungan Pasien Baru - Level 2 (Rendah)', category: 'Office Visits' },
  { code: '99203', display: 'Kunjungan Pasien Baru - Level 3 (Sedang)', category: 'Office Visits' },
  { code: '99204', display: 'Kunjungan Pasien Baru - Level 4 (Menengah)', category: 'Office Visits' },
  { code: '99205', display: 'Kunjungan Pasien Baru - Level 5 (Kompleks)', category: 'Office Visits' },
  { code: '99211', display: 'Kunjungan Pasien Lama - Level 1 (Minimal)', category: 'Office Visits' },
  { code: '99212', display: 'Kunjungan Pasien Lama - Level 2 (Ringan)', category: 'Office Visits' },

  // Laboratory
  { code: '81000', display: 'Urinalisis Rutin', category: 'Laboratory' },
  { code: '85025', display: 'CBC Darah Lengkap dengan Diferensial', category: 'Laboratory' },
  { code: '85027', display: 'CBC Darah Lengkap Otomatis', category: 'Laboratory' },
  { code: '84443', display: 'Pemeriksaan TSH Tiroid', category: 'Laboratory' },

  // Imaging
  { code: '71046', display: 'Rontgen Dada 2 Proyeksi (PA dan Lateral)', category: 'Imaging' },
  { code: '73610', display: 'Rontgen Pergelangan Kaki (Ankle) Minimal 3 View', category: 'Imaging' },
  { code: '74177', display: 'CT Scan Abdomen dan Pelvis dengan Kontras', category: 'Imaging' },

  // Minor Procedures
  { code: '10060', display: 'Insisi dan Drainase Abses Sederhana', category: 'Minor Procedures' },
  { code: '10120', display: 'Insisi dan Pengangkatan Benda Asing Subkutan', category: 'Minor Procedures' },
  { code: '12001', display: 'Penjahitan Luka Sederhana (≤2.5 cm)', category: 'Minor Procedures' },

  // Consultations / Education
  { code: '99213', display: 'Konsultasi Pasien Lama - Sedang', category: 'Consultations/Education' },
  { code: '99214', display: 'Konsultasi Pasien Lama - Detail Menengah', category: 'Consultations/Education' },
  { code: '99401', display: 'Konseling Pencegahan Penyakit (15 Menit)', category: 'Consultations/Education' },

  // Dental Procedures (CDT)
  { code: 'D0120', display: 'Pemeriksaan Rutin Rongga Mulut', category: 'Dental Procedures' },
  { code: 'D1110', display: 'Scaling / Pembersihan Karang Gigi', category: 'Dental Procedures' },
  { code: 'D2140', display: 'Tambal Amalgam 1 Permukaan', category: 'Dental Procedures' },
  { code: 'D2330', display: 'Tambal Komposit (Resin) Anterior', category: 'Dental Procedures' },
  { code: 'D7140', display: 'Ekstraksi Gigi (Cabut Gigi Sederhana)', category: 'Dental Procedures' },
  { code: 'D7210', display: 'Ekstraksi Gigi dengan Pembedahan (Odontektomi)', category: 'Dental Procedures' },
];
