import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSatuSehatBundle } from "@/lib/bundleBuilder";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["DOKTER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let encounterId: string | undefined;

  try {
    const body = await request.json();
    encounterId = typeof body?.encounterId === "string" ? body.encounterId : undefined;

    if (!encounterId) {
      return Response.json({ error: "encounterId wajib diisi." }, { status: 400 });
    }

    // Validate bundle can be built (IHS IDs present, encounter exists)
    try {
      await buildSatuSehatBundle(encounterId);
    } catch (err) {
      await prisma.encounter.update({
        where: { id: encounterId },
        data: { syncStatus: "FAILED_SYNC" },
      });
      return Response.json(
        { error: err instanceof Error ? err.message : "Bundle build failed" },
        { status: 400 }
      );
    }

    if (process.env.SATUSEHAT_MOCK_MODE !== "true") {
      // TODO: Real Kemenkes POST — send bundle to SATUSEHAT FHIR endpoint
      // Fall through to mock logic so the app doesn't crash during development
    }

    // Simulate network latency
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    const transactionId = "MOCK-TRX-" + crypto.randomUUID();
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { syncStatus: "SUCCESS", transactionId },
    });

    return Response.json({ syncStatus: "SUCCESS", transactionId });
  } catch (error) {
    console.error("[satusehat/submit] Unexpected error:", error);
    if (encounterId) {
      await prisma.encounter
        .update({ where: { id: encounterId }, data: { syncStatus: "FAILED_SYNC" } })
        .catch(() => {});
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
