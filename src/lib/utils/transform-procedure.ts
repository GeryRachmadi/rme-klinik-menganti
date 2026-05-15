import { ProcedureFormValues } from "../schemas/procedure-schema";

export const transformProcedurePayload = (data: ProcedureFormValues) => {
  if (!data.useManual && !data.codeIcd9) return null; // No procedure entered

  if (data.useManual) {
    return {
      codeIcd9: "MANUAL",
      display: data.manualText || "",
      notes: data.notes || ""
    };
  }

  return {
    codeIcd9: data.codeIcd9 || "",
    display: data.display || "",
    notes: data.notes || ""
  };
};
