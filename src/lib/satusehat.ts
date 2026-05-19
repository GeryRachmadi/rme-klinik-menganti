/**
 * SATUSEHAT API Utilities
 * Core utilities for OAuth2, IHS Lookups, and FHIR formatting.
 *
 * Token caching strategy:
 * - Tokens last ~3599s (1 hour minus buffer)
 * - Cache in memory with expiry check
 * - Refresh proactively 60s before expiry
 * - Avoids 1-minute server ban from over-requesting
 */

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp
}

let cachedToken: TokenCache | null = null;

// ─────────────────────────────────────────────────────────
// 1. OAUTH2 TOKEN MANAGER
// ─────────────────────────────────────────────────────────

export async function getSATUSEHATToken(): Promise<string> {
  const now = Date.now();

  // Check cache: is token still valid? (with 60s buffer for safety)
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    console.log("[SATUSEHAT] Using cached token");
    return cachedToken.accessToken;
  }

  console.log("[SATUSEHAT] Fetching new OAuth2 token...");

  const clientId = process.env.SATUSEHAT_CLIENT_ID;
  const clientSecret = process.env.SATUSEHAT_CLIENT_SECRET;
  const baseUrl = process.env.SATUSEHAT_BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error(
      "Missing SATUSEHAT_CLIENT_ID, SATUSEHAT_CLIENT_SECRET, or SATUSEHAT_BASE_URL in .env"
    );
  }

  try {
    const response = await fetch(`${baseUrl}/oauth2/v1/accesstoken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SATUSEHAT] OAuth2 Error:", response.status, errorText);
      throw new Error(
        `SATUSEHAT OAuth2 failed: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    // Cache token with expiry (expires_in is in seconds)
    const expiresAt = now + data.expires_in * 1000;
    cachedToken = {
      accessToken: data.access_token,
      expiresAt,
    };

    console.log(
      `[SATUSEHAT] Token cached, expires in ${data.expires_in} seconds`
    );
    return data.access_token;
  } catch (error) {
    console.error("[SATUSEHAT] Token fetch error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// 2. PATIENT IHS ID LOOKUP
// ─────────────────────────────────────────────────────────

export interface IHSLookupResult {
  ihsId: string;
  nik: string;
  name: string;
}

export async function getPatientIHSId(
  nik: string
): Promise<IHSLookupResult | null> {
  if (!nik || nik.trim().length === 0) {
    throw new Error("NIK is required");
  }

  try {
    const token = await getSATUSEHATToken();
    const baseUrl = process.env.SATUSEHAT_BASE_URL;

    if (!baseUrl) {
      throw new Error("Missing SATUSEHAT_BASE_URL in .env");
    }

    const searchUrl = new URL(`${baseUrl}/fhir-r4/v1/Patient`);
    searchUrl.searchParams.append(
      "identifier",
      `https://fhir.kemkes.go.id/id/nik|${nik}`
    );

    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[SATUSEHAT] Patient lookup failed (${response.status}) for NIK: ${nik}`
      );
      return null;
    }

    const bundle = (await response.json()) as {
      entry?: Array<{
        resource: {
          id: string;
          name?: Array<{ text: string }>;
        };
      }>;
    };

    if (!bundle.entry || bundle.entry.length === 0) {
      console.log(`[SATUSEHAT] No patient found for NIK: ${nik}`);
      return null;
    }

    const patientResource = bundle.entry[0].resource;

    return {
      ihsId: patientResource.id,
      nik: nik,
      name: patientResource.name?.[0]?.text || "Unknown",
    };
  } catch (error) {
    console.error("[SATUSEHAT] Patient IHS lookup error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// 3. PRACTITIONER IHS ID LOOKUP
// ─────────────────────────────────────────────────────────

export async function getPractitionerIHSId(
  nik: string
): Promise<IHSLookupResult | null> {
  if (!nik || nik.trim().length === 0) {
    throw new Error("NIK is required");
  }

  try {
    const token = await getSATUSEHATToken();
    const baseUrl = process.env.SATUSEHAT_BASE_URL;

    if (!baseUrl) {
      throw new Error("Missing SATUSEHAT_BASE_URL in .env");
    }

    const searchUrl = new URL(`${baseUrl}/fhir-r4/v1/Practitioner`);
    searchUrl.searchParams.append(
      "identifier",
      `https://fhir.kemkes.go.id/id/nik|${nik}`
    );

    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[SATUSEHAT] Practitioner lookup failed (${response.status}) for NIK: ${nik}`
      );
      return null;
    }

    const bundle = (await response.json()) as {
      entry?: Array<{
        resource: {
          id: string;
          name?: Array<{ text: string }>;
        };
      }>;
    };

    if (!bundle.entry || bundle.entry.length === 0) {
      console.log(`[SATUSEHAT] No practitioner found for NIK: ${nik}`);
      return null;
    }

    const practitionerResource = bundle.entry[0].resource;

    return {
      ihsId: practitionerResource.id,
      nik: nik,
      name: practitionerResource.name?.[0]?.text || "Unknown",
    };
  } catch (error) {
    console.error("[SATUSEHAT] Practitioner IHS lookup error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// 4. FHIR R4 HELPERS
// ─────────────────────────────────────────────────────────

/**
 * Format date as Extended ISO-8601 with timezone offset (+07:00 for Indonesia)
 * Required by FHIR R4 for strict datetime validation
 */
export function toFHIRDateTime(date: Date = new Date()): string {
  const offset = "+07:00"; // WIB Timezone
  const iso = date.toISOString();
  // Replace Z with +07:00
  return iso.slice(0, -1) + offset;
}

/**
 * FHIR R4 requires dataAbsentReason instead of null values for vital signs
 */
export function formatVitalSign(
  value: number | null | undefined,
  unit: string
):
  | { valueQuantity: { value: number; unit: string; system: string; code: string } }
  | { dataAbsentReason: { coding: Array<{ system: string; code: string; display: string }> } } {
  if (value === null || value === undefined) {
    return {
      dataAbsentReason: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/data-absent-reason",
            code: "unknown",
            display: "Unknown",
          },
        ],
      },
    };
  }
  return {
    valueQuantity: {
      value,
      unit,
      system: "http://unitsofmeasure.org",
      code: unit,
    },
  };
}
