/**
 * Temporary mock data for ICD-10 diagnosis codes.
 * This is used for local development and testing before migrating to a real database/API.
 */
export const ICD10_MOCK_DATA = [
  { code: 'J02.9', display: 'Acute pharyngitis, unspecified' },
  { code: 'A00.0', display: 'Cholera due to Vibrio cholerae 01, biovar cholerae' },
  { code: 'I10', display: 'Essential hypertension' },
  { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications' },
  { code: 'M79.3', display: 'Panniculitis, unspecified' },
  { code: 'F41.1', display: 'Generalized anxiety disorder' },
  { code: 'K21.9', display: 'Unspecified gastro-esophageal reflux disease' },
  { code: 'J06.9', display: 'Acute upper respiratory infection, unspecified' },
  { code: 'M25.5', display: 'Pain in joint' },
  { code: 'R05.9', display: 'Fever, unspecified' },
  { code: 'A09', display: 'Unspecified gastroenteritis and colitis' },
  { code: 'B86', display: 'Scabies' },
  { code: 'K59.1', display: 'Diarrhea' },
  { code: 'N39.0', display: 'Urinary tract infection, site not specified' },
  { code: 'R10.9', display: 'Unspecified abdominal pain' },
  { code: 'H10.9', display: 'Unspecified conjunctivitis' },
  { code: 'J01.90', display: 'Acute sinusitis, unspecified' },
  { code: 'J20.9', display: 'Acute bronchitis, unspecified' },
  { code: 'H65.90', display: 'Unspecified nonsuppurative otitis media, unspecified ear' },
  { code: 'L20.9', display: 'Atopic dermatitis, unspecified' },
  { code: 'K04.0', display: 'Pulpitis' },
  { code: 'K02.9', display: 'Dental caries, unspecified' },
  { code: 'K05.3', display: 'Chronic periodontitis, unspecified' },
  { code: 'K03.8', display: 'Other specified diseases of hard tissues of teeth' },
  { code: 'K02.1', display: 'Caries of dentine' },
  { code: 'K05.2', display: 'Aggressive periodontitis' },
  { code: 'K30', display: 'Functional dyspepsia' },
  { code: 'J45.9', display: 'Unspecified asthma' },
  { code: 'M10.9', display: 'Gout, unspecified' },
  { code: 'E78.5', display: 'Hyperlipidemia, unspecified' },
  { code: 'A15.9', display: 'Respiratory tuberculosis, unspecified' },
];

/**
 * Maps Indonesian condition names (as stored from SubjectiveInitialForm SUGGESTIONS_PENYAKIT)
 * to ICD-10 codes. Used as a display-layer fallback when the DB code field is empty.
 */
export const CONDITION_NAME_TO_ICD10: Record<string, string> = {
  'Hipertensi': 'I10',
  'Diabetes Melitus Tipe 2': 'E11.9',
  'Maag (Dispepsia)': 'K30',
  'Radang Tenggorokan (Faringitis)': 'J02.9',
  'Asma': 'J45.9',
  'Asam Urat (Gout)': 'M10.9',
  'Kolesterol Tinggi': 'E78.5',
  'Tuberkulosis (TBC)': 'A15.9',
  'ISPA': 'J06.9',
  'Diare': 'K59.1',
};
