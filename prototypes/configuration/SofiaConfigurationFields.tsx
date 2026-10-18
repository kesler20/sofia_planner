import * as React from "react";
import { AnalyticsSelect } from "../../src/components/analytics/AnalyticsControls";
import type { AlertRule, SofiaConfig, SofiaSnapshot } from "./sofiaTypes";

// ============================================================ //
//                                                              //
//   SOFIA CONFIGURATION FIELDS                                 //
//                                                              //
//   Stateless controls for alerts and routine weights.          //
//   Configuration owns saved state and receives emitted edits.  //
//                                                              //
// ============================================================ //
export function SofiaConfigurationFields(props: {
  config: SofiaConfig; snapshot: SofiaSnapshot | null;
  section: "alerts" | "report" | "routine";
  onEventRuleChange: (id: string, patch: Partial<AlertRule>) => void;
  onEventRuleAdd: () => void; onEventRuleRemove: (id: string) => void;
  onEventWeightChange: (id: string, weight: number) => void;
}): React.ReactElement {
  const fieldClass = "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800";
  const choices = Array.from(new Map((props.snapshot?.metrics ?? []).map(metric => [metric.source_key, { id: metric.source_key, name: metric.unit ? `${metric.name} (${metric.unit})` : metric.name }])).values());
  return <div className="space-y-5">
    <p className="text-sm text-gray-600">Targets and control limits come from the existing planning settings. Sofia proposes initial thresholds in your approval task. Saving these settings explicitly enables the rules you select.</p>
    {props.section === "alerts" && <>{props.config.rules.map(rule => <fieldset key={rule.id} className="space-y-3 rounded-xl border border-gray-200 p-4">
      <legend className="px-2 text-sm font-semibold">{choices.find(choice => choice.id === rule.source_key)?.name ?? rule.source_key}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <AnalyticsSelect label="Metric" value={rule.source_key} options={choices.some(choice => choice.id === rule.source_key) ? choices : [...choices, { id: rule.source_key, name: rule.source_key || "Choose a metric" }]} onEventChange={value => props.onEventRuleChange(rule.id, { source_key: value })} />
        <AnalyticsSelect label="Alert" value={rule.kind} options={[{ id: "pace", name: "Target pace" }, { id: "limits", name: "Control limits" }, { id: "freshness", name: "Data freshness" }]} onEventChange={value => props.onEventRuleChange(rule.id, { kind: value as AlertRule["kind"] })} />
        <AnalyticsSelect label="Period" value={rule.period} options={[{ id: "week", name: "Week" }, { id: "month", name: "Month" }, { id: "year", name: "Year" }]} onEventChange={value => props.onEventRuleChange(rule.id, { period: value as AlertRule["period"] })} />
      </div>
      {rule.kind === "pace" && <div className="flex flex-wrap gap-4"><AnalyticsSelect label="Goal direction" value={rule.direction} options={[{ id: "minimum", name: "At least target" }, { id: "maximum", name: "At most target" }, { id: "range", name: "Close to target" }]} onEventChange={value => props.onEventRuleChange(rule.id, { direction: value as AlertRule["direction"] })} /><label className="text-sm">Tolerance (%)<input aria-label="Pace tolerance percent" className={`${fieldClass} ml-2 w-24`} type="number" min={0} step="any" value={rule.tolerance * 100} onChange={event => props.onEventRuleChange(rule.id, { tolerance: Number(event.target.value) / 100 })} /></label></div>}
      {rule.kind === "freshness" && <label className="text-sm">Alert after days without new observations<input aria-label="Freshness days" className={`${fieldClass} ml-2 w-24`} type="number" min={0.01} step="any" value={rule.stale_after_days ?? ""} onChange={event => props.onEventRuleChange(rule.id, { stale_after_days: event.target.value ? Number(event.target.value) : null })} /></label>}
      <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={rule.enabled} onChange={event => props.onEventRuleChange(rule.id, { enabled: event.target.checked })} /> Email alerts</label><label><input type="checkbox" checked={rule.include_in_report} onChange={event => props.onEventRuleChange(rule.id, { include_in_report: event.target.checked })} /> Include in report</label><button type="button" onClick={() => props.onEventRuleRemove(rule.id)} className="text-rose-700">Remove rule</button></div>
    </fieldset>)}
    <button type="button" disabled={!choices.length} onClick={props.onEventRuleAdd} className="rounded-lg border border-violet-200 px-4 py-2 text-sm text-violet-800 disabled:opacity-50">Add alert</button></>}
    {props.section === "report" && <><h3 className="text-sm font-semibold">Daily assessment</h3><p className="text-sm text-gray-600">The 21.00 London run emails the Monday-to-today assessment with the complete HTML report attached. Activity after the cutoff appears in the next assessment.</p>{props.config.rules.map(rule => <label key={rule.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={rule.include_in_report} onChange={event => props.onEventRuleChange(rule.id, { include_in_report: event.target.checked })} />{choices.find(choice => choice.id === rule.source_key)?.name ?? rule.source_key}</label>)}</>}
    {props.section === "routine" && <><h3 className="text-sm font-semibold">Routine weights</h3>
    <p className="text-sm text-gray-500">Scheduled habits start with equal weight. Zero excludes a habit from the overall score.</p>
    <div className="grid gap-3 sm:grid-cols-2">{Object.entries(props.snapshot?.routine?.habits ?? {}).map(([id, habit]) => <label key={id} className="flex items-center justify-between gap-3 text-sm">{habit.name}<input aria-label={`${habit.name} weight`} className={`${fieldClass} w-24`} type="number" min={0} step="any" value={props.config.habit_weights[id] ?? 1} onChange={event => props.onEventWeightChange(id, Number(event.target.value))} /></label>)}</div></>}
  </div>;
}
