import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

function formatTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findUnique({
      where: { username: session.user.username as string },
      include: { practitioner: true },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const whereCondition: Prisma.EncounterWhereInput =
      account.role === "DOKTER" && account.practitioner
        ? { practitionerId: account.practitioner.id }
        : {};

    const encounters = await prisma.encounter.findMany({
      where: whereCondition,
      include: {
        patient: true,
        practitioner: true,
      },
      orderBy: {
        periodStart: "desc",
      },
    });

    const mappedData = encounters.map((enc) => {
      const date = new Date(enc.periodStart);

      const birthDate = new Date(enc.patient.tanggalLahir);
      let age = date.getFullYear() - birthDate.getFullYear();
      const m = date.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && date.getDate() < birthDate.getDate())) {
        age--;
      }

      return {
        id: enc.id,
        noAntrean: enc.queueNumber,
        tanggal: date.toISOString().split("T")[0],
        waktu: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        namaPasien: enc.patient.namaLengkap,
        jenisKelamin: enc.patient.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
        umur: age,
        noRm: enc.patient.noRm,
        jenisPasien: enc.patient.jenisPasien,
        poli: enc.practitioner?.speciality ?? "-",
        dokter: enc.practitioner?.name ?? "Belum ditentukan",
        prioritas: formatTitleCase(enc.priority),
        status: formatTitleCase(enc.status),
      };
    });

    return NextResponse.json({ success: true, data: mappedData });

  } catch (error) {
    console.error("Error fetching encounters:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
