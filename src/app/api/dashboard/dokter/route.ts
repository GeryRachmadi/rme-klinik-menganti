import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "DOKTER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wibOffset = 7 * 60 * 60 * 1000;
  const nowWib = new Date(Date.now() + wibOffset);
  nowWib.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(nowWib.getTime() - wibOffset);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    antreanMenunggu,
    selesaiDiperiksa,
    encounters,
    riwayatPemeriksaan,
  ] = await Promise.all([
    prisma.encounter.count({
      where: { status: "MENUNGGU", createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.encounter.count({
      where: { status: "SELESAI", createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.encounter.findMany({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      take: 8,
      orderBy: { createdAt: "asc" },
      include: {
        patient: { select: { name: true, gender: true, birthdate: true } },
      },
    }),
    prisma.encounter.findMany({
      where: {
        status: "SELESAI",
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        patient: { select: { name: true } },
        conditionDiagnoses: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: { codeIcd10: true, display: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    antreanMenunggu,
    selesaiDiperiksa,
    encounters,
    riwayatPemeriksaan,
  });
}
