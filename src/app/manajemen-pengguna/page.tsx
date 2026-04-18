import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ManajemenPengguna from "@/components/shared/ManajemenPengguna";

export default async function ManajemenPenggunaPage() {
  const session = await auth();

  return (
    <DashboardLayout>
      <ManajemenPengguna role={session?.user?.role} />
    </DashboardLayout>
  );
}
