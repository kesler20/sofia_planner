import { useAccount } from "../../auth/accountContext";
import LoadingAnimation from "../../components/LoadingAnimation";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { AnalyticsCard, AnalyticsSelect, SegmentedControl } from "../../components/analytics/AnalyticsControls";
import HorizontalRankingChart from "../../components/charts/HorizontalRankingChart";
import IOSSwitch from "../../components/switch/IOSSwitch";
import { londonToday } from "../finance/financeAnalyticsCalculations";
import { loadDietData, retainDietData } from "./dietAnalyticsData";
import { addDays, bodyFatScenario, calibrationView, monitoringView, weekDates } from "./dietAnalyticsCalculations";
import DietDateNavigation from "./components/DietDateNavigation";
import { componentKeys } from "./dietAnalyticsTypes";
import type { DietData, ComponentKey, Goal } from "./dietAnalyticsTypes";
import { DietDonut, DietSeries, NumberField, Stat, colours, format, labelOf } from "./components/DietAnalyticsComponents";

// ============================================================ //
//                                                              //
//   DIET ANALYTICS PAGE                                        //
//                                                              //
//   Displays engine-owned monitoring, rankings and calibration. //
//   Owns refresh, selections and local body-fat scenarios.      //
//                                                              //
// ============================================================ //
export default function DietAnalyticsPage(props: { loadData?: typeof loadDietData; currentDate?: string } = {}) {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const page = useLocation().pathname.split("/").pop();
  const user = useAccount();
  const [data, setData] = React.useState<DietData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [today, setToday] = React.useState(props.currentDate ?? londonToday());
  const [metric, setMetric] = React.useState<"calories" | "protein">("calories");
  const [historyDate, setHistoryDate] = React.useState<string | null>(null);
  const [dietName, setDietName] = React.useState("");
  const [rankingView, setRankingView] = React.useState("catalogue");
  const [rankingMetric, setRankingMetric] = React.useState<ComponentKey>("calories");
  const [selectedMeal, setSelectedMeal] = React.useState("");
  const [showFoods, setShowFoods] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [order, setOrder] = React.useState("highest");
  const [goal, setGoal] = React.useState<Goal>({ weight: 85, fat: 25, target: 15, days: 90, maintenance: NaN });
  const initialised = React.useRef(false);
  const maintenanceEdited = React.useRef(false);
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("diet analytics selection", page, metric, rankingView, loading);
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
        const next = await (props.loadData ?? loadDietData)(user);
        if (!active) return;
        setData(previous => retainDietData(previous, next));
        setToday(props.currentDate ?? londonToday());
        const observedMaintenance = calibrationView(next, props.currentDate ?? londonToday()).maintenance;
        if (!maintenanceEdited.current && observedMaintenance != null)
          setGoal(previous => ({ ...previous, maintenance: observedMaintenance }));
        if (!initialised.current && next.health) {
          initialised.current = true;
          setGoal(previous => ({ ...previous, weight: next.health!.latest_body.weight?.value ?? previous.weight, fat: next.health!.latest_body.body_fat?.value ?? previous.fat }));
        }
      } finally { pending = false; if (active) setLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [user, props.loadData, props.currentDate]);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Calculator
  const handleEventGoal = (key: keyof Goal, value: number) => {
    if (key === "maintenance") maintenanceEdited.current = true;
    setGoal(previous => ({ ...previous, [key]: value }));
  };
  // ------------------------------------------------------ Rankings
  const handleEventRankingView = (value: string) => { setRankingView(value); setSelectedMeal(""); setShowFoods(false); };
  const handleEventMeal = (value: string) => { setSelectedMeal(value === "all" ? "" : value); if (value === "all") setShowFoods(false); };
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const diet = data?.diets?.find(item => item.name === dietName) ?? data?.diets?.find(item => item.active) ?? data?.diets?.[0];
  const selectedDate = historyDate ?? today;
  const view = monitoringView(data, diet, metric, today, selectedDate);
  const contributionDates = weekDates(selectedDate);
  const contributions = data?.actuals?.days.filter(day => contributionDates.includes(day.date) && day.date <= selectedDate && day.date <= today).flatMap(day => day.entries.map(entry => ({ id: entry.id, name: entry.name, value: entry[metric] }))) ?? [];
  const latestDiary = data?.actuals?.days.filter(day => day.entries.length > 0 || day.complete).map(day => day.date).sort().at(-1);
  const consumed = data?.analytics?.as_of === today ? data.analytics.rankings.consumed : [];
  const ranked = rankingView === "catalogue" ? data?.analytics?.rankings.catalogue ?? [] : consumed;
  const selected = ranked.find(item => item.id === selectedMeal);
  const foods = showFoods && !!selected;
  const population = foods ? selected!.foods : ranked;
  const unknown = population.filter(item => item.components[rankingMetric] === null);
  const rows = population.filter(item => !unknown.includes(item)).map((item, index) => ({ id: item.id, name: item.name, servings: item.servings, colour: colours[index % colours.length], value: item.components[rankingMetric]! })).sort((a, b) => order === "highest" ? b.value - a.value : a.value - b.value);
  const visibleRows = expanded ? rows : rows.slice(0, 5);
  const additive = ["calories", "protein", "cost"].includes(rankingMetric);
  const calibration = calibrationView(data, today);
  const energy = selectedDate <= today ? data?.analytics?.daily_balance_history?.[selectedDate] ?? (data?.analytics?.daily_balance?.date === selectedDate ? data.analytics.daily_balance : null) : null;
  const scenario = bodyFatScenario(goal);
  const status = data?.errors.length ? "Unable to refresh some Diet data. Retaining successful observations." : !data?.analytics ? "Diet analytics are unavailable." : null;
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  if (loading) return <LoadingAnimation />;
  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-gray-800">
    {status && <AnalyticsCard><p role="status" className="text-sm text-gray-500">{status}</p></AnalyticsCard>}
    {page === "monitoring" && <>
      <h1 className="text-2xl font-semibold">Diet Monitoring</h1>
      <div className="flex flex-wrap items-end gap-4"><AnalyticsSelect label="Diet" value={diet?.name ?? ""} options={(data?.diets ?? []).map(item => ({ id: item.name, name: item.name }))} onEventChange={setDietName}/><SegmentedControl label="Metric" value={metric} options={[{ value: "calories", label: "Calories" }, { value: "protein", label: "Protein" }]} onEventChange={setMetric}/><DietDateNavigation date={selectedDate} today={today} onEventPrevious={() => setHistoryDate(addDays(selectedDate, -1))} onEventToday={() => setHistoryDate(null)} onEventNext={() => setHistoryDate(addDays(selectedDate, 1))}/></div>
      {historyDate && <p className="text-sm text-gray-500">Week · {view.dates[0]} to {view.dates[6]}</p>}
      {view.actual === null && latestDiary && !historyDate && <button className="text-sm text-blue-700" onClick={() => setHistoryDate(latestDiary)}>Show latest available day · {latestDiary}</button>}
      {!diet && <p role="status">No diet plan is available.</p>}
      <AnalyticsCard>
        <h2 className="text-sm font-semibold">Daily energy balance · {selectedDate}</h2>
        <div className="my-6 flex flex-wrap items-center justify-center gap-4 text-center sm:gap-8" aria-label="Daily energy equation">
          <div><p className="text-sm text-gray-500">OUT · Fit calories burned</p><p className="text-3xl font-semibold sm:text-4xl">{format("calories", energy?.burned ?? null)}</p></div><span className="text-3xl">−</span>
          <div><p className="text-sm text-gray-500">IN · Logged MFP intake</p><p className="text-3xl font-semibold sm:text-4xl">{format("calories", energy?.intake ?? null)}</p></div><span className="text-3xl">=</span>
          <div><p className="text-sm text-gray-500">{energy?.balance == null ? "Unavailable" : energy.balance > 0 ? "Deficit" : energy.balance < 0 ? "Surplus" : "Balanced"}</p><p className="text-3xl font-semibold text-violet-700 sm:text-4xl">{format("calories", energy?.balance == null ? null : Math.abs(energy.balance))}</p></div>
        </div>
      </AnalyticsCard>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label={`Average logged day${view.observed_days !== undefined ? ` (${view.observed_days} days)` : ""}`} value={format(metric, view.dailyRate)}/><Stat label="Remaining logged allowance/day" value={format(metric, view.requiredRate)}/><Stat label="Total remaining" value={format(metric, view.remaining)}/></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]"><AnalyticsCard><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{metric === "protein" ? "Protein progress" : "Calorie allowance"}</h2><span className="text-xl font-semibold">{format(metric, metric === "protein" ? view.actual : view.remaining)}</span></div><DietSeries data={view.points} metric={metric}/><div className="flex flex-wrap justify-center gap-5 text-xs text-gray-500"><span>Solid · Logged</span><span>Dashed · Plan</span></div></AnalyticsCard><AnalyticsCard><DietDonut rows={contributions} metric={metric}/></AnalyticsCard></div>
    </>}
    {page === "rankings" && <>
      <h1 className="text-2xl font-semibold">Meal Rankings</h1>
      <div className="flex flex-wrap items-end gap-4"><SegmentedControl label="Source" value={rankingView} options={[{ value: "catalogue", label: "Catalogue" }, { value: "consumed", label: "Consumed" }]} onEventChange={handleEventRankingView}/><AnalyticsSelect label="Metric" value={rankingMetric} options={componentKeys.map(key => ({ id: key, name: labelOf(key) }))} onEventChange={value => setRankingMetric(value as ComponentKey)}/><SegmentedControl label="Order" value={order} options={[{ value: "highest", label: "Highest" }, { value: "lowest", label: "Lowest" }]} onEventChange={setOrder}/></div>
      <div className="flex flex-wrap items-end gap-4"><AnalyticsSelect label="Meal" value={selected?.id ?? "all"} options={[{ id: "all", name: "All meals" }, ...ranked.map(item => ({ id: item.id, name: item.name }))]} onEventChange={handleEventMeal}/><label className="flex items-center gap-3 py-2 text-sm font-semibold"><IOSSwitch checked={foods} disabled={!selected} inputProps={{ "aria-label": "Foods" }} onChange={(_event, checked) => setShowFoods(checked)}/>Foods</label></div>
      <AnalyticsCard><h2 className="mb-4 text-lg font-semibold">{foods ? `${selected!.name} | Foods` : rankingView === "catalogue" ? "Saved meals · Per serving" : "Consumed meals · This week"}</h2>
        <div className={additive ? "grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]" : "grid gap-5"}><div>
          {visibleRows.length ? <HorizontalRankingChart rows={visibleRows} colour="#2563eb" selectedId={selected?.id} formatValue={value => format(rankingMetric, value)} maxBarSize={14} height={Math.max(260, visibleRows.length * 42)} onEventSelect={foods ? undefined : handleEventMeal}/> : <p className="py-12 text-sm text-gray-500">No complete values for this ranking.</p>}
          <table className="mt-4 w-full text-xs"><thead><tr className="text-left text-gray-500"><th className="pb-2 font-normal">Name</th><th className="pb-2 text-right font-normal">{labelOf(rankingMetric)}</th>{rankingView === "consumed" && <th className="pb-2 text-right font-normal">Servings</th>}</tr></thead><tbody>{visibleRows.map(row => <tr key={row.id} className="border-t border-gray-100"><td className="py-3">{foods ? row.name : <button className="text-left text-blue-700" onClick={() => handleEventMeal(row.id)}>{row.name}</button>}</td><td className="text-right tabular-nums">{format(rankingMetric, row.value)}</td>{rankingView === "consumed" && <td className="text-right">{row.servings}</td>}</tr>)}</tbody></table>
          {rows.length > 5 && <button className="mt-3 text-sm font-semibold text-blue-700" onClick={() => setExpanded(previous => !previous)}>{expanded ? "Show top 5" : `Show all ${rows.length}`}</button>}
        </div>{additive && <DietDonut rows={rows} metric={rankingMetric}/>}</div>
      </AnalyticsCard>
    </>}
    {page === "calculator" && <>
      <h1 className="text-2xl font-semibold">Calorie Calculator</h1>

      <div className="grid gap-4 sm:grid-cols-3"><Stat label="IN · Average logged intake" value={format("calories", calibration.intake)}/><Stat label="OUT · Fit expenditure" value={format("calories", calibration.expenditure)}/><Stat label="Maintenance estimate" value={format("calories", calibration.maintenance)}/></div>
      <AnalyticsCard><h2 className="mb-5 text-lg font-semibold">Observed calibration</h2><dl className="grid gap-5 text-sm sm:grid-cols-3"><div><dt>Calculated daily correction</dt><dd className="text-xl font-semibold">{format("calories", calibration.correction)}</dd></div><div><dt>Raw predicted weekly change</dt><dd>{format("weight", calibration.predictedChange)}</dd></div><div><dt>Observed weekly change</dt><dd>{format("weight", calibration.observedChange)}</dd></div></dl></AnalyticsCard>
      <hr className="border-gray-200"/><div className="mx-auto max-w-4xl space-y-5"><h2 className="text-2xl font-semibold">Body-fat Calorie Calculator</h2><p className="text-sm text-gray-500">Maintenance starts from the observed estimate when available. Editing it creates a scenario without changing calibration.</p>
        <AnalyticsCard><div className="grid gap-4 sm:grid-cols-2">{([{ key: "weight", label: "Current weight (kg)", step: .1 }, { key: "fat", label: "Current body fat (%)", step: .1 }, { key: "target", label: "Target body fat (%)", step: .1 }, { key: "days", label: "Timeline (days)", step: 1 }, { key: "maintenance", label: "Maintenance scenario (kcal/day)", step: 10 }] as const).map(field => <NumberField key={field.key} label={field.label} value={goal[field.key]} step={field.step} onEventChange={value => handleEventGoal(field.key, value)}/>)}</div></AnalyticsCard>
        {scenario ? <div className="grid gap-4 sm:grid-cols-2"><Stat label="Starting weight" value={format("weight", goal.weight)}/><Stat label="Target weight" value={format("weight", scenario.targetWeight)}/><Stat label="Starting lean mass" value={format("weight", scenario.lean)}/><Stat label="Starting fat mass" value={format("weight", scenario.startingFat)}/><Stat label="Target fat mass" value={format("weight", scenario.targetFat)}/><Stat label="Weight to lose" value={format("weight", scenario.lose)}/><Stat label="Total deficit" value={format("calories", scenario.deficit)}/><Stat label="Daily deficit" value={format("calories", scenario.dailyDeficit)}/><Stat label="Target calories per day" value={format("calories", scenario.calories)}/><Stat label="Target protein per day" value={format("protein", scenario.protein)}/></div> : <p className="text-sm text-gray-500">Enter valid values and a target body fat below current body fat.</p>}
      </div>
    </>}
  </main>;
}
