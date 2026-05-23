"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, UserPlus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import AccountFormModal, { type AccountSavePayload } from "@/components/shared/AccountFormModal";
import DeleteConfirmationModal from "@/components/shared/DeleteConfirmationModal";

// ── Types matching GET /api/accounts response ──────────────────────────────

type Role = "DOKTER" | "PENDAFTARAN" | "PERAWAT" | "ADMIN";

interface Practitioner {
  id: string;
  name: string;
  identifierStr: string | null;
  speciality: string | null;
  ihsNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  practitioner: Practitioner | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const roleBadge: Record<Role, { label: string; className: string }> = {
  ADMIN:      { label: "ADMIN",      className: "bg-purple-50 text-purple-500 border-purple-500"    },
  DOKTER: { label: "DOKTER", className: "bg-green-50 text-[#2BB5A0] border-[#2BB5A0]" },
  PERAWAT:     { label: "PERAWAT",     className: "bg-orange-50 text-orange-500 border-orange-500"  },
  PENDAFTARAN: { label: "PENDAFTARAN", className: "bg-blue-50 text-blue-500 border-blue-500"   },
};

function displayName(account: Account): string {
  return account.practitioner?.name ?? account.username;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

// ── Component ────────────────────────────────────────────────────────────────

interface ManajemenPenggunaProps {
  role?: string;
}

export default function ManajemenPengguna({ role }: ManajemenPenggunaProps) {
  const isAdmin = role === "ADMIN";

  // ── Server data ───────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter / search ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Account | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<Account | null>(null);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: "success" | "error" }>({
    message: "", visible: false, type: "success",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true, type });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch accounts ────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/accounts?${params}`);
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data.accounts);
        setPagination(json.data.pagination);
      } else {
        showToast(json.error ?? "Gagal memuat data pengguna.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat memuat data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchAccounts]);

  // ── Client-side role / status filter ─────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      if (roleFilter !== "Semua" && a.role !== roleFilter) return false;
      if (statusFilter === "aktif" && !a.isActive) return false;
      if (statusFilter === "nonaktif" && a.isActive) return false;
      return true;
    });
  }, [accounts, roleFilter, statusFilter]);

  // ── Save (create or update) ───────────────────────────────────────────────
  async function handleSaveAccount(payload: AccountSavePayload): Promise<string | null> {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/accounts/${payload.id}` : "/api/accounts";
    const method = isEdit ? "PATCH" : "POST";

