import { ProcedureFormValues } from "../schemas/procedure-schema";

export const transformProcedurePayload = (data: ProcedureFormValues) => {
  if (!data.procedures || data.procedures.length === 0) {
    return [];
  }

  return data.procedures.map(item => ({
    codeCpt: item.codeCpt,
    display: item.display,
    notes: item.notes || ""
  }));
};
