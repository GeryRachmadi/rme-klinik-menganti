"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
  type PatientRegistrationOutput,
} from "@/lib/validations/patient";
import type { Patient } from "@/generated/prisma";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { INDONESIA_REGIONS } from "@/data/indonesia-regions";

interface PatientEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-500">{message}</p>;
}

function toDateInput(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

export default function PatientEditDrawer({ isOpen, onClose, patient, onSuccess }: PatientEditDrawerProps) {
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false, message: "", type: "success"
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref for namaLengkap — merged with RHF ref so we can focus it on open
  const namaLengkapRef = useRef<HTMLInputElement | null>(null);

  // Mount/unmount for drawer animation
  useEffect(() => {
    if (isOpen) setRendered(true);
    else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Focus namaLengkap after the slide-in animation completes
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => namaLengkapRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    control,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<PatientRegistrationInput, any, PatientRegistrationOutput>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: "onChange",
  });

  // ── Item 16: cascading Provinsi → Kabupaten/Kota ──────────────────────────
  const watchedProvinsi = watch("provinsi");
  const kabupatenOptions = useMemo(
    () => INDONESIA_REGIONS.find((r) => r.provinsi === watchedProvinsi)?.kabupaten ?? [],
    [watchedProvinsi]
  );
  // Clear kabupatenKota only on a *user* province change — never on the first
  // sync (reset() prefill from existing patient), so existing values survive.
  const prevProvinsi = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevProvinsi.current !== undefined && prevProvinsi.current !== watchedProvinsi) {
      setValue("kabupatenKota", "");
    }
    prevProvinsi.current = watchedProvinsi;
  }, [watchedProvinsi, setValue]);

  // Pre-fill all fields whenever patient changes and drawer is open
  useEffect(() => {
    if (patient && isOpen) {
      reset({
        nik:               patient.nik,
        namaLengkap:       patient.namaLengkap,
        tempatLahir:       patient.tempatLahir,
        tanggalLahir:      toDateInput(patient.tanggalLahir),
        jenisKelamin:      patient.jenisKelamin      as PatientRegistrationInput["jenisKelamin"],
        agama:             patient.agama             as PatientRegistrationInput["agama"],
        statusPernikahan:  patient.statusPernikahan  as PatientRegistrationInput["statusPernikahan"],
        jenisPasien:       patient.jenisPasien       as PatientRegistrationInput["jenisPasien"],
        alamatKtp:         patient.alamatKtp,
        provinsi:          patient.provinsi,
        kabupatenKota:     patient.kabupatenKota,
        kecamatan:         patient.kecamatan,
        desa:              patient.desa,
        pekerjaan:         patient.pekerjaan,
        perusahaan:        patient.perusahaan   ?? "",
        noHp:              patient.noHp,
        namaWali:          patient.namaWali     ?? "",
        hubunganWali:      patient.hubunganWali ?? "",
        noHpWali:          patient.noHpWali     ?? "",
      });
    }
  }, [patient, isOpen, reset]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setToast((t) => ({ ...t, visible: false }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [isOpen, reset]);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  async function onSubmit(data: PatientRegistrationOutput) {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      // Map empty optional strings → null before preparing the request body
      const payload = {
        ...data,
        perusahaan:   data.perusahaan   || null,
        namaWali:     data.namaWali     || null,
        hubunganWali: data.hubunganWali || null,
        noHpWali:     data.noHpWali     || null,
      };

      const res = await fetch(`/api/patients/${patient.noRm}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null); // Safely parse JSON in case of 502/504 HTML responses

      if (!res.ok) {
        // Handle specific 409 Conflict for NIK
        if (res.status === 409 && json?.error?.toLowerCase().includes("nik")) {
          setError("nik", { type: "server", message: json.error });
          return; // Stop execution here so the toast doesn't also show
        }
        
        // Throw general error for the catch block
        throw new Error(json?.error || json?.message || "Gagal menyimpan perubahan ke server.");
      }

      showToast("Data pasien berhasil diperbarui.", "success");
      if (onSuccess) onSuccess();
      // Delay unmounting slightly so the Next.js fetch doesn't get canceled
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (error: any) {
      // Handle "TypeError: Failed to fetch" (Network/Offline error)
      if (error.message === "Failed to fetch") {
        showToast("Koneksi terputus. Periksa jaringan internet Anda.", "error");
      } else {
        showToast(error.message || "Terjadi kesalahan tidak terduga.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!rendered) return null;

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white transition-colors";
  const cls = (err?: { message?: string }) =>
    err ? `${inputBase} border-red-400 focus:border-red-400` : `${inputBase} border-gray-200 focus:border-[#2BB5A0]`;
  const selCls = (err?: { message?: string }) => `${cls(err)} appearance-none cursor-pointer`;

  // Merge RHF ref with our local namaLengkapRef
  const { ref: rhfNamaRef, ...namaRest } = register("namaLengkap");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
              Edit Data Pasien
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Ubah informasi pasien{patient ? ` — ${patient.noRm}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5"
            title="Tutup"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          id="patient-edit-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          {/* Section 1: Identitas */}
          <div className="space-y-4">
            <SectionTitle>Identitas Pasien</SectionTitle>

            {/* No. Rekam Medis (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                No. Rekam Medis{" "}
                <span className="font-normal text-gray-400">(tidak dapat diubah)</span>
              </label>
              <input
                type="text"
                value={patient?.noRm ?? ""}
                readOnly
                tabIndex={-1}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-100 bg-gray-100 text-sm text-gray-400 cursor-not-allowed select-none"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                NIK <span className="text-red-500">*</span>{" "}
                <span className="font-normal text-gray-400">(Nomor Induk Kependudukan)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Masukkan 16 digit NIK"
                autoComplete="off"
                maxLength={16}
                {...(() => {
                  const { onChange, ...rest } = register("nik");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      onChange(e);
                    },
                  };
                })()}
                className={cls(errors.nik)}
              />
              <FieldError message={errors.nik?.message} />
            </div>

            {/* Nama Lengkap — autofocused on drawer open */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Sesuai KTP"
                autoComplete="off"
                ref={(el) => {
                  rhfNamaRef(el);
                  namaLengkapRef.current = el;
                }}
                {...namaRest}
                className={cls(errors.namaLengkap)}
              />
              <FieldError message={errors.namaLengkap?.message} />
            </div>

            {/* Jenis Kelamin | Jenis Pasien */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("jenisKelamin")} className={selCls(errors.jenisKelamin)}>
                    <option value="" disabled>Pilih jenis kelamin…</option>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.jenisKelamin?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Jenis Pasien <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("jenisPasien")} className={selCls(errors.jenisPasien)}>
                    <option value="" disabled>Pilih jenis pasien…</option>
                    <option value="UMUM">Umum</option>
                    <option value="BPJS">BPJS</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.jenisPasien?.message} />
              </div>
            </div>

            {/* Tempat Lahir | Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Kota/Kabupaten lahir"
                  autoComplete="off"
                  {...register("tempatLahir")}
                  className={cls(errors.tempatLahir)}
                />
                <FieldError message={errors.tempatLahir?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  autoComplete="off"
                  {...register("tanggalLahir")}
                  className={`${cls(errors.tanggalLahir)} text-gray-600`}
                />
                <FieldError message={errors.tanggalLahir?.message} />
              </div>
            </div>

            {/* Agama | Status Pernikahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Agama <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("agama")} className={selCls(errors.agama)}>
                    <option value="" disabled>Pilih agama…</option>
                    <option value="ISLAM">Islam</option>
                    <option value="KRISTEN">Kristen</option>
                    <option value="KATOLIK">Katolik</option>
                    <option value="HINDU">Hindu</option>
                    <option value="BUDDHA">Buddha</option>
                    <option value="KHONGHUCU">Khonghucu</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.agama?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Status Pernikahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("statusPernikahan")} className={selCls(errors.statusPernikahan)}>
                    <option value="" disabled>Pilih status…</option>
                    <option value="BELUM_MENIKAH">Belum Menikah</option>
                    <option value="MENIKAH">Menikah</option>
                    <option value="CERAI_HIDUP">Cerai Hidup</option>
                    <option value="CERAI_MATI">Cerai Mati</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.statusPernikahan?.message} />
              </div>
            </div>
          </div>

          {/* Section 2: Alamat */}
          <div className="space-y-4">
            <SectionTitle>Alamat</SectionTitle>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Alamat KTP <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Jl. Nama Jalan, No. XX, RT/RW…"
                autoComplete="off"
                rows={3}
                {...register("alamatKtp")}
                className={`${cls(errors.alamatKtp)} resize-none`}
              />
              <FieldError message={errors.alamatKtp?.message} />
            </div>

            {/* Provinsi | Kabupaten/Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="provinsi"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={INDONESIA_REGIONS.map((r) => r.provinsi)}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih provinsi..."
                      hasError={!!errors.provinsi}
                    />
                  )}
                />
                <FieldError message={errors.provinsi?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kabupaten / Kota <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="kabupatenKota"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={kabupatenOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih kabupaten/kota..."
                      disabled={!watchedProvinsi}
                      hasError={!!errors.kabupatenKota}
                    />
                  )}
                />
                <FieldError message={errors.kabupatenKota?.message} />
              </div>
            </div>

            {/* Kecamatan | Desa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kecamatan <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("kecamatan")}
                  type="text"
                  autoComplete="off"
                  placeholder="Contoh: Menganti"
                  className={cls(errors.kecamatan)}
                />
                <FieldError message={errors.kecamatan?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Desa / Kelurahan <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("desa")}
                  type="text"
                  autoComplete="off"
                  placeholder="Contoh: Sidowungu"
                  className={cls(errors.desa)}
                />
                <FieldError message={errors.desa?.message} />
              </div>
            </div>
          </div>

          {/* Section 3: Kontak */}
          <div className="space-y-4">
            <SectionTitle>Kontak Pasien</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Karyawan Swasta"
                  autoComplete="off"
                  {...register("pekerjaan")}
                  className={cls(errors.pekerjaan)}
                />
                <FieldError message={errors.pekerjaan?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Perusahaan <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="PT Bank Mandiri (Persero) Tbk"
                  autoComplete="off"
                  {...register("perusahaan")}
                  className={cls(errors.perusahaan)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                No. HP / Kontak <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="08123456789"
                autoComplete="off"
                maxLength={13}
                {...(() => {
                  const { onChange, ...rest } = register("noHp");
                  return {
                    ...rest,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      onChange(e);
                    },
                  };
                })()}
                className={cls(errors.noHp)}
              />
              <FieldError message={errors.noHp?.message} />
            </div>
          </div>

          {/* Section 4: Data Wali */}
          <div className="space-y-4">
            <SectionTitle suffix="(Opsional)">Data Wali</SectionTitle>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Lengkap Wali
              </label>
              <input
                type="text"
                placeholder="Nama lengkap dari penanggung jawab"
                autoComplete="off"
                {...register("namaWali")}
                className={cls(errors.namaWali)}
              />
              <FieldError message={errors.namaWali?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hubungan</label>
                <div className="relative">
                  <select {...register("hubunganWali")} className={selCls(errors.hubunganWali)}>
                    <option value="">-- Tidak ada / Hapus Hubungan --</option>
                    <option value="Suami">Suami</option>
                    <option value="Istri">Istri</option>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Anak">Anak</option>
                    <option value="Kakak">Kakak</option>
                    <option value="Adik">Adik</option>
                    <option value="Kakek">Kakek</option>
                    <option value="Nenek">Nenek</option>
                    <option value="Wali">Wali</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.hubunganWali?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. HP Wali</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="08123456789"
                  autoComplete="off"
                  maxLength={13}
                  {...(() => {
                    const { onChange, ...rest } = register("noHpWali");
                    return {
                      ...rest,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                        onChange(e);
                      },
                    };
                  })()}
                  className={cls(errors.noHpWali)}
                />
                <FieldError message={errors.noHpWali?.message} />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="patient-edit-form"
            disabled={!isValid || !isDirty || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: "#2BB5A0" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${toast.type === "error" ? "border-red-200" : "border-green-200"}`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {toast.type === "error" ? (
            <X size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}
    </>
  );
}
