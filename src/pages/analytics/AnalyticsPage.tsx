import * as React from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createResourceInDb, readResourceInDb, useStoredValue } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import CustomForm from "../../components/forms/CustomForm";
import { IoIosAdd } from "react-icons/io";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

type AnalyticsView = "checkins" | "categories" | "items";
type GroupBy = "week" | "month" | "year";
type ChartMode = "burndown" | "burnup" | "timeSeries" | "pareto";
type ResolutionTargets = Record<GroupBy, number>;

type WarehouseRow = {
  date: string;
  [key: string]: string | number | null | undefined;
};

type AnalyticsCategory = {
  id: string;
  name: string;
  unit: string;
  targets?: Partial<ResolutionTargets>;
  target?: number;
  color: string;
};

type AnalyticsItem = {
  id: string;
  name: string;
  unit: string;
  sourceKey: string;
  categoryIds: string[];
  targets?: Partial<ResolutionTargets>;
  target?: number;
};

type ManualObservation = {
  id: string;
  dateISO: string;
  itemId: string;
  value: number;
  category: string;
};

type DiscoveredStream = {
  sourceKey: string;
  sourceName: string;
  fieldName: string;
  label: string;
};

type ChartPoint = {
  date: string;
  label: string;
  value: number;
  target: number;
  remaining: number;
  plannedRemaining?: number;
  actualRemaining?: number | null;
};

// ====================== //
//                        //
//   CONSTANTS            //
//                        //
// ====================== //

const DEFAULT_CATEGORY_ID = "individual";
const WAREHOUSE_RESOURCES: Record<GroupBy | "daily", string> = {
  daily: "data_warehouse_daily",
  week: "data_warehouse_weekly",
  month: "data_warehouse_monthly",
  year: "data_warehouse_yearly",
};

const defaultCategories: AnalyticsCategory[] = [
  {
    id: DEFAULT_CATEGORY_ID,
    name: "Individual",
    unit: "",
    targets: { week: 0, month: 0, year: 0 },
    color: "#4b5563",
  },
];

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#db2777",
  "#0f766e",
];

// ====================== //
//                        //
//   UTILS                //
//                        //
// ====================== //

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO: string, days: number): string {
  const date = new Date(dateISO);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function fieldNameForSourceKey(sourceKey: string): string {
  const parts = sourceKey.split("___");
  return parts.length > 1 ? parts.slice(1).join("___") : sourceKey;
}

function sourceNameForSourceKey(sourceKey: string): string {
  const parts = sourceKey.split("___");
  return parts.length > 1 ? parts[0] : "warehouse";
}

function toLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function toItemId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function targetsFromLegacyValue(value: number | undefined): ResolutionTargets {
  return {
    week: value ?? 0,
    month: value ?? 0,
    year: value ?? 0,
  };
}

function targetForResolution(
  targetable: { targets?: Partial<ResolutionTargets>; target?: number },
  groupBy: GroupBy,
): number {
  return targetable.targets?.[groupBy] ?? targetable.target ?? 0;
}

function setTargetForResolution(
  targetable: { targets?: Partial<ResolutionTargets>; target?: number },
  groupBy: GroupBy,
  value: number,
): ResolutionTargets {
  return {
    ...targetsFromLegacyValue(targetable.target),
    ...(targetable.targets ?? {}),
    [groupBy]: value,
  };
}

function isNumericValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isManualItem(item: AnalyticsItem): boolean {
  return item.sourceKey.startsWith("sofia_planner___");
}

function startOfPeriod(dateISO: string, groupBy: GroupBy): string {
  const d = new Date(dateISO);
  if (groupBy === "week") {
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (day - 1));
  }
  if (groupBy === "month") d.setDate(1);
  if (groupBy === "year") d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
}

function periodLabel(dateISO: string, groupBy: GroupBy): string {
  const d = new Date(dateISO);
  if (groupBy === "week") return `w/o ${dateISO.slice(5)}`;
  if (groupBy === "month") {
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { year: "numeric" });
}

function daysInWindow(groupBy: GroupBy): number {
  if (groupBy === "week") return 7;
  if (groupBy === "month") return 30;
  return 365;
}

function latestDataDate(rows: WarehouseRow[]): string | undefined {
  return rows
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) => key !== "date" && isNumericValue(value),
      ),
    )
    .map((row) => row.date)
    .sort()
    .pop();
}

function currentWindowStart(groupBy: GroupBy, anchorDate?: string): string {
  return startOfPeriod(anchorDate ?? todayISO(), groupBy);
}

