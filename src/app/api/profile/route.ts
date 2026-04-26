import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ProfileSchema = z.object({
  heightCm: z.number().positive().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.string().optional().nullable(),
  activityLevel: z.string().optional().nullable(),
  nutritionalGoal: z.string().optional().nullable(),
  dietaryPreference: z.string().optional().nullable(),
  chronicDisease: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  physicalActivity: z.boolean().optional().nullable(),
  activityFrequency: z.string().optional().nullable(),
  mealsPerDay: z.string().optional().nullable(),
  allergyIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  const userAllergies = await prisma.userAllergy.findMany({
    where: { userId: session.user.id },
    include: { allergy: true },
  });

  return NextResponse.json({
    profile,
    allergies: userAllergies.map((ua) => ua.allergy),
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { allergyIds, ...profileData } = parsed.data;
  const userId = session.user.id;

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: profileData,
    create: { userId, ...profileData },
  });

  // Update allergies
  if (allergyIds !== undefined) {
    await prisma.userAllergy.deleteMany({ where: { userId } });
    if (allergyIds.length > 0) {
      await prisma.userAllergy.createMany({
        data: allergyIds.map((allergyId) => ({ userId, allergyId })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ profile });
}
