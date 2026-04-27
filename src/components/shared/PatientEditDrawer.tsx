"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
} from "@/lib/validations/patient";
import type { Patient } from "@/generated/prisma";

interface PatientEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

function SectionTitle({ children, suffix }: { children: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#2BB5A0" }}>
        {children}
      </span>
      {suffix && (
        <span className="text-xs font-normal tracking-widest uppercase text-gray-400">{suffix}</span>
      )}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-500">{message}</p>;
}

function toDateInput(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

export default function PatientEditDrawer({ isOpen, onClose, patient }: PatientEditDrawerProps) {
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; type: "success" | "error"; message: string }>({
    visible: false, type: "success", message: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) setRendered(true);
    else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PatientRegistrationInput>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: "onChange",
  });

  // Pre-fill form whenever the patient changes (drawer opens with new patient)
  useEffect(() => {
    if (patient && isOpen) {
      reset({
        nik: patient.nik,
        namaLengkap: patient.namaLengkap,
        tempatLahir: patient.tempatLahir,
        tanggalLahir: toDateInput(patient.tanggalLahir),
        jenisKelamin: patient.jenisKelamin as PatientRegistrationInput["jenisKelamin"],
        agama: patient.agama as PatientRegistrationInput["agama"],
        statusPernikahan: patient.statusPernikahan as PatientRegistrationInput["statusPernikahan"],
        jenisPasien: patient.jenisPasien as PatientRegistrationInput["jenisPasien"],
        alamatKtp: patient.alamatKtp,
        provinsi: patient.provinsi,
        kabupatenKota: patient.kabupatenKota,
        kecamatan: patient.kecamatan,
        desa: patient.desa,
        pekerjaan: patient.pekerjaan,
        perusahaan: patient.perusahaan ?? "",
        noHp: patient.noHp,
        namaWali: patient.namaWali ?? "",
        hubunganWali: patient.hubunganWali ?? "",
        noHpWali: patient.noHpWali ?? "",
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
    setToast({ visible: true, type, message });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  async function onSubmit(data: PatientRegistrationInput) {
    if (!patient) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.noRm}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Data pasien ${patient.noRm} berhasil diperbarui.`);
        router.refresh();
        setTimeout(() => onClose(), 1500);
      } else {
        showToast(json.message ?? "Gagal memperbarui data pasien.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan. Coba lagi.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  if (!rendered) return null;

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white transition-colors";
  const cls = (err?: { message?: string }) =>
    err ? `${inputBase} border-red-400 focus:border-red-400` : `${inputBase} border-gray-200 focus:border-[#2BB5A0]`;
  const selCls = (err?: { message?: string }) => `${cls(err)} appearance-none cursor-pointer`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
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

            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Sesuai KTP"
                autoComplete="off"
                {...register("namaLengkap")}
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
                    <option value="" disabled>Pilih jenis kelamin...</option>
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
                    <option value="" disabled>Pilih jenis pasien...</option>
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
                    <option value="" disabled>Pilih agama...</option>
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
                    <option value="" disabled>Pilih status...</option>
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
                placeholder="Jl. Nama Jalan, No. XX, RT/RW..."
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
                <div className="relative">
                  <select {...register("provinsi")} className={selCls(errors.provinsi)}>
                    <option value="" disabled>Pilih provinsi...</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.provinsi?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kabupaten / Kota <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("kabupatenKota")} className={selCls(errors.kabupatenKota)}>
                    <option value="" disabled>Pilih kab/kota...</option>
                    <option value="Kabupaten Gresik">Kabupaten Gresik</option>
                    <option value="Kota Surabaya">Kota Surabaya</option>
                    <option value="Kabupaten Sidoarjo">Kabupaten Sidoarjo</option>
                    <option value="Kabupaten Lamongan">Kabupaten Lamongan</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.kabupatenKota?.message} />
              </div>
            </div>

            {/* Kecamatan | Desa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kecamatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("kecamatan")} className={selCls(errors.kecamatan)}>
                    <option value="" disabled>Pilih kecamatan...</option>
                    <option value="Menganti">Menganti</option>
                    <option value="Kedamean">Kedamean</option>
                    <option value="Benjeng">Benjeng</option>
                    <option value="Cerme">Cerme</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <FieldError message={errors.kecamatan?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Desa / Kelurahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select {...register("desa")} className={selCls(errors.desa)}>
                    <option value="" disabled>Pilih desa...</option>
                    <option value="Menganti">Menganti</option>
                    <option value="Sidowungu">Sidowungu</option>
                    <option value="Hulaan">Hulaan</option>
                    <option value="Randupadangan">Randupadangan</option>
                  </select>
                  <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
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
                    <option value="">Pilih hubungan...</option>
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
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="patient-edit-form"
            disabled={isLoading || !isValid}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: "#2BB5A0" }}
          >
            {isLoading && <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />}
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            toast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}
    </>
  );
}
