"use server";

import { auth } from "@/lib/auth";
import { generateQueueNumber, type PolicyType } from "@/lib/queue-utils";

export type GenerateQueueResult =
  | { success: true; queueNumber: string }
  | { success: false; error: string };

export async function generateQueueAction(
  policyType: PolicyType
): Promise<GenerateQueueResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }
  if (!["ADMIN", "PENDAFTARAN"].includes(session.user.role ?? "")) {
    return { success: false, error: "Forbidden: insufficient role" };
  }

  try {
    const queueNumber = await generateQueueNumber(policyType);
    return { success: true, queueNumber };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghasilkan nomor antrean.";
    return { success: false, error: message };
  }
}
