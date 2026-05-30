import { z } from "zod";

// Base object — shared between registration and update schemas.
const patientBaseObject = z.object({
  // ── Identitas ──────────────────────────────────────────────────────────
  nik: z
    .string({ message: "NIK wajib diisi dalam bentuk teks" })
    .optional()
    .transform(val => val?.trim() || "")
    .refine(val => val === "" || (val.length === 16 && /^\d+$/.test(val)), {
      message: "NIK harus 16 digit angka jika diisi",
    }),

  namaLengkap: z
    .string({ message: "Nama lengkap wajib diisi" })
    .min(3, "Nama lengkap minimal 3 karakter"),

  tempatLahir: z
    .string({ message: "Tempat lahir wajib diisi" })
    .min(3, "Tempat lahir minimal 3 karakter"),

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
  alamatKtp:     z.string({ message: "Alamat KTP wajib diisi" }).min(1, "Alamat KTP wajib diisi"),
  provinsi:      z.string({ message: "Provinsi wajib dipilih" }).min(1, "Provinsi wajib dipilih"),
  kabupatenKota: z.string({ message: "Kabupaten/Kota wajib dipilih" }).min(1, "Kabupaten/Kota wajib dipilih"),
  kecamatan:     z.string({ message: "Kecamatan wajib dipilih" }).min(1, "Kecamatan wajib dipilih"),
  desa:          z.string({ message: "Desa/Kelurahan wajib dipilih" }).min(1, "Desa/Kelurahan wajib dipilih"),

  // ── Pekerjaan & Kontak ─────────────────────────────────────────────────
  pekerjaan:  z.string({ message: "Pekerjaan wajib diisi" }).min(1, "Pekerjaan wajib diisi"),
  perusahaan: z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),

  noHp: z
    .string({ message: "Nomor HP wajib diisi" })
    .regex(/^08\d{8,11}$/, "No. HP tidak valid (harus diawali 08 dan total 10-13 digit angka)"),

  // ── Data Wali (opsional — all-or-nothing rule below) ───────────────────
  namaWali:     z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),
  hubunganWali: z.string().nullable().optional().transform(val => (val === "" || !val) ? null : val),
  noHpWali:     z.string().nullable().optional()
                  .transform(val => (val === "" || !val) ? null : val)
                  .refine(val => val === null || /^08\d{8,11}$/.test(val), "No. HP Wali tidak valid (harus diawali 08 dan 10-13 digit)"),
});

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Guardian superRefine: mandatory for minors (<17); all-or-nothing for adults.
function guardianRefine(
  data: { tanggalLahir?: Date; namaWali?: string | null; hubunganWali?: string | null; noHpWali?: string | null },
  ctx: z.RefinementCtx
) {
  const isMinor = data.tanggalLahir ? calculateAge(data.tanggalLahir) < 17 : false;

  if (isMinor) {
    const msg = "Wajib diisi untuk pasien di bawah 17 tahun.";
    if (!data.namaWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["namaWali"] });
    if (!data.hubunganWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["hubunganWali"] });
    if (!data.noHpWali)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["noHpWali"] });
    return;
  }

  const hasAny = data.namaWali || data.hubunganWali || data.noHpWali;
  const hasAll = data.namaWali && data.hubunganWali && data.noHpWali;
  if (hasAny && !hasAll) {
    const msg = "Jika ada data wali, semua field wali wajib diisi secara lengkap.";
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