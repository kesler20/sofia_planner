import * as React from "react";
import { ToggleButton } from "@mui/material";
import { FoodType, MealType } from "../../types";
import MainButton from "../../components/button/MainButton";
import { Table } from "../../components/table/Table";
import { buildSearchableText, useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";

const createEmptyMeal = (name: string): MealType => ({
  name,
  foods: [],
  tasteScore: 5,
});

const getFoodQuantity = (food: FoodType) => food.quantity ?? 1;

export default function Meal() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const [foodsFromDb] = useCachedValue<FoodType[]>(email, [], "foods");
  const [mealsFromDb, setMealsFromDb, isLoading] = useStoredValue<MealType[]>(
    email,
    [],
    "meals",
  );
  const [draftMeal, setDraftMeal] = React.useState<MealType>(createEmptyMeal(""));
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  // No auto-select: this page is for creating meals only.

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Meal
  const handleEventAddMeal = () => {
    const cleanName = draftMeal.name.trim();
    if (!cleanName) {
      toastFactory("Name the meal before adding it.", MessageSeverity.WARNING);
      return;
    }

    if (mealsFromDb.some((meal) => meal.name === cleanName)) {
      toastFactory("Meal names must be unique.", MessageSeverity.WARNING);
      return;
    }

    setMealsFromDb((prev) => [...prev, { ...draftMeal, name: cleanName }]);
    setDraftMeal(createEmptyMeal(""));
    toastFactory("Meal added", MessageSeverity.SUCCESS);
  };

  const handleEventChangeMealName = (name: string) => {
    setDraftMeal((prev) => ({ ...prev, name }));
  };

  // ------------------------------------------------------ Food
  const handleEventToggleFood = (food: FoodType) => {
    setDraftMeal((prev) => {
      const foodIsSelected = prev.foods.some((item) => item.name === food.name);
      if (foodIsSelected) {
        return {
          ...prev,
          foods: prev.foods.filter((item) => item.name !== food.name),
        };
      }

      return { ...prev, foods: [...prev.foods, { ...food, quantity: 1 }] };
    });
  };

  const handleEventChangeFoodQuantity = (foodName: string, quantity: number) => {
    setDraftMeal((prev) => ({
      ...prev,
      foods: prev.foods.map((food) =>
        food.name !== foodName ? food : { ...food, quantity },
      ),
    }));
  };

  // ------------------------------------------------------ Search
  const handleEventSearchFoods = (query: string) => {
    setSearchQuery(query);
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getFoodInSelectedMeal = (foodName: string) => {
    return draftMeal.foods.find((food) => food.name === foodName) ?? null;
  };

  const getMealTotal = (meal: MealType) => ({
    calories: meal.foods.reduce(
      (sum, food) => sum + food.calories * getFoodQuantity(food),
      0,
    ),
    protein: meal.foods.reduce(
      (sum, food) => sum + food.protein * getFoodQuantity(food),
      0,
    ),
    cost: meal.foods.reduce(
      (sum, food) => sum + (food.cost ?? 0) * getFoodQuantity(food),
      0,
    ),
  });

  const getFoodMatchesSearch = (food: FoodType) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return buildSearchableText([
      food.name,
      food.calories,
      food.protein,
      food.cost ?? "unmatched",
      food.vendor ?? "unmatched",
      food.amount,
    ]).includes(normalizedQuery);
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  if (isLoading) {
    return <LoadingAnimation />;
  }

  const filteredFoods = foodsFromDb.filter(getFoodMatchesSearch);
  const selectedMealTotal = getMealTotal(draftMeal);
  const selectedMealAmount = draftMeal.foods.reduce(
    (sum, food) => sum + food.amount * getFoodQuantity(food),
    0,
  );

  return (
    <div className="w-full flex flex-col items-center p-2 sm:p-3 h-[calc(100vh-88px)] box-border overflow-hidden">
      {/* Food selector header (aligned like EditMeal) */}
      <div className="w-full max-w-[1100px] flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-2 text-gray-500">
        <div className="hidden sm:flex sm:w-1/4 items-center justify-center">
          <p className="font-bold text-gray-600">Create Meal</p>
        </div>

        <div className="flex-1 min-w-[170px] sm:w-1/3 flex items-center justify-center">
          <input
            className="border-b w-full text-center outline-none"
            placeholder="New meal name"
            value={draftMeal.name}
            onChange={(event) => handleEventChangeMealName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleEventAddMeal();
              }
            }}
          />
        </div>

        <div className="w-auto sm:w-1/3 flex items-center justify-center">
          <MainButton
            text="Create Meal"
            onSubmit={handleEventAddMeal}
            iconOnlyOnMobile
            className="!mt-0 !mb-0"
          />
        </div>
      </div>

      <div className="w-full max-w-[1100px] flex-1 min-h-0 bg-white p-2 rounded shadow flex flex-col">
        {/* Search */}
        <div className="w-full flex justify-center mb-2">
          <input
            className="border-b w-full max-w-[420px] text-center outline-none"
            placeholder="Search foods"
            value={searchQuery}
            onChange={(event) => handleEventSearchFoods(event.target.value)}
          />
        </div>

        {/* Foods */}
        <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-auto scrollbar-hide">
          <Table>
            <tbody>
              <tr>
                <th>Food Name</th>
                <th>Select</th>
                <th className="hidden sm:table-cell">Amount (g)</th>
                <th>Qty</th>
                <th><span className="sm:hidden">Kcal</span><span className="hidden sm:inline">Food Calories (Kcal)</span></th>
                <th><span className="sm:hidden">Prot</span><span className="hidden sm:inline">Food Protein (g)</span></th>
                <th className="hidden sm:table-cell">Food Cost (£)</th>
                <th className="hidden sm:table-cell">Vendor</th>
              </tr>
              {filteredFoods.map((food) => {
                const selectedFood = getFoodInSelectedMeal(food.name);
                return (
                  <tr key={food.name} className={selectedFood ? "selected" : ""}>
                    <td className="min-w-[120px] text-left">{food.name}</td>
                    <td>
                      <ToggleButton
                        value="check"
                        selected={Boolean(selectedFood)}
                        onClick={() => handleEventToggleFood(food)}
                      />
                    </td>
                    <td className="hidden sm:table-cell">{food.amount ?? 0}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="text-center"
                        disabled={!selectedFood}
                        value={selectedFood ? String(getFoodQuantity(selectedFood)) : "1"}
                        onChange={(event) => {
                          const next =
                            event.target.value === "" ? 0 : Number(event.target.value);
                          handleEventChangeFoodQuantity(food.name, next);
                        }}
                      />
                    </td>
                    <td>{selectedFood?.calories ?? food.calories}</td>
                    <td>{selectedFood?.protein ?? food.protein}</td>
                    <td className="hidden sm:table-cell">
                      {(selectedFood?.cost ?? food.cost)?.toFixed(2) ?? "unmatched"}
                    </td>
                    <td className="hidden sm:table-cell">{food.vendor ?? "unmatched"}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* Total */}
        <div className="sticky bottom-0 bg-white pt-2">
          <div className="grid grid-cols-5 gap-1 rounded-xl border border-gray-200 bg-white p-2 text-center text-[11px] font-semibold text-gray-500 md:hidden">
            <div>
              <p className="text-gray-400">Sel</p>
              <p>{draftMeal.foods.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Amt</p>
              <p>{selectedMealAmount}</p>
            </div>
            <div>
              <p className="text-gray-400">Kcal</p>
              <p>{selectedMealTotal.calories}</p>
            </div>
            <div>
              <p className="text-gray-400">Prot</p>
              <p>{selectedMealTotal.protein}</p>
            </div>
            <div>
              <p className="text-gray-400">£</p>
              <p>{selectedMealTotal.cost.toFixed(2)}</p>
            </div>
          </div>
          <Table className="hidden md:table">
            <tbody>
              <tr>
                <th>Additional Info</th>
                <th>Total Selected</th>
                <th>Total Amount (g)</th>
                <th>Total Calories (Kcal)</th>
                <th>Total Protein (g)</th>
                <th>Total Cost (£)</th>
                <th>Additional Info</th>
              </tr>
              <tr>
                <td>{draftMeal.name.trim() || "..."}</td>
                <td>{draftMeal.foods.length}</td>
                <td>{selectedMealAmount}</td>
                <td>{selectedMealTotal.calories}</td>
                <td>{selectedMealTotal.protein}</td>
                <td>{selectedMealTotal.cost.toFixed(2)}</td>
                <td>
                  {draftMeal.name.trim()
                    ? `${draftMeal.tasteScore}/10 taste`
                    : "..."}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
