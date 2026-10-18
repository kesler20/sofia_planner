import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const coverageSchema = z.object({ start: day, end: day });
export const actualResourceSchema = z.object({
  schema_version: z.literal(1),
  revision: z.string(),
  available: z.boolean(),
  observed_through: day.nullable(),
  captured_at: z.string().nullable(),
  coverage: z.array(coverageSchema),
  entities: z.array(z.object({ id: z.string(), name: z.string() })),
  rows: z.array(
    z.object({
      date: day,
      entity_id: z.string(),
      value: z.number().finite(),
      merchant: z.string().nullable(),
    }),
  ),
});
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
export type ActualResource = z.infer<typeof actualResourceSchema>;
export type MonitoringData = { expenses: ActualResource; analytics: FinanceMonitoring };
export type MonitoringSelection = {
  entityId: string;
  mode: "month" | "year";
  month: number;
  today: string;
};
export type MonitoringPoint = {
  index: number;
  expense: number | null;
  actual: number | null;
  plan: number | null;
};
export type MonitoringViewModel = {
  observedDays?: number;
  partial?: boolean;
  points: MonitoringPoint[];
  budget: number | null;
  spent: number | null;
  remaining: number | null;
  dailyRate: number | null;
  periodRate: number | null;
  remainingRate: number | null;
  plannedDailyRate: number | null;
  plannedPeriodRate: number | null;
  breakdown: { name: string; value: number }[];
  observedThrough: string | null;
  complete: boolean;
};

const merchantRankingSchema = z.object({
  id: z.string(),
  name: z.string(),
  net_total: z.number().int().safe(),
  positive_share: z.number().finite().min(0).max(1),
  cumulative_share: z.number().finite().min(0).max(1),
});
const categoryRankingSchema = merchantRankingSchema.extend({
  merchants: z.array(merchantRankingSchema),
});
export const spendingRankingsSchema = z.object({
  schema_version: z.literal(2),
  revision: z.string(),
  input_revision: z.string(),
  available: z.boolean(),
  captured_at: z.string().nullable(),
  observed_through: day.nullable(),
  coverage: z.array(coverageSchema),
  periods: z.array(z.object({
    period: z.enum(["month", "year"]),
    start: day,
    end: day,
    observed_coverage: z.array(coverageSchema),
    coverage_status: z.enum(["complete", "partial"]),
    net_total: z.number().int().safe(),
    categories: z.array(categoryRankingSchema),
  })),
});
export type SpendingRankings = z.infer<typeof spendingRankingsSchema>;
export type RankingPeriod = SpendingRankings["periods"][number];
export type RankingEntry = z.infer<typeof merchantRankingSchema>;

const nullableMetric = z.number().finite().nullable();
export const monitoringViewSchema = z.object({
  observedDays: z.number().int().nonnegative().optional(), partial: z.boolean().optional(),
  points: z.array(z.object({ index: z.number().int(), expense: nullableMetric, actual: nullableMetric, plan: nullableMetric })),
  budget: nullableMetric, spent: nullableMetric, remaining: nullableMetric, dailyRate: nullableMetric, periodRate: nullableMetric, remainingRate: nullableMetric,
  plannedDailyRate: nullableMetric, plannedPeriodRate: nullableMetric,
  breakdown: z.array(z.object({ name: z.string(), value: z.number().finite() })), observedThrough: day.nullable(), complete: z.boolean(),
});
export const financeMonitoringSchema = z.object({ schema_version: z.literal(1), revision: z.string(), generated_at: z.string(), as_of: day, input_revision: z.string(), views: z.record(z.object({ months: z.array(monitoringViewSchema).length(12), year: monitoringViewSchema })) });
export type FinanceMonitoring = z.infer<typeof financeMonitoringSchema>;
