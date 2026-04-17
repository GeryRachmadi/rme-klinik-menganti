import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/components/shared/AdminDashboard";
import PendaftaranDashboard from "@/components/shared/PendaftaranDashboard";
import PerawatDashboard from "@/components/shared/PerawatDashboard";

export default async function BerandaPage() {
  const session = await auth();
  const role = session?.user.role;
  const name = session?.user.name ?? session?.user.username ?? "Pengguna";

  if (role === "ADMIN") {
    const [totalAccounts, totalPatients, activityLogs] = await Promise.all([
      prisma.account.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          account: {
            select: {
              role: true,
              username: true,
              practitioner: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return (
      <DashboardLayout>
        <AdminDashboard
          name={name}
          totalAccounts={totalAccounts}
          totalPatients={totalPatients}
          activityLogs={activityLogs}
        />
      </DashboardLayout>
    );
  }

  if (role === "PENDAFTARAN") {
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWib = new Date(Date.now() + wibOffset);
    nowWib.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowWib.getTime() - wibOffset);
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
          include: { patient: { select: { name: true } } },
        }),
        prisma.practitioner.findMany({
          where: { account: { isActive: true, role: "DOKTER" } },
          select: { id: true, name: true, speciality: true },
          orderBy: { name: "asc" },
        }),
      ]);

    return (
      <DashboardLayout>
        <PendaftaranDashboard
          name={name}
          totalEncountersToday={totalEncountersToday}
          sisaAntrean={sisaAntrean}
          encounters={encounters}
          practitioners={practitioners}
        />
      </DashboardLayout>
    );
  }

  if (role === "PERAWAT") {
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
          patient: { select: { name: true, gender: true, birthdate: true } },
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
        include: { patient: { select: { name: true } } },
      }),
      prisma.practitioner.findUnique({
        where: { accountId: session!.user.id },
        select: { speciality: true },
      }),
    ]);

    return (
      <DashboardLayout>
        <PerawatDashboard
          name={name}
          antreanMenunggu={antreanMenunggu}
          selesaiAsesmen={selesaiAsesmen}
          ruangPenugasan={perawatPrac?.speciality ?? "Umum"}
          encounters={encounters}
          partnerDokter={partnerDokter}
          selesaiList={selesaiList}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="text-gray-400 text-sm"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        Dashboard sedang dalam pengembangan.
      </div>
    </DashboardLayout>
  );
}
