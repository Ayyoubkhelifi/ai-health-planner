import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateHealthPlan } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipeId } = await req.json();
  if (!recipeId) return NextResponse.json({ error: "recipeId required" }, { status: 400 });

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { recipeIngredients: { include: { ingredient: true } } },
  });

  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const ingredientList = recipe.recipeIngredients
    .map((ri: { ingredient: { name: string } }) => ri.ingredient.name)
    .join(", ");

  const prompt = `You are a professional chef and nutritionist. Generate detailed cooking instructions for:

Recipe: "${recipe.name}"
Ingredients: ${ingredientList}
Category: ${recipe.category || "General"}

Provide the following in your response as plain text (NOT JSON):
1. **Prep Time** and **Cook Time** estimates
2. **Serving Size** (1-2 people, healthy portion)
3. **Step-by-step instructions** (numbered, 4-8 steps)
4. **Nutritional notes** (brief: approximate calories, protein, key nutrients)
5. **Chef's tip** (one practical tip for best results)

Keep it concise but helpful. Use simple language.`;

  try {
    const instructions = await generateHealthPlan(prompt);
    return NextResponse.json({ instructions });
  } catch (e: unknown) {
    console.error("Recipe instructions generation error:", e);
    return NextResponse.json({ error: "Failed to generate instructions" }, { status: 502 });
  }
}
