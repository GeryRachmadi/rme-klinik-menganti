// Batas logis tanda vital — digunakan oleh TR-58 schema dan TR-63 validasi Pemeriksaan Fisik
export const VITAL_BOUNDS = {
  tekananDarah: { min: "60/40", max: "250/150" },
  suhu: { min: 34.0, max: 42.0 },
  nadi: { min: 30, max: 200 },
  napas: { min: 8, max: 60, unit: "x/min" },
  tinggiBadan: { min: 50, max: 250 },
  beratBadan: { min: 1, max: 300 },
  spo2: { min: 50, max: 100 },
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
