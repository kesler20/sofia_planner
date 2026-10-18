import { z } from "zod";

export const periods = ["week"] as const;
const publishedPeriods = ["week", "month", "year"] as const;
export type Period = (typeof periods)[number];
export const muscleGroups = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"] as const;
const finite = z.number().finite();
const bodyValue = z.object({ value: finite, measured_at: z.string() });
export const analyticsSchema = z.object({
  schema_version: z.literal(1), revision: z.string(), generated_at: z.string(),
  metrics: z.array(z.object({ id: z.string(), name: z.string(), unit: z.string(), aggregation: z.enum(["sum", "mean"]), source: z.string() })),
  daily: z.array(z.object({ date: z.string(), values: z.record(finite), muscle_volumes: z.record(finite) })),
  exercises: z.array(z.object({ id: z.string(), name: z.string() })),
  exercise_daily_bests: z.array(z.object({ date: z.string(), exercise_id: z.string(), load: finite.positive(), body_weight: finite.positive(), weight_measured_at: z.string(), lifted_at: z.string() })),
  periods: z.array(z.object({ period: z.enum(publishedPeriods), start: z.string(), end: z.string(), controls: z.record(finite), records: z.array(z.object({ exercise_id: z.string(), load: finite, previous_pr: finite.nullable(), percentage: finite.nullable(), body_weight: finite, lifted_at: z.string(), weight_measured_at: z.string() })) })).transform(rows => rows.filter(row => row.period === "week")),
  burnup: z.array(z.object({ period: z.enum(publishedPeriods), start: z.string(), end: z.string(), entity_id: z.string(), observed_days: finite.int().nonnegative().optional(), remaining_days: finite.int().nonnegative().optional(), partial: z.boolean().default(false), observed_through: z.string().nullable(), accumulated: finite.nullable(), daily_pace: finite.nullable(), required_pace: finite.nullable(), remaining: finite.nullable(), target: finite.nullable(), points: z.array(z.object({ date: z.string(), value: finite.nullable(), pace: finite.nullable() })) })).transform(rows => rows.filter(row => row.period === "week")),
  latest_body: z.record(bodyValue), weight_cutoff: z.number().int().nullable(),
  observed_through: z.record(z.string().nullable()), unmapped_exercises: z.array(z.string()),
});
const limitsSchema = z.object({ lower: finite, upper: finite }).passthrough().refine(value => value.lower < value.upper, "Lower limit must be less than upper limit");
const targets = z.object({ week: finite.nonnegative().optional(), month: finite.nonnegative().optional(), year: finite.nonnegative().optional() }).passthrough();
const limits = z.object({ week: limitsSchema.optional(), month: limitsSchema.optional(), year: limitsSchema.optional() }).passthrough();
export const configSchema = z.object({ schema_version: z.literal(1), targets: z.record(targets), limits: z.record(limits) }).passthrough();
export type Analytics = z.infer<typeof analyticsSchema>;
export type HealthConfig = z.infer<typeof configSchema>;
export const emptyConfig = (): HealthConfig => ({ schema_version: 1, targets: {}, limits: {} });
export type HealthData = { analytics: Analytics | null; config: HealthConfig | null; errors: string[]; failedResources?: string[] };
export type Selection = { period: Period; date: string; offset: number; entityId: string };
export type ChartPoint = { date: string; end: string; label: string; value: number | null; previousPr?: number | null; percentage?: number | null; target?: number | null; pace?: number | null; bodyWeight?: number; liftedAt?: string; weightMeasuredAt?: string };
