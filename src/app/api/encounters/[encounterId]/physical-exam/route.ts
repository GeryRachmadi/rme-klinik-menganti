import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeActivityLog } from "@/lib/activity-log";
import { PhysicalExamSchema } from "@/lib/schemas/physical-exam-schema";
import { parsePhysicalExamData } from "@/lib/utils/observation-parser";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role;

  if (!["DOKTER", "PERAWAT", "ADMIN"].includes(userRole)) {
    return Response.json(
      { error: "Forbidden: Hanya perawat dan dokter yang dapat menyimpan pemeriksaan fisik." },
      { status: 403 }
    );
  }

  const { encounterId } = await params;

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true },
    });

    if (!encounter) {
      return Response.json({ error: "Encounter tidak ditemukan" }, { status: 404 });
    }

    const allowedStatuses = userRole === 'ADMIN'
      ? ["MENUNGGU", "DIPERIKSA", "SELESAI"]
      : ["MENUNGGU", "DIPERIKSA"];
    if (!allowedStatuses.includes(encounter.status)) {
      return Response.json(
        { error: `Tidak dapat menambah pemeriksaan fisik di status ${encounter.status}` },
        { status: 400 }
      );
    }

    const patientId = encounter.patientId;
    const body = await request.json();

    const bodyValidation = PhysicalExamSchema.safeParse(body);
    if (!bodyValidation.success) {
      return Response.json(
        {
          error: "Validasi gagal",
          details: bodyValidation.error.format(),
        },
        { status: 400 }
      );
    }

    const parsed = parsePhysicalExamData(bodyValidation.data);

    const result = await prisma.$transaction(async (tx) => {
      // Find systolic and diastolic from parsed output
      const systolic = parsed.observations.find(o => o.fieldName === "Tekanan Darah Sistol")?.valueQuantity;
      const diastolic = parsed.observations.find(o => o.fieldName === "Tekanan Darah Diastol")?.valueQuantity;

      const createdObservation = await tx.observation.create({
        data: {
          encounterId,
          systolic: systolic,
          diastolic: diastolic,
          temperature: bodyValidation.data.suhu,
          heartRate: bodyValidation.data.nadi,
          respiratoryRate: bodyValidation.data.napas,
          weight: bodyValidation.data.beratBadan,
          height: bodyValidation.data.tinggiBadan,
          bmi: bodyValidation.data.bmi,
          notes: bodyValidation.data.catatan,
        },
      });

      if (encounter.status === 'MENUNGGU') {
        await tx.encounter.update({
          where: { id: encounterId },
          data: { status: 'DIPERIKSA' },
        });
      }

      return {
        success: true,
        observationCount: 1, // Only 1 Observation record covers all standard fields now
      };
    });

    writeActivityLog(
      session.user.id,
      "PHYSICAL_EXAM_SAVED",
      "Pemeriksaan fisik dicatat",
      `Pasien ${encounter.patient.namaLengkap} (${encounter.queueNumber}) · ${encounter.patient.noRm}`
    );

    return Response.json(
      {
        success: true,
        encounterId,
        observationCount: result.observationCount,
        message: "Pemeriksaan fisik berhasil disimpan",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Physical exam save error:", error);
    return Response.json(
      { error: "Terjadi kesalahan internal saat menyimpan data" },
      { status: 500 }
    );
  }
}
