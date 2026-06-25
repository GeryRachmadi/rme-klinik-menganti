"use client";

import { useState } from "react";
import Image from "next/image";
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
    <main className="flex min-h-screen w-full">
      {/* Panel Kiri — putih */}
      <div className="relative flex w-full flex-col bg-white lg:w-[40%] lg:max-w-[640px]">
        {/* Logo Klinik */}
        <div className="flex items-center gap-3 px-8 pt-8 sm:px-12 sm:pt-12">
          <div className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-[#f7f7f7]">
            <Image
              src="/images/clinic_logo.png"
              alt="Logo Klinik Pratama Menganti"
              fill
              sizes="54px"
              className="object-cover"
            />
          </div>
          <div style={{ fontFamily: "var(--font-jakarta)" }}>
            <p className="text-[13px] font-extrabold leading-tight text-[#005147]">Klinik</p>
            <p className="text-[13px] font-medium leading-tight text-[#005147]">Pratama Menganti</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12">
          <div className="mx-auto w-full max-w-[490px]">
            <h2
              className="text-center text-[32px] font-bold tracking-[-0.32px] text-[#3cada3]"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Masuk
            </h2>
            <p
              className="mt-2 text-center text-[16px] text-[#3e4946]"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Masukkan kredensial anda untuk mengakses rekam medis
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col gap-4"
              autoComplete="off"
            >
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium text-black"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Masukkan username anda…"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  className={`w-full rounded-[6px] bg-[#f1f5f9] px-4 py-4 text-sm text-gray-700 placeholder-[#a0a2a2] outline-none transition ${
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
                  className="text-sm font-medium text-black"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password anda…"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full rounded-[6px] bg-[#f1f5f9] px-4 py-4 pr-12 text-sm text-gray-700 placeholder-[#a0a2a2] outline-none transition ${
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
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
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
                className="mt-4 w-full rounded-[20px] py-4 text-[18px] font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(180deg, #5bc8b2 0%, #2fbcbc 100%)",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {loading ? "Memproses…" : "Masuk"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p
          className="pb-8 text-center text-xs text-[#6e7976] sm:pb-12"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Pratama Menganti Clinic Electronic Medical Record
        </p>
      </div>

      {/* Panel Kanan — gradient teal */}
      <div
        className="relative hidden flex-1 overflow-hidden lg:flex"
        style={{ background: "linear-gradient(180deg, #5bc8b2 0%, #2fbcbc 100%)" }}
      >
        <div className="absolute left-[47px] top-[55px] z-10 max-w-[686px] pr-12">
          <h1
            className="text-[36px] font-semibold leading-[56px] tracking-[-0.96px] text-white"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Selamat Datang!
          </h1>
          <p
            className="mt-2 text-[18px] font-medium leading-[28px] text-white"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            di platform digital rekam medis Anda. Kelola informasi pasien dan
            riwayat kunjungan dengan aman dalam satu ekosistem yang terintegrasi.
          </p>
        </div>

        {/* Kolom screenshot kiri (overflow sebagian ke kiri) */}
        <div className="absolute left-[-10%] top-[300px] z-0 flex w-[55%] -rotate-[11deg] flex-col gap-[36px]">
          <div className="relative aspect-[1440/1070] w-full overflow-hidden rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <Image src="/images/mockup_1.png" alt="Tampilan Tambah Kunjungan Baru" fill quality={100} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="relative aspect-[1440/1070] w-full overflow-hidden rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <Image src="/images/mockup_2.png" alt="Tampilan Asesmen Kunjungan" fill quality={100} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>

        {/* Kolom screenshot kanan */}
        <div className="absolute left-[50%] top-[300px] z-0 flex w-[55%] -rotate-[11deg] flex-col gap-[36px]">
          <div className="relative aspect-[1440/1070] w-full overflow-hidden rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <Image src="/images/mockup_3.png" alt="Tampilan Dashboard Dokter" fill quality={100} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="relative aspect-[1440/1070] w-full overflow-hidden rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <Image src="/images/mockup_4.png" alt="Tampilan Rekam Medis Pasien" fill quality={100} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </div>
    </main>
  );
}