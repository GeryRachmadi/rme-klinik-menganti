import { z } from 'zod';

export const AssessmentSchema = z.object({
  penyakit: z.array(z.string()),
  tidakAdaPenyakit: z.boolean(),
  catatanPenyakit: z.string().max(500, "Catatan maksimal 500 karakter"),

  alergi: z.array(z.string()),
  tidakAdaAlergi: z.boolean(),
  catatanAlergi: z.string().max(500, "Catatan maksimal 500 karakter"),

  obat: z.array(z.string()),
  tidakAdaObat: z.boolean(),
  catatanObat: z.string().max(500, "Catatan maksimal 500 karakter"),
}).superRefine((data, ctx) => {
  // RULE 1: Penyakit Mutual Exclusion
  if (data.penyakit.length === 0 && !data.tidakAdaPenyakit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mohon isi riwayat penyakit atau centang opsi 'Pasien menyangkal'",
      path: ["penyakit"],
    });
  }
  
  // RULE 2: Alergi Mutual Exclusion
  if (data.alergi.length === 0 && !data.tidakAdaAlergi) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mohon isi riwayat alergi atau centang opsi 'No Known Allergies (NKA)'",
      path: ["alergi"],
    });
  }

  // RULE 3: Obat Mutual Exclusion
  if (data.obat.length === 0 && !data.tidakAdaObat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mohon isi pengobatan rutin atau centang opsi 'Tidak ada pengobatan rutin'",
      path: ["obat"],
    });
  }
});

export type AssessmentFormValues = z.infer<typeof AssessmentSchema>;