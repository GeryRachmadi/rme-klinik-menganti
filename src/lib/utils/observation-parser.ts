import { PhysicalExamData } from "@/lib/schemas/physical-exam-schema";
import { OBSERVATION_CODES } from "@/lib/constants/observation-codes";

export function parseTekananDarah(value: string): { systolic: number; diastolic: number } {
  if (!/^\d{2,3}\/\d{2,3}$/.test(value)) {
    throw new Error("Format tekanan darah tidak valid");
  }
  const [systolic, diastolic] = value.split("/").map(Number);
  if (isNaN(systolic) || isNaN(diastolic)) {
    throw new Error("Format tekanan darah tidak valid");
  }
  return { systolic, diastolic };
}

export function parsePhysicalExamData(
  data: PhysicalExamData
): {
  observations: Array<{
    fieldName: string;
    code: string;
    valueQuantity: number;
    valueUnit: string;
    valueString?: string;
  }>;
  metadata: {
    catatan?: string;
    userConfirmedOutOfBounds?: boolean;
  };
} {
  const observations: Array<{
    fieldName: string;
    code: string;
    valueQuantity: number;
    valueUnit: string;
    valueString?: string;
  }> = [];

  if (data.tekananDarah) {
    const { systolic, diastolic } = parseTekananDarah(data.tekananDarah);
    observations.push({
      fieldName: "Tekanan Darah Sistol",
      code: OBSERVATION_CODES["Tekanan Darah Sistol"].code,
      valueQuantity: systolic,
      valueUnit: OBSERVATION_CODES["Tekanan Darah Sistol"].unit,
    });
    observations.push({
      fieldName: "Tekanan Darah Diastol",
      code: OBSERVATION_CODES["Tekanan Darah Diastol"].code,
      valueQuantity: diastolic,
      valueUnit: OBSERVATION_CODES["Tekanan Darah Diastol"].unit,
    });
  }

  if (data.suhu !== undefined) {
    observations.push({
      fieldName: "Suhu Tubuh",
      code: OBSERVATION_CODES["Suhu Tubuh"].code,
      valueQuantity: data.suhu,
      valueUnit: OBSERVATION_CODES["Suhu Tubuh"].unit,
    });
  }

  if (data.nadi !== undefined) {
    observations.push({
      fieldName: "Denyut Nadi",
      code: OBSERVATION_CODES["Denyut Nadi"].code,
      valueQuantity: data.nadi,
      valueUnit: OBSERVATION_CODES["Denyut Nadi"].unit,
    });
  }

  if (data.napas !== undefined) {
    observations.push({
      fieldName: "Frekuensi Pernapasan",
      code: OBSERVATION_CODES["Frekuensi Pernapasan"].code,
      valueQuantity: data.napas,
      valueUnit: OBSERVATION_CODES["Frekuensi Pernapasan"].unit,
    });
  }

  if (data.tinggiBadan !== undefined) {
    observations.push({
      fieldName: "Tinggi Badan",
      code: OBSERVATION_CODES["Tinggi Badan"].code,
      valueQuantity: data.tinggiBadan,
      valueUnit: OBSERVATION_CODES["Tinggi Badan"].unit,
    });
  }

  if (data.beratBadan !== undefined) {
    observations.push({
      fieldName: "Berat Badan",
      code: OBSERVATION_CODES["Berat Badan"].code,
      valueQuantity: data.beratBadan,
      valueUnit: OBSERVATION_CODES["Berat Badan"].unit,
    });
  }

  if (data.bmi !== undefined) {
    observations.push({
      fieldName: "BMI",
      code: OBSERVATION_CODES["BMI"].code,
      valueQuantity: data.bmi,
      valueUnit: OBSERVATION_CODES["BMI"].unit,
    });
  }

  return {
    observations,
    metadata: {
      catatan: data.catatan,
      // Default to false, can be overridden when calling if needed,
      // but schema says `userConfirmedOutOfBounds?: boolean`
    },
  };
}
