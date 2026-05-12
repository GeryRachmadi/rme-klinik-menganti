import { z } from 'zod';

// Basic HTML/script tag sanitization regex
const noHtmlRegex = /<[^>]*>?/gm;

export const HasilPeriksaSchema = z.object({
  keluhanUtama: z
    .string()
    .trim()
    .max(500, 'Keluhan utama maksimal 500 karakter')
    .refine((val) => !val || !noHtmlRegex.test(val), {
      message: 'Input tidak boleh mengandung tag HTML',
    })
    .optional(),
  
  pemeriksaanFisikTambahan: z
    .string()
    .trim()
    .max(500, 'Pemeriksaan fisik tambahan maksimal 500 karakter')
    .refine((val) => !val || !noHtmlRegex.test(val), {
      message: 'Input tidak boleh mengandung tag HTML',
    })
    .optional(),
});

// Infer type from schema
export type HasilPeriksaData = z.infer<typeof HasilPeriksaSchema>;
