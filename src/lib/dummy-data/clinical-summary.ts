export interface Diagnosis {
  code: string;
  name: string;
  dateDiagnosed: string;
}

export interface LatestVitals {
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  weight?: number;
  height?: number;
  bmi: number;
  lastUpdated: string;
}

export interface RoutineMed {
  name: string;
  dosage: string;
  instructions: string;
  lastUpdated: string;
}

export interface RiskFactor {
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface SpecialNote {
  text: string;
  severity: 'critical' | 'warning' | 'info';
  dateAdded: string;
}

export interface ClinicalSummary {
  diagnoses: Diagnosis[];
  latestVitals: LatestVitals;
  routineMeds: RoutineMed[];
  riskFactors: RiskFactor[];
  specialNotes: SpecialNote[];
}

export const dummyClinicalSummary: ClinicalSummary = {
  diagnoses: [
    {
      code: "J45.9",
      name: "Asma Ringan",
      dateDiagnosed: "2023-01-15T00:00:00.000Z",
    },
    {
      code: "I10",
      name: "Hipertensi",
      dateDiagnosed: "2022-05-20T00:00:00.000Z",
    },
  ],
  latestVitals: {
    bloodPressure: "135/85",
    heartRate: 78,
    respiratoryRate: 18,
    temperature: 36.6,
    weight: 70,
    height: 169,
    bmi: 24.5,
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  routineMeds: [
    {
      name: "Amlodipine",
      dosage: "5 mg",
      instructions: "1x sehari sesudah makan",
      lastUpdated: "2024-01-10T00:00:00.000Z",
    },
    {
      name: "Salbutamol",
      dosage: "100 mcg",
      instructions: "Bila perlu (jika sesak napas)",
      lastUpdated: "2024-01-10T00:00:00.000Z",
    },
    {
      name: "Vitamin C",
      dosage: "500 mg",
      instructions: "1x sehari",
      lastUpdated: "2024-01-10T00:00:00.000Z",
    },
  ],
  riskFactors: [
    {
      description: "Alergi Penicillin",
      severity: "critical",
    },
    {
      description: "Perokok Aktif",
      severity: "warning",
    },
  ],
  specialNotes: [
    {
      text: "Riwayat keluarga diabetes",
      severity: "info",
      dateAdded: "2023-11-05T00:00:00.000Z",
    },
  ],
};
