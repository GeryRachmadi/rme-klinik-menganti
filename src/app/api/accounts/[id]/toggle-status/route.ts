import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { okResponse, errResponse } from "@/lib/api-response";
import { handlePrismaError } from "@/lib/api-errors";

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

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminRole();
  if (!authResult.authorized) return errResponse(authResult.error, 403);

  const { id } = await params;

  if (id === authResult.session.user.id) {
    return errResponse("Tidak dapat menonaktifkan akun Anda sendiri.", 403);
  }

  const existing = await prisma.account.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    return errResponse("Akun tidak ditemukan.", 404);
  }

  try {
    const account = await prisma.account.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: ACCOUNT_SELECT,
    });

    return okResponse(account, "Status akun berhasil diubah.");
  } catch (err) {
    const { response, status } = handlePrismaError(err);
    return Response.json(response, { status });
  }
}
