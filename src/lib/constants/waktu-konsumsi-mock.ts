// Mock data for "Waktu Konsumsi" (timing of medication intake) used in the
// Racikan container form (UAT Phase 2 Item 13 rebuild) — this field changes from
// free text to a curated dropdown. A flat list (no categories needed, unlike
// bentuk-sediaan) — this is a curated subset for common primary-care
// prescriptions, NOT exhaustive, consistent with the other mock files.

export interface WaktuKonsumsiEntry {
  display: string;
}

export const WAKTU_KONSUMSI_MOCK: WaktuKonsumsiEntry[] = [
  { display: 'Sebelum Makan' },
  { display: 'Sesudah Makan' },
  { display: 'Saat Makan' },
  { display: 'Perut Kosong' },
  { display: 'Sebelum Tidur' },
  { display: 'Bila Perlu (PRN)' },
  { display: 'Setiap 6 Jam' },
  { display: 'Setiap 8 Jam' },
  { display: 'Setiap 12 Jam' },
  { display: 'Lainnya' },
];
