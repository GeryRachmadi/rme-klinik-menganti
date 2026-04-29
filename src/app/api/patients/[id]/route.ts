import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { patientUpdateSchema } from "@/lib/validations/patient";
import { okResponse, errResponse } from "@/lib/api-response";
import { handlePrismaError, handleZodError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { Patient } from "@/generated/prisma";

// GET /api/patients/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Patient>>> {
  const session = await auth();
  if (!session) return errResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const patient = await prisma.patient.findUnique({ where: { noRm: id } });
    if (!patient) return errResponse("Pasien tidak ditemukan.", 404);
    return okResponse(patient);
  } catch (err) {
    console.error("[GET /api/patients/[id]]", err);
    return errResponse("Gagal mengambil data pasien.", 500);
  }
}

// PUT /api/patients/[id]  (partial update — only provided fields are written)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Patient>>> {
  const session = await auth();
  if (!session) return errResponse("Unauthorized", 401);
  
  // Ensure only authorized roles can update
  const allowedRoles = ["ADMIN", "PENDAFTARAN", "PERAWAT", "DOKTER"];
  if (!allowedRoles.includes(session.user.role)) {
    return errResponse("Forbidden", 403);
  }

  const { id } = await params;

  // Validate body first — return 400 before any DB round-trip
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errResponse("Format JSON tidak valid.", 400);
  }

  const parsed = patientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const { response, status } = handleZodError(parsed.error);
    return NextResponse.json<ApiResponse<Patient>>(response, { status });
  }

  const data = parsed.data;

  // Existence check
  let existing: { id: string } | null;
  try {
    existing = await prisma.patient.findUnique({ where: { noRm: id }, select: { id: true } });
  } catch (err) {
    console.error("[PUT /api/patients/[id]] existence check", err);
    return errResponse("Gagal memeriksa data pasien.", 500);
  }
  if (!existing) return errResponse("Pasien tidak ditemukan.", 404);

  // NIK conflict only relevant when the caller is changing the NIK
  if (data.nik !== undefined) {
    try {
      const nikConflict = await prisma.patient.findFirst({
        where: { nik: data.nik, NOT: { id: existing.id } },
        select: { id: true },
      });
      if (nikConflict) return errResponse("NIK sudah terdaftar oleh pasien lain.", 409);
    } catch (err) {
      console.error("[PUT /api/patients/[id]] NIK conflict check", err);
      return errResponse("Gagal memeriksa data pasien.", 500);
    }
  }

  try {
    const patient = await prisma.patient.update({
      where: { noRm: id },
      data: {
        ...(data.nik !== undefined && { nik: data.nik }),
        ...(data.namaLengkap !== undefined && { namaLengkap: data.namaLengkap }),
        ...(data.tempatLahir !== undefined && { tempatLahir: data.tempatLahir }),
        ...(data.tanggalLahir !== undefined && { tanggalLahir: new Date(data.tanggalLahir) }),
        ...(data.jenisKelamin !== undefined && { jenisKelamin: data.jenisKelamin }),
        ...(data.agama !== undefined && { agama: data.agama }),
        ...(data.statusPernikahan !== undefined && { statusPernikahan: data.statusPernikahan }),
        ...(data.jenisPasien !== undefined && { jenisPasien: data.jenisPasien }),
        ...(data.alamatKtp !== undefined && { alamatKtp: data.alamatKtp }),
        ...(data.provinsi !== undefined && { provinsi: data.provinsi }),
        ...(data.kabupatenKota !== undefined && { kabupatenKota: data.kabupatenKota }),
        ...(data.kecamatan !== undefined && { kecamatan: data.kecamatan }),
        ...(data.desa !== undefined && { desa: data.desa }),
        ...(data.pekerjaan !== undefined && { pekerjaan: data.pekerjaan }),
        ...(data.perusahaan !== undefined && { perusahaan: data.perusahaan }),
        ...(data.noHp !== undefined && { noHp: data.noHp }),
        ...(data.namaWali !== undefined && { namaWali: data.namaWali }),
        ...(data.hubunganWali !== undefined && { hubunganWali: data.hubunganWali }),
        ...(data.noHpWali !== undefined && { noHpWali: data.noHpWali }),
      },
    });

    revalidatePath("/", "layout");
    return okResponse(patient, "Pasien berhasil diperbarui.");
  } catch (err) {
    const { response, status } = handlePrismaError(err);
    return NextResponse.json<ApiResponse<Patient>>(response, { status });
  }
}

// DELETE /api/patients/[id]
// Hard delete — schema has no deletedAt field (see CLAUDE.md guardrails).
// P2003 (patient has linked records) returns 409.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;

  let existing: { id: string } | null;
  try {
    existing = await prisma.patient.findUnique({ where: { noRm: id }, select: { id: true } });
  } catch (err) {
    console.error("[DELETE /api/patients/[id]] existence check", err);
    return errResponse("Gagal memeriksa data pasien.", 500);
  }
  if (!existing) return errResponse("Pasien tidak ditemukan.", 404);

  try {
    await prisma.patient.delete({ where: { noRm: id } });
    revalidatePath("/rekam-medis");
    return okResponse(null, "Pasien berhasil dihapus.");
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const { code } = err as { code: string };
      if (code === "P2003") {
        return errResponse(
          "Pasien tidak dapat dihapus karena memiliki data terkait.",
          409
        );
      }
    }
    const { response, status } = handlePrismaError(err);
    return NextResponse.json<ApiResponse<null>>(response, { status });
  }
}
