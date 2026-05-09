export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export interface BMIStatus {
  status: string;
}

export function getBMIStatus(bmi: number): BMIStatus {
  if (bmi < 18.5) return { status: 'Berat badan kurang' };
  if (bmi < 25)   return { status: 'Normal' };
  if (bmi < 30)   return { status: 'Berat badan lebih' };
  return           { status: 'Obesitas' };
}
