// Practitioner.name no longer carries the dr./drg. title — derive it from
// speciality instead. Keeps a private copy of the speciality→poli map so this
// concern stays independent of EncounterRegistrationDrawer's filtering map.
const SPECIALITY_POLI_MAP: Record<string, string> = {
  umum: "UMUM",
  "poli umum": "UMUM",
  gigi: "GIGI",
  "poli gigi": "GIGI",
};

export function formatDoctorName(
  name: string | null | undefined,
  speciality: string | null | undefined
): string {
  if (!name) return "";
  const poli = SPECIALITY_POLI_MAP[speciality?.toLowerCase().trim() ?? ""];
  if (poli === "GIGI") return `drg. ${name}`;
  if (poli === "UMUM") return `dr. ${name}`;
  return name;
}
