import { z } from "zod";
import { FoodSchema, MealSchema, DietSchema } from "../../types";
import type { MealType } from "../../types";
import { compareAndSwapResourceInDb, readResourceSnapshot } from "../../utils";
import { readDietResource } from "./dietAnalyticsData";

export const cheatInputSchema = FoodSchema.extend({ calories: z.number().finite().nonnegative().nullable(), protein: z.number().finite().nonnegative().nullable(), carbs: z.number().finite().nonnegative().nullable(), fat: z.number().finite().nonnegative().nullable(), cost: z.number().finite().nonnegative().nullable(), amount: z.number().finite().nonnegative().nullable() }).omit({ catalogueId: true, quantity: true, servingUnit: true, tasteScore: true, convenienceScore: true }).refine(value => value.name.trim().length > 0, "Name is required");
export const cheatMealSchema = z.object({ id: z.string().uuid(), revision: z.number().int().positive(), input: cheatInputSchema, created_at: z.string(), updated_at: z.string() });
export const cheatMealsSchema = z.object({ schema_version: z.literal(1), entries: z.array(cheatMealSchema) }).superRefine((value, context) => {
  if (new Set(value.entries.map(entry => entry.id)).size !== value.entries.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate cheat meal identity" });
});
export type CheatMeal = z.infer<typeof cheatMealSchema>;
export type CheatMealInput = z.infer<typeof cheatInputSchema>;

export async function loadCheatMeals(user: string) {
  return await readDietResource(user, "cheat_meals", cheatMealsSchema) ?? { schema_version: 1 as const, entries: [] };
}

export function mergeCheatMeals(meals: MealType[], entries: CheatMeal[]): MealType[] {
  const byId = new Map(meals.map(meal => [meal.catalogueId ?? meal.name, meal]));
  for (const entry of entries) {
    const id = `cheat:${entry.id}`;
    const published = byId.get(id);
    // A producer projection can enrich only the exact authored revision it read.
    if (published?.cheatRevision === entry.revision) continue;
    byId.set(id, { catalogueId: id, name: entry.input.name, foods: [{ ...entry.input, catalogueId: id, quantity: 1, servingUnit: "g" }], tasteScore: published?.tasteScore ?? null, cheatRevision: entry.revision });
  }
  return [...byId.values()];
}

export async function saveCheatMeal(user: string, input: CheatMealInput, expectedRevision: number, id: string = crypto.randomUUID()): Promise<CheatMeal> {
  return navigator.locks.request(`sofia-cheat-meals-${user}`, async () => {
    const persisted = await readResourceSnapshot(user, "cheat_meals");
    const current = persisted ? cheatMealsSchema.parse(persisted) : { schema_version: 1 as const, entries: [] };
    const previous = current.entries.find(entry => entry.id === id);
    if ((previous?.revision ?? 0) !== expectedRevision) throw new Error("This meal changed. Reload before saving.");
    const now = new Date().toISOString();
    const entry = cheatMealSchema.parse({ id, revision: expectedRevision + 1, input: { ...input, name: input.name.trim() }, created_at: previous?.created_at ?? now, updated_at: now });
    await compareAndSwapResourceInDb(user, "cheat_meals", persisted, { ...persisted, ...current, entries: [...current.entries.filter(item => item.id !== id), entry] });
    const saved = await loadCheatMeals(user);
    if (!saved.entries.some(item => item.id === id && item.revision === entry.revision && JSON.stringify(item.input) === JSON.stringify(entry.input))) throw new Error("Meal save could not be verified. Reload before retrying.");
    return entry;
  });
}

export async function loadPlanningMeals(user: string) {
  const [meals, cheats] = await Promise.all([readDietResource(user, "meals", z.array(MealSchema)), loadCheatMeals(user)]);
  return mergeCheatMeals(meals ?? [], cheats.entries);
}

export async function saveDietNote(user: string, dietIdentity: string, note: string, expectedNote: string) {
  return navigator.locks.request(`sofia-diets-${user}`, async () => {
    const raw = await readResourceSnapshot(user, "diets");
    const current = raw ? z.array(DietSchema).parse(raw.key) : null;
    const diet = current?.find(item => item.name === dietIdentity);
    if (!diet) throw new Error("The selected diet is unavailable.");
    if ((diet.note ?? "") !== expectedNote) throw new Error("This note changed. Reload it before saving.");
    const next = current!.map(item => item.name === dietIdentity ? { ...item, note } : item);
    await compareAndSwapResourceInDb(user, "diets", raw, { ...raw, key: next });
    return next;
  });
}
