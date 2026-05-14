import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role;
  if (!["DOKTER", "ADMIN"].includes(userRole)) {
    return Response.json(
      { error: "Hanya dokter yang dapat menyimpan diagnosis" },
      { status: 403 }
    );
  }

  const { encounterId } = await params;

  try {
    const body = await request.json();
    const { assessmentData, physicalData, hasilPeriksaData, selectedDiagnoses } = body;

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { observations: true },
    });

    if (!encounter) {
      return Response.json({ error: "Data kunjungan tidak ditemukan" }, { status: 404 });
    }

    if (!["MENUNGGU", "DIPERIKSA"].includes(encounter.status)) {
      return Response.json(
        { error: "Status kunjungan tidak valid untuk input diagnosis" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Save diagnoses
      if (selectedDiagnoses && selectedDiagnoses.length > 0) {
        await tx.conditionDiagnosis.createMany({
          data: selectedDiagnoses.map(
            (d: { code: string; display: string; notes?: string }, idx: number) => ({
              encounterId,
              codeIcd10: d.code,
              display: d.display,
              notes: d.notes ?? null,
              isPrimary: idx === 0,
            })
          ),
        });
      }

      // Update or create Observation
      const existingObs = encounter.observations?.[0] ?? null;
      const doctorNotes = hasilPeriksaData?.pemeriksaanFisikTambahan || null;

      if (existingObs) {
        const appendedNotes = doctorNotes
          ? [existingObs.notes, `[Catatan Dokter]: ${doctorNotes}`]
              .filter(Boolean)
              .join("\n\n")
          : existingObs.notes;
        await tx.observation.update({
          where: { id: existingObs.id },
          data: { notes: appendedNotes },
        });
      } else {
        let systolic: number | null = null;
        let diastolic: number | null = null;
        if (physicalData?.tekananDarah) {
          const [sys, dias] = (physicalData.tekananDarah as string)
            .split("/")
            .map(Number);
          systolic = sys || null;
          diastolic = dias || null;
        }
        await tx.observation.create({
          data: {
            encounterId,
            systolic,
            diastolic,
            temperature: physicalData?.suhu ?? null,
            heartRate: physicalData?.nadi ?? null,
            respiratoryRate: physicalData?.napas ?? null,
            height: physicalData?.tinggiBadan ?? null,
            weight: physicalData?.beratBadan ?? null,
            bmi: physicalData?.bmi ?? null,
            notes: doctorNotes,
          },
        });
      }

      // Update Encounter status to SELESAI
      await tx.encounter.update({
        where: { id: encounterId },
        data: {
          reasonCode: hasilPeriksaData?.keluhanUtama ?? null,
          status: "SELESAI",
          updatedAt: new Date(),
        },
      });
    });

    return Response.json(
      { success: true, message: "Asesmen berhasil disimpan. Kunjungan Selesai." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[TR-70] Asesmen save error:", error);
    return Response.json({ error: "Gagal menyimpan data ke server." }, { status: 500 });
  }
}
