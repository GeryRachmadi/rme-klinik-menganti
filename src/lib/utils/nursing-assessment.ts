// Asesmen Keperawatan (Nursing Assessment) — UAT Phase 2 Item 14.
//
// The nurse's own clinical judgment: one or more SDKI nursing diagnoses plus an
// optional catatan. Like family history (Item 19), this is episodic and collapses
// ENTIRELY into a single `Encounter.asesmenKeperawatan String?` field. We serialize
// the diagnoses array + catatan into one JSON string and parse it back on
// hydration/display. JSON is used (not a delimiter) so the free-text catatan and
// the structured diagnosis objects round-trip safely.
//
// This helper is the SINGLE source of truth for the format — all call sites
// (nurse route, doctor route, asesmen hydration, rekam-medis mapper) must go
// through serialize/parse so the round-trip stays consistent. Mirrors
// family-history.ts exactly, minus the negation (`tidakAda`) flag — Asesmen
// Keperawatan is mandatory and has no "Tidak Ada" escape hatch.

export interface NursingDiagnosisItem {
  code: string;
  display: string;
  category: string;
}

export interface NursingAssessment {
  diagnoses: NursingDiagnosisItem[];
  catatan: string;
}

/**
 * Collapse the nursing-assessment inputs into a single JSON string for storage on
 * Encounter.asesmenKeperawatan. Returns `null` when the section is entirely empty
 * (no diagnoses, no catatan) so the DB column stays NULL — matching the "empty
 * optional strings → null" project rule.
 */
export function serializeNursingAssessment(
  diagnoses: unknown,
  catatan: unknown
): string | null {
  const cleanDiagnoses = Array.isArray(diagnoses)
    ? diagnoses
        .map((d) => {
          if (!d || typeof d !== "object") return null;
          const item = d as Record<string, unknown>;
          const code = typeof item.code === "string" ? item.code.trim() : "";
          const display = typeof item.display === "string" ? item.display.trim() : "";
          const category = typeof item.category === "string" ? item.category.trim() : "";
          if (!display) return null;
          return { code: code || "MANUAL", display, category: category || "Manual" };
        })
        .filter((d): d is NursingDiagnosisItem => d !== null)
    : [];
  const cleanCatatan = typeof catatan === "string" ? catatan.trim() : "";

  if (cleanDiagnoses.length === 0 && cleanCatatan.length === 0) {
    return null;
  }

  return JSON.stringify({
    diagnoses: cleanDiagnoses,
    catatan: cleanCatatan,
  });
}

/**
 * Parse a stored asesmenKeperawatan value back into structured form. Returns
 * `null` for empty/missing input. Falls back to treating a non-JSON legacy string
 * as a plain catatan, so older rows never crash the parser.
 */
export function parseNursingAssessment(raw: unknown): NursingAssessment | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const diagnoses = Array.isArray(parsed.diagnoses)
        ? parsed.diagnoses
            .map((d: unknown) => {
              if (!d || typeof d !== "object") return null;
              const item = d as Record<string, unknown>;
              const code = typeof item.code === "string" ? item.code : "";
              const display = typeof item.display === "string" ? item.display : "";
              const category = typeof item.category === "string" ? item.category : "";
              if (!display) return null;
              return { code: code || "MANUAL", display, category: category || "Manual" };
            })
            .filter((d: NursingDiagnosisItem | null): d is NursingDiagnosisItem => d !== null)
        : [];
      const catatan = typeof parsed.catatan === "string" ? parsed.catatan : "";
      if (diagnoses.length === 0 && catatan.trim().length === 0) {
        return null;
      }
      return { diagnoses, catatan };
    }
  } catch {
    // Not JSON — treat the whole string as a free-text catatan (legacy safety).
  }

  return { diagnoses: [], catatan: raw.trim() };
}
