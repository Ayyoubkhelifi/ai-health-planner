import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateHealthPlan } from "@/lib/openrouter";
import { calcBMI, calcBMR, calcTDEE, getBMICategory, sanitizeForPrompt } from "@/lib/health";

// Inline types matching Prisma query results (avoids import issues with Prisma namespace)
interface IngredientRecord {
  id: string;
  name: string;
  allergyId: string | null;
  createdAt: Date;
}

interface RecipeIngredientWithIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredient: IngredientRecord;
}

interface RecipeWithIngredients {
  id: string;
  name: string;
  nameAr: string | null;
  ingredients: string;
  category: string | null;
  createdAt: Date;
  recipeIngredients: RecipeIngredientWithIngredient[];
}

interface UserAllergyWithAllergy {
  userId: string;
  allergyId: string;
  allergy: { id: string; name: string };
}

const GenerateSchema = z.object({
  goalType: z.enum(["weight_loss", "muscle_gain", "maintenance", "endurance", "flexibility"]),
  goalDetails: z.string().min(1).max(500),
  durationDays: z.number().int().min(7).max(90),
  equipment: z.string().max(200).optional().default(""),
  exerciseTimeMin: z.number().int().min(10).max(180).optional().default(30),
  foodLikes: z.string().max(500).optional().default(""),
  foodDislikes: z.string().max(500).optional().default(""),
  dietType: z.enum(["any", "vegetarian", "vegan", "pescatarian", "keto", "mediterranean"]).optional().default("any"),
});

const AITaskSchema = z.object({
  category: z.enum(["nutrition", "exercise", "hydration", "sleep", "mindfulness"]),
  title: z.string(),
  description: z.string(),
  recipeId: z.string().nullable().optional(),
  durationMin: z.number().nullable().optional(),
  caloriesKcal: z.number().nullable().optional(),
});

const AIPlanSchema = z.object({
  planSummary: z.string(),
  dailyCalorieTarget: z.number(),
  dailyProteinTarget: z.number(),
  days: z.array(
    z.object({
      dayNumber: z.number(),
      tasks: z.array(AITaskSchema),
    })
  ),
});