function discoverStreams(rows: WarehouseRow[]): DiscoveredStream[] {
  const sourceKeys = new Set<string>();
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key !== "date" && isNumericValue(value)) sourceKeys.add(key);
    });
  });
  return Array.from(sourceKeys)
    .sort((a, b) => fieldNameForSourceKey(a).localeCompare(fieldNameForSourceKey(b)))
    .map((sourceKey) => ({
      sourceKey,
      sourceName: sourceNameForSourceKey(sourceKey),
      fieldName: fieldNameForSourceKey(sourceKey),
      label: toLabel(fieldNameForSourceKey(sourceKey)),
    }));
}

function mergeManualObservations(
  rows: WarehouseRow[],
  observations: ManualObservation[],
): WarehouseRow[] {
  const rowsByDate = new Map<string, WarehouseRow>();
  rows.forEach((row) => rowsByDate.set(row.date, { ...row }));

  observations.forEach((observation) => {
    const row = rowsByDate.get(observation.dateISO) ?? { date: observation.dateISO };
    const sourceKey = observation.itemId.includes("___")
      ? observation.itemId
      : `sofia_planner___${observation.itemId}`;
    const currentValue = row[sourceKey];
    row[sourceKey] = isNumericValue(currentValue)
      ? currentValue + observation.value
      : observation.value;
    rowsByDate.set(observation.dateISO, row);
  });

  return Array.from(rowsByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function itemValueForRow(row: WarehouseRow, item: AnalyticsItem): number {
  const value = row[item.sourceKey];
  return isNumericValue(value) ? value : 0;
}

function aggregateDailyRows(
  rows: WarehouseRow[],
  items: AnalyticsItem[],
  groupBy: GroupBy,
  target: number,
): ChartPoint[] {
  const buckets = new Map<string, number>();
  rows.forEach((row) => {
    const bucket = startOfPeriod(row.date, groupBy);
    const rowTotal = items.reduce(
      (sum, item) => sum + itemValueForRow(row, item),
      0,
    );
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + rowTotal);
  });

  let cumulative = 0;
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => {
      cumulative += value;
      return {
        date,
        label: periodLabel(date, groupBy),
        value,
        target,
        remaining: target - cumulative,
      };
    });
}

function buildBurndownPoints(
  rows: WarehouseRow[],
  items: AnalyticsItem[],
  groupBy: GroupBy,
  target: number,
): ChartPoint[] {
  const startDate = currentWindowStart(groupBy, latestDataDate(rows));
  const windowDays = daysInWindow(groupBy);
  const dailyValues = new Map<string, number>();

  rows.forEach((row) => {
    if (row.date < startDate || row.date > addDays(startDate, windowDays - 1)) {
      return;
    }
    const value = items.reduce(
      (sum, item) => sum + itemValueForRow(row, item),
      0,
    );
    dailyValues.set(row.date, (dailyValues.get(row.date) ?? 0) + value);
  });

  let cumulative = 0;
  return Array.from({ length: windowDays }, (_, dayIndex) => {
    const date = addDays(startDate, dayIndex);
    const value = dailyValues.get(date) ?? 0;
    cumulative += value;
    return {
      date,
      label: date.slice(5),
      value,
      target,
      remaining: target - cumulative,
      plannedRemaining:
        windowDays === 1 ? target : target * (1 - dayIndex / (windowDays - 1)),
      actualRemaining: date <= todayISO() ? target - cumulative : null,
    };
  });
}

