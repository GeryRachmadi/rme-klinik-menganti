export function formatJenisKelamin(value: string | null | undefined): string {
  if (!value) return "-";
  if (value === "LAKI_LAKI") return "Laki-laki";
  if (value === "PEREMPUAN") return "Perempuan";
  return value;
}
