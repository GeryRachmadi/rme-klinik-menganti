// Format DoB as "15 Jan 1990". WIB (UTC+7) timezone prevents an off-by-one day
// for patients born near midnight UTC.
export function formatDob(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}
