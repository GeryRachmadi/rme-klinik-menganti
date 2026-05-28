import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type Prisma } from "@/generated/prisma";
import { type ActivityLogEntry } from "@/components/shared/ActivityLogTable";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/components/shared/AdminDashboard";
import PendaftaranDashboard from "@/components/shared/PendaftaranDashboard";
import PerawatDashboard from "@/components/shared/PerawatDashboard";
import DokterDashboard from "@/components/shared/DokterDashboard";
import UnauthorizedToast from "@/components/shared/UnauthorizedToast";

export default async function BerandaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, session] = await Promise.all([searchParams, auth()]);
  const role = session?.user.role;
  const name = session?.user.name ?? session?.user.username ?? "Pengguna";

  let content: React.ReactNode;

  if (role === "ADMIN") {
    const [totalAccounts, totalPatients, activityLogs, failedSyncs, activityLogTotal] =
      await Promise.all([
        prisma.account.count({ where: { isActive: true } }),
        prisma.patient.count(),
        prisma.activityLog.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
          include: {
            account: {
              select: {
                username: true,
                role: true,
                practitioner: { select: { name: true } },
              },
            },
          },
        }) as Promise<ActivityLogEntry[]>,
        prisma.encounter.count({
          where: { syncStatus: "FAILED_SYNC" },
        }),
        prisma.activityLog.count(),
      ]);

    content = (
      <AdminDashboard
        name={name}
        totalAccounts={totalAccounts}
        totalPatients={totalPatients}
        activityLogs={activityLogs}
        activityLogTotal={activityLogTotal}
        failedSyncs={failedSyncs}
        satusehatMockMode={process.env.SATUSEHAT_MOCK_MODE === "true"}
      />
    );
  } else if (role === "PENDAFTARAN") {
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
          include: { patient: { select: { namaLengkap: true } } },
        }),
        prisma.practitioner.findMany({
          where: { account: { isActive: true, role: "DOKTER" } },
          select: { id: true, name: true, speciality: true },
          orderBy: { name: "asc" },
        }),
      ]);

    content = (
      <PendaftaranDashboard
        name={name}
        totalEncountersToday={totalEncountersToday}
        sisaAntrean={sisaAntrean}
        encounters={encounters}
        practitioners={practitioners}
      />
    );
  } else if (role === "PERAWAT") {
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
      menungguTriage,
    ] = await Promise.all([
      prisma.encounter.count({
        where: { status: "MENUNGGU", createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.encounter.count({
        where: { status: "SELESAI", createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.encounter.findMany({
        where: {
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
      prisma.encounter.count({
        where: { status: "MENUNGGU", observations: { none: {} } },
      }),
    ]);

    content = (
      <PerawatDashboard
        name={name}
        antreanMenunggu={antreanMenunggu}
        selesaiAsesmen={selesaiAsesmen}
        menungguTriage={menungguTriage}
        encounters={encounters}
        partnerDokter={partnerDokter}
        selesaiList={selesaiList}
      />
    );
  } else if (role === "DOKTER") {
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWib = new Date(Date.now() + wibOffset);
    nowWib.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowWib.getTime() - wibOffset);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const dokterPractitioner = await prisma.practitioner.findUnique({
      where: { accountId: session!.user.id },
      select: { id: true },
    });

    let antreanMenunggu = 0;
    let selesaiDiperiksa = 0;
    let encounters: Prisma.EncounterGetPayload<{
      include: { patient: { select: { namaLengkap: true; jenisKelamin: true; tanggalLahir: true } } };
    }>[] = [];
    let riwayatPemeriksaan: Prisma.EncounterGetPayload<{
      include: {
        patient: { select: { namaLengkap: true } };
        conditionDiagnoses: { select: { codeIcd10: true; display: true } };
      };
    }>[] = [];

    if (dokterPractitioner) {
      const pid = dokterPractitioner.id;
      [antreanMenunggu, selesaiDiperiksa, encounters, riwayatPemeriksaan] =
        await Promise.all([
          prisma.encounter.count({
            where: { practitionerId: pid, status: "MENUNGGU", createdAt: { gte: todayStart, lt: todayEnd } },
          }),
          prisma.encounter.count({
            where: { practitionerId: pid, status: "SELESAI", createdAt: { gte: todayStart, lt: todayEnd } },
          }),
          prisma.encounter.findMany({
            where: { practitionerId: pid, createdAt: { gte: todayStart, lt: todayEnd } },
            take: 8,
            orderBy: { createdAt: "asc" },
            include: {
              patient: { select: { namaLengkap: true, jenisKelamin: true, tanggalLahir: true } },
            },
          }),
          prisma.encounter.findMany({
            where: {
              practitionerId: pid,
              status: "SELESAI",
              createdAt: { gte: todayStart, lt: todayEnd },
            },
            take: 8,
            orderBy: { updatedAt: "desc" },
            include: {
              patient: { select: { namaLengkap: true } },
              conditionDiagnoses: {
                orderBy: { isPrimary: "desc" },
                take: 1,
                select: { codeIcd10: true, display: true },
              },
            },
          }),
        ]);
    }

    content = (
      <DokterDashboard
        name={name}
        antreanMenunggu={antreanMenunggu}
        selesaiDiperiksa={selesaiDiperiksa}
        jadwalPraktik="08:00–15:00"
        encounters={encounters}
        riwayatPemeriksaan={riwayatPemeriksaan}
      />
    );
  } else {
    content = (
      <div
        className="text-gray-400 text-sm"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        Dashboard sedang dalam pengembangan.
      </div>
    );
  }

  return (
    <DashboardLayout>
      <UnauthorizedToast error={error} />
      {content}
    </DashboardLayout>
  );
}
