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

  // Riwayat Penyakit Keluarga (UAT Phase 2 Item 19) — episodic chips stored as a
  // JSON string on Encounter.riwayatPenyakitKeluarga. Mirrors the other 3
  // sections' shape and mandatory one-of-three rule.
  keluarga: z.array(z.string()),
  tidakAdaKeluarga: z.boolean(),
  catatanKeluarga: z.string().max(500, ERROR_MESSAGES.catatanMax),
}).superRefine((data, ctx) => {
  // A section is valid if ANY ONE holds: has chips, OR negation checked,
  // OR has notes. Invalid only when all three are empty/false simultaneously —
  // notes are a first-class standalone input (BB-08.6).
  if (
    data.penyakit.length === 0 &&
    !data.tidakAdaPenyakit &&
    data.catatanPenyakit.trim().length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.penyakit,
      path: ['penyakit'],
    });
  }

  if (
    data.alergi.length === 0 &&
    !data.tidakAdaAlergi &&
    data.catatanAlergi.trim().length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.alergi,
      path: ['alergi'],
    });
  }

  if (
    data.obat.length === 0 &&
    !data.tidakAdaObat &&
    data.catatanObat.trim().length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.obat,
      path: ['obat'],
    });
  }

  if (
    data.keluarga.length === 0 &&
    !data.tidakAdaKeluarga &&
    data.catatanKeluarga.trim().length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ERROR_MESSAGES.keluarga,
      path: ['keluarga'],
    });
  }
});

export type AssessmentFormValues = z.infer<typeof AssessmentSchema>;
