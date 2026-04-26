import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, completed } = await req.json();

  // Verify task belongs to user's plan
  const task = await prisma.task.findFirst({
    where: { id: taskId, plan: { userId: session.user.id } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
  return NextResponse.json({ task: updated });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  const dayNumber = searchParams.get("day");

  const tasks = await prisma.task.findMany({
    where: {
      plan: { userId: session.user.id },
      ...(planId ? { planId } : {}),
      ...(dayNumber ? { dayNumber: parseInt(dayNumber) } : {}),
    },
    include: { recipe: true },
    orderBy: [{ dayNumber: "asc" }, { category: "asc" }],
  });
  return NextResponse.json({ tasks });
}
