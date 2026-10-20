import { z } from "zod";
import { DietSchema, MealSchema } from "../../types";
import { analyticsSchema } from "../health/healthTypes";

export const componentKeys = ["calories", "protein", "cost", "taste", "convenience"] as const;
export type ComponentKey = typeof componentKeys[number];
const finite = z.number().finite();
const ruleSchema = z.object({ weight: finite.nonnegative(), direction: z.enum(["minimise", "maximise"]) });
export const dietConfigSchema = z.object({ schema_version: z.literal(1), correction: finite, rules: z.object({ calories: ruleSchema, protein: ruleSchema, cost: ruleSchema, taste: ruleSchema, convenience: ruleSchema }) });
export type DietConfig = z.infer<typeof dietConfigSchema>;
export const defaultDietConfig = (): DietConfig => ({ schema_version: 1, correction: 0, rules: { calories: { weight: 1, direction: "minimise" }, protein: { weight: 1, direction: "maximise" }, cost: { weight: 1, direction: "minimise" }, taste: { weight: 1, direction: "maximise" }, convenience: { weight: 1, direction: "maximise" } } });
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const date = new Date(`${value}T00:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }, "Invalid calendar date");
export const diaryEntrySchema = z.object({ id: z.string(), meal_id: z.string().nullable(), name: z.string(), servings: finite.positive(), calories: finite.nonnegative(), protein: finite.nonnegative(), cost: finite.nonnegative().nullable(), foods: z.array(z.object({ id: z.string(), name: z.string(), calories: finite.nonnegative(), protein: finite.nonnegative(), cost: finite.nonnegative().nullable() })).default([]) });
export const dietActualsSchema = z.object({ schema_version: z.literal(1), revision: z.string(), captured_at: z.string().datetime({ offset: true }), days: z.array(z.object({ date: dateSchema, complete: z.boolean(), entries: z.array(diaryEntrySchema) })) }).superRefine((value, context) => {
  const dates = value.days.map(day => day.date);
  if (new Set(dates).size !== dates.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate diary dates" });
  for (const day of value.days) if (new Set(day.entries.map(entry => entry.id)).size !== day.entries.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate diary entries" });
});
export type DietActuals = z.infer<typeof dietActualsSchema>;
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
export type DietData = { diets: z.infer<typeof DietSchema>[] | null; meals: z.infer<typeof MealSchema>[] | null; actuals: DietActuals | null; analytics?: DietAnalytics | null; health: z.infer<typeof analyticsSchema> | null; config: DietConfig | null; errors: string[]; failedResources?: string[] };
export type ComponentValues = Record<ComponentKey, number | null>;
export type RankingItem = { id: string; name: string; components: ComponentValues; servings: number; foods: RankingItem[] };
export type Goal = { weight: number; fat: number; target: number; days: number; maintenance: number };
export type SeriesPoint = { label: string; plan: number | null; actual: number | null };

const pointSchema = z.object({ label: z.string(), plan: finite.nullable(), actual: finite.nullable() });
const monitoringSchema = z.object({ observed_days: finite.int().nonnegative().optional(), dates: z.array(dateSchema), points: z.array(pointSchema), covered: z.boolean(), partial: z.boolean(), actual: finite.nullable(), dailyRate: finite.nullable(), remaining: finite.nullable(), requiredRate: finite.nullable() });
const componentsSchema = z.object({ calories: finite.nullable(), protein: finite.nullable(), cost: finite.nullable(), taste: finite.nullable(), convenience: finite.nullable() });
const foodRankingSchema = z.object({ id: z.string(), name: z.string(), components: componentsSchema, servings: finite });
const rankingSchema = foodRankingSchema.extend({ foods: z.array(foodRankingSchema) });
const dailyBalanceSchema = z.object({ date: dateSchema, burned: finite.nullable(), exercise_burned: finite.nullable().optional(), estimated_maintenance: finite.nullable().optional(), intake: finite.nullable(), balance: finite.nullable(), partial: z.boolean(), fit_observed_through: z.string().nullable(), diary_captured_at: z.string() });
export const dietAnalyticsSchema = z.object({
  schema_version: z.literal(1), revision: z.string(), input_revisions: z.record(z.string()), generated_at: z.string(), as_of: dateSchema,
  monitoring: z.record(z.object({ calories: monitoringSchema, protein: monitoringSchema })),
  monitoring_history: z.record(z.record(z.object({ calories: monitoringSchema, protein: monitoringSchema }))).optional(),
  monitoring_by_date: z.record(z.record(z.object({ calories: monitoringSchema, protein: monitoringSchema }))).optional(),
  rankings: z.object({ catalogue: z.array(rankingSchema), consumed: z.array(rankingSchema) }),
  daily_balance: dailyBalanceSchema.optional(),
  daily_balance_history: z.record(dailyBalanceSchema).optional(),
  calibration: z.object({ window: z.literal("rolling_7_days").optional(), method: z.enum(["weight_calibrated", "fit_average", "unavailable"]).default("unavailable"), observed_days: finite.int().min(0).max(7).default(0), intake_days: finite.int().min(0).max(7).default(0), paired_days: finite.int().min(0).max(7).default(0), correction: finite.nullable().default(null), maintenance: finite.nullable().default(null), dates: z.array(dateSchema), points: z.array(pointSchema.extend({ balance_kcal: finite.nullable(), elapsed_days: finite })), available: z.boolean(), intake: finite.nullable(), expenditure: finite.nullable(), balance: finite.nullable(), predictedChange: finite.nullable(), observedChange: finite.nullable() }),
});
export type DietAnalytics = z.infer<typeof dietAnalyticsSchema>;
