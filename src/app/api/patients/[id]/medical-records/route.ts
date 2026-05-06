import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mapPatientMedicalRecords } from "@/lib/mappers/medical-records-mapper";

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role || "UNKNOWN";
    const accountId = session?.user?.id || "unknown-account";

    if (!["ADMIN", "DOKTER", "PERAWAT"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Resolve params to handle both Next.js 14 and 15 paradigms
    const params = await Promise.resolve(context.params);
    const { id } = params;
    
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        conditionHistories: true,
        allergyIntolerances: true,
        medicationStatements: true,
        encounters: {
          take: 50,
          orderBy: { periodStart: "desc" },
          include: {
            practitioner: true,
            observations: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
            conditionDiagnoses: true,
            medicationRequests: true,
            procedures: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Pasien tidak ditemukan" },
        { status: 404 }
      );
    }

    // Audit Logging (non-blocking)
    if (accountId !== "unknown-account") {
      prisma.activityLog.create({
        data: {
          action: "VIEW_MEDICAL_RECORD",
          status: "SUCCESS",
          accountId: accountId,
        },
      }).catch((err) => console.error("Failed to create activity log:", err));
    }

    const mappedData = mapPatientMedicalRecords(patient, role);

    return NextResponse.json(
      {
        success: true,
        data: mappedData,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "max-age=300, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
