import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { okResponse, errResponse } from "@/lib/api-response";
import { updateAccountSchema } from "@/lib/validation";
import { handlePrismaError, handleZodError } from "@/lib/api-errors";

const ACCOUNT_SELECT = {
  id: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  practitioner: {
    select: {
      id: true,
      name: true,
      identifierStr: true,
      speciality: true,
      ihsNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return errResponse("Akses ditolak. Hanya Admin yang dapat mengakses fitur ini.", 403);
  }

  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id },
    select: ACCOUNT_SELECT,
  });

  if (!account) {
    return errResponse("Akun tidak ditemukan.", 404);
  }

  return okResponse(account);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return errResponse("Akses ditolak. Hanya Admin yang dapat mengakses fitur ini.", 403);
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errResponse("Format JSON tidak valid.", 400);
  }

  let validated: ReturnType<typeof updateAccountSchema.parse>;
  try {
    validated = updateAccountSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const { response, status } = handleZodError(err);
      return Response.json(response, { status });
    }
    return errResponse("Validasi gagal.", 400);
  }

  const existing = await prisma.account.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return errResponse("Akun tidak ditemukan.", 404);
  }

  if (validated.username) {
    const conflict = await prisma.account.findFirst({
      where: { username: validated.username, NOT: { id } },
      select: { id: true },
    });
    if (conflict) return errResponse("Username sudah digunakan.", 400);
  }

  if (validated.nik) {
    const conflict = await prisma.practitioner.findFirst({
      where: { identifierStr: validated.nik, NOT: { accountId: id } },
      select: { id: true },
    });
    if (conflict) return errResponse("NIK sudah terdaftar dalam sistem.", 400);
  }

  const accountData: Record<string, unknown> = {};
  if (validated.username) accountData.username = validated.username;
  if (validated.password) accountData.password = await bcrypt.hash(validated.password, 10);

  const practitionerData: Record<string, unknown> = {};
  if (validated.namaLengkap) practitionerData.name = validated.namaLengkap;
  if (validated.nik !== undefined) practitionerData.identifierStr = validated.nik;
  if (validated.spesialisasi !== undefined) practitionerData.speciality = validated.spesialisasi || null;

  try {
    const account = await prisma.$transaction(async (tx) => {
      return tx.account.update({
        where: { id },
        data: {
          ...accountData,
          ...(Object.keys(practitionerData).length > 0 && {
            practitioner: { update: practitionerData },
          }),
        },
        select: ACCOUNT_SELECT,
      });
    });

    return okResponse(account, "Akun berhasil diperbarui.");
  } catch (err) {
    const { response, status } = handlePrismaError(err);
    return Response.json(response, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return errResponse("Akses ditolak. Hanya Admin yang dapat mengakses fitur ini.", 403);
  }

  const { id } = await params;

  const existing = await prisma.account.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return errResponse("Akun tidak ditemukan.", 404);
  }

  try {
    await prisma.account.delete({ where: { id } });
    return okResponse(null, "Akun berhasil dihapus.");
  } catch (err) {
    const { response, status } = handlePrismaError(err);
    return Response.json(response, { status });
  }
}
