import * as React from "react";
import { AnalyticsCard, AnalyticsSelect } from "../../components/analytics/AnalyticsControls";
import { HealthChart, HealthLayout, HealthStat, WeekControls, format } from "./components/HealthComponents";
import { buildBurnupView, londonToday } from "./healthCalculations";
import { observeHealthData, retainSuccessfulData, saveHealthSelection } from "./healthData";
import { muscleGroups } from "./healthTypes";
import type { HealthData, Selection } from "./healthTypes";

// ============================================================ //
//                                                              //
//   BURNUP PAGE                                                //
//                                                              //
//   Tracks recorded steps or muscle volume against goals.       //
//   Owns selections and refresh for the stateless burnup chart.  //
//                                                              //
// ============================================================ //
export default function BurnupPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const user = localStorage.getItem("global/email") || "guest";
  const [data, setData] = React.useState<HealthData | null>(null);
  const [selection, setSelection] = React.useState<Selection>({ period: "week", date: londonToday(), offset: 0, entityId: "steps" });
  const [draft, setDraft] = React.useState<{ key: string; value: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("health burnup selection", selection);
  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  React.useEffect(() => observeHealthData(user, next => setData(previous => retainSuccessfulData(previous, next))), [user]);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Selection
  const handleEventMetric = (value: string) => setSelection(previous => ({ ...previous, entityId: value === "volume" ? "volume:chest" : value }));
  const handleEventMuscle = (value: string) => setSelection(previous => ({ ...previous, entityId: `volume:${value}` }));
  const handleEventDate = (date: string) => setSelection(previous => ({ ...previous, date }));
  const handleEventOffset = (value: string) => setSelection(previous => ({ ...previous, offset: Math.max(0, Math.min(500, Math.floor(Number(value) || 0))) }));
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const volume = selection.entityId.startsWith("volume:");
  const unit = volume ? "kg × reps" : selection.entityId === "steps" ? "steps" : selection.entityId === "habits_completed" ? "completions" : "hours";
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  const key = `${selection.entityId}/${selection.period}`;
  const savedTarget = data?.config?.targets[selection.entityId]?.[selection.period];
  const targetInput = draft?.key === key ? draft.value : savedTarget?.toString() ?? "";
  const previewConfig = data?.config && draft?.key === key && (targetInput === "" || (Number.isFinite(Number(targetInput)) && Number(targetInput) >= 0))
    ? { ...data.config, targets: { ...data.config.targets, [selection.entityId]: { ...data.config.targets[selection.entityId], [selection.period]: targetInput === "" ? undefined : Number(targetInput) } } }
    : data?.config ?? null;
  const view = data?.analytics ? buildBurnupView(data.analytics, previewConfig, selection) : null;
  const latest = data?.analytics?.burnup.filter(row => row.entity_id === selection.entityId && row.period === selection.period && row.accumulated !== null).map(row => row.start).sort().at(-1);
  const handleEventSaveTarget = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const next = await saveHealthSelection(user, "targets", selection.entityId, selection.period, targetInput === "" ? undefined : Number(targetInput));
      setData(previous => previous && { ...previous, config: next }); setDraft(null); setMessage("Target saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save target."); }
    finally { setSaving(false); }
  };
  return <HealthLayout title="Burnup" data={data}>
    {/* Selection controls */}
    <div className="flex flex-wrap items-end gap-4"><AnalyticsSelect label="Metric" value={volume ? "volume" : selection.entityId} options={[{ id: "steps", name: "Steps" }, { id: "volume", name: "Training volume" }, { id: "sleep", name: "Sleep" }, { id: "focus", name: "Focus" }, { id: "habits_completed", name: "Habit completions" }]} onEventChange={handleEventMetric} />{volume && <AnalyticsSelect label="Muscle group" value={selection.entityId.replace("volume:", "")} options={muscleGroups.map(id => ({ id, name: id[0].toUpperCase() + id.slice(1) }))} onEventChange={handleEventMuscle} />}<WeekControls selection={selection} onEventDate={handleEventDate} onEventOffset={handleEventOffset} /></div>
    <form onSubmit={handleEventSaveTarget} className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-5"><label className="space-y-1 text-xs text-gray-500">{selection.period} target ({unit})<input aria-label="Target total" type="number" min={0} step="any" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" value={targetInput} disabled={saving} onChange={event => { setDraft({ key, value: event.target.value }); setMessage(""); }}/></label><button disabled={!data?.config || saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save target"}</button><p className="text-xs text-gray-500">Leave empty to unset this period's target.</p></form>
    {message && <p role="status" className="text-sm text-gray-500">{message}</p>}
    {view?.accumulated === null && latest && <button className="text-sm text-blue-700" onClick={() => handleEventDate(latest)}>Show latest available period · {latest}</button>}
    {/* Pace summary */}
    {view && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><HealthStat label="Accumulated" value={format(view.accumulated, unit)} /><HealthStat label="Target" value={format(view.target, unit)} blue /><HealthStat label={`Average observed day${view.observedDays !== undefined ? ` (${view.observedDays} days)` : ""}`} value={format(view.dailyPace, `${unit}/day`)} /><HealthStat label="Required pace" value={format(view.requiredPace, `${unit}/day`)} blue /></div>
    {/* Cumulative chart */}
    <AnalyticsCard><div className="mb-4 flex flex-wrap justify-between gap-3"><h2 className="text-sm font-semibold">{volume ? `${selection.entityId.replace("volume:", "")} training volume` : selection.entityId === "sleep" ? "Sleep" : selection.entityId === "focus" ? "Focus" : selection.entityId === "habits_completed" ? "Habit completions" : "Steps"}</h2><p className="text-xs text-gray-500">Remaining to target {format(view.remaining, unit)}</p></div>{view.target === null && <p className="mb-3 text-sm text-gray-500">Set a target for this metric and period above.</p>}<HealthChart points={view.points} kind="burnup" unit={unit} target={view.target} id="health-burnup-fill" /><p className="mt-3 text-xs text-gray-500">Recorded through {view.observedThrough ?? "an unavailable date"}{volume ? ". Muscle groups receive overlapping full-volume credit." : "."}</p></AnalyticsCard></>}
  </HealthLayout>;
}
