import axios from "axios";
import { z } from "zod";
import { readResourceInDb, createResourceInDb } from "../../utils";
import { DietSchema, MealSchema } from "../../types";
import { analyticsSchema } from "../health/healthTypes";
import { defaultDietConfig, dietActualsSchema, dietConfigSchema, dietAnalyticsSchema } from "./dietAnalyticsTypes";
import type { DietData, DietConfig } from "./dietAnalyticsTypes";

// Producer resources are read-only. Only an explicit settings save writes.
export async function readDietResource<T>(user: string, name: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T | null> {
  const { result, error } = await readResourceInDb<string>(user, name);
  if (axios.isAxiosError(error) && error.response?.status === 404) return null;
  if (error || result === undefined) throw new Error(`Unable to load ${name}`);
  return schema.parse(typeof result === "string" ? JSON.parse(result) : result);
}
export async function loadDietConfig(user: string): Promise<DietConfig> {
  return await readDietResource(user, "diet_config", dietConfigSchema) ?? defaultDietConfig();
}
export async function loadDietData(user: string): Promise<DietData> {
  const [diets, meals, actuals, health, analytics] = await Promise.allSettled([
    readDietResource(user, "diets", z.array(DietSchema)), readDietResource(user, "meals", z.array(MealSchema)),
    readDietResource(user, "diet_actuals", dietActualsSchema), readDietResource(user, "health_analytics", analyticsSchema), readDietResource(user, "diet_analytics", dietAnalyticsSchema),
  ]);
  const results = [diets, meals, actuals, health, analytics];
  const names = ["diets", "meals", "diet_actuals", "health_analytics", "diet_analytics"];
  const failedResources = results.flatMap((result, index) => result.status === "rejected" ? [names[index]] : []);
  results.forEach((result, index) => { if (result.status === "rejected") { const failure = new Error(`Unable to load ${names[index]}`); failure.name = result.reason instanceof Error ? result.reason.name : "UnknownError"; console.log("Error loading Diet resource", names[index], failure); } });
  return { analytics: analytics.status === "fulfilled" ? analytics.value : null, diets: diets.status === "fulfilled" ? diets.value : null, meals: meals.status === "fulfilled" ? meals.value : null, actuals: actuals.status === "fulfilled" ? actuals.value : null, health: health.status === "fulfilled" ? health.value : null, config: null, errors: failedResources.map(name => `Unable to refresh ${name}.`), failedResources };
}
export function retainDietData(previous: DietData | null, next: DietData): DietData {
  const failed = next.failedResources ?? [];
  return { ...next, analytics: failed.includes("diet_analytics") ? previous?.analytics ?? null : next.analytics, diets: failed.includes("diets") ? previous?.diets ?? null : next.diets, meals: failed.includes("meals") ? previous?.meals ?? null : next.meals, actuals: failed.includes("diet_actuals") ? previous?.actuals ?? null : next.actuals, health: failed.includes("health_analytics") ? previous?.health ?? null : next.health, config: failed.includes("diet_config") ? previous?.config ?? null : next.config };
}
export async function saveDietConfig(user: string, config: DietConfig): Promise<void> {
  const validated = dietConfigSchema.parse(config);
  const { result, error } = await createResourceInDb(user, "diet_config", JSON.stringify(validated));
  if (error || result === undefined || result === false) {
    const failure = new Error("Diet configuration write was not confirmed"); failure.name = error instanceof Error ? error.name : "WriteError";
    console.log("Error saving Diet resource", "diet_config", failure);
    throw new Error("Unable to save Diet configuration");
  }
}
