"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Patient } from "@/generated/prisma";
import PatientRegistrationDrawer from "@/components/shared/PatientRegistrationDrawer";
import PatientEditDrawer from "@/components/shared/PatientEditDrawer";
import PatientDeleteModal from "@/components/shared/PatientDeleteModal";
import type { ApiResponse, PaginatedData } from "@/types/api";
import { formatDob } from "@/lib/utils/format-dob";
import { formatJenisKelamin } from "@/lib/utils/format-gender";

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const LIMIT = 6;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export default function DaftarPasien() {
  const router = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter + pagination state ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery]               = useState("");
  const [jenisKelaminFilter, setJenisKelaminFilter] = useState("");
  const [jenisPasienFilter, setJenisPasienFilter]   = useState("");
  const [currentPage, setCurrentPage]               = useState(1);

  // ── Modal / drawer state ────────────────────────────────────────────────────
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [editPatient,  setEditPatient]  = useState<Patient | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);

  // ── Fetch all patients once (client-side filtering for instant search) ───────
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/patients?limit=200`);
      const json: ApiResponse<PaginatedData<Patient>> = await res.json();
      if (json.success) {
        setPatients(json.data.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Reset page on filter/search change ───────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, jenisKelaminFilter, jenisPasienFilter]);

  // ── Client-side filtering ────────────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      if (q && !p.namaLengkap?.toLowerCase().includes(q) && !p.nik?.toLowerCase().includes(q) && !p.noRm?.toLowerCase().includes(q) && !(p.ihs ?? "").toLowerCase().includes(q)) return false;
      if (jenisKelaminFilter && p.jenisKelamin !== jenisKelaminFilter) return false;
      if (jenisPasienFilter  && p.jenisPasien  !== jenisPasienFilter)  return false;
      return true;
    });
  }, [patients, searchQuery, jenisKelaminFilter, jenisPasienFilter]);

  // ── Derived pagination ───────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / LIMIT));
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);
  const rangeStart = filteredPatients.length === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
  const rangeEnd = Math.min(currentPage * LIMIT, filteredPatients.length);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
    };
  }

  function handleEditOpen(patient: Patient) {
    setEditPatient(patient);
    setIsEditOpen(true);
  }

  function handleEditClose() {
    setIsEditOpen(false);
    setEditPatient(null);
  }

  function handleDeleteOpen(patient: Patient) {
    setDeletePatient(patient);
    setIsDeleteOpen(true);
  }

  function handleDeleteClose() {
    setIsDeleteOpen(false);
    setDeletePatient(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Page Header */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Rekam Medis
          </h1>
          <p
            className="text-sm text-gray-400 mt-1"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Kelola data rekam medis dan riwayat kunjungan pasien
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          Tambah Pasien Baru
        </button>
      </div>

      {/* Filter + Table Card */}
      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">

        {/* Search / Filter Bar */}
        <div className="flex items-end gap-5 mb-7">
          <div className="flex-1">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Cari Pasien
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="Cari Nama, NIK, IHS, atau No.RM…"
                autoComplete="off"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 placeholder-gray-300 outline-none focus:border-[#2BB5A0]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              />
            </div>
          </div>

          <div className="w-48">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Jenis Kelamin
            </label>
            <select
              value={jenisKelaminFilter}
              onChange={handleFilterChange(setJenisKelaminFilter)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="LAKI_LAKI">Laki-laki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>

          <div className="w-48">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Jenis Pasien
            </label>
            <select
              value={jenisPasienFilter}
              onChange={handleFilterChange(setJenisPasienFilter)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="UMUM">UMUM</option>
              <option value="BPJS">BPJS</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                "NAMA",
                "NIK / IHS",
                "TANGGAL LAHIR",
                "NOMOR REKAM MEDIS",
                "NO.HP / KONTAK",
                "ACTION",
              ].map((h) => (
                <th
                  key={h}
                  className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Loader2 size={20} strokeWidth={2} className="inline-block animate-spin text-gray-300" />
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 text-center text-sm text-gray-300"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Tidak ada data pasien yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              paginatedPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  {/* NAMA */}
                  <td className="py-4">
                    <p
                      className="text-sm font-bold text-gray-800"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.namaLengkap}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {formatJenisKelamin(patient.jenisKelamin)} • {calcAge(new Date(patient.tanggalLahir))} thn
                    </p>
                  </td>

                  {/* NIK / IHS */}
                  <td className="py-4">
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.nik}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.ihs ?? "-"}
                    </p>
                  </td>

                  {/* TANGGAL LAHIR */}
                  <td className="py-4">
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {formatDob(patient.tanggalLahir)}
                    </p>
                  </td>

                  {/* NOMOR REKAM MEDIS */}
                  <td className="py-4">
                    <span
                      className="text-sm font-bold text-[#2BB5A0]"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.noRm}
                    </span>
                  </td>

                  {/* NO.HP */}
                  <td className="py-4">
                    <span
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.noHp}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => router.push(`/riwayat-medis/${patient.noRm}`)}
                        className="cursor-pointer p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        title="Lihat rekam medis"
                      >
                        <Eye size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditOpen(patient)}
                        className="cursor-pointer p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                        title="Edit data pasien"
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOpen(patient)}
                        className="cursor-pointer p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Hapus data pasien"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              Sebelum
            </button>

            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-gray-300 text-sm select-none"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === currentPage
                      ? "text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={{
                    fontFamily: "var(--font-jakarta)",
                    background: p === currentPage ? "#2BB5A0" : undefined,
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Selanjutnya
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Record count */}
        <p
          className="text-center text-xs text-gray-300 mt-4"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {isLoading
            ? "Memuat data…"
            : `Menampilkan ${rangeStart}–${rangeEnd} dari ${filteredPatients.length} pasien`}
        </p>
      </div>

      <PatientRegistrationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => fetchPatients()}
        mode="manual"
      />

      <PatientEditDrawer
        isOpen={isEditOpen}
        onClose={handleEditClose}
        patient={editPatient}
        onSuccess={() => fetchPatients()}
      />

      <PatientDeleteModal
        isOpen={isDeleteOpen}
        onClose={handleDeleteClose}
        patient={deletePatient}
        onSuccess={() => fetchPatients()}
      />
    </div>
  );
}
