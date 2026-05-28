import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSatuSehatBundle } from "@/lib/bundleBuilder";
import { getSATUSEHATToken } from "@/lib/satusehat";

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

    // Build bundle — validates IHS IDs, encounter existence, and creates the FHIR payload
    let bundle: Awaited<ReturnType<typeof buildSatuSehatBundle>>;
    try {
      bundle = await buildSatuSehatBundle(encounterId);
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
      // ── Real POST to Kemenkes SATUSEHAT FHIR endpoint ──────────
      const baseUrl = process.env.SATUSEHAT_BASE_URL;
      if (!baseUrl) {
        throw new Error("Missing SATUSEHAT_BASE_URL in .env");
      }

      const token = await getSATUSEHATToken();

      console.log("[satusehat/submit] Sending FHIR Bundle to:", `${baseUrl}/fhir-r4/v1/`);

      const fhirResponse = await fetch(`${baseUrl}/fhir-r4/v1/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/fhir+json",
          Accept: "application/fhir+json",
        },
        body: JSON.stringify(bundle),
      });

      if (!fhirResponse.ok) {
        const rawText = await fhirResponse.text();
        let errorData: unknown = null;
        try {
          errorData = JSON.parse(rawText);
        } catch {
          // non-JSON body
        }

        if (errorData !== null) {
          console.log(
            "🚨 SATUSEHAT REJECTED PAYLOAD - OPERATION OUTCOME:\n",
            JSON.stringify(errorData, null, 2)
          );
        } else {
          console.log(
            `🚨 SATUSEHAT RAW ERROR (non-JSON) [HTTP ${fhirResponse.status}]:`,
            rawText
          );
        }

        await prisma.encounter.update({
          where: { id: encounterId },
          data: { syncStatus: "FAILED_SYNC" },
        });

        return Response.json(
          { error: "SATUSEHAT rejected the FHIR bundle. Check terminal for OperationOutcome." },
          { status: 502 }
        );
      }

      // ── Success — parse SATUSEHAT response for transactionId ───
      const responseData = (await fhirResponse.json()) as { id?: string };
      const transactionId = responseData?.id ?? `TRX-${crypto.randomUUID()}`;

      await prisma.encounter.update({
        where: { id: encounterId },
        data: { syncStatus: "SUCCESS", transactionId },
      });

      return Response.json({ syncStatus: "SUCCESS", transactionId });
    }

    // ── Mock path (SATUSEHAT_MOCK_MODE === "true") ──────────────
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