function categoryBreakdown(
  rows: WarehouseRow[],
  items: AnalyticsItem[],
  groupBy: GroupBy,
): { name: string; value: number }[] {
  return items
    .map((item) => {
      const groupedValues = new Map<string, number>();
      rows.forEach((row) => {
        const bucket = startOfPeriod(row.date, groupBy);
        groupedValues.set(
          bucket,
          (groupedValues.get(bucket) ?? 0) + itemValueForRow(row, item),
        );
      });
      const values = Array.from(groupedValues.values());
      const average = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
      return { name: item.name, value: average };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function itemTimeBreakdown(
  rows: WarehouseRow[],
  item: AnalyticsItem,
  groupBy: GroupBy,
): { name: string; value: number }[] {
  const buckets = new Map<string, number>();
  rows.forEach((row) => {
    const d = new Date(row.date);
    const name =
      groupBy === "week"
        ? d.toLocaleDateString("en-GB", { weekday: "short" })
        : groupBy === "month"
          ? `Day ${d.getDate()}`
          : d.toLocaleDateString("en-GB", { month: "short" });
    buckets.set(name, (buckets.get(name) ?? 0) + itemValueForRow(row, item));
  });
  return Array.from(buckets.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((bucket) => bucket.value > 0);
}

function currentWindowRows(rows: WarehouseRow[], groupBy: GroupBy): WarehouseRow[] {
  const anchorDate = latestDataDate(rows) ?? todayISO();
  const start = currentWindowStart(groupBy, anchorDate);
  const end = addDays(start, daysInWindow(groupBy) - 1);
  return rows.filter((row) => row.date >= start && row.date <= end);
}

function formatValue(value: number, unit: string): string {
  const formatted = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatCorrection(actual: number, target: number, unit: string): string {
  if (target <= 0) return "Target not set";
  const correction = target - actual;
  if (correction === 0) return "0 to target";
  const sign = correction > 0 ? "+" : "-";
  return `${sign}${formatValue(Math.abs(correction), unit)} to target`;
}

// ====================== //
//                        //
//   UI COMPONENTS        //
//                        //
// ====================== //

function Card(props: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`border border-gray-200 rounded-xl bg-white p-4 shadow-sm ${props.className ?? ""}`}
      style={props.style}
    >
      {props.children}
    </div>
  );
}

function Sidebar(props: {
  current: AnalyticsView;
  hasWarehouseData: boolean;
  onEventSelectView: (view: AnalyticsView) => void;
}) {
  const views: { id: AnalyticsView; label: string }[] = [
    { id: "checkins", label: "Check-ins" },
    { id: "categories", label: "Categories" },
    { id: "items", label: "Items" },
  ];

  return (
    <div className="flex w-full gap-2 overflow-x-auto md:w-52 md:flex-col md:overflow-visible scrollbar-hide">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => props.onEventSelectView(view.id)}
          className={
            props.current === view.id
              ? "flex items-center justify-between gap-3 whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 text-left text-sm font-semibold text-white"
              : "flex items-center justify-between gap-3 whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200"
          }
        >
          <span>{view.label}</span>
          <span
            className={
              props.hasWarehouseData
                ? "h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"
                : "h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
            }
          />
        </button>
      ))}
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onEventChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label
      className={`flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 ${props.className ?? ""}`}
    >
      <span>{props.label}</span>
      <Select
        size="small"
        className="min-w-[170px] bg-white normal-case"
        value={props.value}
        onChange={(event: SelectChangeEvent<string>) =>
          props.onEventChange(event.target.value)
        }
      >
        {props.options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </label>
  );
}

function GroupByControl(props: {
  value: GroupBy;
  onEventChange: (value: GroupBy) => void;
}) {
  const options: { id: GroupBy; label: string }[] = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-gray-200 bg-gray-50 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => props.onEventChange(option.id)}
          className={
            props.value === option.id
              ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm"
              : "rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TargetControl(props: {
  groupBy: GroupBy;
  unit: string;
  value: number;
  onEventChange: (value: number) => void;
}) {
  return (
    <label className="flex items-end gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      <span className="flex flex-col gap-1">
        <span>Target</span>
        <input
          type="number"
          min="0"
          step="any"
          className="w-28 border-b border-gray-300 bg-transparent px-2 py-1 text-right text-sm font-normal normal-case text-gray-900 outline-none focus:border-gray-700"
          value={props.value}
          onChange={(event) => props.onEventChange(Number(event.target.value) || 0)}
        />
      </span>
      <span className="pb-1 text-xs font-normal normal-case text-gray-500">
        {props.unit || props.groupBy}
      </span>
    </label>
  );
}

