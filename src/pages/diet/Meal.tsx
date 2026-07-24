import React from "react";
import { FoodType, MealType } from "../../types";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";
import { Card, CardSectionDivider, CardTitle } from "./Diet";

export default function Meal() {
  const email = localStorage.getItem("global/email") || "guest";
  const [foodsFromDb] = useCachedValue<FoodType[]>(email, [], "foods");
  const [mealsFromDb, setMealsFromDb, isLoading] = useStoredValue<MealType[]>(
    email,
    [],
    "meals"
  );
  const [mealName, setMealName] = React.useState("");
  const [tasteScore, setTasteScore] = React.useState(5);
  const [selectedFoods, setSelectedFoods] = React.useState<FoodType[]>([]);

  if (isLoading) {
    return <LoadingAnimation />;
  }

  const toggleFood = (food: FoodType) => {
    setSelectedFoods((prev) =>
      prev.some((f) => f.name === food.name)
        ? prev.filter((f) => f.name !== food.name)
        : [...prev, food]
    );
  };

  const createMeal = () => {
    if (!mealName || selectedFoods.length === 0) {
      toastFactory(
        "Name the meal and pick at least one food.",
        MessageSeverity.WARNING
      );
      return;
    }
    const meal: MealType = { name: mealName, foods: selectedFoods, tasteScore };
    setMealsFromDb([...mealsFromDb, meal]);
    toastFactory("Meal created successfully", MessageSeverity.SUCCESS);
    setMealName("");
    setTasteScore(5);
    setSelectedFoods([]);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start h-[70vh] mt-12">
      <Card className="min-w-[300px] w-1/2 max-w-[900px] mt-4 bg-white p-2">
        <CardTitle title="New Meal" />
        <div className="w-full flex flex-col gap-2 px-2 mt-4">
          <label>
            Meal Name
            <input
              className="border-b w-full text-center"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
          </label>
          <label>
            Taste Score (1-10)
            <input
              type="number"
              min={1}
              max={10}
              className="border-b w-full text-center"
              value={tasteScore}
              onChange={(e) =>
                setTasteScore(Math.min(10, Math.max(1, Number(e.target.value))))
              }
            />
          </label>
        </div>

        <CardSectionDivider title="Pick Foods for this Meal" />
        <div className="w-full max-h-[300px] my-4 flex flex-col justify-start overflow-y-scroll custom-scrollbar">
          {foodsFromDb.map((food) => {
            const isSelected = selectedFoods.some((f) => f.name === food.name);
            return (
              <Card
                key={food.name}
                className={`text-gray-500 p-2 pl-8 hover:glow ${
                  isSelected ? "bg-blue-100" : ""
                }`}
                onClick={() => toggleFood(food)}
              >
                <div className="w-full flex justify-between">
                  <p className="text-gray-600 font-bold">{food.name}</p>
                  {isSelected ? (
                    <IoIosRemove size={24} />
                  ) : (
                    <IoIosAdd size={24} />
                  )}
                </div>
                <p>Calories: {food.calories} (kcal)</p>
                <p>Protein: {food.protein} (g)</p>
              </Card>
            );
          })}
        </div>

        <div className="w-full flex items-center justify-center my-4">
          <button
            className="bg-gray-600 text-white rounded-2xl px-4 py-2"
            onClick={createMeal}
          >
            Save Meal
          </button>
        </div>
      </Card>
    </div>
  );
}
