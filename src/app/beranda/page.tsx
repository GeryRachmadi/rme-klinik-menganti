import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/components/shared/AdminDashboard";

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
