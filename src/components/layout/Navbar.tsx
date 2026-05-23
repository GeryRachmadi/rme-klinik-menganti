"use client";

import { Plus } from "lucide-react";
import GlobalSearch from "@/components/shared/GlobalSearch";
import NotificationDropdown from "@/components/shared/NotificationDropdown";

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center flex-shrink-0">
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
        <GlobalSearch userRole={role} />
      </div>

      {/* Kanan: Bell + Info User */}
      <div className="w-72 flex items-center gap-4 pr-6 flex-shrink-0 justify-end">
        {/* Notifikasi */}
        <NotificationDropdown userRole={role} />

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
