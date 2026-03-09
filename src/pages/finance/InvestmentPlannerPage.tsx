import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3, Table, TrendingUp } from "lucide-react";
import { useStoredValue, readResourceInDb } from "../../utils";
import { Finances } from "./BudgetsPage";
import LoadingAnimation from "../../components/LoadingAnimation";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

type Months =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

type MonthlyAllocation = {
  month: Months;
  availableFunds: number;
  investment: number;
  gifts: number;
};

type ViewMode = "chart" | "table" | "forecast";

type InvestmentParams = {
  principal: number;
  monthlyContribution: number;
  years: number;
  inflationRate: number;
  dividendYield: number;
};

type ProjectionDataPoint = {
  year: number;
  pessimistic: number;
  expected: number;
  optimistic: number;
};

// ====================== //
//                        //
//   CONSTANTS            //
//                        //
// ====================== //

const MONTHS: Months[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SAMPLE_BUDGET_DATA: Record<Months, number> = {
  January: 2500,
  February: 2200,
  March: 2700,
  April: 2300,
  May: 2600,
  June: 2400,
  July: 2800,
  August: 2500,
  September: 2700,
  October: 3000,
  November: 2600,
  December: 3200,
};

const UK_INFLATION_RATE = 0.025;
const DIVIDEND_YIELD = 0.02;

// ====================== //
//                        //
//   UI COMPONENTS        //
//                        //
// ====================== //

function Card(props: {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={props.style}
      className={`border border-gray-200 rounded-2xl shadow-md px-4 w-full ${props.className}`}
    >
      {props.children}
    </div>
  );
}

function ViewToggle(props: {
  activeView: ViewMode;
  onEventChangeView: (view: ViewMode) => void;
}) {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "chart", label: "Chart", icon: <BarChart3 size={16} /> },
    { id: "table", label: "Table", icon: <Table size={16} /> },
    { id: "forecast", label: "Forecast", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => props.onEventChangeView(view.id)}
          className={
            props.activeView === view.id
              ? "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-white shadow-sm text-gray-800"
              : "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all text-gray-500 hover:text-gray-700 hover:bg-white/50"
          }
        >
          {view.icon}
          {view.label}
        </button>
      ))}
    </div>
  );
}

function InputField(props: {
  label: string;
  value: number;
  onEventChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {props.label}
      </label>
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-gray-400 transition-all">
        {props.prefix && (
          <span className="text-gray-400 font-medium text-sm">{props.prefix}</span>
        )}
        <input
          type="number"
          value={props.value}
          onChange={(e) => props.onEventChange(Number(e.target.value))}
          step={props.step || 1}
          className="flex-1 bg-transparent outline-none text-gray-800 font-semibold w-full min-w-0"
        />
        {props.suffix && (
          <span className="text-gray-400 font-medium text-sm">{props.suffix}</span>
        )}
      </div>
    </div>
  );
}

