import { useAccount } from "../../auth/accountContext";
import * as React from "react";
import { AnalyticsCard, AnalyticsSelect } from "../../components/analytics/AnalyticsControls";
import { BodyCards, HealthChart, HealthLayout, WeekControls, percentage } from "./components/HealthComponents";
import { buildPersonalRecordsView, londonToday } from "./healthCalculations";
import { observeHealthData, retainSuccessfulData } from "./healthData";
import type { HealthData, Selection } from "./healthTypes";

// ============================================================ //
//                                                              //
//   PERSONAL RECORDS PAGE                                      //
//                                                              //
//   Selects exercise load records from the eligible history.    //
//   Owns refresh and selection events for stateless charts.     //
//                                                              //
// ============================================================ //
export default function PersonalRecordsPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  const user = useAccount();
  const [data, setData] = React.useState<HealthData | null>(null);
  const [selection, setSelection] = React.useState<Selection>({ period: "week", date: londonToday(), offset: 0, entityId: "" });
  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  console.log("health records selection", selection);
  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  React.useEffect(() => observeHealthData(user, next => {
    setData(previous => retainSuccessfulData(previous, next));
    if (next.analytics) setSelection(previous => ({ ...previous, entityId: next.analytics!.exercises.some(item => item.id === previous.entityId) ? previous.entityId : next.analytics!.exercise_daily_bests[0]?.exercise_id ?? next.analytics!.exercises[0]?.id ?? "" }));
  }), [user]);
  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Selection
  const handleEventExercise = (entityId: string) => setSelection(previous => ({ ...previous, entityId }));
  const handleEventDate = (date: string) => setSelection(previous => ({ ...previous, date }));
  const handleEventOffset = (value: string) => setSelection(previous => ({ ...previous, offset: Math.max(0, Math.min(500, Math.floor(Number(value) || 0))) }));
  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  const analytics = data?.analytics;
  const points = analytics ? buildPersonalRecordsView(analytics, selection) : [];
  const current = points.at(-1);
  const latest = analytics?.periods.filter(row => row.period === selection.period && row.records.some(record => record.exercise_id === selection.entityId)).map(row => row.start).sort().at(-1);
  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  return <HealthLayout title="Gym Personal Records" data={data}>
    {/* Selection controls */}
    <div className="flex flex-wrap items-end gap-4"><AnalyticsSelect label="Exercise" value={selection.entityId} options={analytics?.exercises ?? []} onEventChange={handleEventExercise} /><WeekControls selection={selection} history onEventDate={handleEventDate} onEventOffset={handleEventOffset} /></div>
    {!points.some(point => point.value !== null) && latest && <button className="text-sm text-blue-700" onClick={() => setSelection(previous => ({ ...previous, date: latest, offset: 0 }))}>Show latest available period · {latest}</button>}
    {/* Latest body measurements */}
    {analytics && <BodyCards analytics={analytics} />}
    {/* Personal record area */}
    {analytics && analytics.exercise_daily_bests.length === 0 && <p className="text-sm text-gray-500">No retained lifts match the current body-weight cutoff. Import newer Strong workouts to update the eligible history.</p>}
    {analytics && <AnalyticsCard><div className="mb-5 flex flex-wrap justify-between gap-4"><div><h2 className="text-sm font-semibold">{selection.entityId || "Exercise"} personal records</h2><p className="mt-1 text-xs text-gray-500">Heaviest recorded load per {selection.period}. Lifts matched below {analytics.weight_cutoff ?? "an unavailable cutoff"} kg.</p></div><div className="text-right"><p className="text-2xl font-semibold text-violet-700">{percentage(current?.percentage)}</p><p className="text-xs text-gray-500">Selected {selection.period} vs previous PR</p></div></div><HealthChart points={points} kind="records" unit="kg" id="health-record-fill" /></AnalyticsCard>}
  </HealthLayout>;
}
