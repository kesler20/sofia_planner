import * as React from "react";
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
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStoredValue } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import CustomForm from "../../components/forms/CustomForm";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

type CategoryId = "food" | "money";
type GroupBy = "week" | "month" | "year";
type Status = "green" | "amber" | "red";

type SubBucket = { id: string; name: string; target: number };

type CategoryTarget = {
  categoryId: CategoryId;
  unit: string;
  startDateISO: string;
  timelineDays: number;
  subBuckets: SubBucket[];
};

type EntrySource = "manual" | "google_fit" | "strong" | "monzo";

type CategoryEntry = {
  id: string;
  categoryId: CategoryId;
  dateISO: string;
  value: number;
  subBucketId?: string;
  source: EntrySource;
};

type BurndownPoint = {
  dayIndex: number;
  dateISO: string;
  label: string;
  plannedRemaining: number;
  actualRemaining: number | null;
};

// ====================== //
//                        //
//   CONSTANTS            //
//                        //
// ====================== //

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CATEGORY_ORDER: CategoryId[] = ["food", "money"];

type CategoryConfig = { label: string; unit: string; color: string; faded: string };

const CATEGORY_CONFIG: Record<CategoryId, CategoryConfig> = {
  food: { label: "Food / Diet", unit: "kcal", color: "#22c55e", faded: "#bbf7d0" },
  money: { label: "Money", unit: "£", color: "#3b82f6", faded: "#bfdbfe" },
};

const STATUS_COLOR: Record<Status, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ec4899", "#14b8a6"];

const defaultTargets: CategoryTarget[] = [
  {
    categoryId: "food",
    unit: "kcal",
    startDateISO: todayISO(),
    timelineDays: 30,
    subBuckets: [
      { id: "protein", name: "Protein", target: 150 },
      { id: "calories", name: "Calories", target: 2000 },
    ],
  },
  {
    categoryId: "money",
    unit: "£",
    startDateISO: todayISO(),
    timelineDays: 30,
    subBuckets: [
      { id: "travel", name: "Travel", target: 100 },
      { id: "groceries", name: "Groceries", target: 400 },
    ],
  },
];

// ====================== //
//                        //
//   UTILS                //
//                        //
// ====================== //

function categoryTargetValue(target: CategoryTarget): number {
  return target.subBuckets.reduce((sum, bucket) => sum + bucket.target, 0);
}

function computeBurndownSeries(
  target: CategoryTarget,
  entries: CategoryEntry[]
): BurndownPoint[] {
  const targetValue = categoryTargetValue(target);
  const today = todayISO();
  const sorted = [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const points: BurndownPoint[] = [];
  let cumulative = 0;
  let entryCursor = 0;

  for (let dayIndex = 0; dayIndex <= target.timelineDays; dayIndex++) {
    const dateISO = addDays(target.startDateISO, dayIndex);
    while (entryCursor < sorted.length && sorted[entryCursor].dateISO <= dateISO) {
      cumulative += sorted[entryCursor].value;
      entryCursor++;
    }
    const plannedRemaining = Math.max(
      0,
      targetValue * (1 - dayIndex / target.timelineDays)
    );
    const actualRemaining = dateISO <= today ? targetValue - cumulative : null;
    points.push({
      dayIndex,
      dateISO,
      label: dateISO.slice(5),
      plannedRemaining,
      actualRemaining,
    });
  }
  return points;
}

function computeStatus(points: BurndownPoint[], targetValue: number): Status {
  const asOf = [...points].reverse().find((p) => p.actualRemaining !== null);
  if (!asOf || asOf.actualRemaining === null) return "green";
  const deviation = Math.abs(asOf.actualRemaining - asOf.plannedRemaining);
  const deviationPct = deviation / (targetValue || 1);
  if (deviationPct <= 0.05) return "green";
  if (deviationPct <= 0.15) return "amber";
  return "red";
}

function startOfPeriod(dateISO: string, groupBy: GroupBy): string {
  const d = new Date(dateISO);
  if (groupBy === "week") {
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (day - 1));
  } else if (groupBy === "month") {
    d.setDate(1);
  } else {
    d.setMonth(0, 1);
  }
  return d.toISOString().slice(0, 10);
}

