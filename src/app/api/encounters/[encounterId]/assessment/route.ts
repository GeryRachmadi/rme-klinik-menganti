import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { writeActivityLog } from '@/lib/activity-log';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  try {
    const { encounterId } = await params;

    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { penyakit, alergi, obat, catatanPenyakit, catatanAlergi, catatanObat } = body;

    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      select: {
        patientId: true,
        status: true,
        queueNumber: true,
        patient: { select: { namaLengkap: true, noRm: true } },
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Data kunjungan tidak ditemukan' }, { status: 404 });
    }

    const { patientId } = encounter;

    await prisma.$transaction(async (tx) => {
      if (penyakit && penyakit.length > 0) {
        await tx.conditionHistory.createMany({
          data: penyakit.map((namaPenyakit: string) => ({
            patientId,
            description: namaPenyakit,
            clinicalStatus: 'ACTIVE',
            notes: catatanPenyakit || null,
          })),
        });
      }

      if (alergi && alergi.length > 0) {
        await tx.allergyIntolerance.createMany({
          data: alergi.map((a: { name: string; severity: string }) => ({
            patientId,
            description: a.name,
            reactionSeverity: a.severity,
            notes: catatanAlergi || null,
          })),
        });
      }

      if (obat && obat.length > 0) {
        await tx.medicationStatement.createMany({
          data: obat.map((o: { name: string; dosage?: string }) => ({
            patientId,
            description: o.name,
            dosage: o.dosage || null,
            notes: catatanObat || null,
          })),
        });
      }

      // Do not downgrade a SELESAI encounter; only promote MENUNGGU → DIPERIKSA
      if (encounter.status === 'MENUNGGU') {
        await tx.encounter.update({
          where: { id: encounterId },
          data: { status: 'DIPERIKSA' },
        });
      }
    });

    writeActivityLog(
      session.user.id,
      "ASSESSMENT_SAVED",
      "Kajian awal klinis dicatat",
      `Pasien ${encounter.patient.namaLengkap} (${encounter.queueNumber}) · ${encounter.patient.noRm}`
    );

    return NextResponse.json(
      { success: true, message: 'Asesmen keperawatan berhasil disimpan.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('API Assessment Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat menyimpan data.' },
      { status: 500 }
    );
  }
}
