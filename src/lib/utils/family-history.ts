// Riwayat Penyakit Keluarga (Family Medical History) — UAT Phase 2 Item 19.
//
// Unlike the other 3 Kajian Awal sections (Penyakit/Alergi/Obat) whose chips go
// to patient-scoped longitudinal tables and whose catatan goes to a dedicated
// Encounter note column, family history is episodic and collapses ENTIRELY into
// a single `Encounter.riwayatPenyakitKeluarga String?` field. We therefore
// serialize the three sub-inputs (chips + tidakAda + catatan) into one JSON
// string and parse it back on hydration/display. JSON is used (not a delimiter)
// so the free-text catatan can hold any character safely.
//
// This helper is the SINGLE source of truth for the format — all four call
// sites (nurse route, doctor route, asesmen hydration, rekam-medis mapper)
// must go through serialize/parse so the round-trip stays consistent.

export interface FamilyHistory {
  chips: string[];
  tidakAda: boolean;
  catatan: string;
}

/**
 * Collapse the family-history form inputs into a single JSON string for storage
 * on Encounter.riwayatPenyakitKeluarga. Returns `null` when the section is
 * entirely empty (no chips, not negated, no catatan) so the DB column stays
 * NULL — matching the "empty optional strings → null" project rule.
 */
export function serializeFamilyHistory(
  chips: unknown,
  tidakAda: unknown,
  catatan: unknown
): string | null {
  const cleanChips = Array.isArray(chips)
    ? Array.from(
        new Set(
          chips
            .map((c) => (typeof c === "string" ? c.trim() : ""))
            .filter((c) => c.length > 0)
        )
      )
    : [];
  const cleanCatatan = typeof catatan === "string" ? catatan.trim() : "";
  const cleanTidakAda = tidakAda === true;

  if (cleanChips.length === 0 && !cleanTidakAda && cleanCatatan.length === 0) {
    return null;
  }

  return JSON.stringify({
    chips: cleanChips,
    tidakAda: cleanTidakAda,
    catatan: cleanCatatan,
  });
}

/**
 * Parse a stored riwayatPenyakitKeluarga value back into structured form.
 * Returns `null` for empty/missing input. Falls back to treating a non-JSON
 * legacy string as a plain catatan, so older rows never crash the parser.
 */
export function parseFamilyHistory(raw: unknown): FamilyHistory | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const chips = Array.isArray(parsed.chips)
        ? parsed.chips.filter((c: unknown): c is string => typeof c === "string")
        : [];
      const catatan = typeof parsed.catatan === "string" ? parsed.catatan : "";
      const tidakAda = parsed.tidakAda === true;
      if (chips.length === 0 && !tidakAda && catatan.trim().length === 0) {
        return null;
      }
      return { chips, tidakAda, catatan };
    }
  } catch {
    // Not JSON — treat the whole string as a free-text catatan (legacy safety).
  }

  return { chips: [], tidakAda: false, catatan: raw.trim() };
}
