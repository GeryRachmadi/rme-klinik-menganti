import { prisma } from "@/lib/prisma";

export function writeActivityLog(
  accountId: string,
  type: string,
  desc: string,
  detail?: string
): void {
  const action = JSON.stringify({ type, desc, ...(detail ? { detail } : {}) });
  prisma.activityLog
    .create({ data: { action, status: "SUCCESS", accountId } })
    .catch((err) => console.error("[ActivityLog] Failed to write:", err));
}
