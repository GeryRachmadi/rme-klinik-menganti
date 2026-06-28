"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronDown, CheckCircle2, AlertCircle, Loader2, Sparkles, PencilLine } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { INDONESIA_REGIONS } from "@/data/indonesia-regions";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
  type PatientRegistrationOutput,
} from "@/lib/validations/patient";
import { createPatient } from "@/app/actions/patient";

interface SatusehatData {
  namaLengkap?: string;
  jenisKelamin?: string;
  tanggalLahir?: string;
}

interface PatientRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "autofill" | "manual";
  satusehatData?: SatusehatData | null;
  onSuccess?: (newPatient: any) => void;
  defaultWithoutNik?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-500">{message}</p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PatientRegistrationDrawer({
  isOpen,
  onClose,
  mode = "manual",
  onSuccess,
  defaultWithoutNik = false,
  satusehatData = null,
}: PatientRegistrationDrawerProps) {
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const [activeMode, setActiveMode] = useState<"autofill" | "manual">(mode);
  const [isWithoutNik, setIsWithoutNik] = useState(defaultWithoutNik);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; type: "success" | "error"; message: string }>({
    visible: false, type: "success", message: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `as unknown as` bridges the "" string to enum literal types so RHF can
  // keep selects controlled (avoids uncontrolled→controlled React warning)
  // while Zod still rejects "" as invalid and shows the correct error message.
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<PatientRegistrationInput, any, PatientRegistrationOutput>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      nik: "",
      namaLengkap: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "" as unknown as PatientRegistrationInput["jenisKelamin"],
      agama: "" as unknown as PatientRegistrationInput["agama"],
      statusPernikahan: "" as unknown as PatientRegistrationInput["statusPernikahan"],
      jenisPasien: "" as unknown as PatientRegistrationInput["jenisPasien"],
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

  // ── Item 16: cascading Provinsi → Kabupaten/Kota ──────────────────────────
  const watchedProvinsi = watch("provinsi");
  const kabupatenOptions = useMemo(
    () => INDONESIA_REGIONS.find((r) => r.provinsi === watchedProvinsi)?.kabupaten ?? [],
    [watchedProvinsi]
  );
  // Clear kabupatenKota only on a *user* province change — never on the first
  // sync (register default "" / programmatic prefill), so existing values survive.
  const prevProvinsi = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevProvinsi.current !== undefined && prevProvinsi.current !== watchedProvinsi) {
      setValue("kabupatenKota", "");
    }
    prevProvinsi.current = watchedProvinsi;
  }, [watchedProvinsi, setValue]);

  // Mount/unmount with slide animation; reset form and internal mode on each open
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setActiveMode(mode);
      setIsWithoutNik(defaultWithoutNik);
      reset();
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, mode, reset]);

  function handleNiklessToggle() {
    if (!isWithoutNik) reset({ nik: "" });
    setIsWithoutNik(!isWithoutNik);
  }

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

  async function onSubmit(data: PatientRegistrationOutput) {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        tanggalLahir: data.tanggalLahir.toISOString().split("T")[0], // Convert to "YYYY-MM-DD"
      } as unknown as PatientRegistrationInput;

      const res = await createPatient(payload);
      if (res.success) {
        showToast(`Pasien ${res.data.noRm} berhasil didaftar.`);
        reset();
        router.refresh();
        onSuccess?.(res.data);
        setTimeout(() => onClose(), 1500);
      } else {
        const errorMsg = res.error.toLowerCase();
        if (errorMsg.includes("nik") || errorMsg.includes("terdaftar")) {
          setError("nik", {type:"server", message: res.error});
        } else {
          showToast(res.error, "error");
        }
      }
    } catch (error) {
      showToast("Terjadi kesalahan sistem.", "error")
    } 
    finally {
      setIsLoading(false);
    }
  }

  function calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  const watchedDOB = watch("tanggalLahir");
  const isMinor = watchedDOB ? calculateAge(new Date(watchedDOB)) < 17 : false;

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
  const readonlyCls =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-400 outline-none cursor-not-allowed select-none";

  // Fallback: autofill was attempted but SATUSEHAT returned nothing (null or undefined).
  const isFallback = activeMode === "autofill" && !satusehatData;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isLoading ? undefined : onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 bg-[#009E95] flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-white leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Tambah Pasien Baru
            </h2>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              Lengkapi informasi dibawah untuk membuat data pasien baru
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors mt-0.5"
            title="Tutup"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Mode Banner ─────────────────────────────────────────────────── */}
        {activeMode === "autofill" ? (
          <div
            className="flex items-center gap-3 px-8 py-3 flex-shrink-0 border-b border-[#4DD9C0]/30"
            style={{ background: "#E6F5F4" }}
          >
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: "#2BB5A0" }}
            >
              <Sparkles size={11} strokeWidth={2.5} />
              Mode: Auto-fill dari SATUSEHAT
            </span>
            <p className="text-xs text-[#009E95]">
              Data pasien diisi otomatis. NIK tidak dapat diubah.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-8 py-3 flex-shrink-0 border-b border-gray-100">
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "#E6F5F4", color: "#009E95" }}
            >
              <PencilLine size={11} strokeWidth={2.5} />
              Pendaftaran Manual
            </span>
            <p className="text-xs text-gray-400">
              Isi seluruh data pasien secara lengkap.
            </p>
          </div>
        )}

        {/* ── Scrollable form body ─────────────────────────────────────────── */}
        <form
          id="patient-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-8"
        >
          {/* ── Section 1: IDENTITAS UTAMA ─────────────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Identitas Pasien</SectionTitle>

            {/* NIK */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  NIK {!isWithoutNik && <span className="text-red-500">*</span>}{" "}
                  <span className="font-normal text-gray-400">
                    (Nomor Induk Kependudukan)
                  </span>
                </label>
                {activeMode === "manual" && (
                  <button
                    type="button"
                    onClick={handleNiklessToggle}
                    className="text-xs font-medium text-blue-500 hover:text-blue-600"
                  >
                    {isWithoutNik ? "Punya NIK? Daftarkan dengan NIK" : "Daftarkan tanpa NIK?"}
                  </button>
                )}
              </div>
              {activeMode === "autofill" ? (
                <input
                  type="text"
                  readOnly
                  autoComplete="off"
                  maxLength={16}
                  title="NIK tidak dapat diubah dalam mode Auto-fill"
                  {...register("nik")}
                  className={readonlyCls}
                />
              ) : isWithoutNik ? (
                <input
                  type="text"
                  disabled
                  placeholder="Mendaftar tanpa NIK (Otomatis dibuatkan sistem)"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-400 cursor-not-allowed"
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan 16 digit NIK"
                  autoComplete="off"
                  maxLength={16}
                  title="Nomor Identitas Kependudukan (KTP)"
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
              )}
              {activeMode === "manual" && !isWithoutNik && (
                <p className="mt-1 text-sm text-gray-500">Contoh: 3214041701234567</p>
              )}
              <FieldError message={errors.nik?.message} />
            </div>

            {/* Fallback alert — SATUSEHAT lookup ran but found no data */}
            {isFallback && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={18}
                    strokeWidth={2}
                    className="text-amber-500 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Data tidak ditemukan di SATUSEHAT
                    </p>
                    <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                      Data pasien tidak ditemukan di SATUSEHAT. Lanjutkan dengan
                      pendaftaran manual?
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveMode("manual")}
                    className="px-5 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#2BB5A0" }}
                  >
                    Lanjut Manual
                  </button>
                </div>
              </div>
            )}

            {/* Rest of Section 1 — hidden while fallback prompt is shown */}
            {!isFallback && <>

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
                  <select
                    {...register("jenisKelamin")}
                    className={selCls(errors.jenisKelamin)}
                  >
                    <option value="" disabled>
                      Pilih jenis kelamin...
                    </option>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <FieldError message={errors.jenisKelamin?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Jenis Pasien <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("jenisPasien")}
                    className={selCls(errors.jenisPasien)}
                  >
                    <option value="" disabled>
                      Pilih jenis pasien...
                    </option>
                    <option value="UMUM">Umum</option>
                    <option value="BPJS">BPJS</option>
                  </select>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
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
                <p className="mt-1 text-sm text-gray-500">Contoh: 17/01/1990</p>
                {/* Live Age display — additive, recomputes as the user picks a DoB.
                    Reuses the existing calculateAge() and watchedDOB (also used by
                    the BB-04.7 guardian logic, which is left untouched). */}
                {watchedDOB && !Number.isNaN(new Date(watchedDOB).getTime()) && calculateAge(new Date(watchedDOB)) >= 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Umur: {calculateAge(new Date(watchedDOB))} tahun
                  </p>
                )}
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
                  <select
                    {...register("agama")}
                    className={selCls(errors.agama)}
                  >
                    <option value="" disabled>
                      Pilih agama...
                    </option>
                    <option value="ISLAM">Islam</option>
                    <option value="KRISTEN">Kristen</option>
                    <option value="KATOLIK">Katolik</option>
                    <option value="HINDU">Hindu</option>
                    <option value="BUDDHA">Buddha</option>
                    <option value="KHONGHUCU">Khonghucu</option>
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
                  Status Pernikahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("statusPernikahan")}
                    className={selCls(errors.statusPernikahan)}
                  >
                    <option value="" disabled>
                      Pilih status...
                    </option>
                    <option value="BELUM_MENIKAH">Belum Menikah</option>
                    <option value="MENIKAH">Menikah</option>
                    <option value="CERAI_HIDUP">Cerai Hidup</option>
                    <option value="CERAI_MATI">Cerai Mati</option>
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

            </>} {/* end !isFallback */}
          </div>

          {/* ── Sections 2–4: hidden while fallback prompt is shown ──────────── */}
          {!isFallback && <>

          {/* ── Section 2: ALAMAT LENGKAP ──────────────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Alamat</SectionTitle>

            {/* Alamat KTP */}
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

          {/* ── Section 3: PEKERJAAN DAN KONTAK ───────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle>Kontak Pasien</SectionTitle>

            {/* Pekerjaan | Perusahaan */}
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

          {/* ── Section 4: DATA WALI ──────────────────────────────────────── */}
          <div className="space-y-4">
            <SectionTitle suffix={isMinor ? undefined : "(Opsional)"}>Data Wali</SectionTitle>
            {isMinor && (
              <p className="mt-1 text-sm text-red-500">
                * Wajib diisi untuk pasien di bawah 17 tahun
              </p>
            )}

            {/* Nama Lengkap Wali */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nama Lengkap Wali {isMinor && <span className="text-red-500">*</span>}
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

            {/* Hubungan | No. HP Wali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hubungan {isMinor && <span className="text-red-500">*</span>}
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
                <FieldError message={errors.hubunganWali?.message} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  No. HP Wali {isMinor && <span className="text-red-500">*</span>}
                </label>
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

          </>} {/* end !isFallback */}
        </form>

        {/* ── Footer (sticky, outside <form> — linked via form="patient-form") */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            form="patient-form"
            disabled={isLoading || !isValid}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: "#2BB5A0" }}
          >
            {isLoading && <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />}
            {isLoading ? "Menyimpan…" : "Simpan"}
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
