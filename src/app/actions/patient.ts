"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PatientRegistrationInput } from "@/lib/validations/patient";

export type CreatePatientResponse =
  | { success: true; data: { noRm: string } }
  | { success: false; error: string };

export async function createPatient(
  data: PatientRegistrationInput
): Promise<CreatePatientResponse> {
  const existingPatient = await prisma.patient.findUnique({
    where: { nik: data.nik },
  });

  if (existingPatient) {
    return {
      success: false,
      error: "NIK sudah terdaftar. Silakan hubungi admin.",
    };
  }

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
          nik: data.nik,
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
      return { success: true, data: { noRm: patient.noRm } };
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err) {
        const prismaErr = err as { code: string; meta?: { target?: string[] } };
        if (prismaErr.code === "P2002") {
          const target = prismaErr.meta?.target ?? [];
          if (target.includes("noRm")) continue;
          if (target.includes("nik")) {
            return { success: false, error: "NIK sudah terdaftar. Silakan hubungi admin." };
          }
        }
      }
      return { success: false, error: "Gagal menyimpan data pasien." };
    }
  }

  return {
    success: false,
    error: "Sistem sedang sibuk (No. RM Collision). Silakan coba lagi.",
  };
}
