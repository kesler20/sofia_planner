import LoadingAnimation from "../../../components/LoadingAnimation";
import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { AnalyticsCard } from "../../../components/analytics/AnalyticsControls";
import type { Analytics, ChartPoint, HealthData, Selection } from "../healthTypes";

// ============================================================ //
//                                                              //
//   HEALTH COMPONENTS                                          //
//                                                              //
//   Stateless charts and controls for the Health pages.         //
//   Pages supply observations and handle emitted user events.   //
//                                                              //
// ============================================================ //

export const format = (value: number | null | undefined, unit = "") => value === null || value === undefined ? "Unavailable" : `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value)}${unit ? ` ${unit}` : ""}`;
export const percentage = (value: number | null | undefined) => value === null || value === undefined ? "Unavailable" : `${value > 0 ? "+" : ""}${format(value)}%`;

export function HealthLayout(props: { title: string; data: HealthData | null; children: React.ReactNode }) {
  if (!props.data) return <LoadingAnimation />;
  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-gray-800">
    {/* Page heading */}
    <h1 className="text-2xl font-semibold">{props.title}</h1>
    <nav aria-label="Health pages" className="flex flex-wrap gap-2 text-sm">
      {[["Gym Personal Records", "records"], ["Burnup", "burnup"], ["Control charts", "control"]].map(([label, route]) => <Link key={route} to={`/health/${route}`} className={props.title === label ? "rounded-lg bg-violet-100 px-3 py-2 font-semibold text-violet-800" : "rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"}>{label}</Link>)}
    </nav>
    {/* Source status */}
    {!!props.data?.errors.length && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{props.data.errors.join(". ")}. Previously loaded data remains visible.</p>}
    {props.data && !props.data.analytics && <p className="text-sm text-gray-500">Health observations are unavailable. Refresh the health exports and run the health analytics pipeline.</p>}
    {!!props.data?.analytics?.unmapped_exercises.length && <p className="text-xs text-amber-800">Muscle mapping needed for {props.data.analytics.unmapped_exercises.join(", ")}. These exercises do not contribute to muscle-group totals.</p>}
    {props.children}
  </main>;
}

