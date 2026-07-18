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
  tidakAdaResep: z.boolean().optional(),
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

// Rencana Pemulangan (Discharge Disposition) — replaces the standalone Rujukan
// toggle with SATUSEHAT's 5-option Encounter.hospitalization.dischargeDisposition
// vocabulary. "Dirujuk ke Fasilitas Lain" reuses the existing ServiceRequest-backed
// Tujuan/Alasan fields; "Lain-lain" uses a new free-text dischargeReason instead —
// ServiceRequest stays reserved for genuine referrals so /rekam-medis's "Rujukan"
// display never mislabels a non-referral discharge.
export const DISCHARGE_DISPOSITION_OPTIONS = [
  "Pulang",
  "Dirujuk ke Fasilitas Lain",
  "Pulang Atas Permintaan Sendiri",
  "Meninggal Dunia",
  "Lain-lain",
] as const;

export type DischargeDispositionLabel = typeof DISCHARGE_DISPOSITION_OPTIONS[number];

export const DischargeDispositionFormSchema = z.object({
  // Spread into a mutable array — z.enum's typings in this project's zod
  // version want string[], not the readonly tuple DISCHARGE_DISPOSITION_OPTIONS
  // is declared as (same reason SearchableSelect's `options` prop is spread below).
  label: z.enum([...DISCHARGE_DISPOSITION_OPTIONS]).optional().or(z.literal("")),
  tujuanRujukan: z.string().max(255).optional(),
  alasanRujukan: z.string().max(500).optional(),
  dischargeReason: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // Mirrors ReferralFormSchema's conditional-required pattern: when "Dirujuk ke
  // Fasilitas Lain" is selected, Tujuan and Alasan become mandatory.
  if (data.label === "Dirujuk ke Fasilitas Lain") {
    if (!data.tujuanRujukan?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tujuanRujukan"], message: "Tujuan Rujukan wajib diisi" });
    }
    if (!data.alasanRujukan?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["alasanRujukan"], message: "Alasan Rujukan wajib diisi" });
    }
  }
  // "Lain-lain" requires the free-text reason — the field this option exists for.
  if (data.label === "Lain-lain" && !data.dischargeReason?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dischargeReason"], message: "Keterangan wajib diisi" });
  }
});

export type DischargeDispositionFormValues = z.infer<typeof DischargeDispositionFormSchema>;

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
    tidakAdaResep: z.boolean().optional(),
  }).optional(),
  edukasi: z.object({
    anjuranEdukasi: z.string().optional(),
  }).optional(),
  labInstruction: z.object({
    instruksiLab: z.string().optional(),
  }).optional(),
  rencanaPemulangan: z.object({
    label: z.string().optional(),
    tujuanRujukan: z.string().optional(),
    alasanRujukan: z.string().optional(),
    dischargeReason: z.string().optional(),
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
  const tidakAdaResep = data.medication?.tidakAdaResep === true;
  if (!hasNonRacikan && !hasRacikan && !tidakAdaResep) {
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
  // Conditional Rencana Pemulangan rule: "Dirujuk" requires Tujuan + Alasan
  // (still gates ServiceRequest creation, BB-11.14); "Lain-lain" requires
  // dischargeReason. Mirrors DischargeDispositionFormSchema's own refine so the
  // client-side per-field form AND this central schema agree.
  const label = data.rencanaPemulangan?.label;
  if (label === "Dirujuk ke Fasilitas Lain") {
    if (!data.rencanaPemulangan?.tujuanRujukan?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rencanaPemulangan", "tujuanRujukan"], message: "Tujuan Rujukan wajib diisi" });
    }
    if (!data.rencanaPemulangan?.alasanRujukan?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rencanaPemulangan", "alasanRujukan"], message: "Alasan Rujukan wajib diisi" });
    }
  }
  if (label === "Lain-lain" && !data.rencanaPemulangan?.dischargeReason?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rencanaPemulangan", "dischargeReason"], message: "Keterangan wajib diisi" });
  }
});

export type PlanFormData = z.infer<typeof PlanFormSchema>;
