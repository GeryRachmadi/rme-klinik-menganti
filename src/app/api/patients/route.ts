import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { patientRegistrationSchema } from "@/lib/validations/patient";
import { okResponse, errResponse } from "@/lib/api-response";
import { handleZodError } from "@/lib/api-errors";
import type { ApiResponse, PaginatedData } from "@/types/api";
import type { Patient } from "@/generated/prisma";

// GET /api/patients?page=1&limit=6&search=xxx&jenisKelamin=LAKI_LAKI&jenisPasien=UMUM
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedData<Patient>>>> {
  const { searchParams } = request.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "6", 10)));
  const skip  = (page - 1) * limit;

  const search        = searchParams.get("search")?.trim() ?? "";
  const jenisKelamin  = searchParams.get("jenisKelamin") ?? "";
  const jenisPasien   = searchParams.get("jenisPasien")  ?? "";

  const name = searchParams.get("name")?.trim() ?? "";
  const rm = searchParams.get("rm")?.trim() ?? "";
  const dob = searchParams.get("dob")?.trim() ?? "";

  const where = {
    ...(search && {
      OR: [
        { namaLengkap: { contains: search, mode: "insensitive" as const } },
        { nik:         { contains: search               } },
        { noRm:        { contains: search, mode: "insensitive" as const } },
        { ihs:         { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(name && { namaLengkap: { contains: name, mode: "insensitive" as const } }),
    ...(rm && { noRm: { contains: rm, mode: "insensitive" as const } }),
    ...(dob && {
      tanggalLahir: {
        gte: new Date(`${dob}T00:00:00.000Z`),
        lte: new Date(`${dob}T23:59:59.999Z`),
      },
    }),
    ...(jenisKelamin && { jenisKelamin: jenisKelamin as Patient["jenisKelamin"] }),
    ...(jenisPasien  && { jenisPasien:  jenisPasien  as Patient["jenisPasien"]  }),
  };

  try {
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return okResponse({ data: patients, total, page });
  } catch (err) {
    console.error("[GET /api/patients]", err);
    return errResponse("Gagal mengambil data pasien.", 500);
  }
}

// POST /api/patients
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Patient>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errResponse("Format JSON tidak valid.", 400);
  }

  const parsed = patientRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    const { response, status } = handleZodError(parsed.error);
    return NextResponse.json<ApiResponse<Patient>>(response, { status });
  }

  const data = parsed.data;

  // Intercept empty NIK and generate a dummy unique NIK
  let finalNik = data.nik?.trim() || "";
  if (!finalNik) {
    finalNik = `NONIK-${Date.now()}`;
  }

  // Pre-check duplicate NIK before entering retry loop
  const existing = await prisma.patient.findUnique({ where: { nik: finalNik } });
  if (existing) {
    return errResponse("NIK sudah terdaftar. Silakan hubungi admin.", 409);
  }

  // RM generation with P2002-on-noRm retry (max 3 attempts)
  for (let attempt = 0; attempt < 3; attempt++) {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Find the highest sequence number for this month (survives deletions)
    const lastPatient = await prisma.patient.findFirst({
      where: { noRm: { startsWith: `RM-${yyyymm}-` } },
      orderBy: { noRm: "desc" },
      select: { noRm: true },
    });

    let nextSequence = 1;
    if (lastPatient) {
      const lastSequence = parseInt(lastPatient.noRm.split("-")[2], 10);
      nextSequence = lastSequence + 1;
    }

    const noRm = `RM-${yyyymm}-${String(nextSequence + attempt).padStart(4, "0")}`;

    try {
      const patient = await prisma.patient.create({
        data: {
          noRm,
          nik: finalNik,
          namaLengkap: data.namaLengkap,
          tempatLahir: data.tempatLahir,
          tanggalLahir: new Date(data.tanggalLahir),
          jenisKelamin: data.jenisKelamin,
          agama: data.agama,
          statusPernikahan: data.statusPernikahan,
          jenisPasien: data.jenisPasien,
          alamatKtp: data.alamatKtp,
          provinsi: data.provinsi,
          kabupatenKota: data.kabupatenKota,
          kecamatan: data.kecamatan,
          desa: data.desa,
          pekerjaan: data.pekerjaan,
          perusahaan: data.perusahaan?.trim() || null,
          noHp: data.noHp,
          namaWali: data.namaWali?.trim() || null,
          hubunganWali: data.hubunganWali?.trim() || null,
          noHpWali: data.noHpWali?.trim() || null,
        },
      });

      revalidatePath("/rekam-medis");
      return okResponse(patient, `Pasien berhasil didaftar. No. RM: ${patient.noRm}`);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const prismaErr = err as { code: string; meta?: { target?: string[] } };
        if (prismaErr.code === "P2002") {
          const target = prismaErr.meta?.target ?? [];
          if (target.includes("noRm")) continue;
          if (target.includes("nik")) {
            return errResponse("NIK sudah terdaftar. Silakan hubungi admin.", 409);
          }
        }
      }
      console.error("[POST /api/patients]", err);
      return errResponse("Gagal menyimpan data pasien.", 500);
    }
  }

  return errResponse("Sistem sedang sibuk (No. RM Collision). Silakan coba lagi.", 503);
}
