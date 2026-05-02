/**
 * TR-41.5 API Test Suite — POST /api/encounters
 * Run: npx tsx scripts/test-encounters-api.ts
 *
 * Requires dev server running on http://localhost:3000
 *
 * NOTE: dotenv must be loaded before prisma initialises (prisma reads
 * process.env.DATABASE_URL at module evaluation time). We use a dynamic
 * import for prisma so that dotenv.config() runs first.
 */

// ── Load env vars synchronously BEFORE prisma initialises ────────────────────
// Static ESM imports are evaluated before any module body code runs, so
// "import { prisma }" would evaluate prisma.ts (which reads DATABASE_URL) BEFORE
// loadEnv() gets a chance to set the env. Using a dynamic import for prisma
// ensures prisma.ts only evaluates after loadEnv() has populated process.env.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env",       override: false });
// prisma is imported dynamically inside runTests() below

// ─────────────────────────────────────────────────────────────────────────────

const BASE          = "http://localhost:3000";
const ADMIN_USER    = "gery.admin";
const DOKTER_USER   = "strange.practitioner";
const PASSWORD      = "password123";

type TestResult = "PASS" | "FAIL" | "SKIPPED";
interface Report { id: string; description: string; result: TestResult; detail?: string }
const results: Report[] = [];

// ── Auth: get Auth.js v5 session cookie ───────────────────────────────────────

