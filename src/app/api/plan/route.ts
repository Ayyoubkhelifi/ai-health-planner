import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    include: { tasks: { orderBy: { dayNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ plans });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, status } = await req.json();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { status },
  });
  return NextResponse.json({ plan: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete all tasks first, then the plan
  await prisma.task.deleteMany({ where: { planId } });
  await prisma.plan.delete({ where: { id: planId } });

  return NextResponse.json({ success: true });
}
