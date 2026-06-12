import { z } from "zod";

// Both fields are optional — doctor can submit without filling them.
export const MedicationFormSchema = z.object({
  medicationText: z.string().max(1000, "Maksimal 1000 karakter").optional(),
});

export const EducationFormSchema = z.object({
  anjuranEdukasi: z.string().max(1000, "Maksimal 1000 karakter").optional(),
});

export type MedicationFormValues = z.infer<typeof MedicationFormSchema>;
export type EducationFormValues = z.infer<typeof EducationFormSchema>;

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
    medicationText: z.string().optional(),
  }).optional(),
  edukasi: z.object({
    anjuranEdukasi: z.string().optional(),
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
  if (!data.medication?.medicationText?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["medication", "medicationText"], message: "Resep Obat wajib diisi" });
  }
  if (!data.edukasi?.anjuranEdukasi?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["edukasi", "anjuranEdukasi"], message: "Edukasi / Anjuran wajib diisi" });
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
