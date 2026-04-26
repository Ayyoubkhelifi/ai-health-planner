import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const allergies = await prisma.allergy.findMany({
    orderBy: { name: "asc" },
    where: { name: { not: "Cross-Allergy Between Foods" } },
  });
  return NextResponse.json({ allergies });
}
