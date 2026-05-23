"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  Calendar,
} from "lucide-react";
import EncounterRegistrationDrawer from "@/components/shared/EncounterRegistrationDrawer";
import EncounterEditDrawer from "@/components/shared/EncounterEditDrawer";

type Prioritas = "Stabil" | "Cukup Berisiko" | "Berisiko" | "Berisiko Tinggi";
type StatusAntrean = "Menunggu" | "Diperiksa" | "Selesai" | "Batal";
type JenisPasien = "UMUM" | "BPJS";

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
  prioritas: string;
  status: string;
  syncStatus?: string;
}

interface DaftarAntreanProps {
  userRole?: string;
}

const PRIORITAS_BADGE: Record<Prioritas, string> = {
  "Stabil":         "text-[#2BB5A0] border-[#2BB5A0] bg-white",
  "Cukup Berisiko": "text-orange-500 border-orange-500 bg-white",
  "Berisiko":       "text-yellow-500 border-yellow-500 bg-white",
  "Berisiko Tinggi":"text-red-500 border-red-500 bg-red-50",
};

const STATUS_BADGE: Record<StatusAntrean, string> = {
  "Menunggu": "text-orange-500 border-orange-500 bg-white",
  "Diperiksa": "text-blue-500 border-blue-500 bg-white",
  "Selesai":  "text-[#2BB5A0] border-[#2BB5A0] bg-white",
  "Batal":    "text-red-500 border-red-500 bg-red-50",
};

const FALLBACK_BADGE = "text-gray-500 border-gray-200 bg-white";

