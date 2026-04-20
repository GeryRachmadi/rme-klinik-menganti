import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "PERAWAT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wibOffset = 7 * 60 * 60 * 1000;
  const nowWib = new Date(Date.now() + wibOffset);
  nowWib.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(nowWib.getTime() - wibOffset);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    antreanMenunggu,
    selesaiAsesmen,
    encounters,
    partnerDokter,
    selesaiList,
    perawatPrac,
  ] = await Promise.all([
    prisma.encounter.count({
      where: { status: "MENUNGGU", createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.encounter.count({
      where: { status: "SELESAI", createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.encounter.findMany({
      where: {
        status: { not: "SELESAI" },
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      take: 8,
      orderBy: { createdAt: "asc" },
      include: {
        patient: { select: { namaLengkap: true, jenisKelamin: true, tanggalLahir: true } },
      },
    }),
    prisma.practitioner.findMany({
      where: { account: { isActive: true, role: "DOKTER" } },
      select: { id: true, name: true, speciality: true },
      orderBy: { name: "asc" },
    }),
    prisma.encounter.findMany({
      where: {
        status: "SELESAI",
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { patient: { select: { namaLengkap: true } } },
    }),
    prisma.practitioner.findUnique({
      where: { accountId: session.user.id },
      select: { speciality: true },
    }),
  ]);

  return NextResponse.json({
    antreanMenunggu,
    selesaiAsesmen,
    ruangPenugasan: perawatPrac?.speciality ?? "Umum",
    encounters,
    partnerDokter,
    selesaiList,
  });
}
