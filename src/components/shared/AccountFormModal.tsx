"use client";

import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, AlertCircle, ChevronDown } from "lucide-react";

export type AccountSavePayload = {
  id?: string;
  username: string;
  password?: string;
  role: string;
  nik: string;
  namaLengkap: string;
  spesialisasi?: string;
};

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AccountSavePayload) => Promise<string | null>;
  user?: {
    id: string;
    username: string;
    role: "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";
    isActive: boolean;
    practitioner: {
      nik: string;
      name: string;
      speciality: string | null;
    };
  };
}

interface FormErrors {
  username?: string;
  password?: string;
  role?: string;
  nik?: string;
  namaLengkap?: string;
  spesialisasi?: string;
}

export default function AccountFormModal({ isOpen, onClose, onSave, user }: AccountFormModalProps) {
  const isEditMode = !!user;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [nik, setNik] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [spesialisasi, setSpesialisasi] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setRole(user.role);
      setNik(user.practitioner.nik);
      setNamaLengkap(user.practitioner.name);
      setSpesialisasi(user.practitioner.speciality ?? "");
      setPassword("");
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (showValidationToast) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowValidationToast(false), 3000);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [showValidationToast]);

  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setPassword("");
      setRole("");
      setNik("");
      setNamaLengkap("");
      setSpesialisasi("");
      setShowPassword(false);
      setIsSaving(false);
      setErrors({});
      setApiError(null);
      setShowValidationToast(false);
    }
  }, [isOpen]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!username.trim()) errs.username = "Username tidak boleh kosong";
    if (!isEditMode && !password.trim()) errs.password = "Password tidak boleh kosong";
    if (!role) errs.role = "Role tidak boleh dikosongi";
    if (!nik.trim() || !/^\d{16}$/.test(nik.trim())) errs.nik = "NIK harus 16 digit";
    if (!namaLengkap.trim()) errs.namaLengkap = "Nama lengkap tidak boleh kosong";
    if (role === "DOKTER" && !spesialisasi.trim()) errs.spesialisasi = "Spesialisasi wajib diisi untuk peran Dokter.";
    return errs;
  }

  async function handleSimpan() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowValidationToast(true);
      return;
    }

    setIsSaving(true);
    setApiError(null);

    const payload: AccountSavePayload = {
      ...(isEditMode && { id: user!.id }),
      username,
      ...(password && { password }),
      role,
      nik,
      namaLengkap,
      ...(spesialisasi && { spesialisasi }),
    };

    const errorMsg = await onSave(payload);

    setIsSaving(false);
    if (errorMsg) {
      setApiError(errorMsg);
    } else {
      onClose();
    }
  }

  if (!isOpen) return null;

  const inputBase = "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-700 placeholder-gray-300 outline-none focus:bg-white transition-colors";
  const inputNormal = `${inputBase} border-gray-200 focus:border-[#2BB5A0]`;
  const inputError = `${inputBase} border-red-400`;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div
        className="fixed top-0 right-0 h-full w-[440px] bg-white z-50 flex flex-col shadow-2xl"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-[#009E95] flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-xl font-bold text-white leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {isEditMode ? "Edit Akun" : "Tambah Akun Baru"}
            </h2>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              {isEditMode
                ? "Perbarui informasi akun pengguna"
                : "Lengkapi informasi dibawah untuk membuat akun baru"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors mt-0.5"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

          {/* Section 1: INFORMASI */}
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#2BB5A0" }}>
              Informasi
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={errors.username ? inputError : inputNormal}
              />
              {errors.username && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isEditMode ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pr-11 ${errors.password ? inputError : inputNormal}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <Eye size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`appearance-none cursor-pointer ${errors.role ? inputError : inputNormal} ${!role ? "text-gray-300" : "text-gray-700"}`}
                >
                  <option value="" disabled>Pilih role…</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PENDAFTARAN">Pendaftaran</option>
                  <option value="PERAWAT">Perawat</option>
                  <option value="DOKTER">Dokter</option>
                </select>
                <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.role && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.role}</p>}
            </div>
          </div>

          {/* Section 2: DATA PERSONAL */}
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#2BB5A0" }}>
              Data Personal
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                NIK (Nomor Induk Kependudukan)
              </label>
              <input
                type="text"
                placeholder="Masukkan 16 digit NIK"
                autoComplete="off"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                className={errors.nik ? inputError : inputNormal}
              />
              {errors.nik && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.nik}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                autoComplete="off"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className={errors.namaLengkap ? inputError : inputNormal}
              />
              {errors.namaLengkap && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.namaLengkap}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Spesialisasi (Poli)</label>
              <div className="relative">
                <select
                  value={spesialisasi}
                  onChange={(e) => setSpesialisasi(e.target.value)}
                  className={`appearance-none cursor-pointer ${errors.spesialisasi ? inputError : inputNormal} ${!spesialisasi ? "text-gray-300" : "text-gray-700"}`}
                >
                  <option value="" disabled>Pilih poli…</option>
                  <option value="Umum">Umum</option>
                  <option value="Gigi">Gigi</option>
                </select>
                <ChevronDown size={15} strokeWidth={2} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.spesialisasi && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.spesialisasi}</p>}
            </div>
          </div>

          {/* Validation error toast */}
          {showValidationToast && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <AlertCircle size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 font-medium">Informasi tidak lengkap atau tidak valid.</p>
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <AlertCircle size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 font-medium">{apiError}</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={isSaving}
            className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70 cursor-pointer"
            style={{ background: "#2BB5A0" }}
          >
            {isSaving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </>
  );
}
