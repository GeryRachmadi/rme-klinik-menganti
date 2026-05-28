import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManajemenPenggunaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/beranda?error=unauthorized");
  }

  return <>{children}</>;
}
