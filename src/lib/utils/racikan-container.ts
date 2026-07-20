// Racikan (compounded prescription) container — UAT Phase 2 Item 13 rebuild
// (Option A). Each Racikan row is a CONTAINER (bentuk sediaan, jumlah, aturan
// pakai, waktu konsumsi) holding a sub-array of INGREDIENTS, each with its own
// namaObat + dosis. The whole container serializes to a single JSON string
// stored in one MedicationRequest.medication row (isRacikan: true) — mirrors
// the exact serialize/parse pattern used by nursing-assessment.ts and
// family-history.ts.

export interface RacikanIngredient {
  namaObat: string;
  jumlah: number;
  bentukSediaan: string;
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

// Legacy ingredient shape, saved before the jumlah/bentukSediaan rename —
// `dosis` was a free-text string (originally meant as quantity, sometimes
// containing non-numeric dosage text like "500mg"), and no dosage-form field
// existed at the ingredient level at all. `jumlah` itself used to be a string
// too, before it was made number-only.
interface LegacyRacikanIngredient {
  namaObat: string;
  dosis?: string;
  jumlah?: string | number;
  bentukSediaan?: string;
}

/**
 * Normalizes one parsed ingredient to the current shape — reads `jumlah` if
 * present, else falls back to the old `dosis` key; both may be pre-numeric
 * legacy strings (possibly non-numeric, e.g. "500mg"), so anything that
 * doesn't parse to a positive integer becomes 0 rather than crashing the
 * page. Defaults `bentukSediaan` to "-" when absent so pre-rename records
 * display without crashing.
 */
function normalizeIngredient(raw: LegacyRacikanIngredient): RacikanIngredient {
  const rawJumlah = raw.jumlah ?? raw.dosis;
  const parsedJumlah = typeof rawJumlah === "number" ? rawJumlah : parseInt(String(rawJumlah ?? ""), 10);
  return {
    namaObat: raw.namaObat ?? "",
    jumlah: Number.isInteger(parsedJumlah) && parsedJumlah > 0 ? parsedJumlah : 0,
    bentukSediaan: raw.bentukSediaan ?? "-",
  };
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
      return {
        ...parsed,
        ingredients: parsed.ingredients.map(normalizeIngredient),
      } as RacikanContainer;
    }
    return null;
  } catch {
    // Legacy non-JSON string (an even older flat racikan row from before the
    // container/ingredient rebuild) — treat as a single unnamed ingredient so
    // old data doesn't silently disappear.
    return {
      namaRacikan: "",
      bentukSediaan: "",
      jumlah: 1,
      aturanPakai: "",
      waktuKonsumsi: "",
      ingredients: [{ namaObat: raw, jumlah: 0, bentukSediaan: "-" }],
    };
  }
}
