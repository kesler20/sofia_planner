import * as React from "react";
import { FaTrashAlt } from "react-icons/fa";
import { CiCirclePlus } from "react-icons/ci";

// ============================================================ //
//                                                              //
//   PLANNING COMPONENTS                                        //
//                                                              //
//   Shared Finance and Diet card, typography and icon controls. //
//   Stateless controls emit user events to their page owners.  //
//                                                              //
// ============================================================ //

export function PlanningCard(props: {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onEventClick?: () => void;
  onEventContextMenu?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      onClick={props.onEventClick}
      onContextMenu={props.onEventContextMenu}
      style={props.style}
      className={`border border-gray-200 rounded-2xl shadow-md px-4 w-full ${props.className ?? ""}`}
    >
      {props.children}
    </div>
  );
}

export function PlanningHeading(props: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const Heading = props.as ?? "h1";
  return (
    <Heading
      className={`text-xl md:text-4xl text-gray-800 font-serif font-bold ${props.className ?? ""}`}
    >
      {props.text}
    </Heading>
  );
}

export function PlanningItemHeading(props: {
  children: React.ReactNode;
  compact?: boolean;
  onEventClick?: () => void;
}) {
  return (
    <h2
      className={
        props.compact
          ? "text-base text-gray-800 font-bold"
          : "md:text-2xl text-gray-800 font-bold"
      }
      onClick={props.onEventClick}
    >
      {props.children}
    </h2>
  );
}

export function PlanningDeleteButton(props: {
  label: string;
  className?: string;
  onEventDelete: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      className={`border-gray-800 border-[1.5px] rounded-full p-2 flex items-center justify-center ml-4 shrink-0 ${props.className ?? ""}`}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        props.onEventDelete();
      }}
    >
      <FaTrashAlt
        aria-hidden="true"
        className="cursor-pointer hover:text-red-200 text-red-300"
      />
    </button>
  );
}

export function PlanningAddButton(props: {
  label: string;
  className?: string;
  disabled?: boolean;
  onEventAdd: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      className={`shrink-0 text-gray-800 hover:text-gray-600 disabled:opacity-50 ${props.className ?? ""}`}
      onClick={props.onEventAdd}
    >
      <CiCirclePlus size={36} aria-hidden="true" />
    </button>
  );
}

export function PlanningToolbarButton(props: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  onEventClick: () => void;
}) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.pressed}
      disabled={props.disabled}
      className="ml-2 px-3 h-14 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition flex items-center gap-1 disabled:cursor-default disabled:opacity-50"
      onClick={props.onEventClick}
    >
      {props.children}
    </button>
  );
}
