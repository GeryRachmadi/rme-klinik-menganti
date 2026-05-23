export type Role = "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Beranda",
    href: "/beranda",
    description: "dashboard utama halaman awal",
    roles: ["ADMIN", "PENDAFTARAN", "PERAWAT", "DOKTER"],
  },
  {
    label: "Rawat Jalan",
    href: "/rawat-jalan",
    description: "antrean kunjungan daftar pasien rawat",
    roles: ["ADMIN", "PENDAFTARAN", "PERAWAT", "DOKTER"],
  },
  {
    label: "Rekam Medis",
    href: "/rekam-medis",
    description: "data pasien riwayat medis arsip rekam",
    roles: ["ADMIN", "PENDAFTARAN", "PERAWAT", "DOKTER"],
  },
  {
    label: "Manajemen Pengguna",
    href: "/manajemen-pengguna",
    description: "kelola akun pengguna user admin tambah hapus",
    roles: ["ADMIN"],
  },
];