function periodLabel(dateISO: string, groupBy: GroupBy): string {
  const d = new Date(dateISO);
  if (groupBy === "week") return `w/o ${dateISO.slice(5)}`;
  if (groupBy === "month")
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-GB", { year: "numeric" });
}

function aggregateEntriesByGroup(
  entries: CategoryEntry[],
  groupBy: GroupBy
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();
  entries.forEach((entry) => {
    const bucketKey = startOfPeriod(entry.dateISO, groupBy);
    buckets.set(bucketKey, (buckets.get(bucketKey) ?? 0) + entry.value);
  });
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketKey, value]) => ({ label: periodLabel(bucketKey, groupBy), value }));
}

function currentPeriodEntries(
  entries: CategoryEntry[],
  groupBy: GroupBy
): CategoryEntry[] {
  const periodStart = startOfPeriod(todayISO(), groupBy);
  return entries.filter((e) => e.dateISO >= periodStart && e.dateISO <= todayISO());
}

function daysElapsedInPeriod(groupBy: GroupBy): number {
  const periodStart = new Date(startOfPeriod(todayISO(), groupBy));
  const today = new Date(todayISO());
  return Math.max(
    1,
    Math.round((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

function computeSubBucketBreakdown(
  entries: CategoryEntry[],
  subBuckets: SubBucket[]
): { name: string; value: number }[] {
  const byId = new Map<string, number>();
  let unassigned = 0;
  entries.forEach((entry) => {
    if (entry.subBucketId) {
      byId.set(entry.subBucketId, (byId.get(entry.subBucketId) ?? 0) + entry.value);
    } else {
      unassigned += entry.value;
    }
  });
  const breakdown = subBuckets
    .map((bucket) => ({ name: bucket.name, value: byId.get(bucket.id) ?? 0 }))
    .filter((b) => b.value > 0);
  if (unassigned > 0) breakdown.push({ name: "Other", value: unassigned });
  return breakdown;
}

// ====================== //
//                        //
//   UI COMPONENTS        //
//                        //
// ====================== //

function Card(props: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={`border border-gray-200 rounded-2xl shadow-md p-4 w-full ${
        props.className ?? ""
      }`}
    >
      {props.children}
    </div>
  );
}

function CategorySidebar(props: {
  current: CategoryId | "checkins";
  statuses: Record<CategoryId, Status>;
  onEventSelect: (view: CategoryId) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex md:flex-col gap-2 md:w-48 w-full overflow-x-auto">
      {CATEGORY_ORDER.map((id) => {
        const isActive = props.current === id;
        const status = props.statuses[id];
        return (
          <button
            key={id}
            onClick={() => props.onEventSelect(id)}
            className={
              isActive
                ? "flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold whitespace-nowrap"
                : "flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 whitespace-nowrap"
            }
          >
            <span>{CATEGORY_CONFIG[id].label}</span>
            <span
              className="ml-3 h-2.5 w-2.5 rounded-full inline-block"
              style={{ backgroundColor: STATUS_COLOR[status] }}
            />
          </button>
        );
      })}
      {props.trailing}
    </div>
  );
}

function GroupByControl(props: { value: GroupBy; onEventChange: (v: GroupBy) => void }) {
  const options: { id: GroupBy; label: string }[] = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => props.onEventChange(opt.id)}
          className={
            props.value === opt.id
              ? "px-3 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-sm text-gray-900"
              : "px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-gray-700"
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StatTile(props: { label: string; value: string; color?: string }) {
  return (
    <Card className="flex flex-col justify-center px-4 py-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        {props.label}
      </p>
      <p className="text-lg font-bold" style={{ color: props.color ?? "#374151" }}>
        {props.value}
      </p>
    </Card>
  );
}

function SubBucketDonut(props: { data: { name: string; value: number }[] }) {
  return (
    <Card className="p-2">
      <ResponsiveContainer width="100%" height={110}>
        <PieChart>
          <Pie
            data={props.data.length ? props.data : [{ name: "No data", value: 1 }]}
            dataKey="value"
            nameKey="name"
            innerRadius={28}
            outerRadius={45}
            paddingAngle={2}
          >
            {(props.data.length ? props.data : [{ name: "No data", value: 1 }]).map(
              (entry, index) => (
                <Cell
                  key={entry.name}
                  fill={props.data.length ? PIE_COLORS[index % PIE_COLORS.length] : "#e5e7eb"}
                />
              )
            )}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name?: string) => [
              (value ?? 0).toFixed(1),
              name ?? "",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function BurndownAreaChart(props: {
  points: BurndownPoint[];
  unit: string;
  color: string;
  faded: string;
}) {
  const gradientId = `burndownActual-${props.color.replace("#", "")}`;
  const targetGradientId = `burndownTarget-${props.color.replace("#", "")}`;
  return (
    <Card className="p-4 py-6">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={props.points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={props.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={props.color} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id={targetGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={props.faded} stopOpacity={0.25} />
              <stop offset="95%" stopColor={props.faded} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v) => `${v}${props.unit}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            formatter={(v: number | undefined) =>
              v == null ? ["-", ""] : [`${v.toFixed(0)}${props.unit}`, ""]
            }
          />
          <Area
            type="monotone"
            dataKey="plannedRemaining"
            stroke={props.faded}
            strokeWidth={2}
            strokeDasharray="4 3"
            fill={`url(#${targetGradientId})`}
          />
          <Area
            type="monotone"
            dataKey="actualRemaining"
            stroke={props.color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function EntriesBarChart(props: { data: { label: string; value: number }[]; color: string }) {
  return (
    <Card className="p-4 py-6">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={props.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          />
          <Bar dataKey="value" fill={props.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

type CheckInRow = {
  key: string;
  categoryId: CategoryId;
  label: string;
};

function buildCheckInRows(targets: CategoryTarget[]): CheckInRow[] {
  return targets.flatMap((target) =>
    target.subBuckets.map((bucket) => ({
      key: bucket.id,
      categoryId: target.categoryId,
      label: `${bucket.name} (${target.unit})`,
    }))
  );
}

function manualValueForDate(
  entries: CategoryEntry[],
  subBucketId: string,
  dateISO: string
): number {
  return entries
    .filter(
      (e) => e.subBucketId === subBucketId && e.dateISO === dateISO && e.source === "manual"
    )
    .reduce((sum, e) => sum + e.value, 0);
}

function CheckInsPanel(props: {
  targets: CategoryTarget[];
  entries: CategoryEntry[];
  onEventSaveCheckIns: (payload: {
    dateISO: string;
    entries: { subBucketId: string; categoryId: CategoryId; value: number }[];
    targetsBySubBucket: Record<string, number>;
    timelinesByCategory: Record<CategoryId, number>;
  }) => void;
}) {
  const rows = buildCheckInRows(props.targets);

  const [selectedDateISO, setSelectedDateISO] = React.useState(todayISO());
  const [values, setValues] = React.useState<Record<string, number>>({});
  const [subBucketTargets, setSubBucketTargets] = React.useState<Record<string, number>>({});
  const [timelines, setTimelines] = React.useState<Record<CategoryId, number>>(
    {} as Record<CategoryId, number>
  );

  React.useEffect(() => {
    const nextValues: Record<string, number> = {};
    rows.forEach((row) => {
      nextValues[row.key] = manualValueForDate(props.entries, row.key, selectedDateISO);
    });
    setValues(nextValues);
  }, [selectedDateISO, props.entries]);

  React.useEffect(() => {
    const nextTargets: Record<string, number> = {};
    const nextTimelines: Record<CategoryId, number> = {} as Record<CategoryId, number>;
    props.targets.forEach((target) => {
      nextTimelines[target.categoryId] = target.timelineDays;
      target.subBuckets.forEach((bucket) => {
        nextTargets[bucket.id] = bucket.target;
      });
    });
    setSubBucketTargets(nextTargets);
    setTimelines(nextTimelines);
  }, [props.targets]);

  const handleEventSubmit = () => {
    props.onEventSaveCheckIns({
      dateISO: selectedDateISO,
      entries: rows.map((row) => ({
        subBucketId: row.key,
        categoryId: row.categoryId,
        value: values[row.key] ?? 0,
      })),
      targetsBySubBucket: subBucketTargets,
      timelinesByCategory: timelines,
    });
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h1 className="text-xl font-bold text-gray-800">Check-Ins</h1>
      <Card className="overflow-visible px-3 py-5">
        <div className="flex justify-center py-4">
          <div className="relative flex min-h-[430px] w-full max-w-[520px] items-center justify-center">
            <div className="absolute left-1/2 top-1/2 z-0 h-[390px] w-[345px] -translate-x-[41%] -translate-y-[46%] rotate-[15deg] rounded-[15px] bg-[rgb(144,80,204)] shadow-[18px_22px_24px_rgba(80,80,80,0.28)]" />
            <CustomForm
              className="z-10 w-[390px] max-w-[calc(100vw-4rem)] px-2"
              fieldsClassName="w-full px-4"
              header={
                <label className="mb-2 mt-5 block w-[170px] max-w-[calc(100%-3rem)]">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                    value={selectedDateISO}
                    onChange={(e) => setSelectedDateISO(e.target.value)}
                  />
                </label>
              }
              sections={[
                ...rows.map((row) => ({
                  name: row.label,
                  value: values[row.key] ?? 0,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setValues({ ...values, [row.key]: Number(e.target.value) }),
                  secondary: {
                    label: "Target",
                    value: subBucketTargets[row.key] ?? 0,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setSubBucketTargets({
                        ...subBucketTargets,
                        [row.key]: Number(e.target.value),
                      }),
                  },
                })),
                ...props.targets.map((target) => ({
                  name: `${CATEGORY_CONFIG[target.categoryId].label} timeline (days)`,
                  value: timelines[target.categoryId] ?? target.timelineDays,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setTimelines({
                      ...timelines,
                      [target.categoryId]: Number(e.target.value),
                    }),
                })),
              ]}
              longer={true}
              onSubmit={handleEventSubmit}
            />
          </div>
        </div>
      </Card>
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
  const [targets, setTargets, isTargetsLoading] = useStoredValue<CategoryTarget[]>(
    email,
    defaultTargets,
    "analytics_targets"
  );
  const [entries, setEntries, isEntriesLoading] = useStoredValue<CategoryEntry[]>(
    email,
    [],
    "analytics_entries"
  );
  const [currentView, setCurrentView] = React.useState<CategoryId | "checkins">("food");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("week");
  const [chartMode, setChartMode] = React.useState<"burndown" | "bar">("burndown");

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  if (isTargetsLoading || isEntriesLoading) {
    return <LoadingAnimation />;
  }

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getTarget = (categoryId: CategoryId): CategoryTarget => {
    const found = targets.find((t) => t.categoryId === categoryId);
    return found ?? defaultTargets.find((t) => t.categoryId === categoryId)!;
  };

  const getEntries = (categoryId: CategoryId): CategoryEntry[] =>
    entries.filter((e) => e.categoryId === categoryId);

  const statuses: Record<CategoryId, Status> = {
    food: computeStatus(
      computeBurndownSeries(getTarget("food"), getEntries("food")),
      categoryTargetValue(getTarget("food"))
    ),
    money: computeStatus(
      computeBurndownSeries(getTarget("money"), getEntries("money")),
      categoryTargetValue(getTarget("money"))
    ),
  };

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  const handleEventSelectView = (view: CategoryId) => setCurrentView(view);
  const handleEventChangeGroupBy = (value: GroupBy) => setGroupBy(value);
  const handleEventChangeChartMode = (mode: "burndown" | "bar") => setChartMode(mode);

  const handleEventSaveCheckIns = (payload: {
    dateISO: string;
    entries: { subBucketId: string; categoryId: CategoryId; value: number }[];
    targetsBySubBucket: Record<string, number>;
    timelinesByCategory: Record<CategoryId, number>;
  }) => {
    setTargets((prev) =>
      prev.map((target) => ({
        ...target,
        timelineDays: payload.timelinesByCategory[target.categoryId] ?? target.timelineDays,
        subBuckets: target.subBuckets.map((bucket) => ({
          ...bucket,
          target: payload.targetsBySubBucket[bucket.id] ?? bucket.target,
        })),
      }))
    );
    setEntries((prev) => {
      const touchedSubBucketIds = new Set(payload.entries.map((e) => e.subBucketId));
      const withoutTouchedManualEntries = prev.filter(
        (entry) =>
          !(
            entry.dateISO === payload.dateISO &&
            entry.source === "manual" &&
            entry.subBucketId &&
            touchedSubBucketIds.has(entry.subBucketId)
          )
      );
      const newEntries: CategoryEntry[] = payload.entries.map((e) => ({
        id: crypto.randomUUID(),
        categoryId: e.categoryId,
        dateISO: payload.dateISO,
        value: e.value,
        subBucketId: e.subBucketId,
        source: "manual",
      }));
      return [...withoutTouchedManualEntries, ...newEntries];
    });
    toastFactory("Check-ins saved", MessageSeverity.SUCCESS);
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  const renderCategoryDashboard = (categoryId: CategoryId) => {
    const config = CATEGORY_CONFIG[categoryId];
    const target = getTarget(categoryId);
    const categoryEntries = getEntries(categoryId);
    const points = computeBurndownSeries(target, categoryEntries);
    const periodEntries = currentPeriodEntries(categoryEntries, groupBy);
    const periodTotal = periodEntries.reduce((sum, e) => sum + e.value, 0);
    const dailyRate = periodTotal / daysElapsedInPeriod(groupBy);
    const breakdown = computeSubBucketBreakdown(periodEntries, target.subBuckets);
    const barData = aggregateEntriesByGroup(categoryEntries, groupBy);

    return (
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800">{config.label}</h1>
          <GroupByControl value={groupBy} onEventChange={handleEventChangeGroupBy} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatTile
            label={`This ${groupBy} total`}
            value={`${periodTotal.toFixed(0)}${config.unit}`}
            color={config.color}
          />
          <StatTile
            label="Daily rate"
            value={`${dailyRate.toFixed(1)}${config.unit}/day`}
            color={config.color}
          />
          <SubBucketDonut data={breakdown} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEventChangeChartMode("burndown")}
            className={
              chartMode === "burndown"
                ? "px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-white"
                : "px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600"
            }
          >
            Burndown
          </button>
          <button
            onClick={() => handleEventChangeChartMode("bar")}
            className={
              chartMode === "bar"
                ? "px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-white"
                : "px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600"
            }
          >
            Time series
          </button>
        </div>

        {chartMode === "burndown" ? (
          <BurndownAreaChart
            points={points}
            unit={config.unit}
            color={config.color}
            faded={config.faded}
          />
        ) : (
          <EntriesBarChart data={barData} color={config.color} />
        )}
      </div>
    );
  };

  // ====================== //
  //                        //
  //   RENDER               //
  //                        //
  // ====================== //

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
      <CategorySidebar
        current={currentView}
        statuses={statuses}
        onEventSelect={handleEventSelectView}
        trailing={
          <button
            onClick={() => setCurrentView("checkins")}
            className={
              currentView === "checkins"
                ? "flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold whitespace-nowrap"
                : "flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 whitespace-nowrap"
            }
          >
            <span>Check-Ins</span>
          </button>
        }
      />
      {currentView === "checkins" ? (
        <CheckInsPanel
          targets={CATEGORY_ORDER.map((id) => getTarget(id))}
          entries={entries}
          onEventSaveCheckIns={handleEventSaveCheckIns}
        />
      ) : (
        renderCategoryDashboard(currentView)
      )}
    </div>
  );
}
