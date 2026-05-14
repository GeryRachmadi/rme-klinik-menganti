import { z } from "zod"
import { VITAL_BOUNDS } from "@/lib/constants/assessment-validation"

export const PhysicalExamSchema = z.object({
  tekananDarah: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "Format: 130/85")
    .refine(
      (val) => {
        // Parse BP and check bounds
        const [sys, dias] = val.split("/").map(Number)
        const [minSys, minDias] = VITAL_BOUNDS.tekananDarah.min
          .split("/")
          .map(Number)
        const [maxSys, maxDias] = VITAL_BOUNDS.tekananDarah.max
          .split("/")
          .map(Number)
        return (
          sys >= minSys && sys <= maxSys &&
          dias >= minDias && dias <= maxDias
        )
      },
      {
        message: `Tekanan Darah harus antara ${VITAL_BOUNDS.tekananDarah.min} - ${VITAL_BOUNDS.tekananDarah.max}`
      }
    ),
  
  suhu: z
    .coerce.number()
    .min(VITAL_BOUNDS.suhu.min, `Suhu minimal ${VITAL_BOUNDS.suhu.min}°C`)
    .max(VITAL_BOUNDS.suhu.max, `Suhu maksimal ${VITAL_BOUNDS.suhu.max}°C`),

  nadi: z
    .coerce.number()
    .min(VITAL_BOUNDS.nadi.min, `Nadi minimal ${VITAL_BOUNDS.nadi.min} bpm`)
    .max(VITAL_BOUNDS.nadi.max, `Nadi maksimal ${VITAL_BOUNDS.nadi.max} bpm`),

  napas: z
    .coerce.number()
    .min(VITAL_BOUNDS.napas.min, `Napas minimal ${VITAL_BOUNDS.napas.min} x/min`)
    .max(VITAL_BOUNDS.napas.max, `Napas maksimal ${VITAL_BOUNDS.napas.max} x/min`),

  tinggiBadan: z
    .coerce.number()
    .min(VITAL_BOUNDS.tinggiBadan.min, `Tinggi badan minimal ${VITAL_BOUNDS.tinggiBadan.min} cm`)
    .max(VITAL_BOUNDS.tinggiBadan.max, `Tinggi badan maksimal ${VITAL_BOUNDS.tinggiBadan.max} cm`),

  beratBadan: z
    .coerce.number()
    .min(VITAL_BOUNDS.beratBadan.min, `Berat badan minimal ${VITAL_BOUNDS.beratBadan.min} kg`)
    .max(VITAL_BOUNDS.beratBadan.max, `Berat badan maksimal ${VITAL_BOUNDS.beratBadan.max} kg`),
  
  bmi: z.number().optional(),
  
  catatan: z.string().optional()
})

export type PhysicalExamData = z.infer<typeof PhysicalExamSchema>
