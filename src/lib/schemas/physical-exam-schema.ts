import { z } from "zod"

// Tier 1 — Hard limits (physically impossible, always block via Zod)
const HARD_TD_SYS_MIN = 40
const HARD_TD_SYS_MAX = 300
const HARD_TD_DIAS_MIN = 20
const HARD_TD_DIAS_MAX = 200

export const PhysicalExamSchema = z.object({
  tekananDarah: z
    .string()
    .regex(/^\d{1,3}\/\d{1,3}$/, "Format: 130/85")
    .refine(
      (val) => {
        const [sys, dias] = val.split("/").map(Number)
        return (
          sys >= HARD_TD_SYS_MIN && sys <= HARD_TD_SYS_MAX &&
          dias >= HARD_TD_DIAS_MIN && dias <= HARD_TD_DIAS_MAX
        )
      },
      { message: `Tekanan Darah harus antara ${HARD_TD_SYS_MIN}/${HARD_TD_DIAS_MIN} - ${HARD_TD_SYS_MAX}/${HARD_TD_DIAS_MAX}` }
    ),

  suhu: z
    .coerce.number()
    .min(25, "Suhu minimal 25°C")
    .max(50, "Suhu maksimal 50°C"),

  nadi: z
    .coerce.number()
    .min(10, "Nadi minimal 10 bpm")
    .max(300, "Nadi maksimal 300 bpm"),

  napas: z
    .coerce.number()
    .min(1, "Napas minimal 1 x/min")
    .max(80, "Napas maksimal 80 x/min"),

  // Optional — fill only when measured
  tinggiBadan: z.preprocess(
    (val) => (val === '' || val == null) ? undefined : Number(val),
    z.number()
      .min(30, "Tinggi badan minimal 30 cm")
      .max(250, "Tinggi badan maksimal 250 cm")
      .optional()
  ),

  beratBadan: z.preprocess(
    (val) => (val === '' || val == null) ? undefined : Number(val),
    z.number()
      .min(1, "Berat badan minimal 1 kg")
      .max(300, "Berat badan maksimal 300 kg")
      .optional()
  ),

  bmi: z.number().optional(),

  catatan: z.string().optional(),
})

export type PhysicalExamData = z.infer<typeof PhysicalExamSchema>
