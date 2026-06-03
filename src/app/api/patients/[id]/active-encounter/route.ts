import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "DOKTER", "PERAWAT"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user?.role as string;
  if (!ALLOWED_ROLES.includes(userRole)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // An open encounter (MENUNGGU/DIPERIKSA) is active regardless of which day
    // it was registered — a patient queued on a previous day but not yet seen
    // is still assessable. The duplicate-encounter guard ensures at most one
    // open encounter exists per patient.
    const encounter = await prisma.encounter.findFirst({
      where: {
        patientId: id,
        status: { in: ["MENUNGGU", "DIPERIKSA"] },
      },
      select: {
        id: true,
        patient: { select: { namaLengkap: true } },
      },
      orderBy: { periodStart: "desc" },
    });

    if (!encounter) {
      return NextResponse.json(
        {
          success: false,
          message: "Pasien belum terdaftar hari ini. Silakan daftarkan kunjungan terlebih dahulu.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, encounterId: encounter.id, patientName: encounter.patient.namaLengkap },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
