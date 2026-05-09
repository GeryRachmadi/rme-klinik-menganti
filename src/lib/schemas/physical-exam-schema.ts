import { z } from 'zod';

// Stub schema — bounds validation added in TR-62/63
const numericField = z.union([z.number(), z.literal('')]).optional();

export const physicalExamSchema = z.object({
  tekananDarah: z.string().optional(),
  suhu:         numericField,
  nadi:         numericField,
  napas:        numericField,
  tinggiBadan:  numericField,
  beratBadan:   numericField,
  bmi:          z.number().optional(),
  catatan:      z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

export type PhysicalExamData = z.infer<typeof physicalExamSchema>;
