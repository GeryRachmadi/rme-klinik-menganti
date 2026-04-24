"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Patient } from "@/generated/prisma";
import PatientRegistrationDrawer from "@/components/shared/PatientRegistrationDrawer";

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const ITEMS_PER_PAGE = 6;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export default function DaftarPasien({ patients }: { patients: Patient[] }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisKelaminFilter, setJenisKelaminFilter] = useState("Semua");
  const [jenisPasienFilter, setJenisPasienFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      if (
        q &&
        !p.namaLengkap.toLowerCase().includes(q) &&
        !p.nik.includes(q) &&
        !p.noRm.toLowerCase().includes(q) &&
        !(p.ihs?.toLowerCase().includes(q))
      )
        return false;
      if (jenisKelaminFilter !== "Semua" && p.jenisKelamin !== jenisKelaminFilter)
        return false;
      if (jenisPasienFilter !== "Semua" && p.jenisPasien !== jenisPasienFilter)
        return false;
      return true;
    });
  }, [patients, searchQuery, jenisKelaminFilter, jenisPasienFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  function handleDropdownChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setCurrentPage(1);
    };
  }

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
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          + Tambah Pasien Baru
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
                placeholder="Cari Nama, NIK, IHS, atau No.RM..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
              onChange={handleDropdownChange(setJenisKelaminFilter)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="Semua">Semua</option>
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
              onChange={handleDropdownChange(setJenisPasienFilter)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="Semua">Semua</option>
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
                "NOMOR REKAM MEDIS",
                "NO.HP / KONTAK",
                "JENIS PASIEN",
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
            {paginated.length === 0 ? (
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
              paginated.map((patient) => (
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
                      {patient.jenisKelamin} • {calcAge(new Date(patient.tanggalLahir))} thn
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

                  {/* JENIS PASIEN Badge */}
                  <td className="py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        patient.jenisPasien === "UMUM"
                          ? "bg-green-50 text-green-600"
                          : "bg-blue-50 text-blue-500"
                      }`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {patient.jenisPasien}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => console.log("View patient", patient.id)}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        title="Lihat rekam medis"
                      >
                        <Eye size={15} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => console.log("Edit patient", patient.id)}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                        title="Edit data pasien"
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() =>
                          console.log("Delete patient", patient.id)
                        }
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              Sebelum
            </button>

            {getPageNumbers(safePage, totalPages).map((p, i) =>
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
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === safePage
                      ? "text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={{
                    fontFamily: "var(--font-jakarta)",
                    background: p === safePage ? "#2BB5A0" : undefined,
                  }}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={safePage === totalPages}
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
          Menampilkan {paginated.length} dari {filtered.length} pasien
        </p>
      </div>

      <PatientRegistrationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
