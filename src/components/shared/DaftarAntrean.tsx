"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  Calendar,
} from "lucide-react";

// --- DUMMY DATA ---
type Prioritas = "Stabil" | "Cukup Berisiko" | "Berisiko" | "Berisiko Tinggi";
type StatusAntrean = "Menunggu" | "Diperiksa" | "Selesai" | "Batal";
type JenisPasien = "UMUM" | "BPJS";

interface DummyAntrean {
  id: string;
  noAntrean: string;
  waktu: string;
  namaPasien: string;
  jenisKelamin: string;
  umur: number;
  noRm: string;
  jenisPasien: JenisPasien;
  poli: string;
  dokter: string;
  prioritas: Prioritas;
  status: StatusAntrean;
}

const DUMMY_DATA: DummyAntrean[] = [
  { id: "1", noAntrean: "U-20", waktu: "12:36 WIB", namaPasien: "Wildan Arthasya", jenisKelamin: "Laki-laki", umur: 22, noRm: "RM-2603027", jenisPasien: "UMUM", poli: "Poli Umum", dokter: "dr. Strange", prioritas: "Stabil", status: "Menunggu" },
  { id: "2", noAntrean: "U-19", waktu: "12:36 WIB", namaPasien: "Raisya Gestia", jenisKelamin: "Perempuan", umur: 25, noRm: "RM-2603026", jenisPasien: "BPJS", poli: "Poli Umum", dokter: "dr. Strange", prioritas: "Stabil", status: "Diperiksa" },
  { id: "3", noAntrean: "G-07", waktu: "12:36 WIB", namaPasien: "Santi Nurhayati", jenisKelamin: "Perempuan", umur: 22, noRm: "RM-2603025", jenisPasien: "BPJS", poli: "Poli Gigi", dokter: "dr. Cynthia", prioritas: "Stabil", status: "Batal" },
  { id: "4", noAntrean: "G-06", waktu: "12:36 WIB", namaPasien: "Rian Wijaya", jenisKelamin: "Laki-laki", umur: 18, noRm: "RM-2603024", jenisPasien: "UMUM", poli: "Poli Gigi", dokter: "dr. Cynthia", prioritas: "Berisiko Tinggi", status: "Selesai" },
  { id: "5", noAntrean: "U-18", waktu: "12:36 WIB", namaPasien: "Maya Lestari", jenisKelamin: "Perempuan", umur: 38, noRm: "RM-2603023", jenisPasien: "UMUM", poli: "Poli Umum", dokter: "dr. Strange", prioritas: "Cukup Berisiko", status: "Selesai" },
  { id: "6", noAntrean: "U-17", waktu: "12:36 WIB", namaPasien: "Budi Santoso", jenisKelamin: "Laki-laki", umur: 52, noRm: "RM-2603022", jenisPasien: "UMUM", poli: "Poli Umum", dokter: "dr. Strange", prioritas: "Berisiko", status: "Selesai" },
];

