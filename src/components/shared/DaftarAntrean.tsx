"use client";

import { useState, useEffect } from "react";
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

// --- TYPES ---
type Prioritas = "Stabil" | "Cukup Berisiko" | "Berisiko" | "Berisiko Tinggi" | string;
type StatusAntrean = "Menunggu" | "Diperiksa" | "Selesai" | "Batal" | string;
type JenisPasien = "UMUM" | "BPJS" | string;

interface AntreanData {
  id: string;
  noAntrean: string;
  tanggal: string;
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

interface DaftarAntreanProps {
  userRole?: string;
}

export default function DaftarAntrean({ userRole }: DaftarAntreanProps) {
  // State untuk nyimpen data asli dari API
  const [antreanData, setAntreanData] = useState<AntreanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTanggal, setFilterTanggal] = useState(""); // Diubah jadi kosong agar nampilin semua di awal
  const [filterPrioritas, setFilterPrioritas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const isAuthorized = userRole === "PENDAFTARAN" || userRole === "ADMIN";

  // --- FETCH DATA DARI API (TR-50) ---
  useEffect(() => {
    const fetchAntrean = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/encounters");
        const json = await res.json();

        if (json.success) {
          setAntreanData(json.data);
        } else {
          console.error("Gagal memuat antrean:", json.error);
        }
      } catch (error) {
        console.error("Terjadi kesalahan jaringan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAntrean();
  }, []); // Jalan sekali saat halaman di-load

  // --- LOGIKA FILTERING ---
  const filteredData = antreanData.filter((item) => {
    const matchSearch = 
      item.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.noRm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noAntrean.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchTanggal = filterTanggal ? item.tanggal === filterTanggal : true;
    const matchPrioritas = filterPrioritas ? item.prioritas === filterPrioritas : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;

    return matchSearch && matchTanggal && matchPrioritas && matchStatus;
  });

  const getPrioritasBadge = (prioritas: Prioritas) => {
    switch (prioritas) {
      case "Stabil": return "text-[#2BB5A0] border-[#2BB5A0] bg-white";
      case "Cukup Berisiko": return "text-orange-500 border-orange-500 bg-white";
      case "Berisiko": return "text-yellow-500 border-yellow-500 bg-white";
      case "Berisiko Tinggi": return "text-red-500 border-red-500 bg-red-50";
      default: return "text-gray-500 border-gray-200 bg-white";
    }
  };

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
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            Daftar Antrean dan Kunjungan
          </h1>
          <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>
            Kelola informasi dan rekam medis pasien
          </p>
        </div>
        
        {isAuthorized && (
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }} onClick={() => alert("Membuka form Tambah Kunjungan...")}>
            <UserPlus size={16} strokeWidth={2.5} />
            + Tambah Kunjungan Baru
          </button>
        )}
      </div>

      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">
        <div className="flex flex-wrap items-end gap-5 mb-7">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Cari Pasien</label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2.5} />
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
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Tanggal</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <select
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <option value="">Semua Tanggal</option>
                {/* Kamu bisa bikin dinamis nanti, sementara format YYYY-MM-DD */}
                <option value={new Date().toISOString().split("T")[0]}>Hari Ini</option>
              </select>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Prioritas</label>
            <select
              value={filterPrioritas}
              onChange={(e) => setFilterPrioritas(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="Stabil">Stabil</option>
              <option value="Cukup Berisiko">Cukup Berisiko</option>
              <option value="Berisiko">Berisiko</option>
              <option value="Berisiko Tinggi">Berisiko Tinggi</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="">Semua</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diperiksa">Diperiksa</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { label: "NO. ANTREAN", width: "w-[12%]" },
                  { label: "PASIEN", width: "w-[30%]" },
                  { label: "POLI & DOKTER", width: "w-[20%]" },
                  { label: "PRIORITAS", width: "w-[15%]" },
                  { label: "STATUS", width: "w-[15%]" },
                  { label: "ACTION", width: "w-[8%]" },
                ].map((col) => (
                  <th key={col.label} className={`pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest ${col.width}`} style={{ fontFamily: "var(--font-jakarta)" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" /> Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-jakarta)" }}>
                      Tidak ada antrean yang ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 align-top">
                      <p className="text-base font-bold text-[#2BB5A0]" style={{ fontFamily: "var(--font-poppins)" }}>{row.noAntrean}</p>
                      <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>{row.waktu}</p>
                    </td>

                    <td className="py-4 align-top pr-12">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>{row.namaPasien}</p>
                          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>{row.jenisKelamin} • {row.umur} tahun</p>
                          <p className="text-xs font-bold text-[#2BB5A0] mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>{row.noRm}</p>
                        </div>
                        <span className={`inline-block px-3 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${row.jenisPasien === "UMUM" ? "bg-green-50 text-[#2BB5A0] border-[#2BB5A0]" : "bg-blue-50 text-blue-500 border-blue-500"}`} style={{ fontFamily: "var(--font-jakarta)" }}>
                          {row.jenisPasien}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 align-top">
                      <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>{row.poli}</p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>{row.dokter}</p>
                    </td>

                    <td className="py-4 align-top">
                      <span className={`inline-block px-6 py-1 rounded-full text-xs font-bold border ${getPrioritasBadge(row.prioritas)}`} style={{ fontFamily: "var(--font-jakarta)" }}>
                        {row.prioritas}
                      </span>
                    </td>

                    <td className="py-4 align-top">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${getStatusBadge(row.status)}`} style={{ fontFamily: "var(--font-jakarta)" }}>
                        {row.status}
                      </span>
                    </td>

                    <td className="py-4 align-top">
                      <div className="flex items-center gap-2">
                        <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                          <Eye size={14} strokeWidth={2.5} />
                        </button>
                        {isAuthorized && (
                          <>
                            <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors">
                              <Pencil size={14} strokeWidth={2.5} />
                            </button>
                            <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>
              <ChevronLeft size={16} strokeWidth={3} /> Sebelum
            </button>
            <button className="w-8 h-8 rounded-lg text-sm font-bold text-white bg-[#2BB5A0]" style={{ fontFamily: "var(--font-jakarta)" }}>1</button>
            <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-jakarta)" }}>
              Selanjutnya <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}