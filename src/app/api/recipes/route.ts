import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const allergyFilter = searchParams.get("allergyFilter") === "true";

  // Get user allergies
  let excludedIngredientNames: string[] = [];
  if (allergyFilter) {
    const userAllergies = await prisma.userAllergy.findMany({
      where: { userId: session.user.id },
      include: { allergy: { include: { ingredients: true } } },
    });
    excludedIngredientNames = userAllergies.flatMap((ua) =>
      ua.allergy.ingredients.map((i) => i.name.toLowerCase())
    );
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      recipeIngredients: { include: { ingredient: true } },
    },
    take: 100,
    orderBy: { name: "asc" },
  });

  // Filter by allergy safety
  const filtered = allergyFilter
    ? recipes.filter((r) => {
        const recipeIngNames = r.recipeIngredients.map((ri) =>
          ri.ingredient.name.toLowerCase()
        );
        return !recipeIngNames.some((n) =>
          excludedIngredientNames.some((ex) => n.includes(ex) || ex.includes(n))
        );
      })
    : recipes;

  return NextResponse.json({ recipes: filtered });
}