export default function DaftarAntrean() {
  // Sementara kita pakai dummy state
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 12; // Dummy pagination

  // Helper Warna Badge Prioritas
  const getPrioritasBadge = (prioritas: Prioritas) => {
    switch (prioritas) {
      case "Stabil": return "text-[#2BB5A0] border-[#2BB5A0] bg-white";
      case "Cukup Berisiko": return "text-orange-500 border-orange-500 bg-white";
      case "Berisiko": return "text-yellow-500 border-yellow-500 bg-white";
      case "Berisiko Tinggi": return "text-red-500 border-red-500 bg-red-50";
      default: return "text-gray-500 border-gray-200 bg-white";
    }
  };

  // Helper Warna Badge Status
  const getStatusBadge = (status: StatusAntrean) => {
    switch (status) {
      case "Menunggu": return "text-orange-500 border-orange-500 bg-white";
      case "Diperiksa": return "text-blue-500 border-blue-500 bg-white";
      case "Selesai": return "text-[#2BB5A0] border-[#2BB5A0] bg-white";
      case "Batal": return "text-red-500 border-red-500 bg-red-50";
      default: return "text-gray-500 border-gray-200 bg-white";
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Page Header */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Daftar Antrean dan Kunjungan
          </h1>
          <p
            className="text-sm text-gray-400 mt-1"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Kelola informasi dan rekam medis pasien
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
          onClick={() => alert("Membuka form Tambah Kunjungan...")}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          + Tambah Kunjungan Baru
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
              Tanggal
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <select
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <option value="">Jum'at, 13 Maret 2026</option>
                {/* Dummy Options */}
              </select>
            </div>
          </div>

          <div className="w-40">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Prioritas
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="Stabil">Stabil</option>
              <option value="Darurat">Darurat</option>
            </select>
          </div>

          <div className="w-40">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Status
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diperiksa">Diperiksa</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                "NO. ANTREAN",
                "PASIEN",
                "POLI & DOKTER",
                "PRIORITAS",
                "STATUS",
                "ACTION",
              ].map((h) => (
                <th
                  key={h}
                  className={`pb-3 text-xs font-semibold text-gray-400 tracking-widest ${h === "ACTION" ? "text-right pr-4" : "text-left"}`}
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
            ) : (
              DUMMY_DATA.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors"
                >
                  {/* NO ANTREAN */}
                  <td className="py-4 align-top">
                    <p className="text-base font-bold text-[#2BB5A0]" style={{ fontFamily: "var(--font-poppins)" }}>
                      {row.noAntrean}
                    </p>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {row.waktu}
                    </p>
                  </td>

                  {/* PASIEN */}
                  <td className="py-4 align-top flex items-start justify-between pr-8">
                    <div>
                      <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>
                        {row.namaPasien}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                        {row.jenisKelamin} • {row.umur} tahun
                      </p>
                      <p className="text-xs font-bold text-[#2BB5A0] mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                        {row.noRm}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${
                        row.jenisPasien === "UMUM"
                          ? "bg-green-50 text-[#2BB5A0] border-[#2BB5A0]"
                          : "bg-blue-50 text-blue-500 border-blue-500"
                      }`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {row.jenisPasien}
                    </span>
                  </td>

                  {/* POLI & DOKTER */}
                  <td className="py-4 align-top">
                    <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {row.poli}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {row.dokter}
                    </p>
                  </td>

                  {/* PRIORITAS */}
                  <td className="py-4 align-top">
                    <span
                      className={`inline-block px-6 py-1 rounded-full text-xs font-bold border ${getPrioritasBadge(row.prioritas)}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {row.prioritas}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="py-4 align-top">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${getStatusBadge(row.status)}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                        <Eye size={14} strokeWidth={2.5} />
                      </button>
                      <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors">
                        <Pencil size={14} strokeWidth={2.5} />
                      </button>
                      <button className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination (Dummy Visuals) */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>
            <ChevronLeft size={16} strokeWidth={3} />
            Sebelum
          </button>
          
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-white bg-[#2BB5A0]" style={{ fontFamily: "var(--font-jakarta)" }}>1</button>
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-[#2BB5A0] bg-green-50 hover:bg-[#2BB5A0] hover:text-white transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>2</button>
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-[#2BB5A0] bg-green-50 hover:bg-[#2BB5A0] hover:text-white transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>3</button>
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-[#2BB5A0] bg-green-50 hover:bg-[#2BB5A0] hover:text-white transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>4</button>
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-[#2BB5A0] bg-green-50 hover:bg-[#2BB5A0] hover:text-white transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>5</button>
          <span className="px-1 text-gray-400">........</span>
          <button className="w-8 h-8 rounded-lg text-sm font-bold text-white bg-[#2BB5A0]" style={{ fontFamily: "var(--font-jakarta)" }}>12</button>

          <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>
            Selanjutnya
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>

      </div>
    </div>
  );
}