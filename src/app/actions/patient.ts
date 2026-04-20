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
  for (let attempt = 0; attempt < 3; attempt++) {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const count = await prisma.patient.count({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
    });

    const noRm = `RM-${yyyymm}-${String(count + 1 + attempt).padStart(4, "0")}`;

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
            return { success: false, error: "NIK sudah terdaftar dalam sistem." };
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
