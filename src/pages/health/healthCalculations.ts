import type { Analytics, ChartPoint, HealthConfig, Selection } from "./healthTypes";

const DAY = 86400000;
const dateOf = (day: string) => new Date(`${day}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
export function londonToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function startOf(day: string): string {
  const date = dateOf(day);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return iso(date);
}
export function shiftPeriod(start: string, amount: number): string {
  return iso(new Date(dateOf(start).getTime() + amount * 7 * DAY));
}
export function endOf(start: string): string { return iso(new Date(dateOf(shiftPeriod(start, 1)).getTime() - DAY)); }
export function periodLabel(day: string): string {
  return dateOf(day).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "2-digit" });
}
export function history(selection: Selection): ChartPoint[] {
  const anchor = startOf(selection.date);
  return Array.from({ length: 12 + selection.offset }, (_, index) => {
    const date = shiftPeriod(anchor, index - 11 - selection.offset);
    return { date, end: endOf(date), label: periodLabel(date), value: null };
  });
}
// Period calculations are engine-owned. These functions only select and label snapshots.
export function buildPersonalRecordsView(data: Analytics, selection: Selection): ChartPoint[] {
  return history(selection).map(point => {
    const row = data.periods.find(row => row.period === selection.period && row.start === point.date)?.records.find(row => row.exercise_id === selection.entityId);
    return { ...point, value: row?.load ?? null, previousPr: row?.previous_pr ?? null, percentage: row?.percentage ?? null, bodyWeight: row?.body_weight, liftedAt: row?.lifted_at, weightMeasuredAt: row?.weight_measured_at };
  });
}
export function buildControlView(data: Analytics, selection: Selection): ChartPoint[] {
  return history(selection).map(point => ({ ...point, value: data.periods.find(row => row.period === selection.period && row.start === point.date)?.controls[selection.entityId] ?? null }));
}
export function buildBurnupView(data: Analytics, config: HealthConfig | null, selection: Selection) {
  const start = startOf(selection.date);
  const row = data.burnup.find(row => row.period === selection.period && row.start === start && row.entity_id === selection.entityId);
  const target = config ? config.targets[selection.entityId]?.[selection.period] ?? null : row?.target ?? null;
  const count = row ? (dateOf(row.end).getTime() - dateOf(row.start).getTime()) / DAY + 1 : 7;
  const elapsed = row?.observed_through ? Math.max(0, Math.min(count, (dateOf(row.observed_through).getTime() - dateOf(row.start).getTime()) / DAY + 1)) : 0;
  const remaining = target !== null && row?.accumulated != null ? target - row.accumulated : null;
  const remainingDays = row?.remaining_days ?? Math.max(0, count - elapsed);
  const requiredPace = remaining !== null && remainingDays > 0 ? Math.max(0, remaining) / remainingDays : null;
  return { observedDays: row?.observed_days, partial: row?.partial ?? false, points: (row?.points ?? []).map((point, index) => ({ ...point, pace: target === null ? null : target * (index + 1) / count, end: point.date, label: dateOf(point.date).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }), target })), target, observedThrough: row?.observed_through ?? null, accumulated: row?.accumulated ?? null, dailyPace: row?.daily_pace ?? null, requiredPace, remaining };
}
