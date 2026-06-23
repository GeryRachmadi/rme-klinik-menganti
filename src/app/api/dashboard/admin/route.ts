import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
            practitioner: { select: { name: true, speciality: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ totalAccounts, totalPatients, activityLogs });
}
