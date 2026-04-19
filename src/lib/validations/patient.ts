import { z } from "zod";

export const patientRegistrationSchema = z.object({
  nik: z
    .string()
    .regex(/^\d{16}$/, "NIK wajib diisi dengan 16 Digit"),

  namaLengkap: z
    .string()
    .min(1, "Nama lengkap wajib diisi"),

  tempatLahir: z
    .string()
    .min(1, "Tempat lahir wajib diisi"),

  tanggalLahir: z
    .string()
    .min(1, "Tanggal lahir wajib diisi"),

  agama: z
    .string()
    .min(1, "Agama wajib dipilih"),

  statusPernikahan: z
    .string()
    .min(1, "Status pernikahan wajib dipilih"),

  alamatKtp: z
    .string()
    .min(1, "Alamat KTP wajib diisi"),

  provinsi: z
    .string()
    .min(1, "Provinsi wajib dipilih"),

  kabupatenKota: z
    .string()
    .min(1, "Kabupaten/Kota wajib dipilih"),

  kecamatan: z
    .string()
    .min(1, "Kecamatan wajib dipilih"),

  desa: z
    .string()
    .min(1, "Desa/Kelurahan wajib dipilih"),

  pekerjaan: z
    .string()
    .min(1, "Pekerjaan wajib diisi"),

  perusahaan: z
    .string()
    .optional(),

  noHp: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(13, "Nomor HP maksimal 13 digit")
    .regex(/^\d+$/, "Nomor HP hanya boleh berisi angka"),

  namaWali: z.string().optional(),
  hubunganWali: z.string().optional(),
  noHpWali: z.string().optional(),
});

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;
