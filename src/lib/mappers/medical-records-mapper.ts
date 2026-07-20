import { parseFamilyHistory, type FamilyHistory } from "@/lib/utils/family-history";
import { parseNursingAssessment, type NursingAssessment } from "@/lib/utils/nursing-assessment";
import { parseRacikanContainer } from "@/lib/utils/racikan-container";

export interface ClinicalSummary {
  latestVitals: any | null;
  primaryDiagnosis: any | null;
}

export interface MappedCondition {
  id: string;
  name: string;
  icd10: string;
  status: string;
  dateDiagnosed: Date | string | null;
  notes: string;
}

export interface MappedAllergy {
  id: string;
  allergen: string;
  severity: string;
  reaction: string;
  notes: string;
  dateDiscovered: Date | string | null;
}

export interface MappedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes: string;
  status: string;
  date: Date | string | null;
}

export interface MappedEncounter {
  date: Date | string | null;
  practitionerName: string;
  practitionerSpeciality: string | null;
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

// Discriminated medication display shape — distinguishes Non-Racikan (flat,
// dedicated columns are the source of truth) from Racikan (container JSON in
// `medication` is the source of truth; dedicated columns may be stale per the
// dual-write in the persistence loop).
export type MedicationDisplayItem =
  | {
      type: "non-racikan";
      namaObat: string;
      dosis: string | null;
      bentukSediaan: string | null;
      jumlah: number | null;
      aturanPakai: string | null;
      waktuKonsumsi: string | null;
    }
  | {
      type: "racikan";
      namaRacikan: string;
      bentukSediaan: string;
      jumlah: number;
      aturanPakai: string;
      waktuKonsumsi: string;
      ingredients: Array<{ namaObat: string; jumlah: number; bentukSediaan: string }>;
    }
  | { type: "tidak-ada" };

/**
 * Maps raw MedicationRequest rows into display-ready items. Non-Racikan rows
 * read their structured fields straight from the dedicated columns; Racikan
 * rows parse the JSON container stored in `medication` (the dedicated columns
 * are a redundant dual-write for racikan rows, so the JSON wins). Rows that
 * fail to parse are skipped rather than crashing the page — though
 * parseRacikanContainer's legacy-string fallback means this should be rare.
 */
function mapMedicationRequests(rows: any[]): MedicationDisplayItem[] {
  const items: MedicationDisplayItem[] = [];
  for (const m of rows) {
    if (!m.isRacikan && m.medication === "Tidak ada" && rows.length === 1) {
      items.push({ type: "tidak-ada" });
      continue;
    }
    if (!m.isRacikan) {
      items.push({
        type: "non-racikan",
        namaObat: m.medication || "",
        dosis: m.dosage ?? null,
        bentukSediaan: m.bentukRacikan ?? null,
        jumlah: m.jumlahRacikan ?? null,
        aturanPakai: m.aturanPakai ?? null,
        waktuKonsumsi: m.waktuKonsumsi ?? null,
      });
      continue;
    }

    const container = parseRacikanContainer(m.medication);
    if (!container) continue;
    items.push({
      type: "racikan",
      namaRacikan: container.namaRacikan,
      bentukSediaan: container.bentukSediaan,
      jumlah: container.jumlah,
      aturanPakai: container.aturanPakai,
      waktuKonsumsi: container.waktuKonsumsi,
      ingredients: container.ingredients,
    });
  }
  return items;
}

export interface EpisodicData {
  encounterDate: Date | string | null;
  keluhanAwal: string | null;        // Encounter.reasonCode (Keluhan Utama)
  patientType: string | null;        // Encounter.patientType ("UMUM" | "BPJS")
  diagnoses: EpisodicDiagnosis[];
  vitals: EpisodicVitals | null;
  clinicalNote: string | null;
  practitionerName: string | null;
  practitionerSpeciality: string | null;
  procedures: EpisodicProcedure[];   // Tindakan from latest encounter
  medications: MedicationDisplayItem[]; // Resep Obat from latest encounter
  education: string | null;          // Edukasi/Anjuran free text
  instruksiLab: string | null;       // Instruksi Lab / Penunjang Medis Eksternal
  referral: { tujuan: string; alasan: string | null } | null; // Rujukan (ServiceRequest) — kept for backward compat, superseded by rencanaPemulangan
  rencanaPemulangan: RencanaPemulanganDisplay | null;
}

export interface RingkasanData {
  episodic: EpisodicData | null; // last SELESAI visit snapshot
  pastConditions: string[];      // longitudinal, deduplicated
  allergies: string[];           // longitudinal, deduplicated
  medications: string[];         // longitudinal, deduplicated
}

const EDUKASI_PREFIX = "[Edukasi Pasien]";
const EDUKASI_STRIP = "[Edukasi Pasien]: ";

// Poli is encoded in the queue-number prefix: U-xxx = Umum, G-xxx = Gigi.
// Mirrors getPoliLabel in DashboardQueueTable.
function getPoliLabel(queueNumber: string | null | undefined): string {
  const p = (queueNumber ?? "").charAt(0).toUpperCase();
  if (p === "U") return "Poli Umum";
  if (p === "G") return "Poli Gigi";
  return "Kunjungan";
}

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

function dedupeById<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = (getKey(item) ?? "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Maps the Prisma DischargeDisposition enum to its Indonesian display label —
// mirrors the inverse mapping in the asesmen edit-form page and the enum
// mapping in the API route.
const DISCHARGE_DISPOSITION_DISPLAY_LABELS: Record<string, string> = {
  home: "Pulang",
  other_hcf: "Dirujuk ke Fasilitas Lain",
  aadvice: "Pulang Atas Permintaan Sendiri",
  exp: "Meninggal Dunia",
  oth: "Lain-lain",
};

export interface RencanaPemulanganDisplay {
  label: string;
  tujuanRujukan: string | null;
  alasanRujukan: string | null;
  dischargeReason: string | null;
}

/**
 * Builds the Rencana Pemulangan display shape for one encounter. Backward
 * compatible with pre-migration encounters that have a ServiceRequest row but
 * no dischargeDisposition set — those are treated as an implicit "Dirujuk ke
 * Fasilitas Lain" so their referral data keeps displaying under the new
 * unified card instead of silently disappearing.
 */
function mapRencanaPemulangan(enc: any): RencanaPemulanganDisplay | null {
  const sr = (enc.serviceRequests || [])[0] || null;
  if (enc.dischargeDisposition) {
    const label = DISCHARGE_DISPOSITION_DISPLAY_LABELS[enc.dischargeDisposition] ?? enc.dischargeDisposition;
    return {
      label,
      tujuanRujukan: sr?.intent ?? null,
      alasanRujukan: sr?.note ?? null,
      dischargeReason: enc.dischargeReason ?? null,
    };
  }
  if (sr) {
    return {
      label: "Dirujuk ke Fasilitas Lain",
      tujuanRujukan: sr.intent ?? null,
      alasanRujukan: sr.note ?? null,
      dischargeReason: null,
    };
  }
  return null;
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

    const episodicMeds: MedicationDisplayItem[] = mapMedicationRequests(
      latest.medicationRequests || []
    );

    // Rujukan — ServiceRequest stores tujuan in `intent`, alasan in `note`.
    const sr = (latest.serviceRequests || [])[0] || null;
    const referral = sr ? { tujuan: sr.intent || "", alasan: sr.note ?? null } : null;
    const rencanaPemulangan = mapRencanaPemulangan(latest);

    episodic = {
      encounterDate: latest.periodStart || latest.createdAt || null,
      keluhanAwal: latest.reasonCode || null,
      patientType: latest.patientType || null,
      diagnoses,
      vitals,
      clinicalNote: noteObs?.notes || null,
      practitionerName: latest.practitioner?.name || null,
      practitionerSpeciality: latest.practitioner?.speciality ?? null,
      procedures,
      medications: episodicMeds,
      education,
      instruksiLab: latest.instruksiLab ?? null,
      referral,
      rencanaPemulangan,
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

// ── Riwayat Kunjungan tab (vertical timeline of SELESAI encounters) ──
export interface TimelineEncounter {
  id: string;
  encounterDate: Date | string | null;
  practitionerName: string | null;
  practitionerSpeciality: string | null;
  poli: string; // derived from queueNumber prefix — "Poli Umum" | "Poli Gigi"
  status: string;
  keluhanAwal: string | null; // Encounter.reasonCode (Keluhan Utama from asesmen)
  vitals: EpisodicVitals | null;
  diagnoses: EpisodicDiagnosis[];
  primaryDiagnosisNote: string | null;
  procedures: EpisodicProcedure[];
  medications: MedicationDisplayItem[];
  education: string | null;
  instruksiLab: string | null;       // Instruksi Lab / Penunjang Medis Eksternal
  referral: { tujuan: string; alasan: string | null } | null; // ServiceRequest (Rujukan) — kept for backward compat, superseded by rencanaPemulangan
  rencanaPemulangan: RencanaPemulanganDisplay | null;
  // Asesmen Keperawatan (Item 14) — episodic per-visit nursing judgment, parsed
  // from Encounter.asesmenKeperawatan JSON. NOT a longitudinal "most recent wins"
  // summary; each card shows ITS OWN visit's nursing assessment.
  nursingAssessment: NursingAssessment | null;
}

/**
 * Builds the Riwayat Kunjungan timeline: one rich card per SELESAI or BATAL
 * encounter, newest first. BATAL encounters appear with a red badge for audit
 * trail; their clinical fields will be empty (no SOAP was recorded).
 */
export function mapEncounterTimeline(prismaPatient: any): TimelineEncounter[] {
  const encounters: any[] = prismaPatient?.encounters || [];

  const selesai = encounters
    .filter((e) => e.status === "SELESAI" || e.status === "BATAL")
    .sort((a, b) => {
      const da = a.periodStart || a.createdAt;
      const db = b.periodStart || b.createdAt;
      return new Date(db).getTime() - new Date(da).getTime();
    });

  return selesai.map((enc) => {
    const observations: any[] = enc.observations || [];
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

    const rawDiagnoses: any[] = enc.conditionDiagnoses || [];
    const diagnoses: EpisodicDiagnosis[] = rawDiagnoses
      .map((d) => ({
        code: d.codeIcd10 || "",
        display: d.display || "",
        isPrimary: d.isPrimary === true,
      }))
      // primary first
      .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

    const primaryRaw =
      rawDiagnoses.find((d) => d.isPrimary === true) || rawDiagnoses[0] || null;
    const primaryDiagnosisNote =
      (primaryRaw?.notes && String(primaryRaw.notes).trim()) ||
      (noteObs?.notes && String(noteObs.notes).trim()) ||
      null;

    const eduObs = observations.find(
      (o) => o.notes && String(o.notes).startsWith(EDUKASI_PREFIX)
    );
    const education = eduObs?.notes
      ? String(eduObs.notes).startsWith(EDUKASI_STRIP)
        ? String(eduObs.notes).slice(EDUKASI_STRIP.length).trim() || null
        : String(eduObs.notes).slice(EDUKASI_PREFIX.length).replace(/^:\s*/, "").trim() || null
      : null;

    const procedures: EpisodicProcedure[] = (enc.procedures || []).map(
      (p: any) => ({ code: p.codeIcd9 ?? null, display: p.display || "" })
    );

    const medications: MedicationDisplayItem[] = mapMedicationRequests(
      enc.medicationRequests || []
    );

    // Rujukan — ServiceRequest stores tujuan in `intent`, alasan in `note`.
    const sr = (enc.serviceRequests || [])[0] || null;
    const referral = sr ? { tujuan: sr.intent || "", alasan: sr.note ?? null } : null;
    const rencanaPemulangan = mapRencanaPemulangan(enc);

    const nursingAssessment = parseNursingAssessment(enc.asesmenKeperawatan);

    return {
      id: enc.id,
      encounterDate: enc.periodStart || enc.createdAt || null,
      practitionerName: enc.practitioner?.name || null,
      practitionerSpeciality: enc.practitioner?.speciality ?? null,
      poli: getPoliLabel(enc.queueNumber),
      status: enc.status || "",
      keluhanAwal: enc.reasonCode || null,
      vitals,
      diagnoses,
      primaryDiagnosisNote,
      procedures,
      medications,
      education,
      instruksiLab: enc.instruksiLab ?? null,
      referral,
      rencanaPemulangan,
      nursingAssessment,
    };
  });
}

export interface PatientMedicalRecordData {
  hasMedicalRecord: boolean;
  clinicalSummary: ClinicalSummary;
  conditions: MappedCondition[];
  allergies: MappedAllergy[];
  medications: MappedMedication[];
  encounters: MappedEncounter[];
  // Section-level Kajian Awal catatan from the most recent SELESAI encounter that
  // carries one. Shown below the longitudinal cards in each history tab (BB-08.17).
  conditionNote: string | null;
  conditionNoteDate: Date | string | null;
  allergyNote: string | null;
  allergyNoteDate: Date | string | null;
  medicationNote: string | null;
  medicationNoteDate: Date | string | null;
  // Riwayat Penyakit Keluarga (UAT Phase 2 Item 19) — most recent non-null value
  // across SELESAI encounters, parsed from its JSON string. Shown as a subsection
  // in the Riwayat Penyakit tab.
  familyHistory: FamilyHistory | null;
  familyHistoryDate: Date | string | null;
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

  const conditions: MappedCondition[] = dedupeById(
    (prismaPatient?.conditionHistories || []).map((c: any) => ({
      id: c.id || "",
      name: c.description || c.name || "",
      icd10: c.code || c.icd10 || "",
      status: c.clinicalStatus || c.status || "",
      dateDiagnosed: c.createdAt || c.dateDiagnosed || null,
      notes: c.notes || "",
    })),
    (item) => item.name
  );

  const allergies: MappedAllergy[] = dedupeById(
    (prismaPatient?.allergyIntolerances || []).map((a: any) => ({
      id: a.id || "",
      allergen: a.description || a.allergen || "",
      severity: a.reactionSeverity || a.severity || "",
      reaction: a.notes || a.reaction || "",
      notes: a.notes || "",
      dateDiscovered: a.createdAt || a.dateDiscovered || null,
    })),
    (item) => item.allergen
  );

  const medications: MappedMedication[] = dedupeById(
    (prismaPatient?.medicationStatements || []).map((m: any) => ({
      id: m.id || "",
      name: m.description || m.name || "",
      dosage: m.dosage || "",
      frequency: m.notes || m.frequency || "",
      notes: m.notes || "",
      status: m.clinicalStatus || m.status || "Active",
      date: m.createdAt || null,
    })),
    (item) => item.name
  );

  // Most-recent non-empty section note across SELESAI encounters (newest first).
  const selesaiDesc = sortedEncounters.filter((e: any) => e.status === "SELESAI");
  const conditionNoteEnc = selesaiDesc.find((e: any) => e.riwayatPenyakitNotes?.trim()) ?? null;
  const conditionNote = conditionNoteEnc?.riwayatPenyakitNotes ?? null;
  const conditionNoteDate = conditionNoteEnc?.periodStart ?? conditionNoteEnc?.createdAt ?? null;

  const allergyNoteEnc = selesaiDesc.find((e: any) => e.riwayatAlergiNotes?.trim()) ?? null;
  const allergyNote = allergyNoteEnc?.riwayatAlergiNotes ?? null;
  const allergyNoteDate = allergyNoteEnc?.periodStart ?? allergyNoteEnc?.createdAt ?? null;

  const medicationNoteEnc = selesaiDesc.find((e: any) => e.pengobatanRutinNotes?.trim()) ?? null;
  const medicationNote = medicationNoteEnc?.pengobatanRutinNotes ?? null;
  const medicationNoteDate = medicationNoteEnc?.periodStart ?? medicationNoteEnc?.createdAt ?? null;

  // Family history — most recent SELESAI encounter whose JSON parses to content.
  let familyHistory: FamilyHistory | null = null;
  let familyHistoryDate: Date | string | null = null;
  for (const e of selesaiDesc) {
    const parsed = parseFamilyHistory(e.riwayatPenyakitKeluarga);
    if (parsed) {
      familyHistory = parsed;
      familyHistoryDate = e.periodStart ?? e.createdAt ?? null;
      break;
    }
  }

  const mappedEncounters: MappedEncounter[] = sortedEncounters.map((e: any) => {
    const primaryDiag = e.conditionDiagnoses?.find(
      (d: any) => d.isPrimary === true
    );

    return {
      date: e.periodStart || e.createdAt || null,
      practitionerName: e.practitioner?.name || e.practitionerName || "",
      practitionerSpeciality: e.practitioner?.speciality ?? null,
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
    conditionNote,
    conditionNoteDate,
    allergyNote,
    allergyNoteDate,
    medicationNote,
    medicationNoteDate,
    familyHistory,
    familyHistoryDate,
  };
}
