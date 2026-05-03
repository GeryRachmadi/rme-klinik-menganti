import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdminRole, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { okResponse, errResponse } from "@/lib/api-response";
import { createAccountSchema } from "@/lib/validation";
import { handlePrismaError, handleZodError } from "@/lib/api-errors";
import { ZodError } from "zod";

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role")?.trim() ?? "";

  // If requesting doctors specifically, just require basic authentication
  // Otherwise, require full admin privileges
  if (role === "DOKTER") {
    const session = await auth();
    if (!session) return errResponse("Akses ditolak: Tidak diizinkan.", 401);
  } else {
    const authResult = await requireAdminRole();
    if (!authResult.authorized) return errResponse(authResult.error, 403);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const search = searchParams.get("search")?.trim() ?? "";

  const where: any = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { practitioner: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, accounts] = await Promise.all([
    prisma.account.count({ where }),
    prisma.account.findMany({
      where,
      select: ACCOUNT_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return okResponse({
    accounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminRole();
  if (!authResult.authorized) return errResponse(authResult.error, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errResponse("Format JSON tidak valid.", 400);
  }

  let validated: ReturnType<typeof createAccountSchema.parse>;
  try {
    validated = createAccountSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const { response, status } = handleZodError(err);
      return Response.json(response, { status });
    }
    return errResponse("Validasi gagal.", 400);
  }

  const [existingUsername, existingNik] = await Promise.all([
    prisma.account.findUnique({ where: { username: validated.username }, select: { id: true } }),
    prisma.practitioner.findFirst({ where: { identifierStr: validated.nik }, select: { id: true } }),
  ]);

  if (existingUsername) {
    return errResponse("Username sudah digunakan.", 400);
  }
  if (existingNik) {
    return errResponse("NIK sudah terdaftar dalam sistem.", 400);
  }

  const hashedPassword = await bcrypt.hash(validated.password, 10);

  try {
    const account = await prisma.$transaction(async (tx) => {
      const newAccount = await tx.account.create({
        data: {
          username: validated.username,
          password: hashedPassword,
          role: validated.role,
          isActive: true,
          practitioner: {
            create: {
              name: validated.namaLengkap,
              identifierStr: validated.nik,
              speciality: validated.spesialisasi || null,
            },
          },
        },
        select: ACCOUNT_SELECT,
      });
      return newAccount;
    });

    return okResponse(account, "Akun berhasil dibuat.", 201);
  } catch (err) {
    const { response, status } = handlePrismaError(err);
    return Response.json(response, { status });
  }
}
