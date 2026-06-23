// Mock data for "Bentuk Sediaan" (dosage forms) used in the Racikan medication
// form (UAT Phase 2 Item 13) — a categorized searchable dropdown.
//
// Labels and categories are verbatim from Figma (node 916:41): 14 entries across
// 4 categories, plus Tablet (Cetak/Kompresi) added under Padat (Solida) per PIC
// feedback during Item 13's rebuild — 15 entries total. Shape mirrors
// icd9cm-mock.ts: { display; category }.

export interface BentukSediaanEntry {
  display: string;
  category: string;
}

export const BENTUK_SEDIAAN_MOCK: BentukSediaanEntry[] = [
  // PADAT (SOLIDA)
  { display: 'Pulveres (Puyer)', category: 'Padat (Solida)' },
  { display: 'Kapsul Racikan', category: 'Padat (Solida)' },
  { display: 'Serbuk / Granul', category: 'Padat (Solida)' },
  { display: 'Tablet (Cetak/Kompresi)', category: 'Padat (Solida)' },

  // CAIR (LIQUIDA)
  { display: 'Sirup / Larutan', category: 'Cair (Liquida)' },
  { display: 'Suspensi', category: 'Cair (Liquida)' },
  { display: 'Emulsi', category: 'Cair (Liquida)' },
  { display: 'Tetes (Drop)', category: 'Cair (Liquida)' },

  // SETENGAH PADAT (SEMISOLIDA)
  { display: 'Salep', category: 'Setengah Padat (Semisolida)' },
  { display: 'Krim', category: 'Setengah Padat (Semisolida)' },
  { display: 'Gel', category: 'Setengah Padat (Semisolida)' },
  { display: 'Pasta', category: 'Setengah Padat (Semisolida)' },

  // BENTUK KHUSUS
  { display: 'Lotion / Bedak Kocok', category: 'Bentuk Khusus' },
  { display: 'Guttae (Obat Tetes)', category: 'Bentuk Khusus' },
  { display: 'Enema', category: 'Bentuk Khusus' },
];