    const { id, ...body } = payload;
    void id;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        return json.error ?? "Terjadi kesalahan saat menyimpan data.";
      }
      await fetchAccounts(isEdit ? currentPage : 1, debouncedSearch);
      if (!isEdit) setCurrentPage(1);
      showToast(json.message ?? (isEdit ? "Akun berhasil diperbarui." : "Akun berhasil dibuat."));
      return null;
    } catch {
      return "Terjadi kesalahan jaringan.";
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${userToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Gagal menghapus akun.", "error");
      } else {
        const newPage = accounts.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        await fetchAccounts(newPage, debouncedSearch);
        setCurrentPage(newPage);
        showToast(`Akun ${displayName(userToDelete)} berhasil dihapus.`);
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  }

  // ── Toggle status ─────────────────────────────────────────────────────────
  async function callToggleAPI(account: Account) {
    setIsTogglingId(account.id);
    try {
      const res = await fetch(`/api/accounts/${account.id}/toggle-status`, { method: "PATCH" });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error ?? "Gagal mengubah status akun.", "error");
      } else {
        setAccounts((prev) =>
          prev.map((a) => a.id === account.id ? { ...a, isActive: !a.isActive } : a)
        );
        const name = displayName(account);
        showToast(`Akun ${name} berhasil ${account.isActive ? "dinonaktifkan" : "diaktifkan"}.`);
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsTogglingId(null);
    }
  }

  function handleToggle(account: Account) {
    if (!account.isActive) {
      callToggleAPI(account);
    } else {
      setUserToDeactivate(account);
    }
  }

  async function handleDeactivateConfirm() {
    if (!userToDeactivate) return;
    const account = userToDeactivate;
    setUserToDeactivate(null);
    await callToggleAPI(account);
  }

  // ── Defensive guard ───────────────────────────────────────────────────────
  if (!isAdmin) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Modals */}
      <AccountFormModal
        isOpen={isAddModalOpen || !!userToEdit}
        onClose={() => { setIsAddModalOpen(false); setUserToEdit(null); }}
        onSave={handleSaveAccount}
        user={userToEdit ? {
          id: userToEdit.id,
          username: userToEdit.username,
          role: userToEdit.role,
          isActive: userToEdit.isActive,
          practitioner: {
            nik: userToEdit.practitioner?.identifierStr ?? "",
            name: userToEdit.practitioner?.name ?? "",
            speciality: userToEdit.practitioner?.speciality ?? null,
          },
        } : undefined}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        userName={userToDelete ? displayName(userToDelete) : ""}
        isLoading={isDeleting}
      />

      {/* Deactivate Confirmation Modal */}
      {userToDeactivate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setUserToDeactivate(null)} />
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
              <h2 className="text-xl font-bold text-gray-800 mb-3" style={{ fontFamily: "var(--font-poppins)" }}>
                Nonaktifkan Akun
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Nonaktifkan akun{" "}
                <span className="font-bold text-gray-700">{displayName(userToDeactivate)}</span>?{" "}
                Pengguna ini tidak akan dapat login ke dalam sistem.
              </p>
              <div className="flex gap-3 mt-7 w-full">
                <button
                  type="button"
                  onClick={() => setUserToDeactivate(null)}
                  className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
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

      {/* Toast */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border ${
            toast.type === "error" ? "border-red-200" : "border-green-200"
          }`}
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {toast.type === "error"
            ? <AlertCircle size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
            : <CheckCircle2 size={18} strokeWidth={2} className="text-green-500 flex-shrink-0" />
          }
          <p className="text-sm text-gray-700 font-medium">{toast.message}</p>
        </div>
      )}

      {/* Row 1: Page Header */}
      <div className="col-span-12 bg-white rounded-3xl px-10 py-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "var(--font-jakarta)" }}>
            Atur akses klinik dan peran administratif dari tiap akun
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "#2BB5A0", fontFamily: "var(--font-jakarta)" }}
          >
            <UserPlus size={16} strokeWidth={2.5} />
            Tambah Akun Baru
          </button>
        )}
      </div>

      {/* Row 2: Filter + Table */}
      <div className="col-span-12 bg-white rounded-3xl px-8 py-7">

        {/* Search / Filter Bar */}
        <div className="flex items-end gap-5 mb-7">
          <div className="flex-1">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>
              Cari Akun
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Cari Nama atau Username…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-50 placeholder-gray-300 outline-none focus:border-[#2BB5A0]"
                style={{ fontFamily: "var(--font-jakarta)" }}
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>
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
            <label className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2" style={{ fontFamily: "var(--font-jakarta)" }}>
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
              {["NAMA", "NIK / NO. IHS", "USERNAME", "ROLE", "ACCESS STATUS", "ACTION"].map((h) => (
                <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 tracking-widest" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center" style={{ fontFamily: "var(--font-jakarta)" }}>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    Memuat data…
                  </div>
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-300" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Tidak ada data pengguna yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : filteredAccounts.map((account) => {
              const badge = roleBadge[account.role];
              const isToggling = isTogglingId === account.id;
              return (
                <tr key={account.id} className="border-b border-gray-50 last:border-0">

                  {/* NAMA */}
                  <td className="py-4">
                    <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.practitioner?.name ?? account.username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.practitioner?.speciality ?? "-"}
                    </p>
                  </td>

                  {/* NIK / IHS */}
                  <td className="py-4">
                    <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.practitioner?.identifierStr ?? "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {account.practitioner?.ihsNumber ?? "-"}
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
                      className={`inline-block px-3 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${badge.className}`}
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* ACCESS STATUS Toggle */}
                  <td className="py-4">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => !isToggling && handleToggle(account)}
                        disabled={isToggling}
                        className="flex items-center gap-2 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
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
                          {isToggling ? "…" : account.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </button>
                    ) : (
                      <span
                        className={`text-sm font-medium ${account.isActive ? "text-[#2BB5A0]" : "text-gray-400"}`}
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {account.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    )}
                  </td>

                  {/* ACTION Buttons */}
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => console.log("View user - coming soon")}
                        className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        title="Lihat detail"
                      >
                        <Eye size={15} strokeWidth={2} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setUserToEdit(account)}
                            className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                            title="Edit akun"
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setUserToDelete(account); setIsDeleteModalOpen(true); }}
                            className="cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Hapus akun"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
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

            {getPageNumbers(currentPage, pagination.totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-sm select-none" style={{ fontFamily: "var(--font-jakarta)" }}>
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === currentPage ? "text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)", background: p === currentPage ? "#2BB5A0" : undefined }}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === pagination.totalPages}
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
        {!isLoading && (
          <p className="text-center text-xs text-gray-300 mt-4" style={{ fontFamily: "var(--font-jakarta)" }}>
            Menampilkan {filteredAccounts.length} dari {pagination.total} akun
          </p>
        )}

      </div>
    </div>
  );
}