function MonthlyBarChart(props: { data: MonthlyAllocation[] }) {
  const chartData = props.data.map((d) => ({
    name: d.month.substring(0, 3),
    Investment: d.investment,
    Gifts: d.gifts,
  }));

  return (
    <Card className="p-4 py-6">
      <h2 className="md:text-2xl text-gray-800 font-bold mb-4">
        Monthly Allocation Breakdown
      </h2>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              padding: "10px 14px",
            }}
            formatter={(value) => [`£${Number(value)?.toFixed(0) ?? 0}`, ""]}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "16px" }}
            iconType="circle"
            iconSize={10}
          />
          <Bar
            dataKey="Investment"
            stackId="a"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
          />
          <Bar dataKey="Gifts" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MonthlyTable(props: { data: MonthlyAllocation[] }) {
  const totals = props.data.reduce(
    (acc, d) => ({
      available: acc.available + d.availableFunds,
      investment: acc.investment + d.investment,
      gifts: acc.gifts + d.gifts,
    }),
    { available: 0, investment: 0, gifts: 0 },
  );

  return (
    <Card className="p-4 py-6 overflow-x-auto">
      <h2 className="md:text-2xl text-gray-800 font-bold mb-4">
        Monthly Breakdown Table
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Month
            </th>
            <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
              Available
            </th>
            <th className="text-right py-3 px-3 text-xs font-bold text-green-600 uppercase tracking-wide">
              Invest
            </th>
            <th className="text-right py-3 px-3 text-xs font-bold text-purple-500 uppercase tracking-wide">
              Gifts
            </th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, i) => (
            <tr
              key={row.month}
              className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
            >
              <td className="py-2.5 px-3 font-semibold text-gray-700">
                {row.month}
              </td>
              <td className="py-2.5 px-3 text-right font-medium text-gray-500">
                £{row.availableFunds.toFixed(0)}
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-green-600">
                £{row.investment.toFixed(0)}
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-purple-600">
                £{row.gifts.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-100">
            <td className="py-3 px-3 font-bold text-gray-800">Annual Total</td>
            <td className="py-3 px-3 text-right font-bold text-gray-600">
              £{totals.available.toFixed(0)}
            </td>
            <td className="py-3 px-3 text-right font-bold text-green-600">
              £{totals.investment.toFixed(0)}
            </td>
            <td className="py-3 px-3 text-right font-bold text-purple-600">
              £{totals.gifts.toFixed(0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

function ForecastChart(props: {
  params: InvestmentParams;
  onEventChangeParam: (field: keyof InvestmentParams, value: number) => void;
}) {
  const projectionData = React.useMemo(() => {
    const data: ProjectionDataPoint[] = [];
    for (let year = 0; year <= props.params.years; year++) {
      const months = year * 12;
      const calcFV = (annualRate: number) => {
        const monthlyRate = annualRate / 12;
        const realRate =
          (1 + monthlyRate) / (1 + props.params.inflationRate / 12) - 1;
        const totalRate = realRate + props.params.dividendYield / 12;
        if (months === 0) return props.params.principal;
        return (
          props.params.principal * Math.pow(1 + totalRate, months) +
          props.params.monthlyContribution *
            ((Math.pow(1 + totalRate, months) - 1) / totalRate)
        );
      };
      data.push({
        year,
        pessimistic: calcFV(0.07),
        expected: calcFV(0.1),
        optimistic: calcFV(0.12),
      });
    }
    return data;
  }, [props.params]);

  const final = projectionData[projectionData.length - 1];

  return (
    <Card className="p-4 py-6">
      <h2 className="md:text-2xl text-gray-800 font-bold mb-4">
        Investment Growth Projection
      </h2>

      {/* Input Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InputField
          label="Principal"
          value={props.params.principal}
          onEventChange={(v) => props.onEventChangeParam("principal", v)}
          prefix="£"
        />
        <InputField
          label="Monthly"
          value={props.params.monthlyContribution}
          onEventChange={(v) => props.onEventChangeParam("monthlyContribution", v)}
          prefix="£"
        />
        <InputField
          label="Years"
          value={props.params.years}
          onEventChange={(v) => props.onEventChangeParam("years", v)}
          suffix="yrs"
        />
        <InputField
          label="Inflation"
          value={props.params.inflationRate * 100}
          onEventChange={(v) => props.onEventChangeParam("inflationRate", v / 100)}
          suffix="%"
          step={0.1}
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={projectionData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="optG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="pesG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            formatter={(v: number | undefined, name?: string) => [
              `£${(v ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
              name === "optimistic"
                ? "Best (12%)"
                : name === "expected"
                  ? "Expected (10%)"
                  : name === "pessimistic"
                    ? "Conservative (7%)"
                    : "",
            ]}
            labelFormatter={(l) => `Year ${l}`}
          />
          <Area
            type="monotone"
            dataKey="optimistic"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#optG)"
          />
          <Area
            type="monotone"
            dataKey="expected"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#expG)"
          />
          <Area
            type="monotone"
            dataKey="pessimistic"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#pesG)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">
            Conservative 7%
          </p>
          <p className="text-lg font-bold text-orange-700">
            £
            {final?.pessimistic.toLocaleString("en-GB", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
            Expected 10%
          </p>
          <p className="text-lg font-bold text-blue-700">
            £{final?.expected.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
            Best Case 12%
          </p>
          <p className="text-lg font-bold text-green-700">
            £
            {final?.optimistic.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
        <span className="font-semibold">Note:</span> Adjusted for UK inflation (
        {(props.params.inflationRate * 100).toFixed(1)}%) with reinvested dividends (
        {(DIVIDEND_YIELD * 100).toFixed(1)}% yield). Shows real purchasing power.
      </div>
    </Card>
  );
}

function AllocationInputs(props: {
  fixedInvestment: number;
  onEventChangeInvestment: (v: number) => void;
  totalAvailable: number;
  totalGifts: number;
}) {
  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="md:w-64">
          <InputField
            label="Fixed Monthly Investment (DCA)"
            value={props.fixedInvestment}
            onEventChange={props.onEventChangeInvestment}
            prefix="£"
          />
        </div>
        <div className="flex gap-3 flex-wrap flex-1 md:justify-end">
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Avg Available
            </p>
            <p className="text-lg font-bold text-gray-700">
              £{(props.totalAvailable / 12).toFixed(0)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl px-4 py-2.5 border border-purple-200">
            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
              Avg Gifts
            </p>
            <p className="text-lg font-bold text-purple-600">
              £{(props.totalGifts / 12).toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ====================== //
//                        //
//   MAIN PAGE            //
//                        //
// ====================== //

export default function InvestmentPlannerPage() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const [fixedInvestmentArray, setFixedInvestmentArray, isFixedInvestmentLoading] =
    useStoredValue<number[]>(email, [500], "monthly_fixed_investment");
  const fixedInvestment = fixedInvestmentArray[0] ?? 500;
  const [activeView, setActiveView] = React.useState<ViewMode>("chart");
  const [monthlyBudgetData, setMonthlyBudgetData] =
    React.useState<Record<Months, number>>(SAMPLE_BUDGET_DATA);
  const [investmentParams, setInvestmentParams, isInvestmentsLoading] =
    useStoredValue<InvestmentParams>(
      email,
      {
        principal: 10000,
        monthlyContribution: 500,
        years: 30,
        inflationRate: UK_INFLATION_RATE,
        dividendYield: DIVIDEND_YIELD,
      },
      "investment_params",
    );

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    setInvestmentParams((prev) => ({
      ...prev,
      monthlyContribution: fixedInvestment,
    }));
  }, [fixedInvestment]);

  // Read monthly net from BudgetsPage database (key: "monthlyBalance")
  React.useEffect(() => {
    readResourceInDb<string>(email, "monthlyBalance").then(({ result, error }) => {
      if (error || !result) {
        console.log("Error loading monthlyBalance for investments:", error);
        return;
      }
      try {
        const finances = JSON.parse(result) as Finances;
        const budgetData: Record<Months, number> = {} as any;
        (Object.keys(finances) as Months[]).forEach((month) => {
          const cats = finances[month]?.categories || [];
          let totalIn = 0,
            totalOut = 0;
          cats.forEach((cat: any) => {
            if (cat.type === "income") {
              totalIn += cat.sections.reduce(
                (sum: number, s: any) => sum + (s.value || 0),
                0,
              );
            } else if (cat.type === "expense") {
              totalOut += cat.sections.reduce(
                (sum: number, s: any) => sum + (s.value || 0),
                0,
              );
            }
          });
          budgetData[month] = totalIn - totalOut;
        });
        setMonthlyBudgetData(budgetData);
      } catch (e) {
        console.log("Error parsing monthlyBalance:", e);
      }
    });
  }, []);

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("activeView", activeView);
  console.log("fixedInvestment", fixedInvestment);

  if (isFixedInvestmentLoading || isInvestmentsLoading) {
    return <LoadingAnimation />;
  }

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const calculateAllocations = (): MonthlyAllocation[] => {
    return MONTHS.map((month) => {
      const available = monthlyBudgetData[month];
      const investment = Math.min(fixedInvestment, available);
      const gifts = available - investment;
      return { month, availableFunds: available, investment, gifts };
    });
  };

  const allocations = calculateAllocations();
  const totals = allocations.reduce(
    (acc, a) => ({
      available: acc.available + a.availableFunds,
      investment: acc.investment + a.investment,
      gifts: acc.gifts + a.gifts,
    }),
    { available: 0, investment: 0, gifts: 0 },
  );

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ View
  const handleEventChangeView = (view: ViewMode) => setActiveView(view);

  // ------------------------------------------------------ Investment
  const handleEventChangeInvestment = (value: number) => {
    setFixedInvestmentArray([value]);
    setInvestmentParams((prev) => ({ ...prev, monthlyContribution: value }));
  };

  const handleEventChangeInvestmentParam = (
    field: keyof InvestmentParams,
    value: number,
  ) => {
    setInvestmentParams((prev) => ({ ...prev, [field]: value }));
    if (field === "monthlyContribution") setFixedInvestmentArray([value]);
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <ViewToggle
            activeView={activeView}
            onEventChangeView={handleEventChangeView}
          />
        </div>

        {/* Allocation Inputs */}
        {(activeView === "chart" || activeView === "table") && (
          <AllocationInputs
            fixedInvestment={fixedInvestment}
            onEventChangeInvestment={handleEventChangeInvestment}
            totalAvailable={totals.available}
            totalGifts={totals.gifts}
          />
        )}

        {/* Main Content */}
        {activeView === "chart" && <MonthlyBarChart data={allocations} />}
        {activeView === "table" && <MonthlyTable data={allocations} />}
        {activeView === "forecast" && (
          <ForecastChart
            params={investmentParams}
            onEventChangeParam={handleEventChangeInvestmentParam}
          />
        )}
      </div>
    </div>
  );
}
