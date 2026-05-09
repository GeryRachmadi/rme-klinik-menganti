// Batas logis tanda vital — digunakan oleh TR-58 schema dan TR-63 validasi Pemeriksaan Fisik
export const VITAL_BOUNDS = {
  sistol: { min: 60, max: 250 },
  diastol: { min: 40, max: 150 },
  nadiMin: 30,
  nadiMax: 200,
  suhuMin: 34.0,
  suhuMax: 42.0,
  spo2Min: 50,
  spo2Max: 100,
  beratMin: 1,
  beratMax: 300,
  tinggiMin: 50,
  tinggiMax: 250,
} as const;

export const ERROR_MESSAGES = {
  penyakit: "Mohon isi riwayat penyakit atau centang opsi 'Pasien menyangkal'",
  alergi: "Mohon isi riwayat alergi atau centang opsi 'No Known Allergies (NKA)'",
  obat: "Mohon isi pengobatan rutin atau centang opsi 'Tidak ada pengobatan rutin'",
  catatanMax: "Catatan maksimal 500 karakter",
} as const;

export const ASSESSMENT_CONFIG = {
  autoSaveDebounceMs: 1000,
  toastDurationMs: 3000,
  redirectDelayMs: 1500,
} as const;
