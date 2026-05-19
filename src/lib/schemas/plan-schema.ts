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
}).refine(
  (data) => {
    if (data.isActive) {
      return !!data.tujuanRujukan?.trim() && !!data.alasanRujukan?.trim();
    }
    return true;
  },
  { message: "Tujuan dan alasan rujukan wajib diisi jika rujukan diaktifkan", path: ["tujuanRujukan"] }
);

export type ReferralFormValues = z.infer<typeof ReferralFormSchema>;

// Root schema for the entire Plan section — at least one subsection must have content
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
}).refine(
  (data) => {
    const hasProcedure = Array.isArray(data.procedure?.procedures) && data.procedure.procedures.length > 0;
    const hasManualProcedure = data.procedure?.useManual === true && !!data.procedure?.manualText?.trim();
    const hasMedication = !!data.medication?.medicationText?.trim();
    const hasEdukasi = !!data.edukasi?.anjuranEdukasi?.trim();
    const hasRujukan = data.rujukan?.isActive === true;
    return hasProcedure || hasManualProcedure || hasMedication || hasEdukasi || hasRujukan;
  },
  { message: "Data Rencana Asesmen belum lengkap. Silakan isi minimal satu dari: Tindakan, Resep, Rujukan, atau Edukasi." }
);

export type PlanFormData = z.infer<typeof PlanFormSchema>;
