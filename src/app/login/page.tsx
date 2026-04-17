"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateFields = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = "Username wajib diisi.";
    if (!password) errors.password = "Password wajib diisi.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const errorMessageMap: Record<string, string> = {
    credentials: "Username atau Password salah.",
    account_inactive: "Akun Anda telah dinonaktifkan. Hubungi administrator.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateFields()) return;

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        const code = result.code ?? "unknown";
        setFormError(errorMessageMap[code] ?? "Terjadi kesalahan. Silakan coba lagi.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        window.location.href = "/beranda";
      }
    } catch {
      setFormError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div
        className="w-full bg-white rounded-3xl shadow-xl overflow-hidden flex"
        style={{ maxWidth: "1000px", minHeight: "540px" }}
      >
        {/* Panel Kiri */}
        <div
          className="hidden md:flex w-5/12 flex-col items-center justify-between p-12 text-white"
          style={{
            background: "linear-gradient(160deg, #4DD9C0 0%, #2BB5A0 100%)",
            fontFamily: "var(--font-poppins)",
          }}
        >
          <div />
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Selamat Datang!</h1>
            <p className="text-sm text-white/80 leading-relaxed">
              Masuk untuk mengakses rekam medis
            </p>
          </div>
          <p className="text-xs text-white/60 text-center leading-relaxed">
            Pratama Menganti Clinic Electronic Medical Record
          </p>
        </div>

        {/* Panel Kanan */}
        <div className="flex-1 flex flex-col justify-center px-14 py-14">
          <h2
            className="text-4xl font-bold text-center mb-10"
            style={{
              color: "#2BB5A0",
              fontFamily: "var(--font-poppins)",
            }}
          >
            Masuk
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            autoComplete="off"
          >
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm text-gray-700 font-medium"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Username
              </label>
              <input
                type="text"
                placeholder="Masukkan username anda..."
                autoComplete="off"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }}
                className={`w-full px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 text-sm outline-none transition ${
                  fieldErrors.username
                    ? "ring-2 ring-red-400 bg-red-50"
                    : "focus:ring-2 focus:ring-teal-400"
                }`}
                style={{ fontFamily: "var(--font-jakarta)" }}
              />
              {fieldErrors.username && (
                <span className="text-xs text-red-500" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {fieldErrors.username}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm text-gray-700 font-medium"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password anda..."
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 text-sm outline-none transition pr-12 ${
                    fieldErrors.password
                      ? "ring-2 ring-red-400 bg-red-50"
                      : "focus:ring-2 focus:ring-teal-400"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="text-xs text-red-500" style={{ fontFamily: "var(--font-jakarta)" }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Form Error Message */}
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <span
                  className="text-xs text-red-600"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  {formError}
                </span>
              </div>
            )}

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 rounded-full text-white font-semibold text-sm transition hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(90deg, #4DD9C0 0%, #2BB5A0 100%)",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}