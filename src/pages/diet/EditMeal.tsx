import * as React from "react";
import {
  FormControl,
  ToggleButton,
  Select,
  MenuItem,
} from "@mui/material";
import { FoodType, MealType } from "../../types";
import MainButton from "../../components/button/MainButton";
import { Table } from "../../components/table/Table";
import { buildSearchableText, useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";

const getFoodQuantity = (food: FoodType) => food.quantity ?? 1;

export default function EditMeal() {

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

  const [selectedMealName, setSelectedMealName] = React.useState<string>("");
  const [localMeal, setLocalMeal] = React.useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    if (!selectedMealName && mealsFromDb.length > 0) {
      setSelectedMealName(mealsFromDb[0].name);
    }
  }, [mealsFromDb, selectedMealName]);

  React.useEffect(() => {
    const meal = mealsFromDb.find((m) => m.name === selectedMealName) ?? null;
    setLocalMeal(
      meal ? { ...meal, foods: meal.foods.map((f) => ({ ...f })) } : null,
    );
  }, [selectedMealName, mealsFromDb]);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Meal
  const handleSelectMeal = (name: string) => setSelectedMealName(name);

  const handleChangeMealName = (next: string) => {
    setLocalMeal((prev) => (prev ? { ...prev, name: next } : prev));
  };

  // ------------------------------------------------------ Food
  const handleToggleFood = (food: FoodType) => {
    setLocalMeal((prev) => {
      if (!prev) {
        return prev;
      }

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

  const handleChangeFoodQuantity = (foodName: string, quantity: number) => {
    setLocalMeal((prev) =>
      prev
        ? {
            ...prev,
            foods: prev.foods.map((f) =>
              f.name !== foodName ? f : { ...f, quantity },
            ),
          }
        : prev,
    );
  };

  const handleSave = () => {
    if (!localMeal) return;

    const cleanName = localMeal.name.trim();
    if (!cleanName) {
      toastFactory("Meal must have a name.", MessageSeverity.WARNING);
      return;
    }

    // check name uniqueness (allow if renaming the same meal)
    const nameTaken = mealsFromDb.some(
      (m) => m.name === cleanName && m.name !== selectedMealName,
    );
    if (nameTaken) {
      toastFactory("Another meal with that name exists.", MessageSeverity.WARNING);
      return;
    }

    setMealsFromDb((prev) =>
      prev.map((meal) => {
        if (meal.name !== selectedMealName) return meal;
        return { ...localMeal, name: cleanName };
      }),
    );

    setSelectedMealName(cleanName);
    toastFactory("Meal saved", MessageSeverity.SUCCESS);
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

  const getFoodInMeal = (foodName: string) => {
    return localMeal?.foods.find((food) => food.name === foodName) ?? null;
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
      food.amount,
      food.calories,
      food.protein,
      food.cost ?? "unmatched",
      food.vendor ?? "unmatched",
    ]).includes(normalizedQuery);
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  if (isLoading) return <LoadingAnimation />;

  const filteredFoods = foodsFromDb.filter(getFoodMatchesSearch);
  const mealTotal = localMeal
    ? getMealTotal(localMeal)
    : { calories: 0, protein: 0, cost: 0 };
  const mealAmount =
    localMeal?.foods.reduce(
      (sum, food) => sum + food.amount * getFoodQuantity(food),
      0,
    ) ?? 0;

  return (
    <div className="w-full flex flex-col items-center p-2 sm:p-3 h-[calc(100vh-88px)] box-border overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-[1100px] flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-2">

        <div className="w-full sm:w-1/4 flex items-center justify-center">
          <FormControl variant="outlined" size="small" className="flex-1">
            <Select
              labelId="select-meal-label"
              label="Select meal"
              fullWidth
              value={selectedMealName}
              onChange={(e) => handleSelectMeal(e.target.value as string)}
            >
              <MenuItem value="">-- Select a meal --</MenuItem>
              {mealsFromDb.map((meal) => (
                <MenuItem key={meal.name} value={meal.name}>
                  {meal.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="flex-1 min-w-[170px] sm:w-1/3 flex items-center justify-center">
          <input
            className="border-b w-full text-center outline-none"
            value={localMeal?.name ?? ""}
            onChange={(e) => handleChangeMealName(e.target.value)}
            placeholder="Meal Name"
          />
        </div>

        <div className="w-auto sm:w-1/3 flex items-center justify-center">
          <MainButton
            text="Save Changes"
            onSubmit={handleSave}
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
            onChange={(e) => handleEventSearchFoods(e.target.value)}
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
                <th><span className="sm:hidden">Kcal</span><span className="hidden sm:inline">Calories</span></th>
                <th><span className="sm:hidden">Prot</span><span className="hidden sm:inline">Protein</span></th>
                <th className="hidden sm:table-cell">Cost (£)</th>
                <th className="hidden sm:table-cell">Vendor</th>
              </tr>
              {filteredFoods.map((food) => {
                const selectedFood = getFoodInMeal(food.name);
                return (
                  <tr key={food.name} className={selectedFood ? "selected" : ""}>
                    <td className="min-w-[120px] text-left">{food.name}</td>
                    <td>
                      <ToggleButton
                        value="check"
                        selected={Boolean(selectedFood)}
                        disabled={!localMeal}
                        onClick={() => handleToggleFood(food)}
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
                        onChange={(e) =>
                          handleChangeFoodQuantity(food.name, Number(e.target.value || 0))
                        }
                      />
                    </td>
                    <td>{selectedFood?.calories ?? food.calories}</td>
                    <td>{selectedFood?.protein ?? food.protein}</td>
                    <td className="hidden sm:table-cell">
                      {(selectedFood?.cost ?? food.cost)?.toFixed(2) ?? "unmatched"}
                    </td>
                    <td className="hidden sm:table-cell">
                      {selectedFood?.vendor ?? food.vendor ?? "unmatched"}
                    </td>
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
              <p>{localMeal?.foods.length ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-400">Amt</p>
              <p>{mealAmount}</p>
            </div>
            <div>
              <p className="text-gray-400">Kcal</p>
              <p>{mealTotal.calories}</p>
            </div>
            <div>
              <p className="text-gray-400">Prot</p>
              <p>{mealTotal.protein}</p>
            </div>
            <div>
              <p className="text-gray-400">£</p>
              <p>{mealTotal.cost.toFixed(2)}</p>
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
                <td>{localMeal?.name.trim() || "..."}</td>
                <td>{localMeal?.foods.length ?? 0}</td>
                <td>{mealAmount}</td>
                <td>{mealTotal.calories}</td>
                <td>{mealTotal.protein}</td>
                <td>{mealTotal.cost.toFixed(2)}</td>
                <td>
                  {localMeal ? `${localMeal.tasteScore}/10 taste` : "..."}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
