import DonutChart from "../../../components/charts/DonutChart";
import { AnalyticsCard } from "../../../components/analytics/AnalyticsControls";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "../financeAnalyticsCalculations";
import type {
  MonitoringViewModel,
} from "../financeAnalyticsTypes";

// ============================================================ //
//                                                              //
//   FINANCE ANALYTICS COMPONENTS                                //
//                                                              //
//   Stateless cards and charts for the Finance page containers. //
//   Pages supply display data and handle emitted user events.   //
//                                                              //
// ============================================================ //

export function MetricCard(props: {
  label: string;
  value: string;
  detail?: string;
  tone?: "green" | "amber" | "red";
}): React.ReactElement {
  const tone = props.tone ?? "green";
  return (
    <div
      className={
        tone === "red"
          ? "rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          : tone === "amber"
            ? "rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700"
            : "rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
      }
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {props.label}
      </p>
      <p className="text-3xl font-bold">{props.value}</p>
      {props.detail && <p className="mt-1 text-xs">{props.detail}</p>}
    </div>
  );
}

export function BurndownChart(props: {
  view: MonitoringViewModel;
  yearMode: boolean;
  title: string;
  colour: string;
}): React.ReactElement {
  const view = props.view;
  const budget = view.budget;
  const colour = props.colour;
  const chart = view.points.map((point) => ({ ...point, ceiling: budget }));
  const minimum = Math.min(
    0,
    view.remaining ?? 0,
    ...view.points.map((point) => point.actual ?? 0),
  );
  const endpointIndex = view.points
    .filter((point) => point.actual !== null)
    .at(-1)?.index;
  const ticks = props.yearMode
    ? Array.from({ length: 12 }, (_, index) => index + 1)
    : [
        1,
        ...[5, 10, 15, 20, 25, 30].filter((value) => value < chart.length),
        chart.length,
      ];
  return (
    <AnalyticsCard>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            {props.title} {budget === null ? "spending" : "budget burndown"}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {props.yearMode ? "Monthly" : "Daily"} expense totals
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: colour }}>
            {(budget === null ? view.spent : view.remaining) === null ? "—" : money((budget === null ? view.spent : view.remaining)!)}
          </p>
          <p className="text-xs text-gray-500">{budget === null ? "Spent" : "Left to spend"}</p>
        </div>
      </div>
      {budget === null ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chart} margin={{ top: 12, right: 20, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="#d1d5db" strokeOpacity={0.7} />
            <XAxis dataKey="index" type="number" domain={[1, chart.length]} ticks={ticks} allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis domain={[Math.min(0, ...chart.map(point => point.expense ?? 0)), "auto"]} tickFormatter={money} width={75} tick={{ fontSize: 11 }} />
            <Tooltip formatter={value => [money(Number(value)), "Recorded spending"]} labelFormatter={label => `${props.yearMode ? "Month" : "Day"} ${label}`} />
            <Area type="stepAfter" dataKey="expense" name="Recorded spending" stroke={colour} fill={colour} fillOpacity={0.1} strokeWidth={2.5} connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={chart}
            margin={{ top: 12, right: 20, left: 4, bottom: 4 }}
          >
            <defs><linearGradient id="financeActualShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#64748b" stopOpacity={0.22}/><stop offset="100%" stopColor="#64748b" stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid stroke="#d1d5db" strokeOpacity={0.7} />
            <XAxis
              dataKey="index"
              type="number"
              domain={[1, chart.length]}
              ticks={ticks}
              allowDecimals={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[minimum, Math.max(budget, 1)]}
              tickFormatter={money}
              width={75}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                const point = payload?.[0]?.payload;
                return active && point ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-sm">
                    <p className="mb-2 font-semibold">
                      {props.yearMode ? "Month" : "Day"} {label}
                    </p>
                    <p>
                      Expenses{" "}
                      {point.expense === null
                        ? "Not yet observed"
                        : money(point.expense)}
                    </p>
                    <p>
                      Remaining{" "}
                      {point.actual === null
                        ? "Not yet observed"
                        : money(point.actual)}
                    </p>
                    <p>Planned remaining {money(point.plan)}</p>
                  </div>
                ) : null;
              }}
            />
            <Area dataKey="ceiling" fill="#16a34a" fillOpacity={0.05} stroke="none" tooltipType="none" isAnimationActive={false}/>
            <Area
              type="linear"
              dataKey="plan"
              name="Planned remaining"
              stroke="#15803d"
              strokeWidth={2}
              strokeDasharray="6 5"
              fill="#ef4444"
              fillOpacity={0.05}
              isAnimationActive={false}
            />
            <Area
              type="stepAfter"
              dataKey="actual"
              name="Actual remaining"
              stroke={colour}
              strokeWidth={2.5}
              fill="url(#financeActualShade)"
              connectNulls={false}
              isAnimationActive={false}
              dot={(point) => {
                const row = point.payload;
                return (
                  <circle
                    key={row.index}
                    cx={point.cx}
                    cy={point.cy}
                    r={row.actual !== null && (row.index === 1 || row.index === endpointIndex) ? 5 : 0}
                    fill="white"
                    stroke={colour}
                    strokeWidth={3}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      {budget === null ? <p className="mt-3 text-center text-xs text-gray-500">Recorded spending</p> : <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
        <span>Solid · Actual remaining</span>
        <span>Dashed · Planned remaining</span>
        <span>Green · Within pace</span>
        <span>Rose · Ahead of pace</span>
      </div>}
    </AnalyticsCard>
  );
}

const palette = ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#0891b2", "#ca8a04"];
export function ExpenseBreakdown(props: {
  rows: { name: string; value: number }[];
  slices: { name: string; value: number }[];
}): React.ReactElement {
  const positive = props.slices;
  return (
    <AnalyticsCard>
      <h2 className="text-sm font-semibold">Expense makeup</h2>
      {positive.length ? (
        <DonutChart rows={positive.map((row,index) => ({...row, id: row.name, colour: palette[index % palette.length]}))} height={190} innerRadius={45} outerRadius={72} formatValue={money}/>
      ) : (
        <p className="py-8 text-sm text-gray-500">
          No positive expenses in this period.
        </p>
      )}
      <div className="space-y-2">
        {props.rows.map((row, index) => (
          <div key={row.name} className="flex justify-between gap-4 text-xs">
            <span>
              <span style={{ color: palette[index % palette.length] }}>●</span>{" "}
              {row.name}
              {row.value < 0 ? " (net refund)" : ""}
            </span>
            <span>{money(row.value)}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}
