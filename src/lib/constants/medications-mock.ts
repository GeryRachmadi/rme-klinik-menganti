// Mock data for common Indonesian primary-care medications.
// Used for the type-ahead suggestions in the Racikan medication form (UAT Phase 2
// Item 13) — the doctor types freely (Option A: free-text input with suggestions),
// so this list only assists entry; it never restricts what can be typed.
//
// Shape mirrors icd9cm-mock.ts: { display; category }. The category maps to common
// pharmacological groups for grouping the dropdown. This is a curated subset of
// frequent outpatient prescriptions, NOT an exhaustive pharmacopeia — for local
// development before a real drug-master DB/API (same precedent as sdki-mock.ts).
//
// `display` is the drug NAME ONLY (no strength) — strength/dosis is a separate
// free-text field the doctor fills in per ingredient (Item 13 rebuild, Option A
// container/ingredient restructure), since one drug name can map to multiple
// available strengths not tied 1:1 to a single mock entry.

export interface MedicationEntry {
  display: string;
  category: string;
}

export const MEDICATIONS_MOCK: MedicationEntry[] = [
  // Analgesik / Antipiretik
  { display: 'Paracetamol', category: 'Analgesik/Antipiretik' },
  { display: 'Ibuprofen', category: 'Analgesik/Antipiretik' },
  { display: 'Asam Mefenamat', category: 'Analgesik/Antipiretik' },
  { display: 'Natrium Diklofenak', category: 'Analgesik/Antipiretik' },
  { display: 'Metamizole (Antalgin)', category: 'Analgesik/Antipiretik' },
  { display: 'Ketoprofen', category: 'Analgesik/Antipiretik' },

  // Antibiotik
  { display: 'Amoxicillin', category: 'Antibiotik' },
  { display: 'Cefadroxil', category: 'Antibiotik' },
  { display: 'Ciprofloxacin', category: 'Antibiotik' },
  { display: 'Cotrimoxazole', category: 'Antibiotik' },
  { display: 'Erythromycin', category: 'Antibiotik' },
  { display: 'Metronidazole', category: 'Antibiotik' },
  { display: 'Doxycycline', category: 'Antibiotik' },
  { display: 'Azithromycin', category: 'Antibiotik' },

  // Antihistamin
  { display: 'CTM (Chlorpheniramine Maleate)', category: 'Antihistamin' },
  { display: 'Loratadine', category: 'Antihistamin' },
  { display: 'Cetirizine', category: 'Antihistamin' },
  { display: 'Diphenhydramine', category: 'Antihistamin' },

  // Obat Saluran Cerna
  { display: 'Omeprazole', category: 'Obat Saluran Cerna' },
  { display: 'Antasida DOEN', category: 'Obat Saluran Cerna' },
  { display: 'Domperidone', category: 'Obat Saluran Cerna' },
  { display: 'Ranitidine', category: 'Obat Saluran Cerna' },
  { display: 'Lansoprazole', category: 'Obat Saluran Cerna' },
  { display: 'Loperamide', category: 'Obat Saluran Cerna' },
  { display: 'Oralit (Garam Rehidrasi Oral)', category: 'Obat Saluran Cerna' },
  { display: 'Hyoscine Butilbromida', category: 'Obat Saluran Cerna' },

  // Obat Saluran Napas
  { display: 'Ambroxol', category: 'Obat Saluran Napas' },
  { display: 'Salbutamol', category: 'Obat Saluran Napas' },
  { display: 'Dextromethorphan', category: 'Obat Saluran Napas' },
  { display: 'Gliseril Guaiakolat (GG)', category: 'Obat Saluran Napas' },
  { display: 'Bromhexine', category: 'Obat Saluran Napas' },
  { display: 'Pseudoefedrin', category: 'Obat Saluran Napas' },

  // Vitamin / Suplemen
  { display: 'Vitamin C', category: 'Vitamin/Suplemen' },
  { display: 'Vitamin B Complex', category: 'Vitamin/Suplemen' },
  { display: 'Vitamin B6', category: 'Vitamin/Suplemen' },
  { display: 'Zinc', category: 'Vitamin/Suplemen' },
  { display: 'Asam Folat', category: 'Vitamin/Suplemen' },
  { display: 'Tablet Tambah Darah (Fe + Asam Folat)', category: 'Vitamin/Suplemen' },

  // Obat Kulit Topikal
  { display: 'Hydrocortisone Cream', category: 'Obat Kulit Topikal' },
  { display: 'Gentamicin Cream', category: 'Obat Kulit Topikal' },
  { display: 'Miconazole Cream', category: 'Obat Kulit Topikal' },
  { display: 'Ketoconazole Cream', category: 'Obat Kulit Topikal' },
  { display: 'Betamethasone Cream', category: 'Obat Kulit Topikal' },
  { display: 'Acyclovir Cream', category: 'Obat Kulit Topikal' },

  // Obat Kardiovaskular
  { display: 'Amlodipine', category: 'Obat Kardiovaskular' },
  { display: 'Captopril', category: 'Obat Kardiovaskular' },
  { display: 'Furosemide', category: 'Obat Kardiovaskular' },
  { display: 'Hydrochlorothiazide (HCT)', category: 'Obat Kardiovaskular' },
  { display: 'Simvastatin', category: 'Obat Kardiovaskular' },
  { display: 'Bisoprolol', category: 'Obat Kardiovaskular' },
];