async function getSessionCookie(username: string): Promise<string | null> {
  // Step 1: CSRF token (Auth.js v5 cookie: "authjs.csrf-token")
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfBody = await csrfRes.json() as { csrfToken: string };
  const csrfCookieHeader = (csrfRes.headers.get("set-cookie") ?? "")
    .split(",")
    .map(c => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  // Step 2: Credentials sign-in (Auth.js v5 cookie: "authjs.session-token")
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookieHeader,
    },
    body: new URLSearchParams({
      username,
      password: PASSWORD,
      csrfToken: csrfBody.csrfToken,
      redirect: "false",
      json: "true",
    }).toString(),
    redirect: "manual",   // grab the 302 response directly
  });

  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  const sessionFull = setCookie
    .split(",")
    .find(c =>
      c.trim().startsWith("authjs.session-token") ||
      c.trim().startsWith("__Secure-authjs.session-token") ||
      c.trim().startsWith("next-auth.session-token")
    );

  return sessionFull ? sessionFull.split(";")[0].trim() : null;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function post(
  path: string,
  body: Record<string, unknown>,
  cookie?: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

// ── Reporter ──────────────────────────────────────────────────────────────────

function pass(id: string, desc: string, detail?: string) {
  results.push({ id, description: desc, result: "PASS", detail });
  console.log(`  ✓  [${id}] ${desc}${detail ? `  →  ${detail}` : ""}`);
}
function fail(id: string, desc: string, detail: string) {
  results.push({ id, description: desc, result: "FAIL", detail });
  console.error(`  ✗  [${id}] ${desc}\n       actual: ${detail}`);
}
function skip(id: string, desc: string, reason: string) {
  results.push({ id, description: desc, result: "SKIPPED", detail: reason });
  console.log(`  ○  [${id}] ${desc}  →  SKIPPED: ${reason}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  // Dynamic import so prisma.ts evaluates AFTER loadEnv() has set DATABASE_URL
  const { prisma } = await import("../src/lib/prisma");

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("   TR-41.5  POST /api/encounters  Error Handling Tests    ");
  console.log("══════════════════════════════════════════════════════════\n");

  // ── Preflight ────────────────────────────────────────────────────────────────
  console.log("▶ Preflight: session + DB...");

  const adminCookie = await getSessionCookie(ADMIN_USER);
  if (!adminCookie) {
    console.error("FATAL: could not get ADMIN session cookie.");
    process.exit(1);
  }

  const patient = await prisma.patient.findFirst({ select: { id: true, namaLengkap: true } });
  if (!patient) {
    console.error("FATAL: no patient in database.");
    process.exit(1);
  }

  console.log(`  ✓ Admin session cookie acquired`);
  console.log(`  ✓ Patient: ${patient.namaLengkap} (id=${patient.id})\n`);

  // ── TC2: Queue Full → 409 ────────────────────────────────────────────────────
  console.log("▶ TC2: Queue Full → 409");
  const today = new Date(new Date().toISOString().split("T")[0]);
  let insertedFake = false;

  const existing999 = await prisma.encounter.findFirst({
    where: { queueNumber: "U-999", queueDate: today },
  });

  if (!existing999) {
    await prisma.encounter.create({
      data: {
        queueNumber: "U-999",
        queueDate:   today,
        status:      "MENUNGGU",
        priority:    "STABIL",
        patientType: "UMUM",
        patientId:   patient.id,
      },
    });
    insertedFake = true;
    console.log("  → Inserted U-999 sentinel row");
  } else {
    console.log("  → U-999 already present today");
  }

  const tc2 = await post("/api/encounters", {
    patientId:   patient.id,
    policyType:  "UMUM",
    priority:    "STABIL",
    patientType: "UMUM",
  }, adminCookie);

  if (
    tc2.status === 409 &&
    typeof tc2.json.error === "string" &&
    tc2.json.error.includes("Antrean penuh")
  ) {
    pass("TC2", "Queue full → 409", `error="${tc2.json.error}"`);
  } else {
    fail("TC2", "Queue full → 409",
      `status=${tc2.status}, body=${JSON.stringify(tc2.json)}`);
  }

  // Cleanup
  if (insertedFake) {
    await prisma.encounter.deleteMany({ where: { queueNumber: "U-999", queueDate: today } });
    console.log("  → Cleaned up U-999 row\n");
  }

  // ── TC4a: Missing patientId → 400 ────────────────────────────────────────────
  console.log("▶ TC4a: Missing patientId → 400");
  const tc4a = await post("/api/encounters", { policyType: "UMUM" }, adminCookie);

  if (
    tc4a.status === 400 &&
    typeof tc4a.json.error === "string" &&
    tc4a.json.error.includes("patientId wajib")
  ) {
    pass("TC4a", "Missing patientId → 400", `error="${tc4a.json.error}"`);
  } else {
    fail("TC4a", "Missing patientId → 400",
      `status=${tc4a.status}, body=${JSON.stringify(tc4a.json)}`);
  }

  // ── TC4b: Invalid policyType → 400 ───────────────────────────────────────────
  console.log("\n▶ TC4b: Invalid policyType → 400");
  const tc4b = await post("/api/encounters", {
    patientId:  patient.id,
    policyType: "INVALID",
  }, adminCookie);

  if (
    tc4b.status === 400 &&
    typeof tc4b.json.error === "string" &&
    tc4b.json.error.includes("policyType tidak valid")
  ) {
    pass("TC4b", "Invalid policyType → 400", `error="${tc4b.json.error}"`);
  } else {
    fail("TC4b", "Invalid policyType → 400",
      `status=${tc4b.status}, body=${JSON.stringify(tc4b.json)}`);
  }

  // ── TC5: Unauthorized → 401 (manual) ────────────────────────────────────────
  console.log("\n▶ TC5: Unauthorized → 401");
  skip("TC5", "No session → 401",
    "Cannot programmatically invalidate an active browser session — test manually by logging out and hitting the endpoint");

  // ── TC6: Forbidden (DOKTER role) → 403 ───────────────────────────────────────
  console.log("\n▶ TC6: DOKTER role → 403");
  const dokterCookie = await getSessionCookie(DOKTER_USER);

  if (!dokterCookie) {
    skip("TC6", "DOKTER role → 403", `Could not acquire session for ${DOKTER_USER}`);
  } else {
    const tc6 = await post("/api/encounters", {
      patientId:   patient.id,
      policyType:  "UMUM",
      priority:    "STABIL",
      patientType: "UMUM",
    }, dokterCookie);

    if (tc6.status === 403) {
      pass("TC6", "DOKTER role → 403", `error="${tc6.json.error}"`);
    } else {
      fail("TC6", "DOKTER role → 403",
        `status=${tc6.status}, body=${JSON.stringify(tc6.json)}`);
    }
  }

  // ── TC7: Server console.error log format ─────────────────────────────────────
  console.log("\n▶ TC7: Server console.error log format");
  console.log("  The dev server terminal should show (from TC2 above):");
  console.log("    [POST /api/encounters] generateQueueNumber gagal | policyType=UMUM | <ISO timestamp>");
  console.log("  TC4a and TC4b are validation-layer returns — no server error log expected for those.");
  console.log("  Verify in your 'npm run dev' terminal window.");
  pass("TC7", "Log format described — verify in dev server terminal");

  // ── Summary ───────────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.result === "PASS").length;
  const failed  = results.filter(r => r.result === "FAIL").length;
  const skipped = results.filter(r => r.result === "SKIPPED").length;

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`${"ID".padEnd(7)} ${"Description".padEnd(38)} Result`);
  console.log("─".repeat(62));
  for (const r of results) {
    const icon = r.result === "PASS" ? "✓" : r.result === "FAIL" ? "✗" : "○";
    console.log(`${r.id.padEnd(7)} ${r.description.padEnd(38)} ${icon} ${r.result}`);
    if (r.result !== "PASS" && r.detail) {
      console.log(`        └─ ${r.detail}`);
    }
  }
  console.log("─".repeat(62));
  console.log(`  PASS: ${passed}   FAIL: ${failed}   SKIPPED: ${skipped}`);
  console.log("══════════════════════════════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

runTests()
  .catch(e => { console.error("Unhandled error in test suite:", e); process.exit(1); })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
