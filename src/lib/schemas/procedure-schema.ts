import { z } from "zod";

export const ProcedureItemSchema = z.object({
  codeIcd9: z.string(),
  display: z.string(),
  notes: z.string().optional()
});

export const ProcedureFormSchema = z.object({
  procedures: z.array(ProcedureItemSchema).default([]),
  useManual: z.boolean().default(false),
  manualText: z.string().optional(),
  manualNote: z.string().optional()
});

export type ProcedureFormValues = z.infer<typeof ProcedureFormSchema>;
export type ProcedureItem = z.infer<typeof ProcedureItemSchema>;
