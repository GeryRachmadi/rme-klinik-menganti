// Mock data for SDKI (Standar Diagnosis Keperawatan Indonesia) nursing diagnoses.
// Used for the "Asesmen Keperawatan" section (UAT Phase 2 Item 14) — the nurse's
// own clinical judgment, distinct from the doctor's ICD-10 diagnosis.
//
// Shape mirrors icd9cm-mock.ts exactly: { code; display; category }. The category
// maps to SDKI's five real diagnostic categories (Fisiologis, Psikologis,
// Perilaku, Relasional, Lingkungan). Codes use the real SDKI "D.00XX" scheme
// where known. This is a curated subset of common primary-care presentations,
// not the full SDKI catalogue — for local development before a real DB/API.

export interface SdkiEntry {
  code: string;
  display: string;
  category: string;
}

export const SDKI_MOCK: SdkiEntry[] = [
  // ── Fisiologis ──
  { code: 'D.0001', display: 'Bersihan Jalan Napas Tidak Efektif', category: 'Fisiologis' },
  { code: 'D.0003', display: 'Gangguan Pertukaran Gas', category: 'Fisiologis' },
  { code: 'D.0005', display: 'Pola Napas Tidak Efektif', category: 'Fisiologis' },
  { code: 'D.0008', display: 'Penurunan Curah Jantung', category: 'Fisiologis' },
  { code: 'D.0009', display: 'Perfusi Perifer Tidak Efektif', category: 'Fisiologis' },
  { code: 'D.0019', display: 'Defisit Nutrisi', category: 'Fisiologis' },
  { code: 'D.0022', display: 'Hipervolemia', category: 'Fisiologis' },
  { code: 'D.0023', display: 'Hipovolemia', category: 'Fisiologis' },
  { code: 'D.0027', display: 'Ketidakstabilan Kadar Glukosa Darah', category: 'Fisiologis' },
  { code: 'D.0032', display: 'Risiko Defisit Nutrisi', category: 'Fisiologis' },
  { code: 'D.0040', display: 'Gangguan Eliminasi Urine', category: 'Fisiologis' },
  { code: 'D.0049', display: 'Konstipasi', category: 'Fisiologis' },
  { code: 'D.0055', display: 'Gangguan Pola Tidur', category: 'Fisiologis' },
  { code: 'D.0056', display: 'Intoleransi Aktivitas', category: 'Fisiologis' },
  { code: 'D.0063', display: 'Gangguan Mobilitas Fisik', category: 'Fisiologis' },
  { code: 'D.0074', display: 'Gangguan Rasa Nyaman', category: 'Fisiologis' },
  { code: 'D.0077', display: 'Nyeri Akut', category: 'Fisiologis' },
  { code: 'D.0078', display: 'Nyeri Kronis', category: 'Fisiologis' },
  { code: 'D.0129', display: 'Gangguan Integritas Kulit/Jaringan', category: 'Fisiologis' },
  { code: 'D.0130', display: 'Hipertermia', category: 'Fisiologis' },
  { code: 'D.0131', display: 'Hipotermia', category: 'Fisiologis' },
  { code: 'D.0149', display: 'Termoregulasi Tidak Efektif', category: 'Fisiologis' },

  // ── Psikologis ──
  { code: 'D.0080', display: 'Ansietas', category: 'Psikologis' },
  { code: 'D.0083', display: 'Gangguan Citra Tubuh', category: 'Psikologis' },
  { code: 'D.0087', display: 'Harga Diri Rendah Situasional', category: 'Psikologis' },
  { code: 'D.0096', display: 'Berduka', category: 'Psikologis' },
  { code: 'D.0099', display: 'Distres Spiritual', category: 'Psikologis' },
  { code: 'D.0100', display: 'Keputusasaan', category: 'Psikologis' },

  // ── Perilaku ──
  { code: 'D.0109', display: 'Defisit Perawatan Diri', category: 'Perilaku' },
  { code: 'D.0111', display: 'Defisit Pengetahuan', category: 'Perilaku' },
  { code: 'D.0112', display: 'Kesiapan Peningkatan Pengetahuan', category: 'Perilaku' },
  { code: 'D.0113', display: 'Manajemen Kesehatan Tidak Efektif', category: 'Perilaku' },
  { code: 'D.0114', display: 'Ketidakpatuhan', category: 'Perilaku' },
  { code: 'D.0117', display: 'Pemeliharaan Kesehatan Tidak Efektif', category: 'Perilaku' },

  // ── Relasional ──
  { code: 'D.0118', display: 'Gangguan Interaksi Sosial', category: 'Relasional' },
  { code: 'D.0121', display: 'Gangguan Proses Keluarga', category: 'Relasional' },
  { code: 'D.0123', display: 'Pencapaian Peran Menjadi Orang Tua Tidak Efektif', category: 'Relasional' },
  { code: 'D.0126', display: 'Kesiapan Peningkatan Menjadi Orang Tua', category: 'Relasional' },

  // ── Lingkungan ──
  { code: 'D.0136', display: 'Risiko Cedera', category: 'Lingkungan' },
  { code: 'D.0139', display: 'Risiko Termoregulasi Tidak Efektif', category: 'Lingkungan' },
  { code: 'D.0142', display: 'Risiko Infeksi', category: 'Lingkungan' },
  { code: 'D.0143', display: 'Risiko Jatuh', category: 'Lingkungan' },
];
