import * as React from "react";
import { MenuItem, Select } from "@mui/material";

// ============================================================ //
//                                                              //
//   ANALYTICS CONTROLS                                         //
//                                                              //
//   Shared cards, selectors and segments for all domain pages.  //
//   Pages supply values and own all emitted selection events.  //
//                                                              //
// ============================================================ //
export function AnalyticsCard(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${props.className ?? ""}`}
    >
      {props.children}
    </div>
  );
}

export function SegmentedControl<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onEventChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {props.label}
      </p>
      <div
        role="group"
        aria-label={props.label}
        className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1"
      >
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={props.value === option.value}
            onClick={() => props.onEventChange(option.value)}
            className={
              props.value === option.value
                ? "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm"
                : "rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSelect(props: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onEventChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {props.label}
      <Select
        size="small"
        inputProps={{ "aria-label": props.label }}
        value={props.value}
        onChange={(event) => props.onEventChange(event.target.value)}
        className="min-w-[170px] bg-white normal-case"
      >
        <MenuItem value="" disabled>
          Select {props.label.toLowerCase()}
        </MenuItem>
        {props.options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </label>
  );
}
