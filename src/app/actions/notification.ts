"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  href: string;
  isRead: false;
}

export async function getRoleBasedNotifications(
  role: string
): Promise<NotificationItem[]> {
  // Today's boundary in WIB (UTC+7) — same pattern as beranda/page.tsx
  const wibOffset = 7 * 60 * 60 * 1000;
  const nowWib = new Date(Date.now() + wibOffset);
  nowWib.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(nowWib.getTime() - wibOffset);
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  let where: Prisma.EncounterWhereInput;

  if (role === "PERAWAT") {
    where = { status: "MENUNGGU" };
  } else if (role === "DOKTER") {
    where = { status: "DIPERIKSA" };
  } else if (role === "PENDAFTARAN") {
    where = { status: "MENUNGGU", createdAt: { gte: todayStart, lt: todayEnd } };
  } else if (role === "ADMIN") {
    where = { createdAt: { gte: todayStart, lt: todayEnd } };
  } else {
    return [];
  }

  const encounters = await prisma.encounter.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { patient: { select: { namaLengkap: true } } },
  });

  return encounters.map((enc): NotificationItem => {
    const queue = enc.queueNumber ?? "-";
    const name  = enc.patient.namaLengkap;

    let title: string;
    let message: string;

    if (role === "PERAWAT") {
      title   = "Pasien Menunggu Asesmen";
      message = `${name} (${queue}) menunggu kajian awal perawat.`;
    } else if (role === "DOKTER") {
      title   = "Pasien Siap Diperiksa";
      message = `${name} (${queue}) siap untuk pemeriksaan dokter.`;
    } else if (role === "PENDAFTARAN") {
      title   = "Kunjungan Baru Hari Ini";
      message = `${name} (${queue}) terdaftar dan menunggu antrean.`;
    } else {
      // ADMIN — vary title by status
      const statusLabel: Record<string, string> = {
        MENUNGGU:  "Menunggu",
        DIPERIKSA: "Sedang Diperiksa",
        SELESAI:   "Selesai",
      };
      title   = "Kunjungan Hari Ini";
      message = `${name} (${queue}) — ${statusLabel[enc.status] ?? enc.status}.`;
    }

    return {
      id:        enc.id,
      title,
      message,
      createdAt: enc.createdAt,
      href:      `/rawat-jalan/${enc.id}/asesmen`,
      isRead:    false,
    };
  });
}
