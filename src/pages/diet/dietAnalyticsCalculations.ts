import type { DietType } from "../../types";
import type { DietData, Goal, SeriesPoint } from "./dietAnalyticsTypes";

export const KCAL_PER_KG = 3500 * 2.2046226218;
export const addDays = (day: string, count: number) => new Date(Date.parse(`${day}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
export function weekDates(today: string): string[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const start = addDays(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}
// Observed analytics are published by the engine. The page selects a plan and metric.
export function monitoringView(data: DietData | null, diet: DietType | undefined, metric: "calories" | "protein", today: string, reportingDate = today) {
  const published = data?.analytics;
  const selected = published && reportingDate <= today && reportingDate <= published.as_of ? published.monitoring_by_date?.[reportingDate] ?? (published.as_of === reportingDate ? published.monitoring : undefined) : undefined;
  return (diet ? selected?.[diet.name]?.[metric] : null) ?? { dates: weekDates(reportingDate), points: [] as SeriesPoint[], observed_days: undefined, covered: false, partial: false, actual: null, dailyRate: null, remaining: null, requiredRate: null };
}
export function bodyFatScenario(goal: Goal) {
  if (!Object.values(goal).every(Number.isFinite) || goal.weight <= 0 || goal.fat <= 0 || goal.fat >= 100 || goal.target <= 0 || goal.target >= goal.fat || goal.days < 1 || goal.maintenance <= 0) return null;
  const lean = goal.weight * (1 - goal.fat / 100);
  const targetWeight = lean / (1 - goal.target / 100);
  const lose = goal.weight - targetWeight;
  return { lean, startingFat: goal.weight - lean, targetFat: targetWeight - lean, targetWeight, lose, deficit: lose * KCAL_PER_KG, dailyDeficit: lose * KCAL_PER_KG / goal.days, calories: goal.maintenance - lose * KCAL_PER_KG / goal.days, protein: Math.round(goal.weight * 2.2046226218) };
}
// Select the engine's rolling estimate without changing observed calculations.
export function calibrationView(data: DietData | null, today: string) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index - 7));
  const source = data?.analytics?.calibration;
  if (!source || source.window !== "rolling_7_days" || source.dates.length !== 7 || source.dates[6] >= today) return { dates, points: [] as SeriesPoint[], available: false, method: "unavailable" as const, observed_days: 0, intake_days: 0, paired_days: 0, intake: null, expenditure: null, balance: null, predictedChange: null, observedChange: null, correction: null, maintenance: null };
  return source;
}
