import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q   = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const all = req.nextUrl.searchParams.get("all") === "true";

  if (all) {
    const results = await prisma.iCD10Reference.findMany({
      select: { id: true, code: true, display: true, display_id: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(results);
  }

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await prisma.iCD10Reference.findMany({
    where: {
      OR: [
        { code:       { contains: q, mode: "insensitive" } },
        { display:    { contains: q, mode: "insensitive" } },
        { display_id: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, code: true, display: true, display_id: true },
    take: 20,
  });

  return NextResponse.json(results);
}
