// Racikan (compounded prescription) container — UAT Phase 2 Item 13 rebuild
// (Option A). Each Racikan row is a CONTAINER (bentuk sediaan, jumlah, aturan
// pakai, waktu konsumsi) holding a sub-array of INGREDIENTS, each with its own
// namaObat + dosis. The whole container serializes to a single JSON string
// stored in one MedicationRequest.medication row (isRacikan: true) — mirrors
// the exact serialize/parse pattern used by nursing-assessment.ts and
// family-history.ts.

export interface RacikanIngredient {
  namaObat: string;
  dosis: string;
}

export interface RacikanContainer {
  namaRacikan: string;
  bentukSediaan: string;
  jumlah: number;
  aturanPakai: string;
  waktuKonsumsi: string;
  ingredients: RacikanIngredient[];
}

/**
 * Serialize a Racikan container into a single JSON string for storage on
 * MedicationRequest.medication.
 */
export function serializeRacikanContainer(container: RacikanContainer): string {
  return JSON.stringify(container);
}

/**
 * Parse a stored Racikan container value back into structured form. Returns
 * `null` for empty/missing input. Falls back to treating a non-JSON legacy
 * string (an old flat racikan row from before this rebuild) as a single
 * unnamed ingredient, so old data doesn't silently disappear.
 */
export function parseRacikanContainer(
  raw: string | null | undefined
): RacikanContainer | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.ingredients)) {
      return parsed as RacikanContainer;
    }
    return null;
  } catch {
    // Legacy non-JSON string (old flat racikan row from before this rebuild)
    // — treat as a single unnamed ingredient so old data doesn't silently
    // disappear.
    return {
      namaRacikan: "",
      bentukSediaan: "",
      jumlah: 1,
      aturanPakai: "",
      waktuKonsumsi: "",
      ingredients: [{ namaObat: raw, dosis: "" }],
    };
  }
}
