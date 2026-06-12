import { VITAL_BOUNDS } from '../constants/assessment-validation';
import type { PhysicalExamData } from '../schemas/physical-exam-schema';

export function isWithinBounds(
  fieldName: string,
  value: string | number | undefined
): boolean {
  // Allow empty values
  if (value == null || value === '') {
    return true;
  }

  if (fieldName === 'tekananDarah') {
    if (typeof value !== 'string') return false;
    
    // Parse string "130/85" → extract systolic and diastolic
    const match = value.match(/^(\d{1,3})\/(\d{1,3})$/);
    if (!match) return false;

    const systolic = parseInt(match[1], 10);
    const diastolic = parseInt(match[2], 10);

    const bounds = (VITAL_BOUNDS as Record<string, any>).tekananDarah;
    if (!bounds) return true;

    const [minSys, minDias] = bounds.min.split('/').map(Number);
    const [maxSys, maxDias] = bounds.max.split('/').map(Number);

    return (
      systolic >= minSys &&
      systolic <= maxSys &&
      diastolic >= minDias &&
      diastolic <= maxDias
    );
  }

  const bounds = (VITAL_BOUNDS as Record<string, any>)[fieldName];
  // If fieldName not found in VITAL_BOUNDS → return true (unknown field allowed)
  if (!bounds) return true;

  const numValue = typeof value === 'string' ? Number(value) : value;
  if (isNaN(numValue)) return false;

  return numValue >= bounds.min && numValue <= bounds.max;
}

export function getOutOfBoundsFields(data: PhysicalExamData): string[] {
  const outOfBoundsFields: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (!isWithinBounds(key, value as string | number | undefined)) {
      outOfBoundsFields.push(key);
    }
  }

  return outOfBoundsFields;
}
