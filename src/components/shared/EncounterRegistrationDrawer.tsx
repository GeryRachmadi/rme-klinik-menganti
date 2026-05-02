"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  CheckCircle2,
  User,
  ChevronDown,
  Loader2,
  Ticket,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { type PolicyType } from "@/lib/queue-utils";

// Maps the Poli select value to the PolicyType accepted by generateQueueNumber.
// KIA shares the Umum queue pool for now — extend when KIA gets its own prefix.
const POLI_TO_POLICY: Record<string, PolicyType> = {
  POLI_UMUM: "UMUM",
  POLI_GIGI: "GIGI",
  KIA:       "UMUM",
};

interface EncounterRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEncounterCreated?: () => void;
}

// Placeholder patient — id and fields will come from live search results (TR-40 backend)
const dummyPatient = {
  id:       "cmogv3h2q0000wcuxu4xj8x7c",
  initials: "B",
  name:     "Budi Santoso",
  gender:   "Laki-laki",
  age:      "36",
  noRm:     "RM-202604-0001",
  nik:      "3515000000000001",
};

function PatientSummaryCard({ variant }: { variant: "success" | "disabled" }) {
  const isSuccess = variant === "success";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border ${
        isSuccess ? "bg-[#E6F5F4] border-[#4DD9C0]/50" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
          isSuccess ? "bg-[#2BB5A0] text-white" : "bg-gray-200 text-gray-400"
        }`}
      >
        {dummyPatient.initials}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-bold ${isSuccess ? "text-[#009E95]" : "text-gray-500"}`}>
            {dummyPatient.name}
          </p>
          {isSuccess && <CheckCircle2 size={16} className="text-[#2BB5A0]" />}
        </div>
        <p className={`text-xs mt-0.5 ${isSuccess ? "text-[#2BB5A0]" : "text-gray-400"}`}>
          {dummyPatient.gender} • {dummyPatient.age} thn
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`text-xs px-2 py-1 rounded-md font-medium ${
              isSuccess
                ? "bg-white text-[#2BB5A0] border border-[#2BB5A0]/20"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            RM: {dummyPatient.noRm}
          </span>
          <span className={`text-xs ${isSuccess ? "text-[#2BB5A0]" : "text-gray-400"}`}>
            NIK: {dummyPatient.nik}
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
  const [rendered, setRendered] = useState(false);

  // Search
  const [isFound, setIsFound]         = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form fields
  const [selectedPoli,      setSelectedPoli]      = useState("");
  const [selectedPrioritas, setSelectedPrioritas] = useState("");
  const [keluhanUtama,      setKeluhanUtama]      = useState("");
  const [jenisPasien,       setJenisPasien]       = useState<"UMUM" | "BPJS">("UMUM");

  // Submission
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [successQueueNumber, setSuccessQueueNumber] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drawer mount/unmount animation
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Reset all state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsFound(false);
      setSearchQuery("");
      setSelectedPoli("");
      setSelectedPrioritas("");
      setKeluhanUtama("");
      setJenisPasien("UMUM");
      setIsSubmitting(false);
      setSuccessQueueNumber(null);
      setToast((t) => ({ ...t, visible: false }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [isOpen]);

  // Cleanup toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  if (!rendered) return null;

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      4000
    );
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      e.preventDefault();
      setIsFound(true);
    }
  }

  async function handleSave() {
    if (!isFound) {
      showToast("Cari dan pilih pasien terlebih dahulu.", "error");
      return;
    }
    if (!selectedPoli) {
      showToast("Pilih poli tujuan terlebih dahulu.", "error");
      return;
    }
    if (!selectedPrioritas) {
      showToast("Pilih prioritas pasien terlebih dahulu.", "error");
      return;
    }

    const policyType = POLI_TO_POLICY[selectedPoli] ?? "UMUM";

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:      dummyPatient.id,
          policyType,
          priority:       selectedPrioritas,
          patientType:    jenisPasien,
          reasonCode:     keluhanUtama.trim() || null,
          practitionerId: null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        showToast(json.error ?? "Gagal menyimpan kunjungan.", "error");
        return;
      }

      setSuccessQueueNumber(json.data.queueNumber);
      onEncounterCreated?.();
    } catch {
      showToast("Terjadi kesalahan tidak terduga. Silakan coba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white focus:border-[#2BB5A0] transition-colors";

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
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Tambah Kunjungan Baru
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              {successQueueNumber
                ? "Kunjungan berhasil didaftarkan."
                : "Lengkapi informasi dibawah untuk membuat kunjungan pasien baru hari ini"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5 disabled:opacity-50"
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

              <PatientSummaryCard variant="success" />

              <p className="text-xs text-gray-400 text-center max-w-xs">
                Informasikan nomor antrean ini kepada pasien dan minta untuk menunggu
                dipanggil oleh perawat.
              </p>
            </div>
          ) : (
            /* ── Form ─────────────────────────────────────────────────────── */
            <div className="space-y-8">
              {/* Section 1: Cari Pasien */}
              <div className="space-y-4">
                <SectionTitle>CARI PASIEN</SectionTitle>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    NIK atau Nama Lengkap Pasien
                  </label>
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearch}
                      autoComplete="off"
                      placeholder="Ketik lalu tekan Enter untuk mencari..."
                      className={`${inputBase} pl-10`}
                    />
                  </div>
                </div>

                {isFound && <PatientSummaryCard variant="success" />}

                <button
                  type="button"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Daftarkan Pasien tanpa NIK (Anak-anak/Lansia)?
                </button>
              </div>

              {/* Section 2: Detail Encounter */}
              {isFound && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <SectionTitle>DETAIL ENCOUNTER PASIEN</SectionTitle>

                  <PatientSummaryCard variant="disabled" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prioritas */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Prioritas Pasien <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPrioritas}
                          onChange={(e) => setSelectedPrioritas(e.target.value)}
                          className={`${inputBase} appearance-none cursor-pointer`}
                        >
                          <option value="" disabled>Pilih prioritas...</option>
                          <option value="STABIL">Normal (Sesuai Antrean)</option>
                          <option value="URGENT">Mendesak (Darurat)</option>
                        </select>
                        <ChevronDown
                          size={15}
                          strokeWidth={2}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* Poli Tujuan */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Poli Tujuan <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPoli}
                          onChange={(e) => setSelectedPoli(e.target.value)}
                          className={`${inputBase} appearance-none cursor-pointer`}
                        >
                          <option value="" disabled>Pilih poli...</option>
                          <option value="POLI_UMUM">Poli Umum</option>
                          <option value="POLI_GIGI">Poli Gigi</option>
                          <option value="KIA">KIA</option>
                        </select>
                        <ChevronDown
                          size={15}
                          strokeWidth={2}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dokter (ReadOnly — auto-assigned) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Dokter <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        strokeWidth={2}
                      />
                      <input
                        type="text"
                        readOnly
                        value="Dr. Strange (Otomatis)"
                        className={`${inputBase} pl-10 bg-gray-100 text-gray-500 cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  {/* Keluhan Utama */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Keluhan Utama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={keluhanUtama}
                      onChange={(e) => setKeluhanUtama(e.target.value)}
                      placeholder="Deskripsikan keluhan utama pasien..."
                      rows={3}
                      className={`${inputBase} resize-none`}
                    />
                  </div>

                  {/* Jenis Pasien */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jenis Pasien <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <label
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${
                          jenisPasien === "UMUM"
                            ? "bg-[#E6F5F4] border-[#2BB5A0] text-[#009E95]"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="jenisPasien"
                          value="UMUM"
                          checked={jenisPasien === "UMUM"}
                          onChange={() => setJenisPasien("UMUM")}
                          className="sr-only"
                        />
                        <span className="font-semibold text-sm">Umum</span>
                      </label>
                      <label
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-colors ${
                          jenisPasien === "BPJS"
                            ? "bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="jenisPasien"
                          value="BPJS"
                          checked={jenisPasien === "BPJS"}
                          onChange={() => setJenisPasien("BPJS")}
                          className="sr-only"
                        />
                        <span className="font-semibold text-sm">BPJS Kesehatan</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !isFound}
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
    </>
  );
}
