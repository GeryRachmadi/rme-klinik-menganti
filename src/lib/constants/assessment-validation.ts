// Tier 2 — Soft limits (normal clinical range, trigger warning modal in UI)
// Tier 1 hard limits live in physical-exam-schema.ts (Zod) and are wider.
export const VITAL_BOUNDS = {
  tekananDarah: { min: "90/60", max: "160/100" },
  suhu: { min: 35.0, max: 38.0 },
  nadi: { min: 50, max: 120 },
  napas: { min: 10, max: 30, unit: "x/min" },
  tinggiBadan: { min: 30, max: 250 },
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
