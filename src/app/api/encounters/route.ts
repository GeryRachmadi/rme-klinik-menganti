import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { generateQueueNumber, type PolicyType } from "@/lib/queue-utils";

function formatTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { username: session.user.username as string },
      include: { practitioner: true },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const whereCondition: Prisma.EncounterWhereInput =
      account.role === "DOKTER" && account.practitioner
        ? { practitionerId: account.practitioner.id }
        : {};

    const encounters = await prisma.encounter.findMany({
      where: whereCondition,
      include: {
        patient: true,
        practitioner: true,
      },
      orderBy: {
        periodStart: "desc",
      },
    });

    const mappedData = encounters.map((enc) => {
      const date = new Date(enc.periodStart);

      const birthDate = new Date(enc.patient.tanggalLahir);
      let age = date.getFullYear() - birthDate.getFullYear();
      const m = date.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && date.getDate() < birthDate.getDate())) {
        age--;
      }

      return {
        id: enc.id,
        noAntrean: enc.queueNumber,
        tanggal: date.toISOString().split("T")[0],
        waktu: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        namaPasien: enc.patient.namaLengkap,
        jenisKelamin: enc.patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
        umur: age,
        noRm: enc.patient.noRm,
        jenisPasien: enc.patient.jenisPasien,
        poli: enc.practitioner?.speciality ?? "-",
        dokter: enc.practitioner?.name ?? "Belum ditentukan",
        prioritas: formatTitleCase(enc.priority),
        status: formatTitleCase(enc.status),
        syncStatus: enc.syncStatus,
      };
    });

    return NextResponse.json({ success: true, data: mappedData });

  } catch (error) {
    console.error("Error fetching encounters:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

const VALID_POLICY_TYPES = new Set(["UMUM", "GIGI"]);

/**
 * POST /api/encounters — TR-41.5 concurrency model
 *
 * generateQueueNumber() resolves the next counter inside a Prisma $transaction,
 * so two concurrent submissions receive distinct numbers from separate snapshots.
 * The unique index on [queueNumber, queueDate] is the hard safety net: a P2002
 * means two transactions resolved the same counter simultaneously (extremely rare).
 * The losing request returns 409 so the user can retry and receive the next number.
 * Queue-number gaps caused by conflicts are acceptable — no retry loop in the API.
 */
export async function POST(req: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "PENDAFTARAN"].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ── Parse & validate body ────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Request body tidak valid." }, { status: 400 });
    }

    const {
      patientId,
      policyType,
      priority,
      reasonCode,
      patientType,
      practitionerId,
    } = body as Record<string, unknown>;

    // Validate that ALL required fields are present
    if (
      !patientId ||
      !practitionerId ||
      !policyType ||
      !priority ||
      !patientType ||
      !reasonCode
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (typeof patientId !== "string") {
      return NextResponse.json({ success: false, error: "patientId wajib diisi." }, { status: 400 });
    }
    if (typeof policyType !== "string" || !VALID_POLICY_TYPES.has(policyType as PolicyType)) {
      return NextResponse.json(
        { success: false, error: "policyType tidak valid. Gunakan 'UMUM' atau 'GIGI'." },
        { status: 400 }
      );
    }

    // ── Generate queue number ────────────────────────────────────────────────
    let queueNumber: string;
    try {
      queueNumber = await generateQueueNumber(policyType as PolicyType);
    } catch (err) {
      const isQueueFull = err instanceof Error && err.message === "Antrean penuh untuk hari ini";
      console.error(
        `[POST /api/encounters] generateQueueNumber gagal | policyType=${policyType} | ${new Date().toISOString()}`,
        err
      );
      return NextResponse.json(
        {
          success: false,
          error: isQueueFull
            ? "Antrean penuh untuk hari ini, coba lagi besok."
            : "Gagal menghasilkan nomor antrean.",
        },
        { status: isQueueFull ? 409 : 500 }
      );
    }

    // Midnight UTC — consistent with the @db.Date storage and query in queue-utils
    const queueDate = new Date(new Date().toISOString().split("T")[0]);

    // ── Create encounter ─────────────────────────────────────────────────────
    // Two concurrent requests each resolve a distinct counter in their own
    // $transaction snapshots. P2002 here means an extremely rare same-counter
    // race — return 409 so the client can retry and get the next number.
    // Gaps from losing requests are acceptable.
    try {
      const newEncounter = await prisma.encounter.create({
        data: {
          queueNumber,
          queueDate,
          status:     "MENUNGGU",
          // class:   "AMB",     // Required for future SATUSEHAT compliance (not yet in Prisma schema)
          priority:   typeof priority    === "string" ? priority    : "STABIL",
          reasonCode: typeof reasonCode  === "string" ? reasonCode  : null,
          patientType: typeof patientType === "string" ? patientType : "UMUM",
          patientId,
          practitionerId: typeof practitionerId === "string" ? practitionerId : null,
        },
        select: {
          id:          true,
          queueNumber: true,
          queueDate:   true,
          status:      true,
          priority:    true,
          periodStart: true,
          patient: {
            select: { namaLengkap: true, noRm: true },
          },
          practitioner: {
            select: { name: true, speciality: true },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: newEncounter,
        },
        { status: 201 }
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        console.error(
          `[POST /api/encounters] Konflik antrean konkuren | policyType=${policyType} | queueDate=${queueDate.toISOString().split("T")[0]} | queueNumber=${queueNumber}`
        );
        return NextResponse.json(
          { success: false, error: "Nomor antrean sudah digunakan, coba lagi." },
          { status: 409 }
        );
      }
      console.error(
        `[POST /api/encounters] Prisma error | policyType=${policyType} | ${new Date().toISOString()}`,
        err instanceof Prisma.PrismaClientKnownRequestError
          ? { code: err.code, message: err.message }
          : err
      );
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[POST /api/encounters] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
