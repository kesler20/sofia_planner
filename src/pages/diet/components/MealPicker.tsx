import * as React from "react";
import BasicModal from "../../../components/modal/BasicModal";
import type { MealType, WeekdayType } from "../../../types";
import { mealTotals, formatNutrient } from "../dietPlanning";

export function MealPicker(props: { open: boolean; day: WeekdayType; meals: MealType[]; loading: boolean; query: string; onEventQuery: (query: string) => void; onEventAdd: (meal: MealType) => void; onEventRecipe: (meal: MealType) => void; onEventClose: () => void }): React.ReactElement {
  return <BasicModal open={props.open} handleClose={props.onEventClose} customModal={
    <section role="dialog" aria-modal="true" aria-label="Choose meals" className="flex h-[86dvh] w-[94vw] max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
      <header className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-gray-800">Add meals for {props.day}</h2><button type="button" aria-label="Close meal picker" onClick={props.onEventClose} className="rounded-lg border px-4 py-2">Done</button></header>
      <label className="mb-2 text-sm font-medium text-gray-700" htmlFor="meal-filter">Filter meals</label>
      <input autoFocus id="meal-filter" type="search" placeholder="Meal name, ingredient or vendor" value={props.query} onChange={event => props.onEventQuery(event.target.value)} className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none" />
      <p role="status" className="mb-4 text-sm text-gray-500">{props.loading ? "Loading meals" : `${props.meals.length} ${props.meals.length === 1 ? "meal" : "meals"}`}</p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        {!props.loading && !props.meals.length && <p className="py-8 text-center text-gray-500">No meals match your filter.</p>}
        <div className="grid gap-4 md:grid-cols-2">{props.meals.map(meal => {
          const total = mealTotals(meal);
          return <article key={meal.catalogueId ?? meal.name} onContextMenu={event => { event.preventDefault(); props.onEventRecipe(meal); }} className="rounded-2xl border border-gray-200 p-5">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">{meal.name}</h3>
            <p className="mb-2 text-sm text-gray-600">{formatNutrient(total.calories)} kcal · {formatNutrient(total.protein, 1)} g protein · {total.cost === null ? "Cost unknown" : `£${total.cost.toFixed(2)}`}</p>
            <p className="mb-4 text-sm text-gray-500">Taste {meal.tasteScore === null ? "unrated" : `${meal.tasteScore}/10`}</p>
            <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => props.onEventAdd(meal)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Add meal</button><button type="button" onClick={() => props.onEventRecipe(meal)} className="rounded-lg border px-4 py-2 text-sm">Recipe</button></div>
          </article>;
        })}</div>
      </div>
    </section>
  } />;
}
