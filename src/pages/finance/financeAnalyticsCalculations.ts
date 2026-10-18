import type { MonitoringData, MonitoringSelection, MonitoringViewModel } from "./financeAnalyticsTypes";

export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
export const iso = (date: Date) => date.toISOString().slice(0, 10);
export const dateOf = (day: string) => new Date(`${day}T00:00:00Z`);
export function londonToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
// The engine owns burn rates, allowances and observed aggregation.
export function buildMonitoringView(data: MonitoringData, selection: MonitoringSelection): MonitoringViewModel {
  const resource = data.analytics;
  const validDate = resource.as_of <= selection.today && resource.as_of.slice(0, 4) === selection.today.slice(0, 4);
  const views = validDate && resource.input_revision === data.expenses.revision ? resource.views[selection.entityId] : undefined;
  return (selection.mode === "year" ? views?.year : views?.months[selection.month]) ?? { points: [], budget: null, spent: null, remaining: null, dailyRate: null, periodRate: null, remainingRate: null, plannedDailyRate: null, plannedPeriodRate: null, breakdown: [], observedThrough: null, complete: false };
}
