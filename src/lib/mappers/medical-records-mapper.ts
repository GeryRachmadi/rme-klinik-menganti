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

// ── Ringkasan tab (2-column episodic + longitudinal) ──
export interface EpisodicVitals {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
}

export interface EpisodicDiagnosis {
  code: string;
  display: string;
  isPrimary: boolean;
}

export interface EpisodicProcedure {
  code: string | null;
  display: string;
}

export interface EpisodicMedication {
  name: string;
  dosage: string | null;
}

export interface EpisodicData {
  encounterDate: Date | string | null;
  diagnoses: EpisodicDiagnosis[];
  vitals: EpisodicVitals | null;
  clinicalNote: string | null;
  practitionerName: string | null;
  procedures: EpisodicProcedure[];   // Tindakan from latest encounter
  medications: EpisodicMedication[]; // Resep Obat from latest encounter
  education: string | null;          // Edukasi/Anjuran free text
}

export interface RingkasanData {
  episodic: EpisodicData | null; // last SELESAI visit snapshot
  pastConditions: string[];      // longitudinal, deduplicated
  allergies: string[];           // longitudinal, deduplicated
  medications: string[];         // longitudinal, deduplicated
}

const EDUKASI_PREFIX = "[Edukasi Pasien]";
const EDUKASI_STRIP = "[Edukasi Pasien]: ";

function hasAnyVital(o: any): boolean {
  return (
    o.systolic != null ||
    o.diastolic != null ||
    o.heartRate != null ||
    o.temperature != null ||
    o.respiratoryRate != null ||
    o.weight != null ||
    o.height != null ||
    o.bmi != null
  );
}

function dedupeStrings(values: (string | null | undefined)[]): string[] {
  const cleaned = values
    .map((v) => (v ?? "").trim())
    .filter((v) => v.length > 0);
  return cleaned.filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Builds the Ringkasan tab payload.
 * EPISODIC: snapshot of the most recent SELESAI encounter only.
 * LONGITUDINAL: deduplicated patient-scoped history (ConditionHistory,
 * AllergyIntolerance, MedicationStatement) — NOT aggregated per-encounter,
 * because those tables carry patientId, not encounterId.
 */
export function mapRingkasanData(prismaPatient: any): RingkasanData {
  const encounters: any[] = prismaPatient?.encounters || [];

  // encounters arrive ordered periodStart desc; preserve order after filter.
  const selesai = encounters.filter((e) => e.status === "SELESAI");
  const latest = selesai[0] || null;

  let episodic: EpisodicData | null = null;
  if (latest) {
    const observations: any[] = latest.observations || [];
    const vitalsObs = observations.find(hasAnyVital) || null;
    const noteObs =
      observations.find(
        (o) => o.notes && !String(o.notes).startsWith(EDUKASI_PREFIX)
      ) || null;

    let vitals: EpisodicVitals | null = null;
    if (vitalsObs) {
      let bmi: number | null = vitalsObs.bmi ?? null;
      if (bmi == null && vitalsObs.weight && vitalsObs.height) {
        const meters = Number(vitalsObs.height) / 100;
        bmi = Number((Number(vitalsObs.weight) / (meters * meters)).toFixed(1));
      }
      vitals = {
        systolic: vitalsObs.systolic ?? null,
        diastolic: vitalsObs.diastolic ?? null,
        heartRate: vitalsObs.heartRate ?? null,
        temperature: vitalsObs.temperature ?? null,
        respiratoryRate: vitalsObs.respiratoryRate ?? null,
        weight: vitalsObs.weight ?? null,
        height: vitalsObs.height ?? null,
        bmi,
      };
    }

    const diagnoses: EpisodicDiagnosis[] = (latest.conditionDiagnoses || [])
      .map((d: any) => ({
        code: d.codeIcd10 || "",
        display: d.display || "",
        isPrimary: d.isPrimary === true,
      }))
      // primary first
      .sort((a: EpisodicDiagnosis, b: EpisodicDiagnosis) =>
        a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
      );

    const eduObs = observations.find(
      (o) => o.notes && String(o.notes).startsWith(EDUKASI_PREFIX)
    );
    const education = eduObs?.notes
      ? String(eduObs.notes).startsWith(EDUKASI_STRIP)
        ? String(eduObs.notes).slice(EDUKASI_STRIP.length).trim() || null
        : String(eduObs.notes).slice(EDUKASI_PREFIX.length).replace(/^:\s*/, "").trim() || null
      : null;

    const procedures: EpisodicProcedure[] = (latest.procedures || []).map(
      (p: any) => ({ code: p.codeIcd9 ?? null, display: p.display || "" })
    );

    const episodicMeds: EpisodicMedication[] = (latest.medicationRequests || []).map(
      (m: any) => ({ name: m.medication || "", dosage: m.dosage ?? null })
    );

    episodic = {
      encounterDate: latest.periodStart || latest.createdAt || null,
      diagnoses,
      vitals,
      clinicalNote: noteObs?.notes || null,
      practitionerName: latest.practitioner?.name || null,
      procedures,
      medications: episodicMeds,
      education,
    };
  }

  return {
    episodic,
    pastConditions: dedupeStrings(
      (prismaPatient?.conditionHistories || []).map((c: any) => c.description)
    ),
    allergies: dedupeStrings(
      (prismaPatient?.allergyIntolerances || []).map((a: any) => a.description)
    ),
    medications: dedupeStrings(
      (prismaPatient?.medicationStatements || []).map((m: any) => m.description)
    ),
  };
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
