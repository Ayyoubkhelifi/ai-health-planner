import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DB_DIR = path.join(__dirname, '..', 'db');

function readSheet(filename: string): any[] {
  const filePath = path.join(DB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found at ${filePath}`);
    return [];
  }
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function clean(val: any): string {
  return String(val || '').trim();
}

async function main() {
  console.log('🌱 Starting seed...\n');

  // ─── 1. ALLERGIES (from liste des allergies.xlsx) ──────────────────────────
  console.log('📋 Seeding allergies...');
  const allergyRows = readSheet('liste des allergies.xlsx');
  let allergyCount = 0;
  const allergyMap: Record<string, string> = {}; // name -> id

  for (const row of allergyRows) {
    const name = clean(row['Allergie']);
    if (!name) continue;
    const allergy = await prisma.allergy.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    allergyMap[name] = allergy.id;
    allergyCount++;
  }
  console.log(`  ✅ ${allergyCount} allergies seeded`);

  // ─── 2. INGREDIENTS (from ingrediant_EN.xlsx) ─────────────────────────────
  console.log('🥕 Seeding ingredients...');
  const ingredientRows = readSheet('ingrediant_EN.xlsx');
  let ingredientCount = 0;
  const ingredientMap: Record<string, string> = {}; // name -> id

  for (const row of ingredientRows) {
    const name = clean(row['Ingrediants']);
    const allergyName = clean(row['Allergie']);
    if (!name) continue;

    const allergyId = allergyMap[allergyName] || null;
    const ingredient = await prisma.ingredient.upsert({
      where: { name },
      update: { allergyId },
      create: { name, allergyId },
    });
    ingredientMap[name.toLowerCase()] = ingredient.id;
    ingredientCount++;
  }

  // Also seed from ing.xlsx (the raw ingredient list) — only if not already there
  const ingRows = readSheet('ing.xlsx');
  for (const row of ingRows) {
    const name = clean(row['Ingrediants']);
    if (!name || ingredientMap[name.toLowerCase()]) continue;
    const ingredient = await prisma.ingredient.upsert({
      where: { name },
      update: {},
      create: { name, allergyId: null },
    });
    ingredientMap[name.toLowerCase()] = ingredient.id;
    ingredientCount++;
  }
  console.log(`  ✅ ${ingredientCount} ingredients seeded`);

  // ─── 3. CROSS-ALLERGIES (from croise.xlsx) ────────────────────────────────
  console.log('🔗 Seeding cross-allergies...');
  const crossRows = readSheet('croise.xlsx');
  let crossCount = 0;

  // Ensure a default allergy entry for cross-allergy
  const crossAllergyName = 'Cross-Allergy Between Foods';
  if (!allergyMap[crossAllergyName]) {
    const ca = await prisma.allergy.upsert({
      where: { name: crossAllergyName },
      update: {},
      create: { name: crossAllergyName },
    });
    allergyMap[crossAllergyName] = ca.id;
  }

  for (const row of crossRows) {
    const ing1 = clean(row['Ingredient1 '] || row['Ingredient1']);
    const ing2 = clean(row['Ingredient2 '] || row['Ingredient2']);
    if (!ing1 || !ing2) continue;

    try {
      await prisma.crossAllergy.upsert({
        where: { ingredient1_ingredient2: { ingredient1: ing1, ingredient2: ing2 } },
        update: {},
        create: {
          ingredient1: ing1,
          ingredient2: ing2,
          allergyId: allergyMap[crossAllergyName],
        },
      });
      crossCount++;
    } catch (_) {}
  }
  console.log(`  ✅ ${crossCount} cross-allergy pairs seeded`);

  // ─── 4. RECIPES (from recette_EN.xlsx) ────────────────────────────────────
  console.log('🍽️  Seeding recipes...');
  const recipeRows = readSheet('recette_EN.xlsx');
  let recipeCount = 0;
  const recipeMap: Record<string, string> = {}; // name -> id

  // Categories inferred from name keywords
  function inferCategory(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('soup') || n.includes('broth') || n.includes('chowder')) return 'Soup';
    if (n.includes('salad')) return 'Salad';
    if (n.includes('cake') || n.includes('cookie') || n.includes('brownie') || n.includes('dessert') || n.includes('pudding') || n.includes('pie')) return 'Dessert';
    if (n.includes('smoothie') || n.includes('juice') || n.includes('shake') || n.includes('drink') || n.includes('lemonade')) return 'Drink';
    if (n.includes('sandwich') || n.includes('burger') || n.includes('wrap') || n.includes('toast')) return 'Sandwich';
    if (n.includes('chicken') || n.includes('beef') || n.includes('lamb') || n.includes('pork') || n.includes('fish') || n.includes('shrimp') || n.includes('salmon') || n.includes('tuna')) return 'Main Dish';
    if (n.includes('pasta') || n.includes('noodle') || n.includes('spaghetti') || n.includes('lasagna')) return 'Pasta';
    if (n.includes('rice') || n.includes('pilaf') || n.includes('risotto')) return 'Rice';
    if (n.includes('bread') || n.includes('muffin') || n.includes('biscuit') || n.includes('croissant')) return 'Bread';
    if (n.includes('egg') || n.includes('omelette') || n.includes('frittata')) return 'Breakfast';
    if (n.includes('stew') || n.includes('curry') || n.includes('casserole')) return 'Stew';
    return 'General';
  }

  for (const row of recipeRows) {
    const name = clean(row['Aliment']);
    const ingredientsStr = clean(row['ingrediants (mains-sucre-gras-epice)']);
    const nameAr = clean(row['الغذاء']);
    if (!name) continue;

    const recipe = await prisma.recipe.upsert({
      where: { name },
      update: { ingredients: ingredientsStr, nameAr: nameAr || null, category: inferCategory(name) },
      create: {
        name,
        nameAr: nameAr || null,
        ingredients: ingredientsStr,
        category: inferCategory(name),
      },
    });
    recipeMap[name] = recipe.id;
    recipeCount++;

    // Link ingredients
    if (ingredientsStr) {
      const parts = ingredientsStr.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        // Find best matching ingredient
        const key = part.toLowerCase();
        let ingId = ingredientMap[key];
        if (!ingId) {
          // Try partial match
          const matched = Object.keys(ingredientMap).find(k => k.includes(key) || key.includes(k));
          if (matched) ingId = ingredientMap[matched];
        }
        if (!ingId) {
          // Create ingredient on the fly
          try {
            const newIng = await prisma.ingredient.upsert({
              where: { name: part },
              update: {},
              create: { name: part },
            });
            ingId = newIng.id;
            ingredientMap[key] = ingId;
          } catch (_) {}
        }
        if (ingId) {
          try {
            await prisma.recipeIngredient.upsert({
              where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId: ingId } },
              update: {},
              create: { recipeId: recipe.id, ingredientId: ingId },
            });
          } catch (_) {}
        }
      }
    }
  }
  console.log(`  ✅ ${recipeCount} recipes seeded`);

  // ─── 5. USER PROFILES (from User profi.xlsx) ──────────────────────────────
  console.log('👤 Seeding user profiles...');
  const userRows = readSheet('User profi.xlsx');
  let userCount = 0;

  // Create a default admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@healthplanner.ai' },
    update: {},
    create: {
      email: 'admin@healthplanner.ai',
      password: adminPassword,
      name: 'Admin',
    },
  });

  for (const row of userRows) {
    const name = clean(row['Name']);
    const emailRaw = clean(row['Email address']);
    const age = Number(row['Age']) || null;
    const sex = clean(row['Sex']); // Feminine | Masculine
    const occupation = clean(row['Occupation']);
    const city = clean(row['City']);
    const lifestyle = clean(row['Lifestyle']);
    const weightKg = Number(row['What is your weight? (kg)']) || null;
    const heightM = Number(row['What is your height? (m)']) || null;
    const heightCm = heightM ? heightM * 100 : null;
    const nutritionalGoal = clean(row['Nutritional objectives']);
    const preference = clean(row['What is your preference?']);
    const recipeLikes = clean(row['Which recipe do you like?']);
    const recipeDislikes = clean(row['Which recipe do you dislike?']);
    const mealsPerDay = clean(row['How many meals do you eat in a day?']);
    const physicalActivity = clean(row['Do you engage in physical activity?']) === 'Yes';
    const activityFreq = String(row['How often do you practice this activity each week?'] || '');
    const chronicDisease = clean(row['Your chronic disease']);
    const otherDisease = clean(row['If your disease does not appear in the list, please note it here:']);
    const medication = clean(row['Do you take medication on a regular daily basis? If so, please list them; otherwise, leave the field blank.']);
    const hasAllergy = clean(row['Do you have a food allergy?']) === 'Yes';
    const allergyName = clean(row['What is your allergy?']);
    const otherAllergy = clean(row['If your allergy is not listed, please note it here:']);
    const otherSymptoms = clean(row['If you have any other symptoms']);

    if (!name) continue;

    // Generate a unique email
    const email = emailRaw || `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@healthplanner.ai`;
    const password = await bcrypt.hash('password123', 12);

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: { name },
        create: { email, password, name },
      });

      await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          heightCm,
          weightKg,
          age,
          gender: sex || null,
          occupation: occupation || null,
          city: city || null,
          activityLevel: lifestyle || null,
          physicalActivity,
          activityFrequency: activityFreq || null,
          mealsPerDay: mealsPerDay || null,
          nutritionalGoal: nutritionalGoal || null,
          dietaryPreference: preference || null,
          recipeLikes: recipeLikes || null,
          recipeDislikes: recipeDislikes || null,
          chronicDisease: [chronicDisease, otherDisease].filter(Boolean).join('; ') || null,
          medication: medication || null,
          otherSymptoms: otherSymptoms || null,
        },
        create: {
          userId: user.id,
          heightCm,
          weightKg,
          age,
          gender: sex || null,
          occupation: occupation || null,
          city: city || null,
          activityLevel: lifestyle || null,
          physicalActivity,
          activityFrequency: activityFreq || null,
          mealsPerDay: mealsPerDay || null,
          nutritionalGoal: nutritionalGoal || null,
          dietaryPreference: preference || null,
          recipeLikes: recipeLikes || null,
          recipeDislikes: recipeDislikes || null,
          chronicDisease: [chronicDisease, otherDisease].filter(Boolean).join('; ') || null,
          medication: medication || null,
          otherSymptoms: otherSymptoms || null,
        },
      });

      // Link allergies
      if (hasAllergy && allergyName) {
        const allergyId = allergyMap[allergyName];
        if (allergyId) {
          await prisma.userAllergy.upsert({
            where: { userId_allergyId: { userId: user.id, allergyId } },
            update: {},
            create: { userId: user.id, allergyId },
          });
        }
      }
      userCount++;
    } catch (e) {
      // Duplicate email — skip
    }
  }
  console.log(`  ✅ ${userCount} user profiles seeded`);

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.recipe.count(),
    prisma.ingredient.count(),
    prisma.allergy.count(),
    prisma.user.count(),
    prisma.crossAllergy.count(),
  ]);
  console.log('\n🎉 Seed complete!');
  console.log(`   Recipes:      ${counts[0]}`);
  console.log(`   Ingredients:  ${counts[1]}`);
  console.log(`   Allergies:    ${counts[2]}`);
  console.log(`   Users:        ${counts[3]}`);
  console.log(`   CrossAllergy: ${counts[4]}`);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
