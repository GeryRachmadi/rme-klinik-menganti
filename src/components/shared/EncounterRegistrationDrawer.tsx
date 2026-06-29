"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  Ticket,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import PatientRegistrationDrawer from "@/components/shared/PatientRegistrationDrawer";
import { usePatientSearch } from "@/hooks/usePatientSearch";
import { formatDoctorName } from "@/lib/utils/format-doctor-name";
import { encounterRegistrationSchema, type EncounterRegistrationFormData } from "@/lib/validations/encounter";

interface EncounterRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEncounterCreated?: () => Promise<void>;
}

// Practitioner.speciality is free-text ("Umum", "Poli Gigi") while policyType emits
// enum values ("UMUM", "GIGI"). This map normalizes speciality → poli for the
// Item-15 Poli→Dokter dependency filter. Case-insensitive; trim before lookup.
const SPECIALITY_POLI_MAP: Record<string, string> = {
  umum: "UMUM",
  "poli umum": "UMUM",
  gigi: "GIGI",
  "poli gigi": "GIGI",
};

function PatientSummaryCard({ variant, patient }: { variant: "success" | "disabled"; patient: any }) {
  if (!patient) return null;

  const isSuccess = variant === "success";
  const initials = patient.namaLengkap ? patient.namaLengkap.charAt(0).toUpperCase() : "?";
  const age = patient.tanggalLahir
    ? Math.floor((new Date().getTime() - new Date(patient.tanggalLahir).getTime()) / 3.15576e10)
    : "?";
  const gender = patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border ${
        isSuccess ? "bg-[#E6F5F4] border-[#4DD9C0]/50" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
          isSuccess ? "bg-[#009E95] text-white" : "bg-gray-200 text-gray-400"
        }`}
      >
        {initials}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-bold ${isSuccess ? "text-[#009E95]" : "text-gray-500"}`}>
            {patient.namaLengkap}
          </p>
          {isSuccess && <CheckCircle2 size={16} className="text-[#2BB5A0]" />}
        </div>
        <p className={`text-xs mt-0.5 ${isSuccess ? "text-[#2BB5A0]" : "text-gray-400"}`}>
          {gender} • {age} thn
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`text-xs px-2 py-1 rounded-md font-medium ${
              isSuccess
                ? "bg-white text-[#2BB5A0] border border-[#2BB5A0]/20"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            RM: {patient.noRm}
          </span>
          <span className={`text-xs ${isSuccess ? "text-[#2BB5A0]" : "text-gray-400"}`}>
            NIK: {patient.nik}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EncounterRegistrationDrawer({
  isOpen,
  onClose,
  onEncounterCreated,
}: EncounterRegistrationDrawerProps) {
  const router = useRouter();
  const [rendered, setRendered] = useState(false);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [nurses, setNurses] = useState<any[]>([]);
  const [isLoadingNurses, setIsLoadingNurses] = useState(false);
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);
  const [successQueueNumber, setSuccessQueueNumber] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  const search = usePatientSearch(showToast);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
    setValue,
  } = useForm<EncounterRegistrationFormData>({
    resolver: zodResolver(encounterRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      patientType: "UMUM",
      reasonCode: "",
      practitionerId: "",
      perawatId: "",
      priority: undefined,
      policyType: undefined,
    },
  });

  // Item 15 — watch selected poli to drive the Dokter dependency filter
  const selectedPoli = watch("policyType");
  const filteredDoctors = selectedPoli
    ? practitioners.filter(
        (p) =>
          SPECIALITY_POLI_MAP[p.speciality?.toLowerCase().trim() ?? ""] ===
          selectedPoli
      )
    : practitioners;

  // Drawer mount/unmount animation
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Fetch doctors when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingDoctors(true);
    fetch("/api/accounts?role=DOKTER&limit=100")
      .then((res) => res.json())
      .then((json) => {
        const list = json.data?.accounts || json.data || json.accounts || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          setPractitioners(list.filter((a: any) => a.practitioner).map((a: any) => a.practitioner));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingDoctors(false));
  }, [isOpen]);

  // Fetch nurses when drawer opens (Item 17)
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingNurses(true);
    fetch("/api/accounts?role=PERAWAT&limit=100")
      .then((res) => res.json())
      .then((json) => {
        const list = json.data?.accounts || json.data || json.accounts || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          setNurses(list.filter((a: any) => a.practitioner).map((a: any) => a.practitioner));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingNurses(false));
  }, [isOpen]);

  // Item 15 — clear the selected doctor when poli changes so a doctor from a
  // different poli is never silently submitted.
  useEffect(() => {
    setValue("practitionerId", "");
  }, [selectedPoli, setValue]);

  // Reset all state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      search.reset();
      reset();
      setSuccessQueueNumber(null);
      setToast((t) => ({ ...t, visible: false }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [isOpen, reset, search.reset]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  if (!rendered) return null;

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white focus:border-[#2BB5A0] transition-colors";

  const onSubmit = async (data: EncounterRegistrationFormData) => {
    if (!search.selectedPatient) {
      showToast("Cari dan pilih pasien terlebih dahulu.", "error");
      return;
    }
    try {
      const res = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:      search.selectedPatient.id,
          policyType:     data.policyType,
          priority:       data.priority,
          patientType:    data.patientType,
          reasonCode:     data.reasonCode || null,
          practitionerId: data.practitionerId,
          perawatId:      data.perawatId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error ?? "Gagal menyimpan kunjungan.", "error");
        return;
      }
      setSuccessQueueNumber(json.data.queueNumber);
      await onEncounterCreated?.();
    } catch {
      showToast("Terjadi kesalahan tidak terduga. Silakan coba lagi.", "error");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-[#009E95] flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-white leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Tambah Kunjungan Baru
            </h2>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              {successQueueNumber
                ? "Kunjungan berhasil didaftarkan."
                : "Lengkapi informasi dibawah untuk membuat kunjungan pasien baru hari ini"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors mt-0.5 disabled:opacity-50"
            title="Tutup"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {successQueueNumber ? (
            /* ── Success State ─────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="w-20 h-20 rounded-full bg-[#E6F5F4] flex items-center justify-center">
                <Ticket size={36} className="text-[#2BB5A0]" strokeWidth={1.5} />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Nomor Antrean</p>
                <p
                  className="text-7xl font-bold tracking-tight"
                  style={{ color: "#2BB5A0", fontFamily: "var(--font-poppins)" }}
                >
                  {successQueueNumber}
                </p>
              </div>

              <PatientSummaryCard variant="success" patient={search.selectedPatient} />

              <p className="text-xs text-gray-400 text-center max-w-xs">
                Informasikan nomor antrean ini kepada pasien dan minta untuk menunggu
                dipanggil oleh perawat.
              </p>
            </div>
          ) : (
            /* ── Form ─────────────────────────────────────────────────────── */
            <form id="encounter-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Section 1: Cari Pasien */}
              <div className="space-y-4">
                <SectionTitle>CARI PASIEN</SectionTitle>

                {/* ── Selected patient card (replaces search input) ── */}
                {search.selectedPatient ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl border bg-[#E6F5F4] border-[#4DD9C0]/50">
                    <div className="w-10 h-10 rounded-full bg-[#009E95] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {search.selectedPatient.namaLengkap?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[#009E95] truncate">{search.selectedPatient.namaLengkap}</p>
                        <CheckCircle2 size={14} className="text-[#2BB5A0] flex-shrink-0" />
                      </div>
                      <p className="text-xs text-[#2BB5A0] mt-0.5">
                        {search.selectedPatient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}{" "}
                        •{" "}
                        {search.selectedPatient.tanggalLahir
                          ? Math.floor((Date.now() - new Date(search.selectedPatient.tanggalLahir).getTime()) / 3.15576e10)
                          : "?"}{" "}
                        thn
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-white text-[#2BB5A0] border border-[#2BB5A0]/20">
                          {search.selectedPatient.noRm}
                        </span>
                        <span className="text-xs text-[#2BB5A0]">NIK: {search.selectedPatient.nik}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => search.setSelectedPatient(null)}
                      className="p-1.5 rounded-lg text-[#2BB5A0] hover:bg-[#009E95]/10 transition-colors flex-shrink-0"
                      title="Ganti pasien"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  /* ── Search input + dropdown + advanced search ── */
                  <>
                    {search.isAdvancedSearch ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                              Nama Pasien
                            </label>
                            <input
                              type="text"
                              value={search.advName}
                              onChange={(e) => search.onAdvFieldChange("name", e.target.value)}
                              autoComplete="off"
                              placeholder="Masukkan nama pasien"
                              className={inputBase}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                              No. Rekam Medis
                            </label>
                            <input
                              type="text"
                              value={search.advRm}
                              onChange={(e) => search.onAdvFieldChange("rm", e.target.value)}
                              autoComplete="off"
                              placeholder="Contoh: RM-2024…"
                              className={inputBase}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Tanggal Lahir
                          </label>
                          <input
                            type="date"
                            value={search.advDob}
                            onChange={(e) => search.onAdvFieldChange("dob", e.target.value)}
                            autoComplete="off"
                            className={inputBase}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            type="button"
                            onClick={search.handleAdvancedSearch}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity"
                            style={{ background: "#2BB5A0" }}
                          >
                            Cari Pasien
                          </button>
                          <button
                            type="button"
                            onClick={() => search.setIsAdvancedSearch(false)}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Kembali ke Pencarian NIK
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            NIK / No. RM / Nama Pasien
                          </label>
                          <div className="relative">
                            <Search
                              size={18}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                              strokeWidth={2}
                            />
                            <input
                              type="text"
                              value={search.searchQuery}
                              onChange={(e) => {
                                const value = e.target.value;
                                search.onSearchQueryChange(value);
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                debounceRef.current = setTimeout(() => {
                                  search.triggerSearch(value);
                                }, 300);
                              }}
                              onKeyDown={search.handleSearch}
                              onBlur={() => setTimeout(() => search.clearResults(), 200)}
                              autoComplete="off"
                              placeholder="Ketik NIK, No. RM, atau nama pasien…"
                              className={`${inputBase} pl-10 pr-9`}
                            />
                            {search.searchQuery && (
                              <button
                                type="button"
                                onClick={() => search.reset()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                                title="Hapus pencarian"
                              >
                                <X size={15} strokeWidth={2} />
                              </button>
                            )}

                            {/* Floating dropdown */}
                            {search.results.length > 0 && (
                              <div
                                className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-xl border border-gray-100 max-h-60 overflow-y-auto"
                                style={{ fontFamily: "var(--font-jakarta)" }}
                              >
                                {search.results.map((patient) => {
                                  const age = patient.tanggalLahir
                                    ? Math.floor((Date.now() - new Date(patient.tanggalLahir).getTime()) / 3.15576e10)
                                    : "?";
                                  const gender = patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
                                  return (
                                    <button
                                      key={patient.id}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        search.setSelectedPatient(patient);
                                        search.clearResults();
                                        search.onSearchQueryChange("");
                                        if (debounceRef.current) clearTimeout(debounceRef.current);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E6F5F4] transition-colors text-left border-b border-gray-50 last:border-0"
                                    >
                                      <div className="w-9 h-9 rounded-full bg-[#009E95] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {patient.namaLengkap?.charAt(0).toUpperCase() ?? "?"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{patient.namaLengkap}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{gender} • {age} thn</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                            {patient.noRm}
                                          </span>
                                          <span className="text-xs text-gray-400 truncate">NIK: {patient.nik}</span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <button
                            type="button"
                            onClick={() => search.setIsAdvancedSearch(true)}
                            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            Pencarian Spesifik (Nama / No. RM)?
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsPatientDrawerOpen(true)}
                            className="text-sm font-semibold text-[#2BB5A0] hover:text-[#009E95] transition-colors cursor-pointer"
                          >
                            + Tambah Pasien Baru
                          </button>
                        </div>
                      </>
                    )}

                    {search.showEmptyState && (
                      <div className="flex flex-col items-center justify-center p-6 mt-4 rounded-xl border border-red-100 bg-red-50 text-center">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                          <UserX size={24} className="text-red-400" />
                        </div>
                        <h3 className="text-sm font-bold text-red-800 mb-1">Pasien Tidak Ditemukan</h3>
                        <p className="text-xs text-red-600 mb-4 max-w-[80%]">
                          Data pasien tidak ditemukan di sistem. Silakan periksa kembali kata kunci pencarian atau daftarkan pasien baru.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push("/rekam-medis")}
                          className="px-5 py-2 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                          style={{ background: "#2BB5A0" }}
                        >
                          Tambah Pasien Baru
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Section 2: Detail Encounter */}
              {search.selectedPatient && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <SectionTitle>DETAIL ENCOUNTER PASIEN</SectionTitle>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prioritas */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Prioritas Pasien <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                          <>
                            <div className="relative">
                              <select
                                {...field}
                                value={field.value || ""}
                                className={`${inputBase} appearance-none cursor-pointer ${errors.priority ? "border-red-500" : "border-gray-200 focus:border-[#2BB5A0]"}`}
                              >
                                <option value="" disabled>Pilih prioritas…</option>
                                <option value="STABIL">Stabil</option>
                                <option value="CUKUP_BERISIKO">Cukup Berisiko</option>
                                <option value="BERISIKO">Berisiko</option>
                                <option value="BERISIKO_TINGGI">Berisiko Tinggi</option>
                              </select>
                              <ChevronDown
                                size={15}
                                strokeWidth={2}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                            </div>
                            {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
                          </>
                        )}
                      />
                    </div>

                    {/* Poli Tujuan */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Poli Tujuan <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="policyType"
                        control={control}
                        render={({ field }) => (
                          <>
                            <div className="relative">
                              <select
                                {...field}
                                value={field.value || ""}
                                className={`${inputBase} appearance-none cursor-pointer ${errors.policyType ? "border-red-500" : "border-gray-200 focus:border-[#2BB5A0]"}`}
                              >
                                <option value="" disabled>Pilih poli…</option>
                                <option value="UMUM">Poli Umum</option>
                                <option value="GIGI">Poli Gigi</option>
                              </select>
                              <ChevronDown
                                size={15}
                                strokeWidth={2}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                            </div>
                            {errors.policyType && <p className="text-red-500 text-xs mt-1">{errors.policyType.message}</p>}
                          </>
                        )}
                      />
                    </div>
                  </div>

                  {/* Dokter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Dokter <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="practitionerId"
                      control={control}
                      render={({ field }) => (
                        <>
                          <div className="relative">
                            <User
                              size={15}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                              strokeWidth={2}
                            />
                            <select
                              {...field}
                              disabled={isLoadingDoctors || !selectedPoli}
                              className={`${inputBase} pl-10 appearance-none cursor-pointer ${errors.practitionerId ? "border-red-500" : "border-gray-200 focus:border-[#2BB5A0]"}`}
                            >
                              <option value="" disabled>
                                {isLoadingDoctors
                                  ? "Memuat dokter…"
                                  : !selectedPoli
                                    ? "Pilih poli terlebih dahulu…"
                                    : filteredDoctors.length === 0
                                      ? "Tidak ada dokter tersedia"
                                      : "Pilih Dokter…"}
                              </option>
                              {filteredDoctors.map((p) => (
                                <option key={p.id} value={p.id}>{formatDoctorName(p.name, p.speciality)}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              strokeWidth={2}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                          {errors.practitionerId && <p className="text-red-500 text-xs mt-1">{errors.practitionerId.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  {/* Perawat */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Perawat <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="perawatId"
                      control={control}
                      render={({ field }) => (
                        <>
                          <div className="relative">
                            <UserCheck
                              size={15}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                              strokeWidth={2}
                            />
                            <select
                              {...field}
                              disabled={isLoadingNurses}
                              className={`${inputBase} pl-10 appearance-none cursor-pointer ${errors.perawatId ? "border-red-500" : "border-gray-200 focus:border-[#2BB5A0]"}`}
                            >
                              <option value="" disabled>
                                {isLoadingNurses
                                  ? "Memuat perawat…"
                                  : nurses.length === 0
                                    ? "Tidak ada perawat tersedia"
                                    : "Pilih Perawat…"}
                              </option>
                              {nurses.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              strokeWidth={2}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                          {errors.perawatId && <p className="text-red-500 text-xs mt-1">{errors.perawatId.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  {/* Keluhan Utama */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Keluhan Utama <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="reasonCode"
                      control={control}
                      render={({ field }) => (
                        <>
                          <textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Deskripsikan keluhan utama pasien…"
                            rows={3}
                            className={`${inputBase} resize-none ${errors.reasonCode ? "border-red-500" : "border-gray-200 focus:border-[#2BB5A0]"}`}
                          />
                          {errors.reasonCode && <p className="text-red-500 text-xs mt-1">{errors.reasonCode.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  {/* Jenis Pasien */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jenis Penjamin <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="patientType"
                      control={control}
                      render={({ field }) => (
                        <>
                          <div className="flex gap-3">
                            <label
                              onClick={() => field.onChange("UMUM")}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${
                                field.value === "UMUM"
                                  ? "bg-[#E6F5F4] border-[#2BB5A0] text-[#009E95]"
                                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              <span className="font-semibold text-sm">Umum</span>
                            </label>
                            <label
                              onClick={() => field.onChange("BPJS")}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${
                                field.value === "BPJS"
                                  ? "bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              <span className="font-semibold text-sm">BPJS Kesehatan</span>
                            </label>
                          </div>
                          {errors.patientType && <p className="text-red-500 text-xs mt-1">{errors.patientType.message}</p>}
                        </>
                      )}
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 flex-shrink-0 bg-white">
          {successQueueNumber ? (
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "#2BB5A0" }}
            >
              Selesai
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="encounter-form"
                disabled={isSubmitting || !search.selectedPatient || !isValid}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#2BB5A0" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </>
          )}
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
            <X size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          )}
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}

      {/*
       * PatientRegistrationDrawer — opened from empty state or "Tambah Pasien Baru" CTA.
       * onSuccess implements the Magic Transition: after creation, the new patient is
       * fetched by noRm and auto-selected in this drawer without a manual search step.
       */}
      <PatientRegistrationDrawer
        isOpen={isPatientDrawerOpen}
        onClose={() => setIsPatientDrawerOpen(false)}
        mode="manual"
        defaultWithoutNik={true}
        onSuccess={async (newPatient) => {
          setIsPatientDrawerOpen(false);
          try {
            const res = await fetch(`/api/patients?rm=${newPatient.noRm}`);
            const json = await res.json();
            const patientsArray = json.data?.data || (Array.isArray(json.data) ? json.data : []);
            if (patientsArray.length > 0) {
              search.setSelectedPatient(patientsArray[0]);
              showToast("Pasien otomatis dipilih, silakan lanjut isi kunjungan.", "success");
            } else {
              showToast("Pasien berhasil didaftar, tapi gagal memuat otomatis.", "error");
            }
          } catch {
            showToast("Terjadi kesalahan saat menarik data pasien baru.", "error");
          }
        }}
      />
    </>
  );
}
