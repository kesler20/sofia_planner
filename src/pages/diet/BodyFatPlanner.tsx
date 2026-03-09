import * as React from "react";
import { Calendar, Flame, TrendingDown, Utensils } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import { useStoredValue } from "../../utils";

// ====================== //
//                        //
//   COMPONENT TYPES      //
//                        //
// ====================== //

type WeightUnit = "kg" | "lb";

type GoalDraft = {
  unit: WeightUnit;
  currentWeight: number;
  currentBodyFatPct: number;
  targetBodyFatPct: number;
  timelineDays: number;
  maintenanceCalories: number;
};

type ActiveGoal = GoalDraft & {
  goalId: string;
  startDateISO: string; // YYYY-MM-DD
};

type CheckIn = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  calories: number;
  bodyWeight: number;
  bodyFatPct: number;
};

type BurndownPoint = {
  dayIndex: number;
  dateISO: string;
  label: string;
  plannedRemainingDeficitKcal: number;
  actualRemainingDeficitKcal: number | null;
};

type PlannerPanel = "goal" | "checkins";

// =================== //
//                     //
//   UI COMPONENT      //
//                     //
// =================== //

function Card(props: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/70 backdrop-blur shadow-sm">
      <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {props.icon ? (
              <div className="h-9 w-9 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                {props.icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-900 truncate">
                {props.title}
              </div>
              {props.subtitle ? (
                <div className="text-sm text-zinc-600 mt-0.5">{props.subtitle}</div>
              ) : null}
            </div>
          </div>
        </div>
        {props.right ? <div className="shrink-0">{props.right}</div> : null}
      </div>
      <div className="px-5 sm:px-6 pb-6">{props.children}</div>
    </div>
  );
}

function SegmentedControl(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onEventChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-zinc-600">{props.label}</div>
      <div className="inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
        {props.options.map((opt) => {
          const isActive = opt.value === props.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={
                isActive
                  ? "px-3 py-1.5 text-sm rounded-xl bg-white border border-zinc-200 shadow-sm text-zinc-900"
                  : "px-3 py-1.5 text-sm rounded-xl text-zinc-600 hover:text-zinc-900"
              }
              onClick={() => props.onEventChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  onEventChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-600">{props.label}</div>
      <div className="relative">
        <input
          type="number"
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
          value={Number.isFinite(props.value) ? props.value : 0}
          step={props.step ?? 1}
          min={props.min}
          max={props.max}
          onChange={(e) => props.onEventChange(safeNumber(e.target.value))}
        />
        {props.suffix ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {props.suffix}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function TextField(props: {
  label: string;
  value: string;
  type?: "text" | "date";
  onEventChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-600">{props.label}</div>
      <input
        type={props.type ?? "text"}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
        value={props.value}
        onChange={(e) => props.onEventChange(e.target.value)}
      />
    </label>
  );
}

function MetricPill(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-xs font-medium text-zinc-600">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">{props.value}</div>
      {props.hint ? (
        <div className="mt-1 text-xs text-zinc-500">{props.hint}</div>
      ) : null}
    </div>
  );
}

function CheckInRow(props: {
  checkIn: CheckIn;
  unit: WeightUnit;
  onEventChangeDate: (checkInId: string, dateISO: string) => void;
  onEventChangeCalories: (checkInId: string, calories: number) => void;
  onEventChangeBodyWeight: (checkInId: string, bodyWeight: number) => void;
  onEventChangeBodyFatPct: (checkInId: string, bodyFatPct: number) => void;
  onEventDelete: (checkInId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-3">
          <TextField
            label="Date"
            type="date"
            value={props.checkIn.dateISO}
            onEventChange={(v) => props.onEventChangeDate(props.checkIn.id, v)}
          />
        </div>
        <div className="sm:col-span-3">
          <NumberField
            label="Calories"
            value={props.checkIn.calories}
            min={0}
            step={10}
            suffix="kcal"
            onEventChange={(v) => props.onEventChangeCalories(props.checkIn.id, v)}
          />
        </div>
        <div className="sm:col-span-3">
          <NumberField
            label={`Body weight (${props.unit})`}
            value={props.checkIn.bodyWeight}
            min={0}
            step={0.1}
            onEventChange={(v) => props.onEventChangeBodyWeight(props.checkIn.id, v)}
          />
        </div>
        <div className="sm:col-span-2">
          <NumberField
            label="Body fat"
            value={props.checkIn.bodyFatPct}
            min={0}
            max={75}
            step={0.1}
            suffix="%"
            onEventChange={(v) => props.onEventChangeBodyFatPct(props.checkIn.id, v)}
          />
        </div>
        <div className="sm:col-span-1 flex sm:justify-end">
          <button
            type="button"
            className="w-full sm:w-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            onClick={() => props.onEventDelete(props.checkIn.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== //
//                       //
//   MAIN COMPONENT      //
//                       //
// ===================== //

export default function BodyFatPlanner() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const legacyGoalDraft = readFromLocalStorage<GoalDraft>("bf.goalDraft");
  const legacyActiveGoal = readFromLocalStorage<ActiveGoal>("bf.activeGoal");
  const legacyCheckIns = readFromLocalStorage<CheckIn[]>("bf.checkIns");

  const [goalDraft, setGoalDraft] = useStoredValue<GoalDraft>(
    email,
    legacyGoalDraft ?? {
      unit: "kg",
      currentWeight: 85,
      currentBodyFatPct: 25,
      targetBodyFatPct: 15,
      timelineDays: 90,
      maintenanceCalories: 2600,
    },
    "bf.goalDraft"
  );

  const [activeGoal, setActiveGoal] = useStoredValue<ActiveGoal | null>(
    email,
    legacyActiveGoal ?? null,
    "bf.activeGoal"
  );

  const [checkIns, setCheckIns] = useStoredValue<CheckIn[]>(
    email,
    legacyCheckIns ?? [],
    "bf.checkIns"
  );

  const [newCheckIn, setNewCheckIn] = React.useState<Omit<CheckIn, "id">>(() => {
    const baseWeight = activeGoal?.currentWeight ?? goalDraft.currentWeight;
    const baseBodyFat = activeGoal?.currentBodyFatPct ?? goalDraft.currentBodyFatPct;
    return {
      dateISO: todayISO(),
      calories: Math.max(0, Math.round(goalDraft.maintenanceCalories - 500)),
      bodyWeight: baseWeight,
      bodyFatPct: baseBodyFat,
    };
  });

  const [activePanel, setActivePanel] = React.useState<PlannerPanel>("goal");

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("goalDraft", goalDraft);
  console.log("activeGoal", activeGoal);
  console.log("checkIns", checkIns);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    setNewCheckIn((prev) => {
      const baseWeight = activeGoal?.currentWeight ?? goalDraft.currentWeight;
      const baseBodyFat =
        activeGoal?.currentBodyFatPct ?? goalDraft.currentBodyFatPct;
      return {
        ...prev,
        bodyWeight: baseWeight,
        bodyFatPct: baseBodyFat,
        calories: Math.max(
          0,
          Math.round(
            (activeGoal?.maintenanceCalories ?? goalDraft.maintenanceCalories) - 500
          )
        ),
      };
    });
  }, [
    activeGoal,
    goalDraft.currentWeight,
    goalDraft.currentBodyFatPct,
    goalDraft.maintenanceCalories,
  ]);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Goal (Draft)
  const handleEventChangeGoalField = (
    field: keyof GoalDraft,
    value: string | number
  ) => {
    setGoalDraft((prev) => ({ ...prev, [field]: value } as GoalDraft));
  };

  const handleEventApplyGoal = () => {
    const next: ActiveGoal = {
      ...goalDraft,
      goalId: crypto.randomUUID(),
      startDateISO: todayISO(),
    };

    setActiveGoal(next);
    setCheckIns([]);

    setNewCheckIn({
      dateISO: todayISO(),
      calories: Math.max(0, Math.round(next.maintenanceCalories - 500)),
      bodyWeight: next.currentWeight,
      bodyFatPct: next.currentBodyFatPct,
    });
  };

  const handleEventClearAllData = () => {
    setActiveGoal(null);
    setCheckIns([]);
  };

  // ------------------------------------------------------ Check-in (New)
  const handleEventChangeNewCheckInField = (
    field: keyof Omit<CheckIn, "id">,
    value: string | number
  ) => {
    setNewCheckIn((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventAddCheckIn = () => {
    if (!activeGoal) return;

    const next: CheckIn = {
      id: crypto.randomUUID(),
      ...newCheckIn,
    };

    const start = parseISODate(activeGoal.startDateISO);
    const end = addDays(start, Math.max(0, activeGoal.timelineDays - 1));
    const date = parseISODate(next.dateISO);

    if (date < start || date > end) {
      toastFactory(
        "Check-in date must be within the active goal timeline. Adjust the date or apply a new goal.",
        MessageSeverity.INFO
      );
      return;
    }

    setCheckIns((prev) => {
      const merged = [...prev, next];
      return sortCheckInsByDate(merged);
    });

    setNewCheckIn((prev) => ({ ...prev, dateISO: todayISO() }));
  };

  // ------------------------------------------------------ Check-in (Existing)
  const handleEventUpdateCheckInDate = (checkInId: string, dateISO: string) => {
    setCheckIns((prev) =>
      sortCheckInsByDate(
        prev.map((c) => (c.id !== checkInId ? c : { ...c, dateISO }))
      )
    );
  };

  const handleEventUpdateCheckInCalories = (checkInId: string, calories: number) => {
    setCheckIns((prev) =>
      prev.map((c) => (c.id !== checkInId ? c : { ...c, calories }))
    );
  };

  const handleEventUpdateCheckInBodyWeight = (
    checkInId: string,
    bodyWeight: number
  ) => {
    setCheckIns((prev) =>
      prev.map((c) => (c.id !== checkInId ? c : { ...c, bodyWeight }))
    );
  };

  const handleEventUpdateCheckInBodyFatPct = (
    checkInId: string,
    bodyFatPct: number
  ) => {
    setCheckIns((prev) =>
      prev.map((c) => (c.id !== checkInId ? c : { ...c, bodyFatPct }))
    );
  };

  const handleEventDeleteCheckIn = (checkInId: string) => {
    setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getGoalMetrics = (goal: GoalDraft) => {
    const lbm = calcLeanMass(goal.currentWeight, goal.currentBodyFatPct);
    const targetWeight = calcTargetWeightFromLBM(lbm, goal.targetBodyFatPct);
    const weightToLose = Math.max(0, goal.currentWeight - targetWeight);

    const totalDeficitKcal = calcTotalDeficitKcal(weightToLose, goal.unit);
    const dailyDeficitKcal =
      goal.timelineDays > 0 ? totalDeficitKcal / goal.timelineDays : 0;

    const proteinGrams = Math.round(calcProteinGrams(goal.currentWeight, goal.unit));
    const targetCalories = Math.max(0, goal.maintenanceCalories - dailyDeficitKcal);

    return {
      lbm,
      targetWeight,
      weightToLose,
      totalDeficitKcal,
      dailyDeficitKcal,
      proteinGrams,
      targetCalories,
    };
  };

  const getActiveTimeline = () => {
    if (!activeGoal) return null;
    const start = parseISODate(activeGoal.startDateISO);
    const end = addDays(start, Math.max(0, activeGoal.timelineDays - 1));
    return { start, end };
  };

  const getBurndownData = (): {
    points: BurndownPoint[];
    requiredCaloriesFromTomorrow: number | null;
    requiredDailyDeficitKcal: number | null;
    remainingDeficitKcal: number | null;
    remainingDays: number | null;
    onTrackDailyCalories: number | null;
    scaleBasedRemainingDeficitKcal: number | null;
  } => {
    if (!activeGoal) {
      return {
        points: [],
        requiredCaloriesFromTomorrow: null,
        requiredDailyDeficitKcal: null,
        remainingDeficitKcal: null,
        remainingDays: null,
        onTrackDailyCalories: null,
        scaleBasedRemainingDeficitKcal: null,
      };
    }

    const timeline = getActiveTimeline();
    if (!timeline) {
      return {
        points: [],
        requiredCaloriesFromTomorrow: null,
        requiredDailyDeficitKcal: null,
        remainingDeficitKcal: null,
        remainingDays: null,
        onTrackDailyCalories: null,
        scaleBasedRemainingDeficitKcal: null,
      };
    }

    const { totalDeficitKcal, dailyDeficitKcal, targetCalories } =
      getGoalMetrics(activeGoal);

    const points: BurndownPoint[] = [];
    for (let i = 0; i < Math.max(0, activeGoal.timelineDays); i++) {
      const d = addDays(timeline.start, i);
      const plannedRemaining = Math.max(0, totalDeficitKcal - i * dailyDeficitKcal);

      points.push({
        dayIndex: i,
        dateISO: formatISODate(d),
        label: formatShortLabel(d),
        plannedRemainingDeficitKcal: plannedRemaining,
        actualRemainingDeficitKcal: null,
      });
    }

    const sorted = sortCheckInsByDate(checkIns);
    const maintenance = activeGoal.maintenanceCalories;

    let cumulativeAchievedDeficit = 0;
    let lastActualRemaining: number | null = null;

    for (const p of points) {
      const checkInsToday = sorted.filter((c) => c.dateISO === p.dateISO);
      for (const c of checkInsToday) {
        const dailyDelta = maintenance - c.calories;
        cumulativeAchievedDeficit += dailyDelta;
      }

      const actualRemaining = Math.max(
        0,
        totalDeficitKcal - cumulativeAchievedDeficit
      );

      if (checkInsToday.length > 0) {
        lastActualRemaining = actualRemaining;
      }

      p.actualRemainingDeficitKcal = lastActualRemaining;
    }

    const today = parseISODate(todayISO());
    const asOfDayIndexRaw = daysBetween(timeline.start, today);
    const asOfDayIndex = clamp(
      asOfDayIndexRaw,
      0,
      Math.max(0, activeGoal.timelineDays - 1)
    );

    const asOfPoint = points.find((p) => p.dayIndex === asOfDayIndex);
    const asOfActualRemaining = asOfPoint?.actualRemainingDeficitKcal;

    const remainingDays = Math.max(0, activeGoal.timelineDays - (asOfDayIndex + 1));

    const remainingDeficitKcal =
      asOfActualRemaining ??
      points[asOfDayIndex]?.plannedRemainingDeficitKcal ??
      totalDeficitKcal;

    const requiredDailyDeficitKcal =
      remainingDays > 0 ? remainingDeficitKcal / remainingDays : 0;
    const requiredCaloriesFromTomorrow = Math.max(
      0,
      maintenance - requiredDailyDeficitKcal
    );

    const onTrackDailyCalories = Math.max(0, targetCalories);

    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const scaleBasedRemainingDeficitKcal = (() => {
      const weight = latest?.bodyWeight ?? activeGoal.currentWeight;
      const bf = latest?.bodyFatPct ?? activeGoal.currentBodyFatPct;
      const lbm = calcLeanMass(weight, bf);
      const targetWeight = calcTargetWeightFromLBM(lbm, activeGoal.targetBodyFatPct);
      const remainingWeightLoss = Math.max(0, weight - targetWeight);
      return calcTotalDeficitKcal(remainingWeightLoss, activeGoal.unit);
    })();

    return {
      points,
      requiredCaloriesFromTomorrow,
      requiredDailyDeficitKcal,
      remainingDeficitKcal,
      remainingDays,
      onTrackDailyCalories,
      scaleBasedRemainingDeficitKcal,
    };
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  const draftMetrics = getGoalMetrics(goalDraft);
  const burndown = getBurndownData();
  const timeline = getActiveTimeline();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <SegmentedControl
            label="View"
            value={activePanel}
            options={[
              { value: "goal", label: "Targets" },
              { value: "checkins", label: "Check-ins" },
            ]}
            onEventChange={(v) => setActivePanel(v as PlannerPanel)}
          />

          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                onClick={handleEventClearAllData}
              >
                Clear active goal
              </button>
              <button
                type="button"
                className="rounded-2xl bg-zinc-900 text-white px-4 py-2 text-sm hover:bg-zinc-800"
                onClick={handleEventApplyGoal}
              >
                Apply goal (resets check-ins)
              </button>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="mt-6">
          {activePanel === "goal" ? (
            <Card
              title="Goal + deficit calculator"
              subtitle="Estimate target body weight, total deficit, and daily targets"
              icon={
                <span role="img" aria-label="target" className="text-xl">
                  🎯
                </span>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberField
                  label={`Current weight (${goalDraft.unit})`}
                  value={goalDraft.currentWeight}
                  min={0}
                  step={0.1}
                  onEventChange={(v) =>
                    handleEventChangeGoalField("currentWeight", v)
                  }
                />
                <NumberField
                  label="Current body fat"
                  value={goalDraft.currentBodyFatPct}
                  min={0}
                  max={75}
                  step={0.1}
                  suffix="%"
                  onEventChange={(v) =>
                    handleEventChangeGoalField("currentBodyFatPct", v)
                  }
                />
                <NumberField
                  label="Target body fat"
                  value={goalDraft.targetBodyFatPct}
                  min={0}
                  max={75}
                  step={0.1}
                  suffix="%"
                  onEventChange={(v) =>
                    handleEventChangeGoalField("targetBodyFatPct", v)
                  }
                />
                <NumberField
                  label="Timeline"
                  value={goalDraft.timelineDays}
                  min={1}
                  step={1}
                  suffix="days"
                  onEventChange={(v) =>
                    handleEventChangeGoalField("timelineDays", v)
                  }
                />
                <div className="sm:col-span-2">
                  <NumberField
                    label="Estimated maintenance (TDEE)"
                    value={goalDraft.maintenanceCalories}
                    min={0}
                    step={10}
                    suffix="kcal/day"
                    onEventChange={(v) =>
                      handleEventChangeGoalField("maintenanceCalories", v)
                    }
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetricPill
                  label="Protein target"
                  value={`${draftMetrics.proteinGrams.toLocaleString()} g/day`}
                  hint="~1g per lb of current body weight"
                />
                <MetricPill
                  label="Lean body mass"
                  value={`${formatMaybe(draftMetrics.lbm)} ${goalDraft.unit}`}
                />
                <MetricPill
                  label="Target body weight"
                  value={`${formatMaybe(draftMetrics.targetWeight)} ${
                    goalDraft.unit
                  }`}
                />
                <MetricPill
                  label="Weight to lose"
                  value={`${formatMaybe(draftMetrics.weightToLose)} ${
                    goalDraft.unit
                  }`}
                />
                <MetricPill
                  label="Total deficit (est.)"
                  value={`${Math.round(
                    draftMetrics.totalDeficitKcal
                  ).toLocaleString()} kcal`}
                  hint="Uses ~3,500 kcal per lb"
                />
                <MetricPill
                  label="Daily deficit"
                  value={`${Math.round(
                    draftMetrics.dailyDeficitKcal
                  ).toLocaleString()} kcal/day`}
                />
                <div className="sm:col-span-2">
                  <MetricPill
                    label="Target calories/day (if maintenance is correct)"
                    value={`${Math.round(
                      draftMetrics.targetCalories
                    ).toLocaleString()} kcal/day`}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                This tool is for planning and tracking. If targets become extreme,
                extend your timeline and consider professional guidance.
              </div>
            </Card>
          ) : (
            <Card
              title="Burndown + check-ins"
              subtitle="Track your remaining deficit and adjust intake when you miss a day"
              icon={
                <span role="img" aria-label="burndown" className="text-xl">
                  📉
                </span>
              }
            >
              {!activeGoal ? (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-700">
                  Apply a goal to start tracking. This panel resets whenever you
                  apply a new goal.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MetricPill
                      label="Timeline"
                      value={`${activeGoal.timelineDays} days`}
                      hint={
                        timeline
                          ? `${timeline.start.toDateString()} → ${timeline.end.toDateString()}`
                          : undefined
                      }
                    />
                    <MetricPill
                      label="On-track calories/day"
                      value={`${Math.round(
                        burndown.onTrackDailyCalories ?? 0
                      ).toLocaleString()} kcal`}
                      hint="Based on your original plan"
                    />
                    <MetricPill
                      label="Remaining deficit"
                      value={`${Math.round(
                        burndown.remainingDeficitKcal ?? 0
                      ).toLocaleString()} kcal`}
                      hint="Energy-based (from check-ins)"
                    />
                    <MetricPill
                      label="Calories/day to get back on track"
                      value={
                        burndown.requiredCaloriesFromTomorrow == null
                          ? "—"
                          : `${Math.round(
                              burndown.requiredCaloriesFromTomorrow
                            ).toLocaleString()} kcal`
                      }
                      hint={
                        burndown.remainingDays == null
                          ? undefined
                          : `Assumes ${burndown.remainingDays} days remaining`
                      }
                    />
                    <div className="sm:col-span-2">
                      <MetricPill
                        label="Scale-based remaining deficit (optional)"
                        value={`${Math.round(
                          burndown.scaleBasedRemainingDeficitKcal ?? 0
                        ).toLocaleString()} kcal`}
                        hint="Uses latest weigh-in + body fat estimate"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-zinc-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-800">
                        Remaining deficit burndown
                      </div>
                      <div className="text-xs text-zinc-500">Planned vs actual</div>
                    </div>
                    <div className="mt-3 h-56 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={burndown.points}
                          margin={{ left: 6, right: 16, top: 8, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis tick={{ fontSize: 12 }} width={60} />
                          <Tooltip
                            formatter={(value: any, name: any) => {
                              if (typeof value !== "number") return [value, name];
                              return [
                                `${Math.round(value).toLocaleString()} kcal`,
                                name,
                              ];
                            }}
                            labelFormatter={(label) => `Day: ${label}`}
                          />
                          <ReferenceLine y={0} strokeDasharray="4 4" />
                          <Line
                            type="monotone"
                            dataKey="plannedRemainingDeficitKcal"
                            name="Planned remaining"
                            stroke="#111827"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="actualRemainingDeficitKcal"
                            name="Actual remaining"
                            stroke="#64748B"
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
                        <Flame className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          Daily check-in
                        </div>
                        <div className="text-xs text-zinc-600">
                          Enter calories, weight, and body fat. The chart updates
                          automatically.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-3">
                        <TextField
                          label="Date"
                          type="date"
                          value={newCheckIn.dateISO}
                          onEventChange={(v) =>
                            handleEventChangeNewCheckInField("dateISO", v)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <NumberField
                          label="Calories"
                          value={newCheckIn.calories}
                          min={0}
                          step={10}
                          suffix="kcal"
                          onEventChange={(v) =>
                            handleEventChangeNewCheckInField("calories", v)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <NumberField
                          label={`Body weight (${activeGoal.unit})`}
                          value={newCheckIn.bodyWeight}
                          min={0}
                          step={0.1}
                          onEventChange={(v) =>
                            handleEventChangeNewCheckInField("bodyWeight", v)
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <NumberField
                          label="Body fat"
                          value={newCheckIn.bodyFatPct}
                          min={0}
                          max={75}
                          step={0.1}
                          suffix="%"
                          onEventChange={(v) =>
                            handleEventChangeNewCheckInField("bodyFatPct", v)
                          }
                        />
                      </div>
                      <div className="sm:col-span-1 flex sm:justify-end">
                        <button
                          type="button"
                          className="w-full sm:w-auto rounded-2xl bg-zinc-900 text-white px-3 py-2 text-sm hover:bg-zinc-800"
                          onClick={handleEventAddCheckIn}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {checkIns.length === 0 ? (
                      <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-700">
                        No check-ins yet.
                      </div>
                    ) : (
                      checkIns.map((c) => (
                        <CheckInRow
                          key={c.id}
                          checkIn={c}
                          unit={activeGoal.unit}
                          onEventChangeDate={handleEventUpdateCheckInDate}
                          onEventChangeCalories={handleEventUpdateCheckInCalories}
                          onEventChangeBodyWeight={
                            handleEventUpdateCheckInBodyWeight
                          }
                          onEventChangeBodyFatPct={
                            handleEventUpdateCheckInBodyFatPct
                          }
                          onEventDelete={handleEventDeleteCheckIn}
                        />
                      ))
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
                        <Utensils className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Maintenance</div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {activeGoal.maintenanceCalories.toLocaleString()} kcal
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">
                          Required daily deficit
                        </div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {Math.round(
                            burndown.requiredDailyDeficitKcal ?? 0
                          ).toLocaleString()}{" "}
                          kcal/day
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Tip</div>
                        <div className="text-sm font-semibold text-zinc-900">
                          Extend the timeline if calories get too low
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-zinc-500">
          Notes: deficit estimates are approximate. Scale readings and body fat
          estimates can fluctuate day-to-day.
        </div>
      </div>
    </div>
  );
}

// ------------------------- math + date helpers

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(raw: string) {
  const v = Number(raw);
  if (!Number.isFinite(v)) return 0;
  return v;
}

function formatMaybe(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 100) return n.toFixed(0);
  return n.toFixed(1);
}

function calcLeanMass(weight: number, bodyFatPct: number) {
  const bf = clamp(bodyFatPct, 0, 100) / 100;
  return Math.max(0, weight * (1 - bf));
}

function calcTargetWeightFromLBM(leanMass: number, targetBodyFatPct: number) {
  const targetBf = clamp(targetBodyFatPct, 0, 99.9) / 100;
  const denom = 1 - targetBf;
  if (denom <= 0) return leanMass;
  return Math.max(0, leanMass / denom);
}

function calcProteinGrams(currentWeight: number, unit: WeightUnit) {
  const weightLb = unit === "kg" ? currentWeight * 2.2046226218 : currentWeight;
  return Math.max(0, weightLb * 1);
}

function calcTotalDeficitKcal(weightToLose: number, unit: WeightUnit) {
  const loseLb = unit === "kg" ? weightToLose * 2.2046226218 : weightToLose;
  return Math.max(0, loseLb * 3500);
}

function todayISO() {
  return formatISODate(new Date());
}

function formatISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(a: Date, b: Date) {
  const one = new Date(a);
  const two = new Date(b);
  one.setHours(0, 0, 0, 0);
  two.setHours(0, 0, 0, 0);
  const ms = two.getTime() - one.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatShortLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sortCheckInsByDate(items: CheckIn[]) {
  return [...items].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

// ------------------------- local storage

function readFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
