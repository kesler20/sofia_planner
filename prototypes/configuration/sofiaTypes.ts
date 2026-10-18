import { z } from "zod";

export const alertRuleSchema = z.object({
  id: z.string().min(1), source_key: z.string().min(1),
  kind: z.enum(["pace", "limits", "freshness"]), enabled: z.boolean(),
  direction: z.enum(["minimum", "maximum", "range"]),
  tolerance: z.number().finite().nonnegative(),
  stale_after_days: z.number().finite().positive().nullable(),
  period: z.enum(["week", "month", "year"]), include_in_report: z.boolean(),
}).refine(rule => !rule.enabled || rule.kind !== "freshness" || rule.stale_after_days !== null, "Enabled freshness alerts require a threshold in days");
export const sofiaConfigSchema = z.object({
  schema_version: z.literal(1), rules: z.array(alertRuleSchema),
  habit_weights: z.record(z.number().finite().nonnegative()),
  shopping_horizon_days: z.number().int().min(1).max(90),
  report_hour: z.number().int().min(0).max(23),
}).refine(value => new Set(value.rules.map(rule => rule.id)).size === value.rules.length, "Rule IDs must be unique");
export type SofiaConfig = z.infer<typeof sofiaConfigSchema>;
export type AlertRule = z.infer<typeof alertRuleSchema>;
export const emptySofiaConfig = (): SofiaConfig => ({ schema_version: 1, rules: [], habit_weights: {}, shopping_horizon_days: 7, report_hour: 21 });
export const sofiaSnapshotSchema = z.object({
  cutoff: z.string(), metrics: z.array(z.object({ source_key: z.string(), name: z.string(), unit: z.string() })),
  routine: z.object({ habits: z.record(z.object({ name: z.string(), weight: z.number() })) }).nullable(),
});
export type SofiaSnapshot = z.infer<typeof sofiaSnapshotSchema>;
