"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, UserPlus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
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

const mockUsers: DummyAccount[] = [
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
  DOKTER: { label: "DOKTER", className: "bg-blue-50 text-blue-500" },
  PENDAFTARAN: { label: "PENDAFTARAN", className: "bg-purple-50 text-purple-500" },
  PERAWAT: { label: "PERAWAT", className: "bg-green-50 text-green-600" },
  ADMIN: { label: "ADMIN", className: "bg-gray-100 text-gray-500" },
};

export default function ManajemenPengguna() {
  // ── Table data state ──────────────────────────────────────
  const [users, setUsers] = useState<DummyAccount[]>(mockUsers);

  // ── Filter state ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // ── Modal state ───────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<DummyAccount | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DummyAccount | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<DummyAccount | null>(null);

  // ── Success toast ─────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Toggle handler ────────────────────────────────────────
  function handleToggle(account: DummyAccount) {
    if (!account.isActive) {
      // Inactive → Active: immediate
      setUsers((prev) =>
        prev.map((u) => u.id === account.id ? { ...u, isActive: true } : u)
      );
      showToast(`Akun ${account.name} berhasil diaktifkan.`);
    } else {
      // Active → Inactive: ask for confirmation first
      setUserToDeactivate(account);
    }
  }

  function handleDeactivateConfirm() {
    if (!userToDeactivate) return;
    setUsers((prev) =>
      prev.map((u) => u.id === userToDeactivate.id ? { ...u, isActive: false } : u)
    );
    showToast(`Akun ${userToDeactivate.name} berhasil dinonaktifkan.`);
    setUserToDeactivate(null);
  }

  // ── Delete handler ────────────────────────────────────────
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

  // ── Filtered view ─────────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((account) => {
      if (q) {
        const haystack = [account.name, account.nik, account.ihs ?? "", account.username]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (roleFilter !== "Semua" && account.role !== roleFilter) return false;
      if (statusFilter === "aktif" && !account.isActive) return false;
      if (statusFilter === "nonaktif" && account.isActive) return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ── Modals ── */}
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

      {/* ── Deactivate Confirmation Modal ── */}
      {userToDeactivate && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setUserToDeactivate(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center text-center"
              style={{ fontFamily: "var(--font-jakarta)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2
                className="text-xl font-bold text-gray-800 mb-3"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Nonaktifkan Akun
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Nonaktifkan akun{" "}
                <span className="font-bold text-gray-700">{userToDeactivate.name}</span>?{" "}
                Pengguna ini tidak akan dapat login ke dalam sistem.
              </p>
              <div className="flex gap-3 mt-7 w-full">
                <button
                  onClick={() => setUserToDeactivate(null)}
                  className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeactivateConfirm}
                  className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                >
                  Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Success Toast ── */}
      {toast.visible && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-green-200 rounded-2xl shadow-lg px-5 py-3.5"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}

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
          <div className="flex-1">
            <label
              className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Cari Akun
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2.5} />
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
              {["NAMA", "NIK/IHS", "USERNAME", "ROLE", "ACCESS STATUS", "ACTION"].map((h) => (
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
                    <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.subtitle}
                    </p>
                  </td>

                  {/* NIK/IHS */}
                  <td className="py-4">
                    <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.nik}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.ihs ?? "-"}
                    </p>
                  </td>

                  {/* USERNAME */}
                  <td className="py-4">
                    <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-jakarta)" }}>
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
                    <button
                      onClick={() => handleToggle(account)}
                      className="flex items-center gap-2 cursor-pointer group"
                      title={account.isActive ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                    >
                      <div
                        className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors duration-200"
                        style={{ background: account.isActive ? "#2BB5A0" : "#D1D5DB" }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                          style={{ transform: account.isActive ? "translateX(22px)" : "translateX(2px)" }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {account.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </button>
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
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === 1 ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
              style={{ fontFamily: "var(--font-jakarta)", background: page === 1 ? "#2BB5A0" : undefined }}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-gray-300 text-sm select-none" style={{ fontFamily: "var(--font-jakarta)" }}>
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
