import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ encounterId: string }> } // <-- FIX 1: Jadikan Promise
) {
  try {
    const { encounterId } = await params; // <-- FIX 2: Wajib di-await
    
    // 1. CEK AUTENTIKASI
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      penyakit, alergi, obat, 
      catatanPenyakit, catatanAlergi, catatanObat 
    } = body;

    // 2. DAPATKAN PATIENT ID DARI ENCOUNTER
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId },
      select: { patientId: true }
    });

    if (!encounter) {
      return NextResponse.json({ error: "Data kunjungan tidak ditemukan" }, { status: 404 });
    }

    const patientId = encounter.patientId;

    // 3. PRISMA TRANSACTION (Atomic Operations)
    await prisma.$transaction(async (tx) => {
      
      // A. Masukkan Riwayat Penyakit
      if (penyakit && penyakit.length > 0) {
        const penyakitData = penyakit.map((namaPenyakit: string) => ({
          patientId: patientId,
          description: namaPenyakit,
          clinicalStatus: 'ACTIVE',
          notes: catatanPenyakit || null,
        }));
        await tx.conditionHistory.createMany({ data: penyakitData });
      }

      // B. Masukkan Riwayat Alergi
      if (alergi && alergi.length > 0) {
        const alergiData = alergi.map((a: { name: string, severity: string }) => ({
          patientId: patientId,
          description: a.name,
          reactionSeverity: a.severity, 
          notes: catatanAlergi || null,
        }));
        await tx.allergyIntolerance.createMany({ data: alergiData });
      }

      // C. Masukkan Riwayat Obat
      if (obat && obat.length > 0) {
        const obatData = obat.map((o: { name: string, dosage?: string }) => ({
          patientId: patientId,
          description: o.name,
          dosage: o.dosage || null,
          notes: catatanObat || null,
        }));
        await tx.medicationStatement.createMany({ data: obatData });
      }

      // D. Update Status Encounter
      // Karena kamu tidak punya field clinicalNotes di tabel Encounter,
      // kita cukup mengubah statusnya saja menjadi DIPERIKSA.
      await tx.encounter.update({
        where: { id: encounterId },
        data: {
          status: 'DIPERIKSA',
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Asesmen keperawatan berhasil disimpan secara atomik." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Assessment Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat menyimpan data." }, 
      { status: 500 }
    );
  }
}