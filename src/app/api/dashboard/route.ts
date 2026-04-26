import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // Active plan
  const activePlan = await prisma.plan.findFirst({
    where: { userId, status: "active" },
    include: {
      tasks: {
        include: { recipe: true },
        orderBy: [{ dayNumber: "asc" }, { category: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlan) {
    return NextResponse.json({ activePlan: null, todayTasks: [], stats: null });
  }

  // Today's tasks
  const today = new Date();
  const startOfPlan = new Date(activePlan.startDate);
  const diffMs = today.getTime() - startOfPlan.getTime();
  const dayNumber = Math.max(1, Math.min(Math.floor(diffMs / 86400000) + 1, activePlan.durationDays));
  const todayTasks = activePlan.tasks.filter((t) => t.dayNumber === dayNumber);

  // Stats
  const totalTasks = activePlan.tasks.length;
  const completedTasks = activePlan.tasks.filter((t) => t.completed).length;
  const todayCompleted = todayTasks.filter((t) => t.completed).length;

  // Streak: count consecutive days with at least 1 completed task going back from today
  let streak = 0;
  for (let d = dayNumber; d >= 1; d--) {
    const dayTasks = activePlan.tasks.filter((t) => t.dayNumber === d);
    if (dayTasks.some((t) => t.completed)) streak++;
    else break;
  }

  return NextResponse.json({
    activePlan: {
      id: activePlan.id,
      goalType: activePlan.goalType,
      goalDetails: activePlan.goalDetails,
      durationDays: activePlan.durationDays,
      planSummary: activePlan.planSummary,
      dailyCalorieTarget: activePlan.dailyCalorieTarget,
      dailyProteinTarget: activePlan.dailyProteinTarget,
      status: activePlan.status,
      startDate: activePlan.startDate,
    },
    todayTasks,
    dayNumber,
    stats: {
      streak,
      totalTasks,
      completedTasks,
      progressPct: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      todayCompleted,
      todayTotal: todayTasks.length,
    },
  });
}
