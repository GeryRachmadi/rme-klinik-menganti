"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
} from "@/lib/validations/patient";

interface PatientRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Tiny presentational helpers (defined outside to avoid remounting) ─────────

function SectionTitle({
  children,
  suffix,
}: {
  children: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2">
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: "#2BB5A0" }}
      >
        {children}
      </span>
      {suffix && (
        <span className="text-xs font-normal tracking-widest uppercase text-gray-400">
          {suffix}
        </span>
      )}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 font-medium">⚠ {message}</p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PatientRegistrationDrawer({
  isOpen,
  onClose,
}: PatientRegistrationDrawerProps) {
  const [rendered, setRendered] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; type: "success" | "error"; message: string }>({
    visible: false, type: "success", message: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount/unmount with slide animation
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientRegistrationInput>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      nik: "",
      namaLengkap: "",
      tempatLahir: "",
      tanggalLahir: "",
      agama: "",
      statusPernikahan: "",
      alamatKtp: "",
      provinsi: "",
      kabupatenKota: "",
      kecamatan: "",
      desa: "",
      pekerjaan: "",
      perusahaan: "",
      noHp: "",
      namaWali: "",
      hubunganWali: "",
      noHpWali: "",
    },
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, message });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setToast((t) => ({ ...t, visible: false }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [isOpen, reset]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  function onSubmit(data: PatientRegistrationInput) {
    console.log("Patient registration data:", data);
    showToast("Data pasien berhasil disimpan.");
  }

  if (!rendered) return null;

  // ── Style tokens ────────────────────────────────────────────────────────────
  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white transition-colors";
  const cls = (err?: { message?: string }) =>
    err
      ? `${inputBase} border-red-400 focus:border-red-400`
      : `${inputBase} border-gray-200 focus:border-[#2BB5A0]`;
  const selCls = (err?: { message?: string }) =>
    `${cls(err)} appearance-none cursor-pointer`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Tambah Pasien Baru
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Lengkapi informasi dibawah untuk membuat data pasien baru
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

        {/* ── Scrollable form body ─────────────────────────────────────────── */}
        <form
          id="patient-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          {/* ── Section 1: IDENTITAS UTAMA ─────────────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Identitas Utama</SectionTitle>

            {/* NIK */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                NIK{" "}
                <span className="font-normal text-gray-400">
                  (Nomor Induk Kependudukan)
                </span>
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
                Nama Lengkap
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

            {/* Tempat Lahir | Tanggal Lahir */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tempat Lahir
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
                  Tanggal Lahir
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Agama
                </label>
                <div className="relative">
                  <select
                    {...register("agama")}
                    className={selCls(errors.agama)}
                  >
                    <option value="" disabled>
                      Pilih agama...
                    </option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.agama?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Status Pernikahan
                </label>
                <div className="relative">
                  <select
                    {...register("statusPernikahan")}
                    className={selCls(errors.statusPernikahan)}
                  >
                    <option value="" disabled>
                      Pilih status...
                    </option>
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Menikah">Menikah</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.statusPernikahan?.message} />
              </div>
            </div>
          </div>

          {/* ── Section 2: ALAMAT LENGKAP ──────────────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Alamat Lengkap</SectionTitle>

            {/* Alamat KTP */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Alamat KTP
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Provinsi
                </label>
                <div className="relative">
                  <select
                    {...register("provinsi")}
                    className={selCls(errors.provinsi)}
                  >
                    <option value="" disabled>
                      Pilih provinsi...
                    </option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.provinsi?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kabupaten / Kota
                </label>
                <div className="relative">
                  <select
                    {...register("kabupatenKota")}
                    className={selCls(errors.kabupatenKota)}
                  >
                    <option value="" disabled>
                      Pilih kab/kota...
                    </option>
                    <option value="Kabupaten Gresik">Kabupaten Gresik</option>
                    <option value="Kota Surabaya">Kota Surabaya</option>
                    <option value="Kabupaten Sidoarjo">
                      Kabupaten Sidoarjo
                    </option>
                    <option value="Kabupaten Lamongan">
                      Kabupaten Lamongan
                    </option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.kabupatenKota?.message} />
              </div>
            </div>

            {/* Kecamatan | Desa */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kecamatan
                </label>
                <div className="relative">
                  <select
                    {...register("kecamatan")}
                    className={selCls(errors.kecamatan)}
                  >
                    <option value="" disabled>
                      Pilih kecamatan...
                    </option>
                    <option value="Menganti">Menganti</option>
                    <option value="Kedamean">Kedamean</option>
                    <option value="Benjeng">Benjeng</option>
                    <option value="Cerme">Cerme</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.kecamatan?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Desa / Kelurahan
                </label>
                <div className="relative">
                  <select
                    {...register("desa")}
                    className={selCls(errors.desa)}
                  >
                    <option value="" disabled>
                      Pilih desa...
                    </option>
                    <option value="Menganti">Menganti</option>
                    <option value="Sidowungu">Sidowungu</option>
                    <option value="Hulaan">Hulaan</option>
                    <option value="Randupadangan">Randupadangan</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.desa?.message} />
              </div>
            </div>
          </div>

          {/* ── Section 3: PEKERJAAN DAN KONTAK ───────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Pekerjaan dan Kontak</SectionTitle>

            {/* Pekerjaan | Perusahaan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pekerjaan
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
                  Perusahaan{" "}
                  <span className="font-normal text-gray-400">(opsional)</span>
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

            {/* No. HP — full width */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                No. HP / Kontak
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

          {/* ── Section 4: DATA WALI (OPSIONAL) ───────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle suffix="(Opsional)">Data Wali</SectionTitle>

            {/* Nama Lengkap Wali */}
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
            </div>

            {/* Hubungan | No. HP Wali */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hubungan
                </label>
                <div className="relative">
                  <select
                    {...register("hubunganWali")}
                    className={selCls(errors.hubunganWali)}
                  >
                    <option value="" disabled>
                      Pilih hubungan...
                    </option>
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
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  No. HP Wali
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  autoComplete="off"
                  {...register("noHpWali")}
                  className={cls(errors.noHpWali)}
                />
              </div>
            </div>
          </div>
        </form>

        {/* ── Footer (sticky, outside <form> — linked via form="patient-form") */}
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
            form="patient-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-70"
            style={{ background: "#2BB5A0" }}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* ── Toast — rendered outside the transformed panel so `fixed` is
           positioned relative to the viewport, not the CSS transform ancestor */}
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
