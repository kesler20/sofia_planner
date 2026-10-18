import * as React from "react";
import DonutChart from "../../../components/charts/DonutChart";
import HorizontalRankingChart from "../../../components/charts/HorizontalRankingChart";
import { money } from "../financeAnalyticsCalculations";
import type { RankingEntry } from "../financeAnalyticsTypes";
import {
  buildRankingSlices,
  getRankingColour,
} from "../spendingRankingsPresentation";

// ============================================================ //
//                                                              //
//   SPENDING RANKING COMPONENTS                                 //
//                                                              //
//   Stateless composition and shared ranking charts for Finance. //
//   The page supplies ranked data and handles selection events. //
//                                                              //
// ============================================================ //

export function RankingDonut(props: {
  entries: RankingEntry[];
  limit: number;
  label: string;
  onEventSelect?: (id: string) => void;
}): React.ReactElement {
  const slices = buildRankingSlices(props.entries, props.limit);
  return (
    <div className="min-w-0">
      {/* Composition chart */}
      {slices.length ? (
        <div aria-label={props.label}>
          <DonutChart rows={slices.map(slice => ({id: slice.id, name: slice.name, value: slice.net_total, colour: slice.isOther ? "#9ca3af" : getRankingColour(slice.id), selectable: !slice.isOther}))} height={240} innerRadius={65} outerRadius={96} formatValue={money} onEventSelect={props.onEventSelect}/>
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">
          No positive net spending in this period.
        </p>
      )}
      {/* Accessible composition legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {slices.map((slice) => (
          <span key={slice.id} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: slice.isOther
                  ? "#9ca3af"
                  : getRankingColour(slice.id),
              }}
            />
            {slice.name} · {(slice.positive_share * 100).toFixed(1)}%
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-gray-500">
        Share of positive net spending
      </p>
    </div>
  );
}

export function SpendingRankingChart(props: {
  entries: RankingEntry[];
  expanded: boolean;
  selectedId?: string;
  onEventSelect?: (id: string) => void;
  onEventToggleExpanded: () => void;
}): React.ReactElement {
  const visible = props.expanded ? props.entries : props.entries.slice(0, 5);
  return (
    <div className="min-w-0">
      {/* Reuse the Analytics horizontal ranking chart with expandable rows */}
      <h3 className="mb-2 text-sm font-semibold">Spending rankings</h3>
      {visible.length ? (
        <HorizontalRankingChart
          rows={visible.map((entry) => ({
            id: entry.id,
            name: entry.name,
            value: entry.net_total,
            colour:
              entry.net_total < 0 ? "#f43f5e" : getRankingColour(entry.id),
          }))}
          maxBarSize={14}
          colour="#2563eb"
          height={Math.max(240, visible.length * 36 + 40)}
          selectedId={props.selectedId}
          formatValue={money}
          onEventSelect={props.onEventSelect}
        />
      ) : (
        <p className="py-8 text-sm text-gray-500">
          No net spending in the observed dates.
        </p>
      )}
      {/* Exact totals and keyboard-accessible category selection */}
      {visible.length > 0 && (
        <table className="mt-4 w-full text-xs">
          <caption className="sr-only">
            Ranked net spending and positive spending share
          </caption>
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2 font-normal">Name</th>
              <th className="pb-2 text-right font-normal">Net spending</th>
              <th className="pb-2 text-right font-normal">Share</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => (
              <tr key={entry.id} className="border-t border-gray-100">
                <td className="py-2 pr-2">
                  {props.onEventSelect ? (
                    <button
                      type="button"
                      aria-pressed={props.selectedId === entry.id}
                      onClick={() => props.onEventSelect?.(entry.id)}
                      className="rounded px-1 py-1 text-left font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-600"
                    >
                      {entry.name}
                    </button>
                  ) : (
                    entry.name
                  )}
                  {entry.net_total < 0 && (
                    <span className="block text-gray-500">Net refund</span>
                  )}
                </td>
                <td className="text-right tabular-nums">
                  {money(entry.net_total)}
                </td>
                <td className="text-right tabular-nums">
                  {(entry.positive_share * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {props.entries.length > 5 && (
        <button
          type="button"
          onClick={props.onEventToggleExpanded}
          className="mt-3 rounded-lg px-2 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-600"
        >
          {props.expanded ? "Show top 5" : `Show all ${props.entries.length}`}
        </button>
      )}
    </div>
  );
}
