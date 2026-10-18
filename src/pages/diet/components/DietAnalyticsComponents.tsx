import DonutChart from "../../../components/charts/DonutChart";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsCard } from "../../../components/analytics/AnalyticsControls";
import type { SeriesPoint } from "../dietAnalyticsTypes";

// ============================================================ //
//                                                              //
//   DIET ANALYTICS COMPONENTS                                  //
//                                                              //
//   Stateless Diet charts and fields used by the Diet page and lab.
//   User events flow to the owning page container.              //
//                                                              //
// ============================================================ //
export const colours = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#f43f5e", "#64748b"];
export const buttonClass = "rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50";
export const labelOf = (key: string) => key[0].toUpperCase() + key.slice(1);
export const format = (key: string, value: number | null) => value === null ? "—" : key === "cost" ? `£${value.toFixed(2)}` : key === "calories" ? `${Math.round(value).toLocaleString()} kcal` : key === "protein" ? `${Math.round(value)} g` : key === "weight" ? `${value.toFixed(2)} kg` : value.toFixed(2);
export function NumberField(props: { label: string; value: number; onEventChange: (value: number) => void; step?: number; min?: number; max?: number }): React.ReactElement {
  return <label className="block space-y-1 text-sm text-gray-600">{props.label}<input aria-label={props.label} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800" type="number" value={Number.isFinite(props.value) ? props.value : ""} step={props.step ?? 1} min={props.min} max={props.max} onChange={event => props.onEventChange(event.target.value === "" ? NaN : Number(event.target.value))}/></label>;
}
export function Stat(props: { label: string; value: string }) {
  return <AnalyticsCard><p className="text-sm text-gray-500">{props.label}</p><p className="my-2 text-2xl font-semibold tabular-nums text-gray-900">{props.value}</p></AnalyticsCard>;
}
export function DietSeries(props: { data: SeriesPoint[]; metric: "calories" | "protein" | "weight" }) {
  return <ResponsiveContainer width="100%" height={320}><AreaChart data={props.data} margin={{ top: 15, right: 12, left: 4, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/><XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24}/><YAxis tick={{ fontSize: 11 }} width={54} domain={props.metric === "weight" ? ["auto", "auto"] : undefined}/><Tooltip formatter={value => format(props.metric, Number(value))}/><Area dataKey="actual" name={props.metric === "weight" ? "Measured weight" : "Logged"} type="linear" stroke="#64748b" fill="#94a3b8" fillOpacity={.18} dot={{ r: props.metric === "weight" ? 4 : 3 }} connectNulls={false} isAnimationActive={false}/><Line dataKey="plan" name={props.metric === "weight" ? "Predicted weight" : "Plan"} type="linear" stroke="#15803d" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false}/></AreaChart></ResponsiveContainer>;
}
export function DietDonut(props: { rows: { id: string; name: string; value: number; colour?: string }[]; metric: string }) {
  const rows = props.rows.filter(row => row.value > 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <div className="min-w-0"><h2 className="text-lg font-semibold">Meal contribution</h2>{rows.length ? <><DonutChart rows={rows.map((row,index) => ({...row, colour: row.colour ?? colours[index % colours.length]}))} height={260} innerRadius={65} outerRadius={95} formatValue={value => format(props.metric,value)}/><div className="space-y-2 text-xs">{rows.map((row, index) => <div key={row.id} className="flex justify-between gap-2"><span className="min-w-0 break-words"><span style={{ color: row.colour ?? colours[index % colours.length] }}>●</span> {row.name}</span><span className="shrink-0 tabular-nums">{format(props.metric, row.value)} · {Math.round(row.value / total * 100)}%</span></div>)}</div></> : <p className="py-12 text-sm text-gray-500">No observed contributions.</p>}</div>;
}
