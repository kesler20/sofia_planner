import { MealSchema, WEEKDAYS } from "../../types";
import type { MealType, WeekPlanType, WeekdayType } from "../../types";
import { z } from "zod";

// These totals describe the editable plan, including unsaved changes.
export function sumKnown(values: Array<number | null>): number | null {
  return values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function mealTotals(meal: MealType) {
  const total = (key: "calories" | "protein" | "carbs" | "fat" | "cost") =>
    sumKnown(meal.foods.map(food => food[key] === null ? null : food[key]! * (food.quantity ?? 1)));
  return { calories: total("calories"), protein: total("protein"), carbs: total("carbs"), fat: total("fat"), cost: total("cost") };
}

export function planCost(meals: WeekPlanType): number | null {
  let total = 0;
  for (const day of WEEKDAYS) for (const meal of meals[day]) {
    const cost = mealTotals(meal).cost;
    if (cost === null) return null;
    total += cost;
  }
  return total;
}

export function appendMeals(plan: WeekPlanType, days: WeekdayType[], meals: MealType[]): WeekPlanType {
  const next = { ...plan };
  for (const day of days) {
    next[day] = [...plan[day], ...meals.map(meal => structuredClone(meal))];
  }
  return next;
}

export function parseMealClipboard(text: string): MealType[] {
  return z.array(MealSchema).min(1).parse(JSON.parse(text));
}

export function matchesMeal(meal: MealType, query: string): boolean {
  const text = [meal.name, ...meal.foods.flatMap(food => [food.name, food.vendor ?? ""])].join(" ").toLocaleLowerCase();
  return query.trim().toLocaleLowerCase().split(/\s+/).every(term => text.includes(term));
}


export function formatNutrient(value: number | null, digits = 0): string {
  return value === null ? "Unknown" : value.toFixed(digits);
}
