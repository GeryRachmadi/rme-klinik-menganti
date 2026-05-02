"use server";

import { generateQueueNumber, type PolicyType } from "@/lib/queue-utils";

export type GenerateQueueResult =
  | { success: true; queueNumber: string }
  | { success: false; error: string };

export async function generateQueueAction(
  policyType: PolicyType
): Promise<GenerateQueueResult> {
  try {
    const queueNumber = await generateQueueNumber(policyType);
    return { success: true, queueNumber };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghasilkan nomor antrean.";
    return { success: false, error: message };
  }
}
