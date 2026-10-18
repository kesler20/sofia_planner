import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// ============================================================ //
//                                                              //
//   DONUT CHART                                                //
//                                                              //
//   Shared Finance and Diet composition renderer. Parents own  //
//   positive slices, grouping, legends and selection events.    //
//                                                              //
// ============================================================ //
export default function DonutChart(props: {
  rows: {
    id: string;
    name: string;
    value: number;
    colour: string;
    selectable?: boolean;
  }[];
  height: number;
  innerRadius: number;
  outerRadius: number;
  formatValue: (value: number) => string;
  onEventSelect?: (id: string) => void;
}): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={props.height}>
      <PieChart>
        <Pie
          data={props.rows}
          dataKey="value"
          nameKey="name"
          innerRadius={props.innerRadius}
          outerRadius={props.outerRadius}
          isAnimationActive={false}
          onClick={(entry) => {
            if (entry.selectable !== false) props.onEventSelect?.(entry.id);
          }}
        >
          {props.rows.map((row) => (
            <Cell key={row.id} fill={row.colour} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => props.formatValue(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
