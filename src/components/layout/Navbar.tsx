"use client";

import { Search, Bell, Plus } from "lucide-react";

type Role = "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  PENDAFTARAN: "Pendaftaran",
  PERAWAT: "Perawat",
  DOKTER: "Dokter",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

interface NavbarProps {
  name: string;
  role: Role;
}

export default function Navbar({ name, role }: NavbarProps) {
  const initials = getInitials(name);

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center flex-shrink-0">
      {/* Logo — lebarnya disejajarkan dengan Sidebar */}
      <div
        className="w-72 flex-shrink-0 flex items-center gap-3 px-5"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #4DD9C0 0%, #2BB5A0 100%)",
          }}
        >
          <Plus size={16} className="text-white" strokeWidth={3} />
        </div>
        <div>
          <p
            className="font-bold text-gray-900 leading-tight text-sm"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Klinik
          </p>
          <p
            className="text-xs text-gray-400 leading-tight"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Pratama Menganti
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative w-full max-w-lg">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari pasien, jadwal, atau fitur…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2BB5A0]/30 transition"
            style={{ fontFamily: "var(--font-jakarta)" }}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Kanan: Bell + Info User */}
      <div className="w-72 flex items-center gap-4 pr-6 flex-shrink-0 justify-end">
        {/* Notifikasi */}
        <button type="button" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
        </button>

        {/* Info User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-sm font-bold text-gray-800 leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {name.toUpperCase()}
            </p>
            <p
              className="text-xs text-gray-400 leading-tight uppercase tracking-wide"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {roleLabels[role]}
            </p>
          </div>

          {/* Avatar inisial */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #4DD9C0 0%, #2BB5A0 100%)",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
