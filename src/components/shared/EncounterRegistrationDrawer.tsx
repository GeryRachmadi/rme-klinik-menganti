"use client";

import { useState, useEffect } from "react";
import { X, Search, CheckCircle2, User, ChevronDown } from "lucide-react";

interface EncounterRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dummy patient data for the summary card
const dummyPatient = {
  initials: "B",
  name: "Budi Santoso",
  gender: "Laki-laki",
  age: "36",
  noRm: "RM-202604-0001",
  nik: "3515000000000001"
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 mb-4">
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: "#2BB5A0" }}
      >
        {children}
      </span>
    </p>
  );
}

function PatientSummaryCard({
  variant,
}: {
  variant: "success" | "disabled";
}) {
  const isSuccess = variant === "success";
  
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border ${
        isSuccess
          ? "bg-[#E6F5F4] border-[#4DD9C0]/50"
          : "bg-gray-50 border-gray-200"
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
          <p
            className={`font-bold ${
              isSuccess ? "text-[#009E95]" : "text-gray-500"
            }`}
          >
            {dummyPatient.name}
          </p>
          {isSuccess && <CheckCircle2 size={16} className="text-[#2BB5A0]" />}
        </div>
        <p
          className={`text-xs mt-0.5 ${
            isSuccess ? "text-[#2BB5A0]" : "text-gray-400"
          }`}
        >
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
          <span
            className={`text-xs ${
              isSuccess ? "text-[#2BB5A0]" : "text-gray-400"
            }`}
          >
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
}: EncounterRegistrationDrawerProps) {
  const [rendered, setRendered] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisPasien, setJenisPasien] = useState<"UMUM" | "BPJS">("UMUM");

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      // Reset state when opening
      setIsFound(false);
      setSearchQuery("");
      setJenisPasien("UMUM");
    } else {
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!rendered) return null;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      e.preventDefault();
      setIsFound(true);
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white focus:border-[#2BB5A0] transition-colors";

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
              Tambah Kunjungan Baru
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Lengkapi informasi dibawah untuk membuat kunjungan pasien baru hari ini
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

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* ── Section 1: CARI PASIEN ────────────────────────────────────── */}
          <div>
            <SectionTitle>CARI PASIEN</SectionTitle>
            <div className="space-y-4">
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
                    placeholder="Ketik lalu tekan Enter untuk mencari..."
                    className={`${inputBase} pl-10`}
                  />
                </div>
              </div>

              {isFound && <PatientSummaryCard variant="success" />}

              <div>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Daftarkan Pasien tanpa NIK (Anak-anak/Lansia)?
                </button>
              </div>
            </div>
          </div>

          {/* ── Section 2: DETAIL ENCOUNTER PASIEN ────────────────────────── */}
          {isFound && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <SectionTitle>DETAIL ENCOUNTER PASIEN</SectionTitle>

              <PatientSummaryCard variant="disabled" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prioritas Pasien */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Prioritas Pasien <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select className={`${inputBase} appearance-none cursor-pointer`}>
                      <option value="" disabled selected>
                        Pilih prioritas...
                      </option>
                      <option value="NORMAL">Normal (Sesuai Antrean)</option>
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
                    <select className={`${inputBase} appearance-none cursor-pointer`}>
                      <option value="" disabled selected>
                        Pilih poli...
                      </option>
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

              {/* Dokter (ReadOnly) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Dokter <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
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
                  placeholder="Deskripsikan keluhan utama pasien..."
                  rows={3}
                  className={`${inputBase} resize-none`}
                />
              </div>

              {/* Jenis Pasien (Toggle) */}
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

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#2BB5A0" }}
          >
            Simpan
          </button>
        </div>
      </div>
    </>
  );
}
