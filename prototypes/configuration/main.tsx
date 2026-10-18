import "../offline";
import PlannerTheme from "../../src/components/PlannerTheme";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsCard, AnalyticsSelect, SegmentedControl } from "../../src/components/analytics/AnalyticsControls";
import { SofiaConfigurationFields } from "./SofiaConfigurationFields";
import { emptySofiaConfig } from "./sofiaTypes";
import type { AlertRule, SofiaConfig, SofiaSnapshot } from "./sofiaTypes";
import { muscleGroups } from "../../src/pages/health/healthTypes";
import { DietConfigurationFields } from "./DietConfigurationFields";
import { defaultDietConfig } from "../../src/pages/diet/dietAnalyticsTypes";
import type { ComponentKey, DietConfig } from "../../src/pages/diet/dietAnalyticsTypes";
import "../../src/styles/index.css";

// ============================================================ //
//                                                              //
//   SOFIA CONFIGURATION PROTOTYPE                              //
//                                                              //
//   Local interactive draft using existing app components.      //
//   The container owns memory-only edits with no resource writes.//
//                                                              //
// ============================================================ //
type Section = "diet" | "health" | "sofia";
type SofiaSection = "alerts" | "report" | "routine" | "shopping" | "approvals";
const healthMetrics = [
  { id: "steps", name: "Steps", unit: "steps" }, { id: "calories", name: "Calories burned", unit: "kcal" },
  { id: "sleep", name: "Sleep duration", unit: "hours" }, { id: "volume", name: "Training volume", unit: "kg × reps" },
  { id: "weight", name: "Weight", unit: "kg" }, { id: "body_fat", name: "Body fat", unit: "%" }, { id: "muscle_mass", name: "Muscle mass", unit: "kg" },
  { id: "bmi", name: "BMI", unit: "kg/m²" }, { id: "subcutaneous_fat", name: "Subcutaneous fat", unit: "%" },
  { id: "heart_rate", name: "Heart rate", unit: "bpm" }, { id: "cardiac_index", name: "Cardiac index", unit: "" },
  { id: "visceral_fat", name: "Visceral fat", unit: "index" }, { id: "body_water", name: "Body water", unit: "%" },
  { id: "skeletal_muscle", name: "Skeletal muscle", unit: "%" }, { id: "bone_mass", name: "Bone mass", unit: "kg" },
  { id: "protein", name: "Body protein", unit: "%" }, { id: "bmr", name: "Basal metabolism", unit: "kcal" },
  { id: "body_age", name: "Body age", unit: "years" },
];
const routineHabits = [{ id: "sample-reading", name: "Reading" }, { id: "sample-walking", name: "Walking" }];
const snapshot: SofiaSnapshot = {
  cutoff: "2026-01-01",
  metrics: [{ source_key: "steps", name: "Steps", unit: "steps" }, { source_key: "weight", name: "Weight", unit: "kg" }, { source_key: "finance:groceries", name: "Groceries spending", unit: "GBP" }, { source_key: "source:monzo", name: "Monzo source", unit: "" }],
  routine: { habits: Object.fromEntries(routineHabits.map(habit => [habit.id, { name: habit.name, weight: 1 }])) },
};
const initial: SofiaConfig = { ...emptySofiaConfig(), rules: [
  { id: "groceries", source_key: "finance:groceries", kind: "pace", enabled: false, direction: "maximum", tolerance: 0, stale_after_days: null, period: "month", include_in_report: true },
  { id: "steps", source_key: "steps", kind: "pace", enabled: false, direction: "minimum", tolerance: 0, stale_after_days: null, period: "week", include_in_report: true },
  { id: "weight", source_key: "weight", kind: "limits", enabled: false, direction: "range", tolerance: 0, stale_after_days: null, period: "week", include_in_report: true },
  { id: "monzo", source_key: "source:monzo", kind: "freshness", enabled: false, direction: "minimum", tolerance: 0, stale_after_days: null, period: "week", include_in_report: true },
] };

