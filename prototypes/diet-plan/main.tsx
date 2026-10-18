import "../offline";
import PlannerTheme from "../../src/components/PlannerTheme";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { SelectedMealsMenu } from "../../src/pages/diet/components/SelectedMealsMenu";
import WeekBoard from "../../src/pages/diet/WeekBoard";
import { MealPicker } from "../../src/pages/diet/components/MealPicker";
import { MealRecipe } from "../../src/pages/diet/components/MealRecipe";
import { appendMeals, matchesMeal, mealTotals, planCost, sumKnown } from "../../src/pages/diet/dietPlanning";
import { WEEKDAYS } from "../../src/types";
import type { MealType, WeekdayType, WeekPlanType } from "../../src/types";
import "../../src/styles/index.css";
import { ToastContainer } from "react-toastify";

const meals: MealType[] = [
  { name: "Chocolate oats v2", tasteScore: 8, foods: [{ name: "Oats", amount: 100, servingUnit: "g", quantity: 1, calories: 370, protein: 12, carbs: 60, fat: 7, cost: .25, vendor: "Tesco" }, { name: "Chocolate whey", amount: 30, servingUnit: "g", quantity: 2, calories: 115, protein: 23, carbs: 2, fat: 2, cost: .6, vendor: "Myprotein" }] },
  { name: "Chicken and cheese sandwich", tasteScore: 7, foods: [{ name: "Bread", amount: 60, servingUnit: "g", quantity: 2, calories: 150, protein: 5, carbs: 28, fat: 2, cost: .4, vendor: "Tesco" }, { name: "Chicken", amount: 100, servingUnit: "g", quantity: 1, calories: 165, protein: 31, carbs: 0, fat: 4, cost: 1.2, vendor: "Tesco" }] },
  { name: "Salmon rice bowl", tasteScore: null, foods: [{ name: "Salmon", amount: 150, servingUnit: "g", quantity: 1, calories: 310, protein: 30, carbs: 0, fat: 20, cost: 2.5, vendor: "Tesco" }] },
];
function Preview() {
  const [plan, setPlan] = React.useState(Object.fromEntries(WEEKDAYS.map(day => [day, structuredClone(meals)])) as WeekPlanType);
  const [savedPlan, setSavedPlan] = React.useState(plan);
  const [day, setDay] = React.useState<WeekdayType>("Monday");
  const [picker, setPicker] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [recipe, setRecipe] = React.useState<MealType | null>(null);
  const [selected, setSelected] = React.useState<MealType[]>([]);
  const [copied, setCopied] = React.useState<MealType[]>([]);
  const [taste, setTaste] = React.useState("");
  const totals = Object.fromEntries(WEEKDAYS.map(name => [name, { calories: sumKnown(plan[name].map(meal => mealTotals(meal).calories)), protein: sumKnown(plan[name].map(meal => mealTotals(meal).protein)), cost: plan[name].reduce((sum, meal) => sum + (mealTotals(meal).cost ?? 0), 0), tasteScore: 7.5 }])) as React.ComponentProps<typeof WeekBoard>["dayTotals"];
  const handleEventRecipe = (meal: MealType) => { setRecipe(meal); setTaste(meal.tasteScore?.toString() ?? ""); };
  return <main className="space-y-5 p-4 text-gray-800">
    <ToastContainer position="top-right" />
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Plan Diet</h1><p className="mt-1 text-sm text-gray-500">Wide scrolling week using the current diet cards. Illustrative data only.</p></div><div className="rounded-xl border bg-white px-5 py-3"><span className="mr-4 text-sm text-gray-500">Weekly total cost</span><strong className="text-xl">£{planCost(plan)?.toFixed(2)}</strong></div></header>
    <nav aria-label="Plan actions" className="flex flex-wrap gap-3"><button onClick={() => setPicker(true)} className="rounded-lg border px-4 py-3">Open larger meal picker</button><button onClick={() => handleEventRecipe(meals[0])} className="rounded-lg border px-4 py-3">Preview recipe and taste</button></nav>
    <div><WeekBoard meals={plan} dayTotals={totals} currentDay={day} todayWeekday="Friday" quantityOf={food => food.quantity ?? 1} onSelectDay={setDay} onAddMeal={next => { setDay(next); setPicker(true); }} onRemoveMeal={(next, index) => setPlan(current => ({ ...current, [next]: current[next].filter((_, mealIndex) => mealIndex !== index) }))} onChange={setPlan} onEventRecipe={handleEventRecipe} onEventSelectMeal={(day, meal) => { setDay(day); setSelected([meal]); }} /></div>
    <div className="flex items-center gap-3"><button disabled={plan === savedPlan} onClick={() => setSavedPlan(plan)} className="rounded-lg bg-green-500 px-4 py-3 text-white disabled:opacity-40">Save Changes</button><span className="text-sm text-gray-500">{plan === savedPlan ? "Saved" : "Unsaved week"}</span></div>
    {selected.length > 0 && <SelectedMealsMenu selectedMeals={selected} onEventCopyMeals={() => { setCopied(structuredClone(selected)); setSelected([]); }} onEventSpreadMeals={() => { setPlan(current => appendMeals(current, WEEKDAYS, selected)); setSelected([]); }} onEventClose={() => setSelected([])} />}
    <button type="button" onClick={() => setPlan(current => appendMeals(current, [day], copied))} className="rounded-lg border px-4 py-2">Paste into {day}</button>
    <MealPicker open={picker} day={day} meals={meals.filter(meal => matchesMeal(meal, query))} loading={false} query={query} onEventQuery={setQuery} onEventAdd={meal => setPlan(current => appendMeals(current, [day], [meal]))} onEventRecipe={handleEventRecipe} onEventClose={() => setPicker(false)}/>
    <MealRecipe meal={recipe} taste={taste} onEventTaste={setTaste} onEventSave={() => setRecipe(current => current && ({ ...current, tasteScore: taste ? Number(taste) : null }))} onEventClose={() => setRecipe(null)}/>
  </main>;
}
createRoot(document.getElementById("root")!).render(<PlannerTheme><Preview/></PlannerTheme>);
