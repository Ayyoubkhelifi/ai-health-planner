import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateHealthPlan } from "@/lib/openrouter";

const RegenerateSchema = z.object({
  planId: z.string(),
  dayNumber: z.number().int().min(1),
  userPrompt: z.string().max(500).optional().default(""),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = RegenerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { planId, dayNumber, userPrompt } = parsed.data;

  // Verify plan belongs to user
  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId: session.user.id, status: "active" },
  });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Get safe recipes
  const allRecipes = await prisma.recipe.findMany({
    include: { recipeIngredients: { include: { ingredient: true } } },
    take: 30,
    orderBy: { name: "asc" },
  });

  const recipesJSON = JSON.stringify(
    allRecipes.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category || "General",
      ingredients: r.ingredients.slice(0, 80),
    }))
  );

  const DaySchema = z.object({
    tasks: z.array(
      z.object({
        category: z.enum(["nutrition", "exercise", "hydration", "sleep", "mindfulness"]),
        title: z.string(),
        description: z.string(),
        recipeId: z.string().nullable().optional(),
        durationMin: z.number().nullable().optional(),
        caloriesKcal: z.number().nullable().optional(),
      })
    ),
  });

  const prompt = `Regenerate ONLY Day ${dayNumber} of a health plan.

Plan context:
- Goal: ${plan.goalType.replace(/_/g, " ")}
- Daily calorie target: ${plan.dailyCalorieTarget} kcal
- Daily protein target: ${plan.dailyProteinTarget}g

${userPrompt ? `USER'S SPECIAL REQUEST FOR THIS DAY: "${userPrompt}"` : "Make this day feel fresh and different from a typical day."}

Available recipes (use ONLY their exact IDs):
${recipesJSON}

Create 5-8 varied tasks across nutrition, exercise, hydration, sleep, and mindfulness categories.
Each task should have a DETAILED description (2-4 sentences) with specific quantities, sets/reps, or techniques.

Return ONLY this JSON (no markdown, no code blocks):
{
  "tasks": [
    {
      "category": "nutrition"|"exercise"|"hydration"|"sleep"|"mindfulness",
      "title": "Engaging specific title",
      "description": "Detailed actionable description",
      "recipeId": "exact recipe ID or null",
      "durationMin": number or null,
      "caloriesKcal": number or null
    }
  ]
}`;

  let aiRaw: string;
  try {
    aiRaw = await generateHealthPlan(prompt);
  } catch (e: unknown) {
    console.error("AI regenerate error:", e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  let dayPlan: z.infer<typeof DaySchema>;
  try {
    const jsonText = aiRaw.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
    dayPlan = DaySchema.parse(JSON.parse(jsonText));
  } catch (e: unknown) {
    console.error("AI parse error:", e, aiRaw.slice(0, 500));
    return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
  }

  // Delete old tasks for this day, insert new ones
  const taskDate = new Date(plan.startDate);
  taskDate.setDate(taskDate.getDate() + dayNumber - 1);

  await prisma.task.deleteMany({
    where: { planId, dayNumber },
  });

  const validIds = new Set(allRecipes.map((r) => r.id));
  const newTasks = dayPlan.tasks.map((task) => ({
    planId,
    dayNumber,
    date: taskDate,
    category: task.category,
    title: task.title,
    description: task.description,
    recipeId: task.recipeId && validIds.has(task.recipeId) ? task.recipeId : null,
    durationMin: task.durationMin || null,
    caloriesKcal: task.caloriesKcal || null,
  }));

  await prisma.task.createMany({ data: newTasks });

  return NextResponse.json({ success: true, tasksCount: newTasks.length });
}
