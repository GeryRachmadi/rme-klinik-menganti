import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { encounterId } = await params;

  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: {
        select: {
          namaLengkap: true,
          noRm: true,
          nik: true,
          jenisKelamin: true,
          tanggalLahir: true,
        },
      },
      practitioner: {
        select: { id: true, name: true, speciality: true },
      },
    },
  });

  if (!encounter) {
    return NextResponse.json({ success: false, error: "Kunjungan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: encounter });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "PENDAFTARAN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { encounterId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Body tidak valid" }, { status: 400 });
  }

  const { priority, reasonCode, patientType, practitionerId } = body as Record<string, unknown>;

  if (!priority || !patientType || !practitionerId || reasonCode === undefined) {
    return NextResponse.json({ success: false, error: "Field tidak lengkap." }, { status: 400 });
  }

  const encounter = await prisma.encounter.findUnique({ where: { id: encounterId } });
  if (!encounter) {
    return NextResponse.json({ success: false, error: "Kunjungan tidak ditemukan" }, { status: 404 });
  }

  const updated = await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      priority: typeof priority === "string" ? priority : encounter.priority,
      reasonCode: typeof reasonCode === "string" ? (reasonCode.trim() || null) : encounter.reasonCode,
      patientType: typeof patientType === "string" ? patientType : encounter.patientType,
      practitionerId: typeof practitionerId === "string" ? practitionerId : encounter.practitionerId,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ encounterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "PENDAFTARAN"].includes(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { encounterId } = await params;

  const encounter = await prisma.encounter.findUnique({ where: { id: encounterId } });
  if (!encounter) {
    return NextResponse.json({ success: false, error: "Kunjungan tidak ditemukan" }, { status: 404 });
  }

  if (encounter.status !== "MENUNGGU") {
    return NextResponse.json(
      { success: false, error: "Hanya antrean dengan status Menunggu yang dapat dihapus." },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.syncQueue.deleteMany({ where: { encounterId } }),
    prisma.observation.deleteMany({ where: { encounterId } }),
    prisma.conditionDiagnosis.deleteMany({ where: { encounterId } }),
    prisma.procedure.deleteMany({ where: { encounterId } }),
    prisma.serviceRequest.deleteMany({ where: { encounterId } }),
    prisma.medicationRequest.deleteMany({ where: { encounterId } }),
    prisma.encounter.delete({ where: { id: encounterId } }),
  ]);

  return NextResponse.json({ success: true });
}
