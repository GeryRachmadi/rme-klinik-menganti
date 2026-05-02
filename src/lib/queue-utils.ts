import { prisma } from "@/lib/prisma";

export type PolicyType = "UMUM" | "GIGI";

const QUEUE_PREFIX: Record<PolicyType, string> = {
  UMUM: "U",
  GIGI: "G",
};

/**
 * Returns the numeric counter embedded in a queue number string.
 * "U-042" → 42, null/malformed → 0 (treated as "no queue exists yet").
 */
function extractCounter(queueNumber: string | null | undefined): number {
  if (!queueNumber) return 0;
  const n = parseInt(queueNumber.split("-")[1] ?? "", 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Generates the next queue number for today's date and the given policy type.
 *
 * Format: U-001 … U-999 (UMUM/Poli Umum) | G-001 … G-999 (GIGI/Poli Gigi)
 *
 * Race condition note: this function reads the current max and calculates the next
 * number within a transaction snapshot. The caller MUST wrap encounter creation in
 * a retry loop (max 3 attempts) catching Prisma P2002 on [queueNumber, queueDate],
 * consistent with the No.RM generation pattern in CLAUDE.md.
 *
 * @throws {Error} "Antrean penuh untuk hari ini" when counter would exceed 999.
 */
export async function generateQueueNumber(policyType: PolicyType): Promise<string> {
  const prefix = QUEUE_PREFIX[policyType];

  // Midnight UTC matches how Prisma serialises @db.Date values for PostgreSQL.
  // Note: this means the queue day rolls over at 07:00 WIB (UTC+7), not midnight
  // local time. Acceptable for a single-clinic MVP — revisit if operating hours
  // cross UTC midnight becomes an issue.
  const today = new Date(new Date().toISOString().split("T")[0]);

  try {
    return await prisma.$transaction(async (tx) => {
      // Find the highest queue number issued for this prefix today.
      // Zero-padded 3-digit format means lexicographic desc = numeric desc:
      // "U-099" < "U-100", so findFirst desc gives us the true max.
      const last = await tx.encounter.findFirst({
        where: {
          queueDate: today,
          queueNumber: { startsWith: `${prefix}-` },
        },
        orderBy: { queueNumber: "desc" },
        select: { queueNumber: true },
      });

      const next = extractCounter(last?.queueNumber) + 1;

      if (next > 999) {
        throw new Error("Antrean penuh untuk hari ini");
      }

      return `${prefix}-${next.toString().padStart(3, "0")}`;
    });
  } catch (error) {
    // Re-throw capacity errors directly so the caller can surface them to the UI
    if (error instanceof Error && error.message === "Antrean penuh untuk hari ini") {
      throw error;
    }
    console.error(`[generateQueueNumber] Failed for policyType=${policyType}:`, error);
    throw new Error("Gagal menghasilkan nomor antrean. Silakan coba lagi.");
  }
}
