import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "PENDAFTARAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Today's date range in UTC (WIB = UTC+7)
  const wibOffset = 7 * 60 * 60 * 1000;
  const nowWib = new Date(Date.now() + wibOffset);
  nowWib.setUTCHours(0, 0, 0, 0); // midnight WIB expressed in UTC fields
  const todayStart = new Date(nowWib.getTime() - wibOffset); // convert back to UTC
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [totalEncountersToday, sisaAntrean, encounters, practitioners] =
    await Promise.all([
      prisma.encounter.count({
        where: { createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.encounter.count({
        where: {
          status: "MENUNGGU",
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.encounter.findMany({
        where: { createdAt: { gte: todayStart, lt: todayEnd } },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { name: true } },
        },
      }),
      prisma.practitioner.findMany({
        where: { account: { isActive: true, role: "DOKTER" } },
        select: { id: true, name: true, speciality: true },
        orderBy: { name: "asc" },
      }),
    ]);

  return NextResponse.json({
    totalEncountersToday,
    sisaAntrean,
    encounters,
    practitioners,
  });
}