export default function DaftarAntrean({ userRole }: DaftarAntreanProps) {
  const [antreanData, setAntreanData] = useState<AntreanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEncounterOpen, setIsAddEncounterOpen] = useState(false);
  const [editEncounterId, setEditEncounterId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaPasien: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterPrioritas, setFilterPrioritas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const isAuthorized = userRole === "PENDAFTARAN" || userRole === "ADMIN";
  const canAssess = userRole === "ADMIN" || userRole === "DOKTER" || userRole === "PERAWAT";
  const router = useRouter();

  const fetchAntrean = useCallback(async () => {
    try {
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
  }, []);

  useEffect(() => {
    fetchAntrean();
    const interval = setInterval(fetchAntrean, 5000);
    return () => clearInterval(interval);
  }, [fetchAntrean]);

  const showActionToast = (message: string, type: "success" | "error") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/encounters/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showActionToast(json.error ?? "Gagal menghapus antrean.", "error");
        return;
      }
      setDeleteTarget(null);
      await fetchAntrean();
      showActionToast("Antrean berhasil dihapus.", "success");
    } catch {
      showActionToast("Terjadi kesalahan tidak terduga.", "error");
    } finally {
      setIsDeleting(false);
    }
  };


  const filteredData = antreanData.filter((item) => {
    const matchSearch =
      item.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noRm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noAntrean.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTanggal   = filterTanggal   ? item.tanggal    === filterTanggal   : true;
    const matchPrioritas = filterPrioritas ? item.prioritas  === filterPrioritas : true;
    const matchStatus    = filterStatus    ? item.status     === filterStatus    : true;

    return matchSearch && matchTanggal && matchPrioritas && matchStatus;
  });

  return (
    <div className="grid grid-cols-12 gap-6" style={{ fontFamily: "var(--font-jakarta)" }}>
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Daftar Antrean dan Kunjungan
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola informasi dan rekam medis pasien
          </p>
        </div>

        {isAuthorized && (
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#2BB5A0" }}
            onClick={() => setIsAddEncounterOpen(true)}
          >
            <UserPlus size={15} strokeWidth={2} />
            + Tambah Kunjungan Baru
          </button>
        )}
      </div>

      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-5 mb-7">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Cari Pasien
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2} />
              <input
                type="text"
                placeholder="Cari Nama, No.RM, atau No. Antrean…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 placeholder-gray-300 outline-none focus:border-[#2BB5A0]"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Tanggal
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <select
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
              >
                <option value="">Semua Tanggal</option>
                <option value={new Date().toISOString().split("T")[0]}>Hari Ini</option>
              </select>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Prioritas
            </label>
            <select
              value={filterPrioritas}
              onChange={(e) => setFilterPrioritas(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
            >
              <option value="">Semua</option>
              <option value="Stabil">Stabil</option>
              <option value="Cukup Berisiko">Cukup Berisiko</option>
              <option value="Berisiko">Berisiko</option>
              <option value="Berisiko Tinggi">Berisiko Tinggi</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none appearance-none cursor-pointer focus:border-[#2BB5A0]"
            >
              <option value="">Semua</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Diperiksa">Diperiksa</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { label: "NO. ANTREAN",   width: "w-[10%]" },
                  { label: "PASIEN",        width: "w-[25%]" },
                  { label: "POLI & DOKTER", width: "w-[18%]" },
                  { label: "PRIORITAS",     width: "w-[12%]" },
                  { label: "STATUS",        width: "w-[13%]" },
                  ...(canAssess  ? [{ label: "ASESMEN", width: "w-[14%]" }] : []),
                  ...(isAuthorized ? [{ label: "ACTION", width: "w-[8%]"  }] : []),
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest ${col.width}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5 + (canAssess ? 1 : 0) + (isAuthorized ? 1 : 0)} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" /> Memuat data…
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5 + (canAssess ? 1 : 0) + (isAuthorized ? 1 : 0)} className="py-16 text-center">
                    <p className="text-sm text-gray-400">
                      Tidak ada antrean yang ditemukan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="py-4 align-top">
                      <p className="text-base font-bold text-[#2BB5A0]" style={{ fontFamily: "var(--font-poppins)" }}>
                        {row.noAntrean}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{row.waktu}</p>
                    </td>

                    <td className="py-4 align-top pr-12">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{row.namaPasien}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {row.jenisKelamin} • {row.umur} tahun
                          </p>
                          <p className="text-xs font-bold text-[#2BB5A0] mt-0.5">{row.noRm}</p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                            row.jenisPasien === "UMUM"
                              ? "bg-green-50 text-[#2BB5A0] border-[#2BB5A0]"
                              : "bg-blue-50 text-blue-500 border-blue-500"
                          }`}
                        >
                          {row.jenisPasien}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 align-top">
                      <p className="text-sm font-bold text-gray-800">{row.poli}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.dokter}</p>
                    </td>

                    <td className="py-4 align-top">
                      <span
                        className={`inline-block px-6 py-1 rounded-full text-xs font-bold border ${
                          PRIORITAS_BADGE[row.prioritas as Prioritas] ?? FALLBACK_BADGE
                        }`}
                      >
                        {row.prioritas}
                      </span>
                    </td>

                    <td className="py-4 align-top">
                      <span
                        className={`inline-block px-4 py-1 rounded-full text-xs font-bold border ${
                          STATUS_BADGE[row.status as StatusAntrean] ?? FALLBACK_BADGE
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.syncStatus === "FAILED_SYNC" && (
                        <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 border border-red-200">
                          ⚠ Gagal: Sinkronisasi SATUSEHAT
                        </span>
                      )}
                    </td>

                    {canAssess && <td className="py-4 align-top">
                      {row.status === "Selesai" ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/rawat-jalan/${row.id}/asesmen`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3B82F6] hover:bg-blue-600 text-white transition-colors cursor-pointer"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          {userRole === "ADMIN" ? "Edit Asesmen" : "Lihat Asesmen"}
                        </button>
                      ) : canAssess && (row.status === "Menunggu" || row.status === "Diperiksa") ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/rawat-jalan/${row.id}/asesmen`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                          style={{ fontFamily: "var(--font-poppins)" }}
                        >
                          {row.status === "Diperiksa" ? "Edit Asesmen" : "Mulai Asesmen"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>}

                    {isAuthorized && (
                      <td className="py-4 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditEncounterId(row.id)}
                            className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Edit kunjungan"
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (userRole === "ADMIN" || row.status === "Menunggu") && setDeleteTarget({ id: row.id, namaPasien: row.namaPasien })}
                            disabled={userRole !== "ADMIN" && row.status !== "Menunggu"}
                            title={userRole !== "ADMIN" && row.status !== "Menunggu" ? "Hanya antrean Menunggu yang dapat dihapus" : "Hapus antrean"}
                            className={`p-2 rounded-lg transition-colors ${
                              userRole === "ADMIN" || row.status === "Menunggu"
                                ? "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                                : "bg-gray-50 text-gray-200 cursor-not-allowed"
                            }`}
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <button type="button" className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} strokeWidth={3} /> Sebelum
            </button>
            <button type="button" className="w-8 h-8 rounded-lg text-sm font-bold text-white bg-[#2BB5A0]">1</button>
            <button type="button" className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#2BB5A0] hover:bg-gray-50 transition-colors">
              Selanjutnya <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      <EncounterRegistrationDrawer
        isOpen={isAddEncounterOpen}
        onClose={() => setIsAddEncounterOpen(false)}
        onEncounterCreated={fetchAntrean}
      />

      <EncounterEditDrawer
        encounterId={editEncounterId}
        isOpen={!!editEncounterId}
        onClose={() => setEditEncounterId(null)}
        onUpdated={fetchAntrean}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={isDeleting ? undefined : () => setDeleteTarget(null)} />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" strokeWidth={2} />
              </div>
              <h3
                className="text-base font-bold text-gray-800 text-center mb-1"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Hapus Antrean?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Antrean <span className="font-semibold text-gray-700">{deleteTarget.namaPasien}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <><Loader2 size={14} className="animate-spin" /> Menghapus…</>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action toast */}
      {actionToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            actionToast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {actionToast.type === "error" ? (
            <span className="text-red-500 text-sm font-medium">{actionToast.message}</span>
          ) : (
            <span className="text-green-600 text-sm font-medium">{actionToast.message}</span>
          )}
        </div>
      )}
    </div>
  );
}