function ChartModeControl(props: {
  value: ChartMode;
  onEventChange: (value: ChartMode) => void;
}) {
  const options: { id: ChartMode; label: string }[] = [
    { id: "burndown", label: "Burndown" },
    { id: "burnup", label: "Burnup" },
    { id: "timeSeries", label: "Time series" },
    { id: "pareto", label: "Pareto" },
  ];
  return (
    <div className="flex max-w-full flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => props.onEventChange(option.id)}
          className={
            props.value === option.id
              ? "rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white"
              : "rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type MetricTone = {
  text: string;
  border: string;
  background: string;
};

function metricTone(actual: number, target: number): MetricTone {
  if (target <= 0) {
    return {
      text: "#2563eb",
      border: "#dbeafe",
      background: "#eff6ff",
    };
  }

  const distance = Math.abs(actual - target) / target;
  if (distance <= 0.1) {
    return {
      text: "#15803d",
      border: "#bbf7d0",
      background: "#f0fdf4",
    };
  }
  if (distance <= 0.25) {
    return {
      text: "#b45309",
      border: "#fde68a",
      background: "#fffbeb",
    };
  }
  return {
    text: "#b91c1c",
    border: "#fecaca",
    background: "#fef2f2",
  };
}

function StatTile(props: {
  label: string;
  value: string;
  tone: MetricTone;
  correction: string;
  correctionTone: MetricTone;
}) {
  return (
    <Card
      className="flex h-[132px] flex-col justify-center p-3"
      style={{
        borderColor: props.tone.border,
        backgroundColor: props.tone.background,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {props.label}
      </p>
      <p
        className="mt-1 text-4xl font-bold leading-none"
        style={{ color: props.tone.text }}
      >
        {props.value}
      </p>
      <p
        className="mt-2 text-xs font-semibold"
        style={{ color: props.correctionTone.text }}
      >
        {props.correction}
      </p>
    </Card>
  );
}

function DonutChart(props: { data: { name: string; value: number }[] }) {
  const data = props.data.length ? props.data : [{ name: "No data", value: 1 }];
  return (
    <Card className="h-[132px] p-2">
      <ResponsiveContainer width="100%" height={116}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={34}
            outerRadius={52}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  props.data.length
                    ? PIE_COLORS[index % PIE_COLORS.length]
                    : "#e5e7eb"
                }
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MetricChart(props: {
  mode: ChartMode;
  points: ChartPoint[];
  burndownPoints: ChartPoint[];
  pareto: { name: string; value: number }[];
  target: number;
  unit: string;
  color: string;
}) {
  const chartData =
    props.mode === "pareto"
      ? props.pareto
      : props.mode === "burndown"
        ? props.burndownPoints
      : props.points.map((point) => ({
          ...point,
          burnup: point.target - point.remaining,
        }));

  return (
    <Card className="py-6">
      <ResponsiveContainer width="100%" height={320}>
        {props.mode === "pareto" ? (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              type="number"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Bar dataKey="value" fill={props.color} radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : props.mode === "timeSeries" ? (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) =>
                formatValue(value ?? 0, props.unit)
              }
            />
            <ReferenceLine
              y={props.target}
              stroke="#bfdbfe"
              strokeDasharray="4 3"
              strokeWidth={2}
            />
            <Bar dataKey="value" fill={props.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) =>
                formatValue(value ?? 0, props.unit)
              }
            />
            {props.mode === "burndown" ? (
              <>
                <Area
                  type="monotone"
                  dataKey="plannedRemaining"
                  stroke="#bfdbfe"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  fill="#bfdbfe"
                  fillOpacity={0.16}
                />
                <Area
                  type="monotone"
                  dataKey="actualRemaining"
                  stroke={props.color}
                  strokeWidth={2.5}
                  fill={props.color}
                  fillOpacity={0.14}
                  connectNulls={false}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#bfdbfe"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  fill="#bfdbfe"
                  fillOpacity={0.16}
                />
                <Area
                  type="monotone"
                  dataKey="burnup"
                  stroke={props.color}
                  strokeWidth={2.5}
                  fill={props.color}
                  fillOpacity={0.14}
                />
              </>
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}

function CheckInsView(props: {
  categories: AnalyticsCategory[];
  items: AnalyticsItem[];
  observations: ManualObservation[];
  onEventAddCategory: (category: AnalyticsCategory) => void;
  onEventAddItem: (name: string) => void;
  onEventSaveCheckIns: (dateISO: string, values: Record<string, number>) => void;
}) {
  const [dateISO, setDateISO] = React.useState(todayISO());
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newItemName, setNewItemName] = React.useState("");
  const [values, setValues] = React.useState<Record<string, number>>({});
  const selectedItems = props.items.filter(isManualItem);

  React.useEffect(() => {
    const nextValues: Record<string, number> = {};
    selectedItems.forEach((item) => {
      nextValues[item.id] = props.observations
        .filter(
          (observation) =>
            observation.dateISO === dateISO && observation.itemId === item.id,
        )
        .reduce((sum, observation) => sum + observation.value, 0);
    });
    setValues(nextValues);
  }, [dateISO, props.observations, props.items]);

  const handleEventAddCategory = () => {
    const id = toItemId(newCategoryName);
    if (!id) return;
    props.onEventAddCategory({
      id,
      name: newCategoryName,
      unit: "",
      targets: { week: 0, month: 0, year: 0 },
      color: PIE_COLORS[props.categories.length % PIE_COLORS.length],
    });
    setNewCategoryName("");
  };

  const handleEventAddItem = () => {
    props.onEventAddItem(newItemName);
    setNewItemName("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="New Category"
            onClick={handleEventAddCategory}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-gray-900 text-gray-900"
          >
            <IoIosAdd size={20} />
          </button>
          <input
            className="border-b text-center outline-none"
            placeholder="New category"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border-b text-center outline-none"
            placeholder="New item"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleEventAddItem();
            }}
          />
          <button
            type="button"
            title="New Item"
            onClick={handleEventAddItem}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-gray-900 text-gray-900"
          >
            <IoIosAdd size={20} />
          </button>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <div className="relative flex min-h-[430px] w-full max-w-[520px] items-center justify-center">
          <div className="absolute left-1/2 top-1/2 z-0 h-[390px] w-[305px] -translate-x-[53%] -translate-y-[46%] rotate-[15deg] rounded-[15px] bg-[rgb(144,80,204)] shadow-[18px_22px_24px_rgba(80,80,80,0.28)]" />
          <CustomForm
            className="z-10 w-[300px] max-w-[calc(100vw-4rem)] px-2"
            fieldsClassName="w-full px-4"
            header={
              <label className="mb-2 mt-5 block w-[170px] max-w-[calc(100%-3rem)]">
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                  value={dateISO}
                  onChange={(event) => setDateISO(event.target.value)}
                />
              </label>
            }
    sections={selectedItems.map((item) => ({
      name: item.name,
      value: values[item.id] ?? 0,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setValues((prev) => ({
          ...prev,
          [item.id]: Number(event.target.value),
        })),
            }))}
            body={
              selectedItems.length === 0 ? (
                <p className="px-6 pb-4 text-center text-sm text-gray-500">
                  No manual items configured.
                </p>
              ) : null
            }
            longer={true}
            onSubmit={() => props.onEventSaveCheckIns(dateISO, values)}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardView(props: {
  kind: "category" | "item";
  categories: AnalyticsCategory[];
  items: AnalyticsItem[];
  rows: WarehouseRow[];
  selectedId: string;
  groupBy: GroupBy;
  chartMode: ChartMode;
  onEventSelect: (id: string) => void;
  onEventChangeGroupBy: (groupBy: GroupBy) => void;
  onEventChangeChartMode: (chartMode: ChartMode) => void;
  onEventChangeItem: (item: AnalyticsItem) => void;
  onEventChangeCategory: (category: AnalyticsCategory) => void;
}) {
  const selectedCategory =
    props.categories.find((category) => category.id === props.selectedId) ??
    props.categories[0];
  const selectedItem =
    props.items.find((item) => item.id === props.selectedId) ?? props.items[0];
  const dashboardItems =
    props.kind === "category"
      ? props.items.filter((item) =>
          selectedCategory.id === DEFAULT_CATEGORY_ID
            ? item.categoryIds.length === 0 ||
              item.categoryIds.includes(DEFAULT_CATEGORY_ID)
            : item.categoryIds.includes(selectedCategory.id),
        )
      : selectedItem
        ? [selectedItem]
        : [];
  const unit =
    props.kind === "category"
      ? (selectedCategory?.unit ?? "")
      : (selectedItem?.unit ?? "");
  const color =
    props.kind === "category" ? (selectedCategory?.color ?? "#2563eb") : "#2563eb";
  const windowRows = currentWindowRows(props.rows, props.groupBy);
  const target =
    props.kind === "category"
      ? targetForResolution(selectedCategory ?? {}, props.groupBy)
      : targetForResolution(selectedItem ?? {}, props.groupBy);
  const chartPoints = aggregateDailyRows(
    props.rows,
    dashboardItems,
    props.groupBy,
    target,
  );
  const burndownPoints = buildBurndownPoints(
    props.rows,
    dashboardItems,
    props.groupBy,
    target,
  );
  const periodTotal = windowRows.reduce(
    (sum, row) =>
      sum +
      dashboardItems.reduce(
        (itemSum, item) => itemSum + itemValueForRow(row, item),
        0,
      ),
    0,
  );
  const dailyRate = periodTotal / daysInWindow(props.groupBy);
  const resolutionRate = periodTotal;
  const dailyTone = metricTone(
    dailyRate,
    target / daysInWindow(props.groupBy),
  );
  const resolutionTone = metricTone(resolutionRate, target);
  const dailyTarget = target / daysInWindow(props.groupBy);
  const dailyCorrection = formatCorrection(dailyRate, dailyTarget, unit);
  const resolutionCorrection = formatCorrection(resolutionRate, target, unit);
  const pieData =
    props.kind === "category"
      ? categoryBreakdown(windowRows, dashboardItems, props.groupBy)
      : selectedItem
        ? itemTimeBreakdown(windowRows, selectedItem, props.groupBy)
        : [];
  const paretoData =
    props.kind === "category"
      ? pieData.sort((a, b) => b.value - a.value)
      : chartPoints
          .filter((point) => point.value > 0)
          .map((point) => ({ name: point.label, value: point.value }))
          .sort((a, b) => b.value - a.value);

  const handleEventChangeTarget = (value: number) => {
    if (props.kind === "category" && selectedCategory) {
      props.onEventChangeCategory({
        ...selectedCategory,
        targets: setTargetForResolution(selectedCategory, props.groupBy, value),
        target: undefined,
      });
    }
    if (props.kind === "item" && selectedItem) {
      props.onEventChangeItem({
        ...selectedItem,
        targets: setTargetForResolution(selectedItem, props.groupBy, value),
        target: undefined,
      });
    }
  };

  const handleEventChangeItemCategory = (categoryId: string) => {
    if (!selectedItem) return;
    props.onEventChangeItem({
      ...selectedItem,
      categoryIds: [categoryId],
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SelectField
          label={props.kind === "category" ? "Category" : "Item"}
          value={props.selectedId}
          options={(props.kind === "category" ? props.categories : props.items).map(
            (option) => ({
              value: option.id,
              label: option.name,
            }),
          )}
          onEventChange={props.onEventSelect}
        />
        {props.kind === "item" && selectedItem && (
          <SelectField
            label="Category"
            value={selectedItem.categoryIds[0] ?? DEFAULT_CATEGORY_ID}
            options={props.categories
              .filter(
                (category) =>
                  category.id === DEFAULT_CATEGORY_ID ||
                  !selectedItem.unit ||
                  !category.unit ||
                  category.unit === selectedItem.unit,
              )
              .map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            onEventChange={handleEventChangeItemCategory}
          />
        )}
        <GroupByControl
          value={props.groupBy}
          onEventChange={props.onEventChangeGroupBy}
        />
        <TargetControl
          groupBy={props.groupBy}
          unit={unit}
          value={target}
          onEventChange={handleEventChangeTarget}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px]">
        <StatTile
          label="Daily average"
          value={formatValue(dailyRate, unit)}
          tone={dailyTone}
          correction={dailyCorrection}
          correctionTone={dailyTone}
        />
        <StatTile
          label={`${props.groupBy} total`}
          value={formatValue(resolutionRate, unit)}
          tone={resolutionTone}
          correction={resolutionCorrection}
          correctionTone={resolutionTone}
        />
        <DonutChart data={pieData} />
      </div>

      <ChartModeControl
        value={props.chartMode}
        onEventChange={props.onEventChangeChartMode}
      />
      <MetricChart
        mode={props.chartMode}
        points={chartPoints}
        burndownPoints={burndownPoints}
        pareto={paretoData}
        target={target}
        unit={unit}
        color={color}
      />
    </div>
  );
}

// ====================== //
//                        //
//   MAIN PAGE            //
//                        //
// ====================== //

export default function AnalyticsPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const [categories, setCategories, isCategoriesLoading] = useStoredValue<
    AnalyticsCategory[]
  >(email, defaultCategories, "analytics_categories");
  const [items, setItems, isItemsLoading] = useStoredValue<AnalyticsItem[]>(
    email,
    [],
    "analytics_items",
  );
  const [observations, setObservations, isObservationsLoading] = useStoredValue<
    ManualObservation[]
  >(email, [], "analytics_manual_observations");
  const [currentView, setCurrentView] = React.useState<AnalyticsView>("checkins");
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState(DEFAULT_CATEGORY_ID);
  const [selectedItemId, setSelectedItemId] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("week");
  const [chartMode, setChartMode] = React.useState<ChartMode>("burndown");
  const [dailyRows, setDailyRows] = React.useState<WarehouseRow[]>([]);
  const [aggregateRows, setAggregateRows] = React.useState<WarehouseRow[]>([]);
  const [isWarehouseLoading, setIsWarehouseLoading] = React.useState(true);
  const hasAutoSelectedItem = React.useRef(false);

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("analytics categories", categories);
  console.log("analytics items", items);
  console.log("analytics groupBy", groupBy);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    setIsWarehouseLoading(true);
    Promise.all([
      readResourceInDb<string>(email, WAREHOUSE_RESOURCES.daily),
      readResourceInDb<string>(email, WAREHOUSE_RESOURCES[groupBy]),
    ]).then(([dailyResponse, aggregateResponse]) => {
      if (dailyResponse.result) {
        setDailyRows(JSON.parse(dailyResponse.result) as WarehouseRow[]);
      } else if (dailyResponse.error?.response?.status !== 404) {
        console.log("Error loading daily warehouse rows", dailyResponse.error);
        toastFactory("Failed to load daily warehouse rows", MessageSeverity.ERROR);
      }

      if (aggregateResponse.result) {
        setAggregateRows(JSON.parse(aggregateResponse.result) as WarehouseRow[]);
      } else if (aggregateResponse.error?.response?.status !== 404) {
        console.log(
          "Error loading aggregate warehouse rows",
          aggregateResponse.error,
        );
        toastFactory(
          "Failed to load aggregate warehouse rows",
          MessageSeverity.ERROR,
        );
      }
      setIsWarehouseLoading(false);
    });
  }, [email, groupBy]);

  React.useEffect(() => {
    if (hasAutoSelectedItem.current || items.length === 0) return;
    const sourceRows = dailyRows.length ? dailyRows : aggregateRows;
    if (isWarehouseLoading && sourceRows.length === 0) return;
    const anchorDate = latestDataDate(sourceRows);
    const windowStart = currentWindowStart(groupBy, anchorDate);
    const windowRows = sourceRows.filter((row) => row.date >= windowStart);
    const itemWithWindowData = items.find((item) =>
      windowRows.some((row) => {
        const value = row[item.sourceKey];
        return isNumericValue(value) && value !== 0;
      }),
    );
    const itemWithData = items.find((item) =>
      sourceRows.some((row) => {
        const value = row[item.sourceKey];
        return isNumericValue(value) && value !== 0;
      }),
    );
    if (itemWithWindowData ?? itemWithData) {
      setSelectedItemId((itemWithWindowData ?? itemWithData)!.id);
      hasAutoSelectedItem.current = true;
      return;
    }

    if (discoverStreams(sourceRows).length === 0) {
      setSelectedItemId(items[0].id);
      hasAutoSelectedItem.current = true;
    }
  }, [aggregateRows, dailyRows, isWarehouseLoading, items]);

  React.useEffect(() => {
    const sourceRows = dailyRows.length ? dailyRows : aggregateRows;
    const streams = discoverStreams(sourceRows);
    if (!streams.length) return;

    setItems((prev) => {
      const existingSourceKeys = new Set(prev.map((item) => item.sourceKey));
      const newItems = streams
        .filter((stream) => !existingSourceKeys.has(stream.sourceKey))
        .map((stream) => ({
          id: toItemId(stream.sourceKey),
          name: stream.label,
          unit: "",
          sourceKey: stream.sourceKey,
          categoryIds: [DEFAULT_CATEGORY_ID],
          targets: { week: 0, month: 0, year: 0 },
        }));

      if (!newItems.length) return prev;
      return [...prev, ...newItems];
    });
  }, [dailyRows, aggregateRows, setItems]);

  React.useEffect(() => {
    if (isCategoriesLoading) return;
    setCategories((previous) => {
      let changed = false;
      const migrated = previous.map((category) => {
        if (category.targets) return category;
        changed = true;
        return {
          ...category,
          targets: targetsFromLegacyValue(category.target),
          target: undefined,
        };
      });
      return changed ? migrated : previous;
    });
  }, [isCategoriesLoading, setCategories]);

  React.useEffect(() => {
    if (isItemsLoading) return;
    setItems((previous) => {
      let changed = false;
      const migrated = previous.map((item) => {
        if (item.targets) return item;
        changed = true;
        return {
          ...item,
          targets: targetsFromLegacyValue(item.target),
          target: undefined,
        };
      });
      return changed ? migrated : previous;
    });
  }, [isItemsLoading, setItems]);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  const handleEventSelectView = (view: AnalyticsView) => setCurrentView(view);
  const handleEventAddCategory = (category: AnalyticsCategory) =>
    setCategories((prev) => [
      ...prev.filter((item) => item.id !== category.id),
      category,
    ]);
  const handleEventAddManualItem = (name: string) => {
    const itemId = toItemId(name);
    if (!itemId) return;
    const sourceKey = `sofia_planner___${itemId}`;
    if (items.some((item) => item.sourceKey === sourceKey)) {
      toastFactory("An item with that name already exists", MessageSeverity.WARNING);
      return;
    }
    setItems((previous) => [
      ...previous,
      {
        id: itemId,
        name: name.trim(),
        unit: "",
        sourceKey,
        categoryIds: [DEFAULT_CATEGORY_ID],
        targets: { week: 0, month: 0, year: 0 },
      },
    ]);
  };
  const handleEventChangeItem = (item: AnalyticsItem) =>
    setItems((prev) =>
      prev.map((existing) => (existing.id === item.id ? item : existing)),
    );
  const handleEventChangeCategory = (category: AnalyticsCategory) =>
    setCategories((prev) =>
      prev.map((existing) => (existing.id === category.id ? category : existing)),
    );

  const handleEventSaveCheckIns = (
    dateISO: string,
    values: Record<string, number>,
  ) => {
    const selectedItems = items.filter(isManualItem);
    const touchedIds = new Set(selectedItems.map((item) => item.id));
    const nextObservations = observations.filter(
      (observation) =>
        !(observation.dateISO === dateISO && touchedIds.has(observation.itemId)),
    );
    selectedItems.forEach((item) => {
      const value = values[item.id];
      if (!Number.isFinite(value)) return;
      nextObservations.push({
        id: crypto.randomUUID(),
        dateISO,
        itemId: item.id,
        value,
        category: item.categoryIds[0] ?? DEFAULT_CATEGORY_ID,
      });
    });
    setObservations(nextObservations);
    createResourceInDb<string>(
      email,
      "analytics_manual_observations",
      JSON.stringify(nextObservations),
    );
    toastFactory("Check-ins saved", MessageSeverity.SUCCESS);
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const rowsWithManualObservations = mergeManualObservations(
    dailyRows,
    observations,
  );
  const visibleRows = rowsWithManualObservations.length
    ? rowsWithManualObservations
    : aggregateRows;
  const hasWarehouseData = dailyRows.length > 0 || aggregateRows.length > 0;
  const safeCategories = categories.some(
    (category) => category.id === DEFAULT_CATEGORY_ID,
  )
    ? categories
    : [defaultCategories[0], ...categories];

  if (
    isCategoriesLoading ||
    isItemsLoading ||
    isObservationsLoading ||
    isWarehouseLoading
  ) {
    return <LoadingAnimation />;
  }

  // ====================== //
  //                        //
  //   RENDER               //
  //                        //
  // ====================== //

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row">
      {/* Sidebar */}
      <Sidebar
        current={currentView}
        hasWarehouseData={hasWarehouseData}
        onEventSelectView={handleEventSelectView}
      />

      {/* Main view */}
      {currentView === "checkins" && (
        <CheckInsView
          categories={safeCategories}
          items={items}
          observations={observations}
          onEventAddCategory={handleEventAddCategory}
          onEventAddItem={handleEventAddManualItem}
          onEventSaveCheckIns={handleEventSaveCheckIns}
        />
      )}
      {currentView === "categories" && (
        <DashboardView
          kind="category"
          categories={safeCategories}
          items={items}
          rows={visibleRows}
          selectedId={selectedCategoryId}
          groupBy={groupBy}
          chartMode={chartMode}
          onEventSelect={setSelectedCategoryId}
          onEventChangeGroupBy={setGroupBy}
          onEventChangeChartMode={setChartMode}
          onEventChangeItem={handleEventChangeItem}
          onEventChangeCategory={handleEventChangeCategory}
        />
      )}
      {currentView === "items" && (
        <DashboardView
          kind="item"
          categories={safeCategories}
          items={items}
          rows={visibleRows}
          selectedId={selectedItemId}
          groupBy={groupBy}
          chartMode={chartMode}
          onEventSelect={setSelectedItemId}
          onEventChangeGroupBy={setGroupBy}
          onEventChangeChartMode={setChartMode}
          onEventChangeItem={handleEventChangeItem}
          onEventChangeCategory={handleEventChangeCategory}
        />
      )}
    </div>
  );
}
