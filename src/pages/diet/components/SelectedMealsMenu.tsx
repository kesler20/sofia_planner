import * as React from "react";
import type { MealType } from "../../../types";
import { MdCalendarMonth, MdContentCopy } from "react-icons/md";

// ============================================================ //
//                                                              //
//   SELECTED MEALS MENU                                        //
//                                                              //
//   Shared Diet selection popup for the page and prototype.     //
//   Emits copy, spread and close events without persistence.    //
//                                                              //
// ============================================================ //
export function SelectedMealsMenu(props: {
  selectedMeals: MealType[];
  onEventCopyMeals: () => void;
  onEventSpreadMeals: () => void;
  onEventClose: () => void;
}): React.ReactElement {
  return (
    <div className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md px-5 sm:px-8 py-6 flex flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-bold mb-4 text-gray-800 font-serif">
          Selected Meals
        </h2>
        <button
          className="w-8 h-8 flex items-center mb-4 justify-center rounded-full bg-red-400 hover:bg-red-500 text-white text-xl font-bold shadow transition"
          title="Close"
          onClick={props.onEventClose}
        >
          <span>x</span>
        </button>
      </div>
      <ul className="list-disc pl-6 mb-6 w-full">
        {props.selectedMeals.map((meal, index) => (
          <li key={index} className="text-gray-700 text-lg font-semibold">
            {meal.name}
          </li>
        ))}
      </ul>
      <div className="flex gap-6 mt-2">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold shadow transition"
          title="Copy"
          onClick={props.onEventCopyMeals}
        >
          <MdContentCopy size={22} />
        </button>
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold shadow transition"
          title="Spread"
          onClick={props.onEventSpreadMeals}
        >
          <MdCalendarMonth size={22} />
        </button>
      </div>
    </div>
  );
}
