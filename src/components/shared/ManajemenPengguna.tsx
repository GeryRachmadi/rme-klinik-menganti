"use client";

import { useState, useMemo } from "react";
import { Search, UserPlus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import AccountFormModal from "@/components/shared/AccountFormModal";
import DeleteConfirmationModal from "@/components/shared/DeleteConfirmationModal";

type Role = "DOKTER" | "PENDAFTARAN" | "PERAWAT" | "ADMIN";

interface DummyAccount {
  id: string;
  name: string;
  subtitle: string;
  nik: string;
  ihs: string | null;
  username: string;
  role: Role;
  isActive: boolean;
}

const dummyAccounts: DummyAccount[] = [
  {
    id: "1",
    name: "dr.Strange",
    subtitle: "Dokter Poli Umum",
    nik: "1234567890123456",
    ihs: "10009880728",
    username: "strange.practitioner",
    role: "DOKTER",
    isActive: true,
  },
  {
    id: "2",
    name: "Gabrielle",
    subtitle: "Petugas Pendaftaran",
    nik: "3578014502980003",
    ihs: null,
    username: "gabrielle.frontdesk",
    role: "PENDAFTARAN",
    isActive: true,
  },
  {
    id: "3",
    name: "Fanny",
    subtitle: "Perawat",
    nik: "3578016708990012",
    ihs: "10007262080",
    username: "fanny.nurse",
    role: "PERAWAT",
    isActive: false,
  },
];

const roleBadge: Record<Role, { label: string; className: string }> = {
  DOKTER: {
    label: "DOKTER",
    className: "bg-blue-50 text-blue-500",
  },
  PENDAFTARAN: {
    label: "PENDAFTARAN",
    className: "bg-purple-50 text-purple-500",
  },
  PERAWAT: {
    label: "PERAWAT",
    className: "bg-green-50 text-green-600",
  },
  ADMIN: {
    label: "ADMIN",
    className: "bg-gray-100 text-gray-500",
  },
};

export default function ManajemenPengguna() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<DummyAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DummyAccount | null>(null);

  function handleDeleteConfirm() {
    console.log("Delete payload:", {
      id: userToDelete?.id,
      username: userToDelete?.username,
      role: userToDelete?.role,
      nik: userToDelete?.nik,
      name: userToDelete?.name,
      speciality: userToDelete?.subtitle ?? null,
    });
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  }

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dummyAccounts.filter((account) => {
      if (q) {
        const haystack = [
          account.name,
          account.nik,
          account.ihs ?? "",
          account.username,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (roleFilter !== "Semua" && account.role !== roleFilter) return false;
      if (statusFilter === "aktif" && !account.isActive) return false;
      if (statusFilter === "nonaktif" && account.isActive) return false;
      return true;
    });
  }, [searchQuery, roleFilter, statusFilter]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <AccountFormModal
        isOpen={isAddModalOpen || !!userToEdit}
        onClose={() => { setIsAddModalOpen(false); setUserToEdit(null); }}
        user={userToEdit ? {
          id: userToEdit.id,
          username: userToEdit.username,
          role: userToEdit.role,
          isActive: userToEdit.isActive,
          practitioner: {
            nik: userToEdit.nik,
            name: userToEdit.name,
            speciality: userToEdit.subtitle ?? null,
          },
        } : undefined}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        userName={userToDelete?.name ?? ""}
      />

      {/* ── Row 1: Page Header ── */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 leading-tight"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Manajemen Pengguna
          </h1>
          <p
            className="text-sm text-gray-400 mt-1"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Atur akses klinik dan peran administratif dari tiap akun
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
        >
          <UserPlus size={16} strokeWidth={2.5} />
          Tambah Akun Baru
        </button>
      </div>

      {/* ── Row 2: Filter + Table ── */}
      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">

        {/* Search / Filter Bar */}
        <div className="flex items-end gap-5 mb-7">
          {/* Search */}
          <div className="flex-1">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Cari Akun
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="Cari Nama, NIK, IHS, atau Username..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 placeholder-gray-300 outline-none focus:border-[#2BB5A0]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="w-48">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="Semua">Semua</option>
              <option value="ADMIN">Admin</option>
              <option value="PENDAFTARAN">Pendaftaran</option>
              <option value="PERAWAT">Perawat</option>
              <option value="DOKTER">Dokter</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-48">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 outline-none appearance-none cursor-pointer"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <option value="Semua">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                NAMA
              </th>
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                NIK/IHS
              </th>
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                USERNAME
              </th>
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                ROLE
              </th>
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                ACCESS STATUS
              </th>
              <th
                className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 text-center text-sm text-gray-300"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Tidak ada data pengguna yang sesuai dengan pencarian.
                </td>
              </tr>
            )}
            {filteredAccounts.map((account) => {
              const badge = roleBadge[account.role];
              return (
                <tr key={account.id} className="border-b border-gray-50 last:border-0">
                  {/* NAMA */}
                  <td className="py-4">
                    <p
                      className="text-sm font-bold text-gray-800"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {account.name}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {account.subtitle}
                    </p>
                  </td>

                  {/* NIK/IHS */}
                  <td className="py-4">
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {account.nik}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {account.ihs ?? "-"}
                    </p>
                  </td>

                  {/* USERNAME */}
                  <td className="py-4">
                    <span
                      className="text-sm text-gray-600"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {account.username}
                    </span>
                  </td>

                  {/* ROLE Badge */}
                  <td className="py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${badge.className}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* ACCESS STATUS Toggle */}
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {/* Toggle switch – static visual */}
                      <div
                        className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
                        style={{ background: account.isActive ? "#2BB5A0" : "#D1D5DB" }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                          style={{
                            transform: account.isActive
                              ? "translateX(22px)"
                              : "translateX(2px)",
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {account.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </td>

                  {/* ACTION Buttons */}
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => console.log("View user - coming soon")}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        title="Lihat detail"
                      >
                        <Eye size={15} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setUserToEdit(account)}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                        title="Edit akun"
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => { setUserToDelete(account); setIsDeleteModalOpen(true); }}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Hapus akun"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-1 mt-8">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            Sebelum
          </button>

          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                page === 1
                  ? "text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              style={{
                fontFamily: "var(--font-jakarta)",
                background: page === 1 ? "#2BB5A0" : undefined,
              }}
            >
              {page}
            </button>
          ))}

          <span
            className="px-1 text-gray-300 text-sm select-none"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            .......
          </span>

          <button
            className="w-9 h-9 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            12
          </button>

          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Selanjutnya
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}
