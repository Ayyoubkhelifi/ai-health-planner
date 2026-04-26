// Health calculation utilities

export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", bg: "bg-blue-500/20" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-400", bg: "bg-amber-500/20" };
  return { label: "Obese", color: "text-red-400", bg: "bg-red-500/20" };
}

export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender.toLowerCase().includes("fem") || gender.toLowerCase() === "f"
    ? Math.round(base - 161)
    : Math.round(base + 5);
}

export function calcTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    "lightly active": 1.375,
    "moderately active": 1.55,
    active: 1.725,
    "very active": 1.9,
  };
  const key = activityLevel.toLowerCase();
  const multiplier = multipliers[key] ?? 1.55;
  return Math.round(bmr * multiplier);
}

export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/\{|\}/g, "")
    .trim()
    .slice(0, 500);
}
