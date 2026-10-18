import { z } from "zod";
import { readResourceInDb } from "../../utils";
import {
  actualResourceSchema,
  financeMonitoringSchema,
  spendingRankingsSchema,
} from "./financeAnalyticsTypes";
import type {
  MonitoringData,
  SpendingRankings,
} from "./financeAnalyticsTypes";

export async function readFinanceResource<T>(
  user: string,
  name: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const { result, error } = await readResourceInDb<string>(user, name);
  if (error || result === undefined) {
    const failure = new Error(
      error instanceof Error ? error.message : "Resource unavailable",
    );
    console.log("Error loading finance resource", name, failure);
    throw new Error(`Unable to load ${name}. ${failure.message}`);
  }
  return schema.parse(typeof result === "string" ? JSON.parse(result) : result);
}

export async function loadMonitoringData(
  user: string,
): Promise<MonitoringData> {
  const [expenses, analytics] = await Promise.all([
    readFinanceResource(user, "finance_expense_actuals", actualResourceSchema),
    readFinanceResource(user, "finance_monitoring", financeMonitoringSchema),
  ]);
  return { expenses, analytics };
}

export async function loadSpendingRankings(user: string): Promise<SpendingRankings> {
  return readFinanceResource(user, "finance_spending_rankings", spendingRankingsSchema);
}