function Prototype() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const [section, setSection] = React.useState<Section>("sofia");
  const [sofiaSection, setSofiaSection] = React.useState<SofiaSection>("alerts");
  const [period, setPeriod] = React.useState("month");
  const [activity, setActivity] = React.useState("steps");
  const [metric, setMetric] = React.useState("weight");
  const [targets, setTargets] = React.useState<Record<string, string>>({});
  const [limits, setLimits] = React.useState<Record<string, { lower: string; upper: string }>>({});
  const [dietConfig, setDietConfig] = React.useState(defaultDietConfig);
  const [config, setConfig] = React.useState(initial);
  const [subscriptions, setSubscriptions] = React.useState(["Gousto", "PBfit peanut butter powder", "Myprotein Impact Whey Protein Powder · Natural Chocolate · 2.5 kg"]);
  const [message, setMessage] = React.useState("");
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("Sofia prototype selection", section, sofiaSection, period, activity, metric);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Selection
  const handleEventSection = (value: Section) => setSection(value);
  const handleEventSofiaSection = (value: SofiaSection) => setSofiaSection(value);
  const handleEventPeriod = (value: string) => setPeriod(value);
  const handleEventActivity = (value: string) => setActivity(value);
  const handleEventMetric = (value: string) => setMetric(value);
  // ------------------------------------------------------ Health targets and limits
  const handleEventTarget = (value: string) => setTargets(current => ({ ...current, [`${activity}:${period}`]: value }));
  const handleEventLimit = (bound: "lower" | "upper", value: string) => setLimits(current => ({ ...current, [`${metric}:${period}`]: { ...(current[`${metric}:${period}`] ?? { lower: "", upper: "" }), [bound]: value } }));
  // ------------------------------------------------------ Existing Diet configuration
  const handleEventDietRule = (key: ComponentKey, patch: Partial<DietConfig["rules"][ComponentKey]>) => setDietConfig(current => ({ ...current, rules: { ...current.rules, [key]: { ...current.rules[key], ...patch } } }));
  const handleEventDietCorrection = (correction: number) => setDietConfig(current => ({ ...current, correction }));
  // ------------------------------------------------------ Sofia settings
  const handleEventRuleChange = (id: string, patch: Partial<AlertRule>) => setConfig(current => ({ ...current, rules: current.rules.map(rule => rule.id === id ? { ...rule, ...patch } : rule) }));
  const handleEventWeightChange = (id: string, weight: number) => setConfig(current => ({ ...current, habit_weights: { ...current.habit_weights, [id]: weight } }));
  const handleEventRuleAdd = () => setConfig(current => ({ ...current, rules: [...current.rules, { ...initial.rules[1], id: crypto.randomUUID() }] }));
  const handleEventRuleRemove = (id: string) => setConfig(current => ({ ...current, rules: current.rules.filter(rule => rule.id !== id) }));
  const handleEventHorizon = (value: number) => setConfig(current => ({ ...current, shopping_horizon_days: value }));
  const handleEventSubscription = (name: string, checked: boolean) => setSubscriptions(current => checked ? [...current, name] : current.filter(item => item !== name));
  const handleEventReview = () => setMessage("Prototype reviewed. Your edits remain local to this tab.");
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const target = targets[`${activity}:${period}`] ?? "";
  const { lower = "", upper = "" } = limits[`${metric}:${period}`] ?? {};
  const fieldClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-violet-600 focus:outline-none";
  const subscriptionOptions = ["Gousto", "PBfit peanut butter powder", "Myprotein Impact Whey Protein Powder · Natural Chocolate · 2.5 kg"];
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-gray-800">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Configuration</h1><p className="mt-2 text-sm text-gray-500">Diet, Health and Sofia settings.</p></div>
      <p className="text-right text-xs leading-5 text-gray-500">Interactive prototype<br />Changes stay in this tab<br />Uses the existing Home configuration design</p>
    </header>
    <SegmentedControl label="Section" value={section} options={[{ value: "diet", label: "Diet" }, { value: "health", label: "Health" }, { value: "sofia", label: "Sofia" }]} onEventChange={handleEventSection} />
    {section === "diet" && <div className="space-y-5">
      <DietConfigurationFields config={dietConfig} onEventRule={handleEventDietRule} onEventCorrection={handleEventDietCorrection} />
      <p className="text-sm text-gray-500">These are the existing Diet controls with their initial defaults. Meal ranking weights and calibration correction remain in Diet configuration. Intake targets come from the selected weekly diet in Plan Diet.</p>
    </div>}
    {section === "health" && <div className="space-y-5">
      <SegmentedControl label="Period" value={period} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }]} onEventChange={handleEventPeriod} />
      <AnalyticsCard><h2 className="mb-4 text-sm font-semibold">Burnup target</h2><div className="grid items-end gap-4 sm:grid-cols-2">
        <AnalyticsSelect label="Activity" value={activity} options={[{ id: "steps", name: "Steps" }, ...muscleGroups.map(group => ({ id: `volume:${group}`, name: `${group[0].toUpperCase() + group.slice(1)} volume` }))]} onEventChange={handleEventActivity} />
        <label className="space-y-1 text-xs text-gray-500">Target total<input aria-label="Target total" className={fieldClass} type="number" min={0} step="any" value={target} placeholder="Not set" onChange={event => handleEventTarget(event.target.value)} /></label>
      </div><p className="mt-3 text-xs text-gray-500">Steps use a step count. Muscle volume uses recorded kg × reps. Leave empty to unset.</p></AnalyticsCard>
      <AnalyticsCard><h2 className="mb-4 text-sm font-semibold">Control limits</h2><div className="grid items-end gap-4 sm:grid-cols-3">
        <AnalyticsSelect label="Metric" value={metric} options={healthMetrics} onEventChange={handleEventMetric} />
        <label className="space-y-1 text-xs text-gray-500">Lower limit<input aria-label="Lower limit" className={fieldClass} type="number" step="any" value={lower} placeholder="Not set" onChange={event => handleEventLimit("lower", event.target.value)} /></label>
        <label className="space-y-1 text-xs text-gray-500">Upper limit<input aria-label="Upper limit" className={fieldClass} type="number" step="any" value={upper} placeholder="Not set" onChange={event => handleEventLimit("upper", event.target.value)} /></label>
      </div><p className="mt-3 text-xs text-gray-500">Limits apply to the selected metric and period in its displayed units. Leave both empty to unset.</p></AnalyticsCard>
      <p className="text-sm text-gray-500">Health owns these targets and limits. Sofia reads them when assessing the corresponding charts.</p>
    </div>}
    {section === "sofia" && <div className="space-y-5">
      <AnalyticsCard><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold">Sofia’s daily cycle</p><p className="mt-1 text-sm text-gray-500">03.00 · 09.00 · 15.00 · 21.00 Europe/London</p></div><div className="text-sm text-gray-600">Weekly assessment at 21.00<br /><span className="text-xs text-gray-500">Monday through the current day</span></div></div></AnalyticsCard>
      <AnalyticsCard><h2 className="mb-4 text-sm font-semibold">Sofia settings</h2>
        <div className="overflow-x-auto pb-1"><SegmentedControl label="Sofia settings section" value={sofiaSection} options={[{ value: "alerts", label: "Alerts" }, { value: "report", label: "Report" }, { value: "routine", label: "Routine" }, { value: "shopping", label: "Shopping" }, { value: "approvals", label: "Approvals" }]} onEventChange={handleEventSofiaSection} /></div>
        <div className="mt-5 space-y-5">
          {(sofiaSection === "alerts" || sofiaSection === "report" || sofiaSection === "routine") && <SofiaConfigurationFields section={sofiaSection} config={config} snapshot={snapshot} onEventRuleChange={handleEventRuleChange} onEventRuleAdd={handleEventRuleAdd} onEventRuleRemove={handleEventRuleRemove} onEventWeightChange={handleEventWeightChange} />}
          {sofiaSection === "alerts" && <div className="space-y-3 border-t border-gray-200 pt-5">
            <p className="text-sm text-gray-600">Sofia reads Health targets and manual limits, Plan Finances budgets and the selected Plan Diet. Diet calories and protein follow the existing weekly monitoring view. Ranking weights and maintenance correction stay in the Diet section.</p>
            <p className="text-sm text-gray-500">Trends and sustained shifts use comparable observations and include their supporting evidence. New or worsened alerts are grouped into one email. Unchanged open alerts stay in the daily report.</p>
            <p className="text-sm text-gray-500">Freshness rules cover Monzo, MyFitnessPal, Fitdays, Strong and receipt capture. Initial thresholds go to the approval task before activation.</p>
          </div>}
          {sofiaSection === "report" && <div className="border-t border-gray-200 pt-5"><h3 className="mb-3 text-sm font-semibold">Included in the daily assessment</h3><ul className="space-y-2 text-sm text-gray-600"><li>Completed, unchanged, blocked and approval-dependent steps</li><li>Source freshness and missing observations</li><li>Shopping needs and necessary budget recommendations</li><li>Pending decisions and note-move proposals</li><li>HTML charts and metric tables attached to the daily email</li></ul></div>}
          {sofiaSection === "routine" && <p className="border-t border-gray-200 pt-5 text-sm leading-6 text-gray-500">The score uses scheduled occurrences from Monday through today, including exclusions and retrospective check-ins. Current-day habits remain pending until the evening cutoff. Quantified habits can receive partial credit.</p>}
          {sofiaSection === "shopping" && <><h3 className="text-sm font-semibold">Replenishment</h3><label className="block max-w-sm space-y-1 text-xs text-gray-500">Add predicted needs for the next days<input aria-label="Shopping horizon days" className={fieldClass} type="number" min={1} max={90} value={config.shopping_horizon_days} onChange={event => handleEventHorizon(Number(event.target.value))} /></label><p className="text-sm leading-6 text-gray-500">Purchase quantities and cadence are refined by stock and ran-out observations. Estimates stay labelled. One shopping task preserves your manual entries.</p><h3 className="border-t border-gray-200 pt-5 text-sm font-semibold">Subscription exclusions</h3>{subscriptionOptions.map(name => <label key={name} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={subscriptions.includes(name)} onChange={event => handleEventSubscription(name, event.target.checked)} />{name}</label>)}<p className="text-sm text-gray-500">Exclusions apply to the configured subscription products. Completing the task does not establish a purchase.</p></>}
          {sofiaSection === "approvals" && <><h3 className="text-sm font-semibold">Automatic maintenance</h3><p className="text-sm leading-6 text-gray-600">Receipt and order interpretation, reconciled purchases, immutable MFP meal versions, required planner data, recurring counters and shopping. Saved MFP meals are read without modifying them.</p><h3 className="border-t border-gray-200 pt-5 text-sm font-semibold">Your approval</h3><ul className="space-y-2 text-sm text-gray-600"><li>Budget changes</li><li>Daily-note content moves</li><li>MyFitnessPal diary edits</li><li>Agent-proposed thresholds and control limits</li></ul><a className="inline-block text-sm text-violet-700 underline" href="https://ticktick.com/webapp/#p/inbox122673285/tasks/6acbbba18f08c641f65699be" target="_blank" rel="noreferrer">Open Sofia’s approval task</a><p className="text-sm text-gray-500">Sofia reads your edits and comments each run. Approve specific proposal IDs. Completing the task does not approve all proposals.</p><h3 className="border-t border-gray-200 pt-5 text-sm font-semibold">Daily-note cleanup</h3><p className="text-sm leading-6 text-gray-500">Review the 2026 notes first, then new or changed notes. Each proposal identifies the exact passage, an existing destination and the intended edit. Approved moves preserve recoverable copies and replace the source passage with a destination link.</p></>}
        </div>
      </AnalyticsCard>
    </div>}
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5"><p className="text-sm text-gray-500">Prototype edits are unsaved. Each domain keeps its existing settings and save action.</p><button type="button" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800" onClick={handleEventReview}>Review prototype</button></footer>
    {message && <p role="status" className="text-sm text-violet-700">{message}</p>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<PlannerTheme><Prototype /></PlannerTheme>);
