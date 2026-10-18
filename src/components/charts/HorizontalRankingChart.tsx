import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ============================================================ //
//                                                              //
//   HORIZONTAL RANKING CHART                                   //
//                                                              //
//   Shared Analytics ranking bars with optional Finance events. //
//   Callers provide ordered rows, formatting and display height. //
//                                                              //
// ============================================================ //
export default function HorizontalRankingChart(props: {
  rows: { id?: string; name: string; value: number; colour?: string }[];
  colour: string;
  height?: number;
  maxBarSize?: number;
  selectedId?: string;
  formatValue?: (value: number) => string;
  onEventSelect?: (id: string) => void;
}): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={props.height ?? 320}>
      <BarChart
        data={props.rows}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          vertical={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={props.formatValue}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={96}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={
            props.formatValue
              ? (value) => props.formatValue!(Number(value))
              : undefined
          }
        />
        <Bar
          maxBarSize={props.maxBarSize}
          dataKey="value"
          fill={props.colour}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
          onClick={(entry) => {
            if (entry.payload.id) props.onEventSelect?.(entry.payload.id);
          }}
        >
          {props.rows.map((entry) => (
            <Cell
              key={entry.id ?? entry.name}
              fill={entry.colour ?? props.colour}
              stroke={
                entry.id && entry.id === props.selectedId ? "#111827" : "none"
              }
              strokeWidth={2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
