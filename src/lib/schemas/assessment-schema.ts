import { z } from 'zod';
import { ERROR_MESSAGES } from '@/lib/constants/assessment-validation';

export const AssessmentSchema = z.object({
  penyakit: z.array(z.string()),
  tidakAdaPenyakit: z.boolean(),
  catatanPenyakit: z.string().max(500, ERROR_MESSAGES.catatanMax),

  alergi: z.array(z.string()),
  tidakAdaAlergi: z.boolean(),
  catatanAlergi: z.string().max(500, ERROR_MESSAGES.catatanMax),

  obat: z.array(z.string()),
  tidakAdaObat: z.boolean(),
  catatanObat: z.string().max(500, ERROR_MESSAGES.catatanMax),
}).superRefine((data, ctx) => {
  if (data.penyakit.length === 0 && !data.tidakAdaPenyakit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.penyakit,
      path: ['penyakit'],
    });
  }

  if (data.alergi.length === 0 && !data.tidakAdaAlergi) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.alergi,
      path: ['alergi'],
    });
  }

  if (data.obat.length === 0 && !data.tidakAdaObat) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.obat,
      path: ['obat'],
    });
  }
});

export type AssessmentFormValues = z.infer<typeof AssessmentSchema>;