// Rate limit: max 3 plans per user per day
async function checkRateLimit(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await prisma.plan.count({
    where: { userId, createdAt: { gte: today } },
  });
  return count < 3;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId: string = session.user.id;

  // Rate limit
  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit reached: max 3 plans per day" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { goalType, goalDetails, durationDays, equipment, exerciseTimeMin, foodLikes, foodDislikes, dietType } = parsed.data;

  // Fetch user profile + allergies
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const userAllergies: UserAllergyWithAllergy[] = await prisma.userAllergy.findMany({
    where: { userId },
    include: { allergy: true },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const allergyNames: string[] = userAllergies.map(
    (ua: UserAllergyWithAllergy) => ua.allergy.name
  );

  // Calculate metrics
  const bmi: number | null =
    profile?.weightKg && profile?.heightCm
      ? calcBMI(profile.weightKg, profile.heightCm)
      : null;
  const bmiCategory: string = bmi ? getBMICategory(bmi).label : "Unknown";
  const bmr: number | null =
    profile?.weightKg && profile?.heightCm && profile?.age && profile?.gender
      ? calcBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender)
      : null;
  const tdee: number | null = bmr
    ? calcTDEE(bmr, profile?.activityLevel || "moderately active")
    : null;

  // Fetch safe recipes (exclude allergy ingredients)
  let excludedIngNames: string[] = [];
  if (allergyNames.length > 0) {
    const allergyIngredients: { name: string }[] = await prisma.ingredient.findMany({
      where: { allergy: { name: { in: allergyNames } } },
      select: { name: true },
    });
    excludedIngNames = allergyIngredients.map((i: { name: string }) => i.name.toLowerCase());
  }

  const allRecipes: RecipeWithIngredients[] = await prisma.recipe.findMany({
    include: { recipeIngredients: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });

  const safeRecipes: RecipeWithIngredients[] = allRecipes
    .filter((r: RecipeWithIngredients) => {
      if (excludedIngNames.length === 0) return true;
      const ingNames: string[] = r.recipeIngredients.map(
        (ri: RecipeIngredientWithIngredient) => ri.ingredient.name.toLowerCase()
      );
      return !ingNames.some((n: string) =>
        excludedIngNames.some((ex: string) => n.includes(ex) || ex.includes(n))
      );
    })
    .slice(0, 30);

  const recipesJSON: string = JSON.stringify(
    safeRecipes.map((r: RecipeWithIngredients) => ({
      id: r.id,
      name: r.name,
      category: r.category || "General",
      ingredients: r.ingredients.slice(0, 80),
    }))
  );

  // Build prompt
  const prompt: string = `You are an elite health coach creating a highly personalized ${durationDays}-day health transformation plan.

## CLIENT PROFILE
- Name: ${sanitizeForPrompt(user?.name || "User")}
- Age: ${profile?.age || "Unknown"}, Gender: ${sanitizeForPrompt(profile?.gender || "Unknown")}
- Height: ${profile?.heightCm || "Unknown"}cm, Weight: ${profile?.weightKg || "Unknown"}kg
- BMI: ${bmi || "Unknown"} (${bmiCategory}), TDEE: ${tdee || "Unknown"} kcal/day
- Activity level: ${sanitizeForPrompt(profile?.activityLevel || "Moderate")}
- Allergies: ${allergyNames.length ? allergyNames.join(", ") : "None"}
- Dietary preference: ${sanitizeForPrompt(profile?.dietaryPreference || "None")}
- Nutritional goal: ${sanitizeForPrompt(profile?.nutritionalGoal || "Balanced")}
- Primary goal: ${goalType.replace(/_/g, " ")} — ${sanitizeForPrompt(goalDetails)}
- Equipment: ${sanitizeForPrompt(equipment || "None (bodyweight only)")}
- Daily exercise time: ${exerciseTimeMin} min
- Meals per day: ${profile?.mealsPerDay || "3 meals"}
- Diet type: ${dietType || "any"}
${foodLikes ? `- Foods I LOVE (prioritize these): ${sanitizeForPrompt(foodLikes)}` : ""}
${foodDislikes ? `- Foods I DISLIKE (avoid these completely): ${sanitizeForPrompt(foodDislikes)}` : ""}
${profile?.chronicDisease ? `- Chronic condition: ${sanitizeForPrompt(profile.chronicDisease)} (adjust intensity accordingly)` : ""}
${profile?.medication ? `- Medication: ${sanitizeForPrompt(profile.medication)}` : ""}

## AVAILABLE RECIPES (use ONLY these exact IDs)
${recipesJSON}

## REQUIREMENTS FOR EACH DAY
Create 5-8 tasks per day across ALL categories:

**nutrition** (3-4 per day): Assign real recipes from the list above. In the description, include:
- Specific portion size (e.g., "200g chicken breast with 150g brown rice")
- Approximate macros (calories, protein, carbs, fat)
- Best time to eat (e.g., "Ideal as a post-workout meal within 30 min of training")
- A brief preparation tip

**exercise** (1-2 per day): Create detailed, varied workouts. In the description, include:
- Specific exercises with sets/reps (e.g., "4x12 squats, 3x15 push-ups, 3x20 lunges")
- Warm-up and cool-down recommendations
- Form cues (e.g., "Keep your back straight, engage your core")
- Intensity level (light/moderate/vigorous)
- Adapt to the client's equipment and fitness level
- Vary between strength, cardio, HIIT, flexibility across days

**hydration** (1 per day): Specific water intake goals with creative reminders
- Vary the descriptions (infused water ideas, timing strategies, hydration with meals)

**sleep** (1 per day): Personalized sleep optimization tips
- Include specific wind-down routines, bedroom temperature, screen-time cutoffs
- Vary daily (breathing exercises, sleep journaling, progressive muscle relaxation)

**mindfulness** (0-1 per day): Mental wellness activities
- Meditation techniques, gratitude journaling, stress-relief exercises
- Specific durations and methods

## IMPORTANT GUIDELINES
- Make every task description DETAILED and ACTIONABLE (2-4 sentences minimum)
- NEVER be generic. Each day should feel unique with progressive difficulty
- Use motivational but professional language
- Calorie targets should align with the TDEE and goal (deficit for weight loss, surplus for muscle gain)
- Vary recipes across days — don't repeat the same recipe on consecutive days
- Include rest days with active recovery (yoga, stretching, walking)

## OUTPUT FORMAT
Return ONLY this JSON (no markdown, no code blocks, no extra text):
{
  "planSummary": "A 2-3 sentence motivational overview of the plan strategy, explaining why this approach works for the client's specific goal",
  "dailyCalorieTarget": number,
  "dailyProteinTarget": number,
  "days": [
    {
      "dayNumber": number,
      "tasks": [
        {
          "category": "nutrition"|"exercise"|"hydration"|"sleep"|"mindfulness",
          "title": "Engaging, specific title (not generic like 'Eat breakfast')",
          "description": "Detailed, actionable description with specific quantities, form cues, or techniques",
          "recipeId": "exact recipe ID from list or null",
          "durationMin": number or null,
          "caloriesKcal": number or null
        }
      ]
    }
  ]
}`;

  // Call AI (InclusionAI Ling via OpenRouter)
  let aiRaw: string;
  try {
    aiRaw = await generateHealthPlan(prompt);
  } catch (e: unknown) {
    console.error("AI API error:", e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  // Parse + validate
  let aiPlan: z.infer<typeof AIPlanSchema>;
  try {
    const jsonText: string = aiRaw.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
    aiPlan = AIPlanSchema.parse(JSON.parse(jsonText));
  } catch (e: unknown) {
    console.error("AI response parse error:", e, aiRaw.slice(0, 500));
    return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
  }

  // Verify all recipeIds exist in DB
  const validRecipeIds = new Set<string>(safeRecipes.map((r: RecipeWithIngredients) => r.id));
  for (const day of aiPlan.days) {
    for (const task of day.tasks) {
      if (task.recipeId && !validRecipeIds.has(task.recipeId)) {
        task.recipeId = null; // Nullify invalid IDs
      }
    }
  }

  // Save to DB in a transaction
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = await prisma.$transaction(async (tx: any) => {
    const newPlan = await tx.plan.create({
      data: {
        userId,
        goalType,
        goalDetails,
        durationDays,
        startDate,
        endDate,
        status: "active",
        planSummary: aiPlan.planSummary,
        dailyCalorieTarget: aiPlan.dailyCalorieTarget,
        dailyProteinTarget: aiPlan.dailyProteinTarget,
      },
    });

    const tasks = aiPlan.days.flatMap((day) =>
      day.tasks.map((task) => {
        const taskDate = new Date(startDate);
        taskDate.setDate(taskDate.getDate() + day.dayNumber - 1);
        return {
          planId: newPlan.id,
          dayNumber: day.dayNumber,
          date: taskDate,
          category: task.category,
          title: task.title,
          description: task.description,
          recipeId: task.recipeId || null,
          durationMin: task.durationMin || null,
          caloriesKcal: task.caloriesKcal || null,
        };
      })
    );

    await tx.task.createMany({ data: tasks });
    return newPlan;
  });

  return NextResponse.json({ planId: plan.id }, { status: 201 });
}
