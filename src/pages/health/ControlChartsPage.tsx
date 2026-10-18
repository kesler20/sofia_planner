import * as React from "react";
import { AnalyticsCard, AnalyticsSelect } from "../../components/analytics/AnalyticsControls";
import { HealthChart, HealthLayout, WeekControls } from "./components/HealthComponents";
import { buildControlView, londonToday } from "./healthCalculations";
import { observeHealthData, retainSuccessfulData, saveHealthSelection } from "./healthData";
import type { HealthData, Selection } from "./healthTypes";

// ============================================================ //
//                                                              //
//   CONTROL CHARTS PAGE                                        //
//                                                              //
//   Compares health period values with configured limits.       //
//   Owns selections and refresh for the stateless control chart. //
//                                                              //
// ============================================================ //
export default function ControlChartsPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const user = localStorage.getItem("global/email") || "guest";
  const [data, setData] = React.useState<HealthData | null>(null);
  const [selection, setSelection] = React.useState<Selection>({ period: "week", date: londonToday(), offset: 0, entityId: "weight" });
  const [draft, setDraft] = React.useState<{ key: string; lower: string; upper: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("health control selection", selection);
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
  const handleEventMetric = (entityId: string) => setSelection(previous => ({ ...previous, entityId }));
  const handleEventDate = (date: string) => setSelection(previous => ({ ...previous, date }));
  const handleEventOffset = (value: string) => setSelection(previous => ({ ...previous, offset: Math.max(0, Math.min(500, Math.floor(Number(value) || 0))) }));
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const analytics = data?.analytics;
  const metric = analytics?.metrics.find(item => item.id === selection.entityId);
  const points = analytics ? buildControlView(analytics, selection) : [];
  const limits = data?.config?.limits[selection.entityId]?.[selection.period];
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  const key = `${selection.entityId}/${selection.period}`;
  const lower = draft?.key === key ? draft.lower : limits?.lower.toString() ?? "";
  const upper = draft?.key === key ? draft.upper : limits?.upper.toString() ?? "";
  const previewLimits = draft?.key === key && lower === "" && upper === "" ? undefined
    : draft?.key === key && lower !== "" && upper !== "" && Number.isFinite(Number(lower)) && Number.isFinite(Number(upper)) && Number(lower) < Number(upper)
      ? { lower: Number(lower), upper: Number(upper) } : limits;
  const latest = analytics?.periods.filter(row => row.period === selection.period && row.controls[selection.entityId] !== undefined).map(row => row.start).sort().at(-1);
  const handleEventSaveLimits = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      if ((lower === "") !== (upper === "")) throw new Error("Enter both limits or clear both.");
      if (lower !== "" && (!Number.isFinite(Number(lower)) || !Number.isFinite(Number(upper)) || Number(lower) >= Number(upper))) throw new Error("Lower limit must be less than upper limit.");
      const next = await saveHealthSelection(user, "limits", selection.entityId, selection.period, lower === "" ? undefined : { lower: Number(lower), upper: Number(upper) });
      setData(previous => previous && { ...previous, config: next }); setDraft(null); setMessage("Limits saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save limits."); }
    finally { setSaving(false); }
  };
  return <HealthLayout title="Control charts" data={data}>
    {/* Selection controls */}
    <div className="flex flex-wrap items-end gap-4"><AnalyticsSelect label="Metric" value={analytics ? selection.entityId : ""} options={analytics?.metrics ?? []} onEventChange={handleEventMetric} /><WeekControls selection={selection} history onEventDate={handleEventDate} onEventOffset={handleEventOffset} /></div>
    <form onSubmit={handleEventSaveLimits} className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-5">{(["lower", "upper"] as const).map(bound => <label key={bound} className="space-y-1 text-xs text-gray-500">{bound === "lower" ? "Lower limit" : "Upper limit"} ({metric?.unit ?? ""})<input aria-label={bound === "lower" ? "Lower limit" : "Upper limit"} type="number" step="any" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800" value={bound === "lower" ? lower : upper} disabled={saving} onChange={event => { setDraft({ key, lower, upper, [bound]: event.target.value }); setMessage(""); }}/></label>)}<button disabled={!data?.config || saving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save limits"}</button><p className="text-xs text-gray-500">Clear both to unset.</p></form>
    {message && <p role="status" className="text-sm text-gray-500">{message}</p>}
    {!points.some(point => point.value !== null) && latest && <button className="text-sm text-blue-700" onClick={() => setSelection(previous => ({ ...previous, date: latest, offset: 0 }))}>Show latest available period · {latest}</button>}
    {/* Control region */}
    {analytics && <AnalyticsCard><h2 className="mb-2 text-sm font-semibold">{metric?.name} control chart</h2><p className="mb-4 text-xs text-gray-500">{metric?.aggregation === "sum" ? "Total" : "Average observed daily value"} per {selection.period}. Recorded through {analytics.observed_through[selection.entityId] ?? "an unavailable date"}.</p>{!previewLimits && <p className="mb-3 text-sm text-gray-500">Set lower and upper limits for this metric and period above.</p>}<HealthChart points={points} kind="control" unit={metric?.unit ?? ""} limits={previewLimits} id="health-control-fill" /></AnalyticsCard>}
  </HealthLayout>;
}
