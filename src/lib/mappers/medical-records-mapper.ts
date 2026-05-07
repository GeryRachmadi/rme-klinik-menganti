export interface ClinicalSummary {
  latestVitals: any | null;
  primaryDiagnosis: any | null;
}

export interface MappedCondition {
  name: string;
  icd10: string;
  status: string;
  dateDiagnosed: Date | string | null;
  notes: string;
}

export interface MappedAllergy {
  allergen: string;
  severity: string;
  reaction: string;
  dateDiscovered: Date | string | null;
}

export interface MappedMedication {
  name: string;
  dosage: string;
  frequency: string;
  status: string;
}

export interface MappedEncounter {
  date: Date | string | null;
  practitionerName: string;
  primaryDiagnosis: string;
  status: string;
}

export interface PatientMedicalRecordData {
  hasMedicalRecord: boolean;
  clinicalSummary: ClinicalSummary;
  conditions: MappedCondition[];
  allergies: MappedAllergy[];
  medications: MappedMedication[];
  encounters: MappedEncounter[];
}

export function mapPatientMedicalRecords(
  prismaPatient: any,
  userRole: string
): PatientMedicalRecordData {
  const encounters = prismaPatient?.encounters || [];
  const hasMedicalRecord = encounters.length > 0;

  const sortedEncounters = [...encounters].sort((a: any, b: any) => {
    const dateA = a.periodStart || a.createdAt;
    const dateB = b.periodStart || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const mostRecentEncounter = sortedEncounters[0];

  const latestVitals = mostRecentEncounter?.observations?.[0] || null;
  const primaryDiagnosisObj = mostRecentEncounter?.conditionDiagnoses?.find(
    (d: any) => d.isPrimary === true
  ) || null;

  const clinicalSummary = {
    latestVitals,
    primaryDiagnosis: primaryDiagnosisObj,
  };

  const conditions: MappedCondition[] = (prismaPatient?.conditionHistories || []).map((c: any) => ({
    name: c.description || c.name || "",
    icd10: c.code || c.icd10 || "",
    status: c.clinicalStatus || c.status || "",
    dateDiagnosed: c.createdAt || c.dateDiagnosed || null,
    notes: c.notes || "",
  }));

  const allergies: MappedAllergy[] = (prismaPatient?.allergyIntolerances || []).map((a: any) => ({
    allergen: a.description || a.allergen || "",
    severity: a.reactionSeverity || a.severity || "",
    reaction: a.notes || a.reaction || "", // Notes often contains reaction details if reaction is missing
    dateDiscovered: a.createdAt || a.dateDiscovered || null,
  }));

  const medications: MappedMedication[] = (prismaPatient?.medicationStatements || []).map((m: any) => ({
    name: m.description || m.name || "",
    dosage: m.dosage || "",
    frequency: m.notes || m.frequency || "", // Fallback to notes if frequency missing
    status: m.clinicalStatus || m.status || "Active",
  }));

  const mappedEncounters: MappedEncounter[] = sortedEncounters.map((e: any) => {
    const primaryDiag = e.conditionDiagnoses?.find(
      (d: any) => d.isPrimary === true
    );

    return {
      date: e.periodStart || e.createdAt || null,
      practitionerName: e.practitioner?.name || e.practitionerName || "",
      primaryDiagnosis: primaryDiag?.display || primaryDiag?.codeIcd10 || primaryDiag?.name || "",
      status: e.status || "",
    };
  });

  return {
    hasMedicalRecord,
    clinicalSummary,
    conditions,
    allergies,
    medications,
    encounters: mappedEncounters,
  };
}
