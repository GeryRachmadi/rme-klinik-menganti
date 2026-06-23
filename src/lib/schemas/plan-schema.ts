import { z } from "zod";

// A single ingredient within a Racikan container — drug name and strength are
// separate fields since one drug name can map to multiple available strengths
// (Item 13 rebuild, Option A container/ingredient restructure).
const RacikanIngredientSchema = z.object({
  namaObat: z.string().trim().min(1, "Nama obat wajib diisi"),
  dosis: z.string().trim().min(1, "Dosis wajib diisi"),
});

// A single Racikan (compounded) prescription container. Every field is
// mandatory once a row exists, and at least one ingredient is required — an
// empty row is meaningless. Saved as its own MedicationRequest with
// isRacikan: true (Item 13).
export const RacikanContainerSchema = z.object({
  namaRacikan: z.string().trim().min(1, "Nama racikan wajib diisi"),
  bentukSediaan: z.string().trim().min(1, "Bentuk sediaan wajib dipilih"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  aturanPakai: z.string().trim().min(1, "Aturan pakai wajib diisi"),
  waktuKonsumsi: z.string().trim().min(1, "Waktu konsumsi wajib dipilih"),
  ingredients: z
    .array(RacikanIngredientSchema)
    .min(1, "Minimal 1 bahan racikan harus ditambahkan"),
});

// A single Non-Racikan (single-drug, non-compounded) prescription row — the
// same flat shape the old pre-rebuild Racikan row used, repurposed here since
// Non-Racikan items have no ingredients sub-array (Item 13 rebuild).
export const NonRacikanItemSchema = z.object({
  namaObat: z.string().trim().min(1, "Nama obat wajib diisi"),
  dosis: z.string().trim().min(1, "Dosis wajib diisi"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  bentukSediaan: z.string().trim().min(1, "Bentuk sediaan wajib dipilih"),
  aturanPakai: z.string().trim().min(1, "Aturan pakai wajib diisi"),
  waktuKonsumsi: z.string().trim().min(1, "Waktu konsumsi wajib dipilih"),
});

export type NonRacikanItem = z.infer<typeof NonRacikanItemSchema>;

// Resep Obat is a two-panel form (Item 13): a Non-Racikan structured-rows panel
// and a Racikan structured-rows panel. Both are optional at the field level —
// the central PlanFormSchema enforces "at least one of them is filled" (Item 8).
// Optional (not .default([])) so z.input === z.output and the react-hook-form
// resolver types line up cleanly; the form supplies [] as its defaultValue, so
// both arrays are always arrays at runtime. The parent PlanFormSchema's
// mandatory check uses `?.length ?? 0`, unaffected by undefined.
export const MedicationFormSchema = z.object({
  nonRacikanItems: z.array(NonRacikanItemSchema).optional(),
  racikanItems: z.array(RacikanContainerSchema).optional(),
});

export const EducationFormSchema = z.object({
  anjuranEdukasi: z.string().max(1000, "Maksimal 1000 karakter").optional(),
});

// Instruksi Lab / Penunjang Medis Eksternal (H2 Sev3) — mandatory, mirrors the
// Edukasi pattern. The field-level schema stays lenient; the central
// PlanFormSchema enforces the mandatory rule alongside Tindakan/Resep/Edukasi.
export const LabInstructionFormSchema = z.object({
  instruksiLab: z.string().max(1000, "Maksimal 1000 karakter").optional(),
});

export type MedicationFormValues = z.infer<typeof MedicationFormSchema>;
export type EducationFormValues = z.infer<typeof EducationFormSchema>;
export type LabInstructionFormValues = z.infer<typeof LabInstructionFormSchema>;

export const ReferralFormSchema = z.object({
  isActive: z.boolean(),
  tujuanRujukan: z.string().max(255).optional(),
  alasanRujukan: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // When the toggle is ON, both fields become mandatory. Errors are attached
  // per-field so each renders below its own input (BB-11.14).
  if (!data.isActive) return;
  if (!data.tujuanRujukan?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tujuanRujukan"], message: "Tujuan Rujukan wajib diisi" });
  }
  if (!data.alasanRujukan?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["alasanRujukan"], message: "Alasan Rujukan wajib diisi" });
  }
});

export type ReferralFormValues = z.infer<typeof ReferralFormSchema>;

// Root schema for the entire Plan section — Tindakan, Resep, and Edukasi are all
// mandatory (H5 Sev2, PIC request); Rujukan stays conditional on its toggle.
export const PlanFormSchema = z.object({
  procedure: z.object({
    procedures: z.array(z.any()).optional(),
    useManual: z.boolean().optional(),
    manualText: z.string().optional(),
    manualNote: z.string().optional(),
  }).optional(),
  medication: z.object({
    nonRacikanItems: z.array(z.any()).optional(),
    racikanItems: z.array(z.any()).optional(),
  }).optional(),
  edukasi: z.object({
    anjuranEdukasi: z.string().optional(),
  }).optional(),
  labInstruction: z.object({
    instruksiLab: z.string().optional(),
  }).optional(),
  rujukan: z.object({
    isActive: z.boolean().optional(),
    tujuanRujukan: z.string().optional(),
    alasanRujukan: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  // H5 Sev2 (PIC request): Tindakan, Resep, and Edukasi are ALL mandatory — a
  // blank field is no longer accepted (the doctor must e.g. write "Tidak ada obat"
  // rather than leave Resep empty). Issues are attached per-field so each renders
  // below its own input. Manual tindakan entries live inside `procedures`
  // (codeIcd9: "MANUAL"), so procedures.length is the single source of truth.
  if (!(Array.isArray(data.procedure?.procedures) && data.procedure.procedures.length > 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["procedure", "procedures"], message: "Tindakan Medis wajib diisi" });
  }
  // Resep Obat is satisfied by EITHER panel: at least one non-racikan row OR at
  // least one racikan row (Item 13 redefinition of Item 8's mandatory rule).
  // Same message + path as before so the error still renders under the Resep panel.
  const hasNonRacikan = (data.medication?.nonRacikanItems?.length ?? 0) > 0;
  const hasRacikan = (data.medication?.racikanItems?.length ?? 0) > 0;
  if (!hasNonRacikan && !hasRacikan) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["medication", "nonRacikanItems"], message: "Resep Obat wajib diisi" });
  }
  if (!data.edukasi?.anjuranEdukasi?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["edukasi", "anjuranEdukasi"], message: "Edukasi / Anjuran wajib diisi" });
  }
  // Instruksi Lab is a permanent, mandatory Plan fixture (H2 Sev3): the doctor
  // must explicitly type something (even "-" / "Tidak ada") — never blank.
  if (!data.labInstruction?.instruksiLab?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["labInstruction", "instruksiLab"], message: "Instruksi Lab wajib diisi" });
  }
}).superRefine((data, ctx) => {
  // Conditional Rujukan rule: if the referral toggle is ON, Tujuan and Alasan
  // are mandatory — blocks saving an empty ServiceRequest (BB-11.14).
  if (data.rujukan?.isActive !== true) return;
  if (!data.rujukan.tujuanRujukan?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rujukan", "tujuanRujukan"], message: "Tujuan Rujukan wajib diisi" });
  }
  if (!data.rujukan.alasanRujukan?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rujukan", "alasanRujukan"], message: "Alasan Rujukan wajib diisi" });
  }
});

export type PlanFormData = z.infer<typeof PlanFormSchema>;
