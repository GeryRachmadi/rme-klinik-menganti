import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

type Role = "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const name = session.user.name ?? session.user.username ?? "Pengguna";
  const role = session.user.role as Role;

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9]">
      <Navbar name={name} role={role} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
