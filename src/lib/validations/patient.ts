import { z } from "zod";

// Base object — shared between registration and update schemas.
const patientBaseObject = z.object({
    // ── Identitas ──────────────────────────────────────────────────────────
    nik: z
      .string()
      .min(1, "NIK tidak boleh kosong")
      .regex(/^\d{16}$/, "NIK harus 16 digit angka"),

    namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
    tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),

    tanggalLahir: z.string({ message: "Tanggal lahir wajib diisi" })
      .min(1, "Tanggal lahir wajib diisi")
      .transform((str) => new Date(str))
      .refine((d) => !isNaN(d.getTime()), "Format tanggal tidak valid")
      .refine((d) => d <= new Date(), "Tanggal lahir tidak boleh di masa depan")
      .refine((d) => d.getFullYear() >= 1000 && d.getFullYear() <= 9999, "Tahun lahir harus 4 digit")
      .refine((d) => {
        const ageYears = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return ageYears >= 0 && ageYears <= 150;
      }, "Umur harus antara 0 hingga 150 tahun"),

    jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
      error: "Jenis kelamin wajib dipilih",
    }),

    agama: z.enum(
      ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KHONGHUCU"],
      { error: "Agama wajib dipilih" }
    ),

    statusPernikahan: z.enum(
      ["BELUM_MENIKAH", "MENIKAH", "CERAI_HIDUP", "CERAI_MATI"],
      { error: "Status pernikahan wajib dipilih" }
    ),

    jenisPasien: z.enum(["UMUM", "BPJS"], {
      error: "Jenis pasien wajib dipilih",
    }),

    // ── Alamat ─────────────────────────────────────────────────────────────
    alamatKtp:     z.string().min(1, "Alamat KTP wajib diisi"),
    provinsi:      z.string().min(1, "Provinsi wajib dipilih"),
    kabupatenKota: z.string().min(1, "Kabupaten/Kota wajib dipilih"),
    kecamatan:     z.string().min(1, "Kecamatan wajib dipilih"),
    desa:          z.string().min(1, "Desa/Kelurahan wajib dipilih"),

    // ── Pekerjaan & Kontak ─────────────────────────────────────────────────
    pekerjaan:  z.string().min(1, "Pekerjaan wajib diisi"),
    perusahaan: z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),

    noHp: z
      .string()
      .min(10, "Nomor HP minimal 10 digit")
      .max(13, "Nomor HP maksimal 13 digit")
      .regex(/^\d+$/, "Nomor HP hanya boleh berisi angka"),

    // ── Data Wali (opsional — all-or-nothing rule below) ───────────────────
    namaWali:     z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),
    hubunganWali: z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),
    noHpWali:     z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),
  });

// Reusable guardian superRefine: if ANY wali field is present, ALL must be present.
function guardianRefine(
  data: { namaWali?: string | null; hubunganWali?: string | null; noHpWali?: string | null },
  ctx: z.RefinementCtx
) {
  const hasAny = data.namaWali || data.hubunganWali || data.noHpWali;
  const hasAll = data.namaWali && data.hubunganWali && data.noHpWali;
  if (hasAny && !hasAll) {
    const msg = "Jika ada data wali, semua field harus diisi.";
    if (!data.namaWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["namaWali"] });
    if (!data.hubunganWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["hubunganWali"] });
    if (!data.noHpWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["noHpWali"] });
  }
}

// Creation: all required fields enforced.
export const patientRegistrationSchema = patientBaseObject.superRefine(guardianRefine);

// Partial update: every field optional; guardian rule still applies if any wali field present.
export const patientUpdateSchema = patientBaseObject.partial().superRefine(guardianRefine);

export type PatientRegistrationOutput = z.output<typeof patientRegistrationSchema>;
export type PatientRegistrationInput = z.input<typeof patientRegistrationSchema>;
export type PatientUpdateOutput = z.output<typeof patientUpdateSchema>;
export type PatientUpdateInput = z.input<typeof patientUpdateSchema>;
