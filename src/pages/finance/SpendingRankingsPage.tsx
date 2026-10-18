import LoadingAnimation from "../../components/LoadingAnimation";
import * as React from "react";
import IOSSwitch from "../../components/switch/IOSSwitch";
import { loadSpendingRankings } from "./financeAnalyticsData";
import { dateOf, londonToday, money } from "./financeAnalyticsCalculations";
import { MONTHS } from "./financeAnalyticsTypes";
import type { SpendingRankings } from "./financeAnalyticsTypes";
import {
  retainRankingCategory,
  selectRankingPeriod,
} from "./spendingRankingsPresentation";
import { AnalyticsCard, AnalyticsSelect, SegmentedControl } from "../../components/analytics/AnalyticsControls";
import {
  SpendingRankingChart,
  RankingDonut,
} from "./components/SpendingRankingComponents";

// ============================================================ //
//                                                              //
//   SPENDING RANKINGS PAGE                                      //
//                                                              //
//   Shows one category or merchant chart pair at a time.         //
//   Owns period controls, read-only refresh and chart events.    //
//                                                              //
// ============================================================ //
export default function SpendingRankingsPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const user = localStorage.getItem("global/email") || "guest";
  const [data, setData] = React.useState<SpendingRankings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [today, setToday] = React.useState(londonToday());
  const [mode, setMode] = React.useState<"month" | "year">("month");
  const [year, setYear] = React.useState(dateOf(today).getUTCFullYear());
  const [month, setMonth] = React.useState(dateOf(today).getUTCMonth());
  const [categoryId, setCategoryId] = React.useState("");
  const [showMerchants, setShowMerchants] = React.useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = React.useState(false);
  const [merchantsExpanded, setMerchantsExpanded] = React.useState(false);

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("finance rankings state", {
    mode,
    year,
    month,
    loading,
    failed,
    categorySelected: !!categoryId,
    showMerchants,
  });

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  React.useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const next = await loadSpendingRankings(user);
        if (active) {
          setData(next);
          setFailed(false);
          setToday(londonToday());
        }
      } catch (error) {
        if (active) {
          setFailed(true);
          // Keep the failure type without logging validation excerpts or payloads.
          const failure = new Error("Spending rankings refresh failed");
          failure.name = error instanceof Error ? error.name : "UnknownError";
          console.log("Error refreshing finance rankings", failure);
        }
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user]);

  React.useEffect(() => {
    const period = selectRankingPeriod(data, mode, year, month);
    const retained = retainRankingCategory(period, categoryId);
    if (retained !== categoryId) {
      setCategoryId(retained);
      setShowMerchants(false);
    }
  }, [data, mode, year, month, categoryId]);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Period
  const handleEventChangeMode = (value: "month" | "year") => {
    setMode(value);
    setMerchantsExpanded(false);
  };
  const handleEventChangeYear = (value: string) => {
    setYear(Number(value));
    setMerchantsExpanded(false);
  };
  const handleEventChangeMonth = (value: string) => {
    setMonth(Number(value));
    setMerchantsExpanded(false);
  };
  // ------------------------------------------------------ Category
  const handleEventSelectCategory = (id: string) => {
    const selected = id === "__all_categories__" ? "" : id;
    setCategoryId(selected);
    if (!selected) setShowMerchants(false);
    setMerchantsExpanded(false);
  };
  const handleEventChangeMerchantView = (checked: boolean) => {
    setShowMerchants(checked);
  };
  const handleEventToggleCategories = () =>
    setCategoriesExpanded((previous) => !previous);
  const handleEventToggleMerchants = () =>
    setMerchantsExpanded((previous) => !previous);

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const period = selectRankingPeriod(data, mode, year, month);
  const category = period?.categories.find((entry) => entry.id === categoryId);
  const merchantView = showMerchants && !!category;
  const years = [
    ...new Set([
      dateOf(today).getUTCFullYear(),
      ...(data?.periods.map((entry) => Number(entry.start.slice(0, 4))) ?? []),
    ]),
  ].sort((a, b) => b - a);
  const periodLabel = mode === "year" ? `${year}` : `${MONTHS[month]} ${year}`;
  
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  if (loading) return <LoadingAnimation />;
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-gray-800">
      {/* Heading and calendar controls */}
      <h1 className="text-2xl font-semibold">Spending rankings</h1>
      <div className="flex flex-wrap items-end gap-4">
        <SegmentedControl
          label="Period"
          value={mode}
          options={[
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
          onEventChange={handleEventChangeMode}
        />
        {mode === "month" && (
          <AnalyticsSelect
            label="Month"
            value={String(month)}
            options={MONTHS.map((name, index) => ({ id: String(index), name }))}
            onEventChange={handleEventChangeMonth}
          />
        )}
        <AnalyticsSelect
          label="Year"
          value={String(year)}
          options={years.map((value) => ({
            id: String(value),
            name: String(value),
          }))}
          onEventChange={handleEventChangeYear}
        />
        <AnalyticsSelect
          label="Category"
          value={categoryId || "__all_categories__"}
          options={[
            { id: "__all_categories__", name: "All categories" },
            ...(period?.categories ?? []),
          ]}
          onEventChange={handleEventSelectCategory}
        />
        <label className="flex items-center gap-3 py-2 text-sm font-semibold">
          <IOSSwitch
            checked={merchantView}
            disabled={!category}
            inputProps={{ "aria-label": "Merchants" }}
            onChange={(_event, checked) =>
              handleEventChangeMerchantView(checked)
            }
          />
          Merchants
        </label>
      </div>
      {/* One chart pair for category overview or merchant rankings */}
      {data?.available && period && (
        <AnalyticsCard>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {merchantView
                ? `${category!.name} | Merchants`
                : `Categories | ${periodLabel}`}
            </h2>
            <p className="text-sm text-gray-500">
              Net spending{" "}
              <span className="ml-2 text-xl font-semibold tabular-nums text-gray-900">
                {money(merchantView ? category!.net_total : period.net_total)}
              </span>
            </p>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <SpendingRankingChart
              entries={merchantView ? category!.merchants : period.categories}
              expanded={merchantView ? merchantsExpanded : categoriesExpanded}
              selectedId={merchantView ? undefined : categoryId}
              onEventSelect={
                merchantView ? undefined : handleEventSelectCategory
              }
              onEventToggleExpanded={
                merchantView
                  ? handleEventToggleMerchants
                  : handleEventToggleCategories
              }
            />
            <RankingDonut
              entries={merchantView ? category!.merchants : period.categories}
              limit={merchantView ? 4 : 5}
              label={
                merchantView
                  ? `${category!.name} merchant composition`
                  : "Category spending composition"
              }
              onEventSelect={
                merchantView ? undefined : handleEventSelectCategory
              }
            />
          </div>
        </AnalyticsCard>
      )}
    </main>
  );
}
