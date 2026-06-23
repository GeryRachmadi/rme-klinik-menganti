import { z } from "zod";

export const encounterRegistrationSchema = z.object({
  policyType: z.enum(["UMUM", "GIGI"], {
    error: "Poli Tujuan wajib dipilih."
  }),
  practitionerId: z.string().min(1, "Dokter wajib dipilih."),
  perawatId: z.string().min(1, "Perawat wajib dipilih."),
  priority: z.enum(["STABIL", "CUKUP_BERISIKO", "BERISIKO", "BERISIKO_TINGGI"], {
    error: "Prioritas wajib dipilih."
  }),
  patientType: z.enum(["UMUM", "BPJS"], {
    error: "Jenis Pasien wajib dipilih."
  }),
  reasonCode: z.string()
    .trim()
    .min(1, "Keluhan Utama wajib diisi.")
    .max(500, "Keluhan Utama maksimal 500 karakter."),
}).strict();

export type EncounterRegistrationFormData = z.infer<typeof encounterRegistrationSchema>;
