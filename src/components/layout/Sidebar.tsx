"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Home,
  Stethoscope,
  ClipboardList,
  UserCog,
  LogOut,
} from "lucide-react";

type Role = "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";

interface NavItem {
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const baseNavItems: NavItem[] = [
  { label: "Beranda", href: "/beranda", Icon: Home },
  { label: "Rawat Jalan", href: "/rawat-jalan", Icon: Stethoscope },
  { label: "Rekam Medis", href: "/rekam-medis", Icon: ClipboardList },
];

const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    ...baseNavItems,
    { label: "Manajemen Pengguna", href: "/manajemen-pengguna", Icon: UserCog },
  ],
  PENDAFTARAN: baseNavItems,
  PERAWAT: baseNavItems,
  DOKTER: baseNavItems,
};

interface SidebarProps {
  role: Role;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navItemsByRole[role];

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
      {/* Navigasi */}
      <nav className="flex-1 p-3 pt-4">
        <ul className="space-y-1">
          {navItems.map(({ label, href, Icon }) => {
            const isActive =
              href === "/beranda"
                ? pathname === "/beranda"
                : pathname === href || pathname.startsWith(href + "/");

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
                    isActive
                      ? "bg-[#2BB5A0] text-white font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-white" : "text-gray-400"}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tombol Keluar */}
      <div className="p-3 pb-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors text-sm"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          <LogOut size={18} className="text-gray-400" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
