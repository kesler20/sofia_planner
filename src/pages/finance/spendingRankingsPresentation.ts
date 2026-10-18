import type {
  RankingEntry,
  RankingPeriod,
  SpendingRankings,
} from "./financeAnalyticsTypes";

// Display grouping uses the ETL's ranked totals and shares without recomputing analytics.
export function buildRankingSlices(entries: RankingEntry[], limit: number) {
  const positive = entries.filter((entry) => entry.net_total > 0);
  const slices = positive
    .slice(0, limit)
    .map((entry) => ({ ...entry, isOther: false }));
  const remainder = positive.slice(limit);
  if (remainder.length)
    slices.push({
      id: "rankings/other",
      name: "Other",
      net_total: remainder.reduce((total, entry) => total + entry.net_total, 0),
      positive_share: remainder.reduce(
        (total, entry) => total + entry.positive_share,
        0,
      ),
      cumulative_share: remainder[remainder.length - 1].cumulative_share,
      isOther: true,
    });
  return slices;
}

export function selectRankingPeriod(
  data: SpendingRankings | null,
  mode: "month" | "year",
  year: number,
  month: number,
): RankingPeriod | null {
  const start = `${year}-${mode === "year" ? "01" : String(month + 1).padStart(2, "0")}-01`;
  return (
    data?.periods.find(
      (period) => period.period === mode && period.start === start,
    ) ?? null
  );
}

export function retainRankingCategory(
  period: RankingPeriod | null,
  selectedId: string,
): string {
  return period?.categories.some((category) => category.id === selectedId)
    ? selectedId
    : "";
}

export function getRankingColour(id: string): string {
  const palette = ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#0891b2", "#ca8a04"];
  const hash = [...id].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return palette[hash % palette.length];
}
