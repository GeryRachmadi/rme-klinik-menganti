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
  isActive: z.boolean().default(false),
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