export function WeekControls(props: { selection: Selection; history?: boolean; onEventDate: (date: string) => void; onEventOffset: (offset: string) => void }) {
  return <>
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Week containing<input aria-label="Week containing" type="date" value={props.selection.date} onChange={event => { if (event.target.value) props.onEventDate(event.target.value); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal normal-case text-gray-800" /></label>
    {props.history && <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Earlier weeks<input aria-label="Earlier weeks" type="number" min={0} max={500} value={props.selection.offset} onChange={event => props.onEventOffset(event.target.value)} className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal normal-case text-gray-800" /></label>}
  </>;
}

export function HealthStat(props: { label: string; value: string; detail?: string; blue?: boolean }) {
  return <AnalyticsCard><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{props.label}</p><p className={`mt-2 text-2xl font-semibold ${props.blue ? "text-blue-700" : "text-violet-700"}`}>{props.value}</p>{props.detail && <p className="mt-2 text-xs text-gray-500">{props.detail}</p>}</AnalyticsCard>;
}

export function BodyCards(props: { analytics: Analytics }) {
  return <div className="grid gap-4 sm:grid-cols-2">{[["muscle_mass", "Current muscle mass", "kg"], ["body_fat", "Current body fat", "%"]].map(([key, label, unit], index) => {
    const measurement = props.analytics.latest_body[key];
    return <HealthStat key={key} label={label} value={format(measurement?.value, unit)} blue={index === 1} detail={measurement ? `Measured ${new Date(measurement.measured_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}` : "No retained measurement"} />;
  })}</div>;
}

export function HealthChart(props: { points: ChartPoint[]; kind: "records" | "burnup" | "control"; unit: string; target?: number | null; limits?: { lower: number; upper: number }; id: string }) {
  const hasValues = props.points.some(point => point.value !== null);
  return <>
    {!hasValues && <p className="mb-3 text-sm text-gray-500">No observations for this selection.</p>}
    <div className="h-[355px] w-full min-w-0" aria-label={`${props.kind} chart`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 355 }}>
        <ComposedChart data={props.points} margin={{ top: 12, right: 16, left: 4, bottom: 12 }}>
          <defs><linearGradient id={props.id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="100%" stopColor="#7c3aed" stopOpacity={0.03}/></linearGradient></defs>
          <CartesianGrid stroke="#d1d5db" strokeOpacity={0.55} vertical={false} />
          <XAxis dataKey="label" minTickGap={32} tick={{ fontSize: 11 }} />
          <YAxis domain={props.kind === "control" ? ["auto", "auto"] : [0, "auto"]} tickFormatter={value => format(Number(value))} width={65} tick={{ fontSize: 11 }} />
          {props.kind === "control" && props.limits && <>
            <ReferenceArea y1={props.limits.lower} y2={props.limits.upper} fill="#8b5cf6" fillOpacity={0.09} ifOverflow="extendDomain" />
            <ReferenceLine y={props.limits.lower} stroke="#8b5cf6" strokeDasharray="5 5" ifOverflow="extendDomain" />
            <ReferenceLine y={props.limits.upper} stroke="#8b5cf6" strokeDasharray="5 5" ifOverflow="extendDomain" />
          </>}
          {props.kind === "burnup" && props.target !== null && props.target !== undefined && <ReferenceLine y={props.target} stroke="#2563eb" strokeDasharray="5 5" ifOverflow="extendDomain" />}
          {props.kind === "control" ? <Line dataKey="value" stroke="#7c3aed" strokeWidth={2} connectNulls dot={{ r: 5, fill: "transparent", stroke: "#7c3aed", strokeWidth: 2.5 }} activeDot={{ r: 6, fill: "transparent", stroke: "#7c3aed", strokeWidth: 3 }} /> : <Area dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill={`url(#${props.id})`} type="linear" connectNulls={props.kind === "burnup"} dot={{ r: 4, fill: "#7c3aed" }} />}
          {props.kind === "records" && <Line type="stepAfter" dataKey="previousPr" stroke="#2563eb" strokeDasharray="5 5" strokeWidth={2} dot={false} connectNulls={false} />}
          {props.kind === "burnup" && <Line dataKey="pace" stroke="#2563eb" strokeWidth={2} dot={false} />}
          <Tooltip content={({ active, payload }) => {
            const row = payload?.[0]?.payload as ChartPoint | undefined;
            return active && row ? <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm">
              <p className="mb-2 font-semibold">{row.date}{row.end !== row.date ? ` to ${row.end}` : ""}</p>
              <p>{props.kind === "records" ? "Best load" : props.kind === "burnup" ? "Accumulated" : "Period value"} {format(row.value, props.unit)}</p>
              {props.kind === "records" && <><p>Previous PR {format(row.previousPr, props.unit)}</p><p>Change from previous PR {percentage(row.percentage)}</p>{row.bodyWeight !== undefined && <><p>Matched body weight {format(row.bodyWeight, "kg")}</p><p>Weigh-in {row.weightMeasuredAt}</p><p>Lift {row.liftedAt}</p></>}</>}
              {props.kind === "control" && <><p>Upper control limit {format(props.limits?.upper, props.unit)}</p><p>Lower control limit {format(props.limits?.lower, props.unit)}</p></>}
              {props.kind === "burnup" && <><p>Target total {format(props.target, props.unit)}</p><p>Target pace {format(row.pace, props.unit)}</p></>}
            </div> : null;
          }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-3 flex flex-wrap gap-5 text-xs text-gray-500"><span><span className="mr-2 inline-block h-0.5 w-5 bg-violet-600" />{props.kind === "records" ? "Best load · kg" : props.kind === "burnup" ? `Accumulated · ${props.unit}` : `Period value · ${props.unit}`}</span>{props.kind === "records" && <span className="text-blue-700">Dashed · Previous PR</span>}{props.kind === "burnup" && <><span className="text-blue-700">Blue · Target pace</span><span>Dashed · Target total {format(props.target, props.unit)}</span></>}{props.kind === "control" && <span>Shaded · Configured control region</span>}</div>
  </>;
}
