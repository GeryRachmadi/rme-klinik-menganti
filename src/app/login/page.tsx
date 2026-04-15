"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // NextAuth integration - TR-20
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
            {/* Username */}
            <div className="flex flex-col gap-2">
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
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-teal-400 transition"
                style={{ fontFamily: "var(--font-jakarta)" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-teal-400 transition pr-12"
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
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              className="mt-4 w-full py-4 rounded-full text-white font-semibold text-sm transition hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(90deg, #4DD9C0 0%, #2BB5A0 100%)",
                fontFamily: "var(--font-poppins)",
              }}
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}