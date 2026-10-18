import { useAccount } from "../../auth/accountContext";
import LoadingAnimation from "../../components/LoadingAnimation";
import * as React from "react";
import { Link } from "react-router-dom";
import { loadMonitoringData } from "./financeAnalyticsData";
import {
  buildMonitoringView,
  dateOf,
  londonToday,
  money,
} from "./financeAnalyticsCalculations";
import { MONTHS } from "./financeAnalyticsTypes";
import type { MonitoringData } from "./financeAnalyticsTypes";
import { BurndownChart, ExpenseBreakdown, MetricCard } from "./components/FinanceAnalyticsComponents";
import { AnalyticsSelect, SegmentedControl } from "../../components/analytics/AnalyticsControls";

// ============================================================ //
//                                                              //
//   MONITORING PAGE                                            //
//                                                              //
//   Current-year budgets against observed Monzo expenses.       //
//   Owns resource loading and selections for stateless charts.  //
//                                                              //
// ============================================================ //
export default function MonitoringPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const user = useAccount();
  const [data, setData] = React.useState<MonitoringData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [today, setToday] = React.useState(londonToday());
  const [entityId, setEntityId] = React.useState("");
  const [mode, setMode] = React.useState<"month" | "year">("month");
  const [month, setMonth] = React.useState(dateOf(today).getUTCMonth());

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("finance monitoring selection", mode, month, loading);
  console.log("finance monitoring failed", failed, data);

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
        const next = await loadMonitoringData(user);
        if (active) {
          setData(next);
          setFailed(false);
          setToday(londonToday());
          setEntityId((previous) =>
            next.expenses.entities.some((item) => item.id === previous)
              ? previous
              : (next.expenses.entities[0]?.id ?? ""),
          );
        }
      } catch (error) {
        if (active) {
          setFailed(true);
          console.log("Error loading finance monitoring", error);
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

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Monitoring
  const handleEventSelectEntity = (value: string) => setEntityId(value);
  const handleEventChangeMode = (value: "month" | "year") => setMode(value);
  const handleEventChangeMonth = (value: string) => setMonth(Number(value));

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const view = data
    ? buildMonitoringView(data, { entityId, mode, month, today })
    : null;
  const entity = data?.expenses.entities.find((item) => item.id === entityId);
  const latestMonth = data?.analytics.views[entityId]?.months.reduce<number | null>((latest, entry, index) => entry.spent !== null ? index : latest, null) ?? null;
  const yearMode = mode === "year";
  const tone =
    view?.remaining !== null && (view?.remaining ?? 0) < 0 ? "red" : "green";
  const display = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : money(value);

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  if (loading) return <LoadingAnimation />;
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-gray-800">
      {/* Heading */}
      <div className="flex flex-wrap items-baseline justify-between gap-3"><h1 className="text-2xl font-semibold">Monitoring</h1>{view?.observedThrough && <p className="text-xs text-gray-500">Observed through {dateOf(view.observedThrough).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>}</div>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <AnalyticsSelect
          label="Budget"
          value={entityId}
          options={data?.expenses.entities ?? []}
          onEventChange={handleEventSelectEntity}
        />
        {yearMode ? (
          <p className="py-2 text-sm">{dateOf(today).getUTCFullYear()}</p>
        ) : (
          <AnalyticsSelect
            label="Month"
            value={String(month)}
            options={MONTHS.map((name, index) => ({ id: String(index), name }))}
            onEventChange={handleEventChangeMonth}
          />
        )}
        <SegmentedControl
          label="Period"
          value={mode}
          options={[
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
          onEventChange={handleEventChangeMode}
        />
      </div>
      {/* Metric cards */}
      {!loading && view?.spent === null && (
        <div className="flex flex-wrap gap-4 text-sm">
          {latestMonth !== null && <button className="text-blue-700 underline" onClick={() => { setMode("month"); setMonth(latestMonth); }}>View latest available budget month · {MONTHS[latestMonth]}</button>}
          <Link className="text-blue-700 underline" to="/finance/rankings">Browse available spending history</Link>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Spent"
          value={display(view?.spent)}
          tone={tone}
          detail={
            view?.budget === null
              ? "No separate budget"
              : `${display(view?.budget)} ${yearMode ? "annual" : "monthly"} budget`
          }
        />
        <MetricCard
          label={`Average observed day${view?.observedDays !== undefined ? ` (${view.observedDays} days)` : ""}`}
          value={display(view?.dailyRate)}
          tone={tone}
          detail={`${display(view?.plannedDailyRate)} planned per day`}
        />
        <MetricCard
          label={yearMode ? "Monthly burn rate" : "Weekly burn rate"}
          value={display(view?.periodRate)}
          tone={tone}
          detail={`${display(view?.plannedPeriodRate)} planned per ${yearMode ? "month" : "week"}`}
        />
        <MetricCard
          label={yearMode ? "Monthly remaining" : "Weekly remaining"}
          value={display(view?.remainingRate)}
          tone={tone}
          detail={
            view?.complete
              ? "Completed period"
              : `Available per ${yearMode ? "month until year-end" : "week until month-end"}`
          }
        />
      </div>
      {/* Charts */}
      {view && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <BurndownChart
            view={view}
            yearMode={yearMode}
            title={entity?.name ?? "Selected"}
            colour={tone === "red" ? "#b91c1c" : "#15803d"}
          />
          <ExpenseBreakdown
            rows={view.breakdown}
            slices={view.breakdown.filter((row) => row.value > 0)}
          />
        </div>
      )}
    </main>
  );
}
