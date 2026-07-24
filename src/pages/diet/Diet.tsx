import React from "react";
import CustomModal from "../../components/modal/CustomModal";
import { MenuItem, Select } from "@mui/material";
import { DietType, MealType, WeekdayType } from "../../types";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

export function Card(props: {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: any;
}) {
  return (
    <div
      style={props.style}
      onClick={props.onClick}
      className={`
    border border-gray-200 rounded-2xl shadow-md
    px-4
    w-full
    ${props.className}`}
    >
      {props.children}
    </div>
  );
}

export function CardTitle(props: { title: string; onClick?: () => void }) {
  return (
    <div className="flex w-full justify-start items-center text-gray-500">
      <div
        className={`
              flex justify-center items-center
              w-[38px] h-[38px]
              bg-gray-600
              rounded-full text-gray-200
              cursor-pointer
              ml-2 mr-6`}
      >
        <IoIosAdd size={20} onClick={props.onClick} />
      </div>
      <p className="hidden md:block">{props.title}</p>
    </div>
  );
}

export function CardSectionDivider(props: { title: string }) {
  return (
    <>
      <h2 className="font-bold text-gray-600 mt-4">{props.title}</h2>
      <div className="w-full border"></div>
    </>
  );
}

const emptyWeekPlan: DietType["meals"] = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

const defaultDiets: DietType[] = [
  { name: "Default", active: true, finalizedAt: null, meals: emptyWeekPlan },
];

type DietData = { calories: number; protein: number; cost: number; tasteScore: number };

export default function Diet() {
  const email = localStorage.getItem("global/email") || "guest";
  const [diets, setDiets] = useStoredValue<DietType[]>(
    email,
    defaultDiets,
    "diets"
  );
  const activeDiet = diets.find((d) => d.active) ?? diets[0];

  // Infer today's weekday as default
  const jsDayToWeekday: WeekdayType[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [selectMealModalOpen, setSelectMealModalOpen] = React.useState(false);
  const [newDietName, setNewDietName] = React.useState("");
  const today = new Date();
  const todayWeekday = jsDayToWeekday[today.getDay()];
  const [currentDay, setCurrentDay] = React.useState<WeekdayType>(todayWeekday);
  const [mealsFromDb] = useCachedValue<MealType[]>(email, [], "meals");
  const [currentDayTotal, setCurrentDayTotal] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
    tasteScore: 0,
  });
  const [weeklyTotal, setWeeklyTotal] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
    tasteScore: 0,
  });
  const [selectedMeals, setSelectedMeals] = React.useState<MealType[]>([]);

  const updateActiveDiet = (updater: (diet: DietType) => DietType) => {
    setDiets((prev) =>
      prev.map((d) => (d.name === activeDiet.name ? updater(d) : d))
    );
  };

  const averageTasteScore = (meals: MealType[]) =>
    meals.length
      ? meals.reduce((sum, m) => sum + m.tasteScore, 0) / meals.length
      : 0;

  const calculateTotal = React.useCallback(() => {
    const dayMeals = activeDiet.meals[currentDay];
    const dailyTotal = { calories: 0, protein: 0, cost: 0 };
    dayMeals.forEach((meal: MealType) => {
      meal.foods.forEach((food) => {
        dailyTotal.calories += food.calories;
        dailyTotal.protein += food.protein;
        dailyTotal.cost += food.cost ?? 0;
      });
    });
    setCurrentDayTotal({ ...dailyTotal, tasteScore: averageTasteScore(dayMeals) });

    const weekTotal = { calories: 0, protein: 0, cost: 0 };
    let allMeals: MealType[] = [];
    Object.keys(activeDiet.meals).forEach((day) => {
      const meals = activeDiet.meals[day as WeekdayType];
      allMeals = allMeals.concat(meals);
      meals.forEach((meal: MealType) => {
        meal.foods.forEach((food) => {
          weekTotal.calories += food.calories;
          weekTotal.protein += food.protein;
          weekTotal.cost += food.cost ?? 0;
        });
      });
    });
    setWeeklyTotal({ ...weekTotal, tasteScore: averageTasteScore(allMeals) });
  }, [activeDiet, currentDay]);

  React.useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  React.useEffect(() => {
    setSelectedMeals([]);
  }, [currentDay]);

  // listen to the copy and paste events
  React.useEffect(() => {
    document.addEventListener("copy", copySelectedMealsToClipboard);
    document.addEventListener("paste", pasteSelectedMealsFromClipboard);

    return () => {
      document.removeEventListener("copy", copySelectedMealsToClipboard);
      document.removeEventListener("paste", pasteSelectedMealsFromClipboard);
    };
  }, [selectedMeals]);

  const copySelectedMealsToClipboard = () => {
    if (!selectedMeals.length) {
      toastFactory("Select a meal before copying.", MessageSeverity.WARNING);
      return;
    }
    const text = selectedMeals.map((meal: MealType) => meal.name).join(", ");
    navigator.clipboard.writeText(text);
    toastFactory("Copied meal to clipboard", MessageSeverity.SUCCESS);
  };

  const pasteSelectedMealsFromClipboard = async () => {
    const text = await navigator.clipboard.readText();
    const mealNamesCopiedToClipboard = text.split(", ");
    updateActiveDiet((diet) => ({
      ...diet,
      meals: {
        ...diet.meals,
        [currentDay]: [
          ...diet.meals[currentDay],
          ...mealNamesCopiedToClipboard
            .map((mealName) => {
              if (diet.meals[currentDay].some((m) => m.name === mealName)) {
                return;
              }
              return mealsFromDb.find((m: MealType) => m.name === mealName);
            })
            .filter(Boolean),
        ] as MealType[],
      },
    }));
  };

  const addMealToDiet = (meal: MealType) => {
    updateActiveDiet((diet) => {
      if (diet.meals[currentDay].some((m) => m.name === meal.name)) {
        return diet;
      }
      return {
        ...diet,
        meals: {
          ...diet.meals,
          [currentDay]: [...diet.meals[currentDay], meal],
        },
      };
    });
  };

  const removeMealFromDiet = (meal: MealType) => {
    updateActiveDiet((diet) => ({
      ...diet,
      meals: {
        ...diet.meals,
        [currentDay]: diet.meals[currentDay].filter((m) => m.name !== meal.name),
      },
    }));
  };

  const toggleMealSelection = (meal: MealType) => {
    setSelectedMeals((prev) =>
      prev.some((m) => m.name === meal.name)
        ? prev.filter((m) => m.name !== meal.name)
        : [...prev, meal]
    );
  };

  const switchActiveDiet = (dietName: string) => {
    setDiets((prev) => prev.map((d) => ({ ...d, active: d.name === dietName })));
  };

  const createDiet = () => {
    if (!newDietName || diets.some((d) => d.name === newDietName)) {
      toastFactory(
        "Give the new diet a unique name.",
        MessageSeverity.WARNING
      );
      return;
    }
    setDiets((prev) => [
      ...prev.map((d) => ({ ...d, active: false })),
      { name: newDietName, active: true, finalizedAt: null, meals: emptyWeekPlan },
    ]);
    setNewDietName("");
  };

  const generateShoppingList = () => {
    updateActiveDiet((diet) => ({
      ...diet,
      finalizedAt: new Date().toISOString(),
    }));
    toastFactory(
      "Diet finalized — Cristiano Ronaldo's next run will export the shopping list.",
      MessageSeverity.SUCCESS
    );
  };

  // Map WeekdayType to JS day index
  const weekdayToJsDay: Record<WeekdayType, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const openMyFitnessPal = () => {
    // Today's date
    const now = new Date();
    // Find the offset between selected day and today
    const todayIdx = now.getDay();
    const selectedIdx = weekdayToJsDay[currentDay];
    // Calculate the date for the selected day in the current week (past or future)
    const diff = selectedIdx - todayIdx;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    window.open(
      `https://www.myfitnesspal.com/food/diary?date=${dateString}`,
      "_blank"
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-start h-[70vh] mt-12">
      {/* Diet selector */}
      <Card className="min-w-[300px] w-1/2 max-w-[900px] mt-4 bg-white p-2">
        <div className="w-full flex justify-evenly items-center flex-wrap gap-2 py-2">
          <Select
            value={activeDiet.name}
            onChange={(event: any) => switchActiveDiet(event.target.value)}
          >
            {diets.map((diet, index) => (
              <MenuItem key={index} value={diet.name}>
                {diet.name}
                {diet.finalizedAt ? " (finalized)" : ""}
              </MenuItem>
            ))}
          </Select>
          <input
            className="border-b text-center"
            placeholder="New diet name"
            value={newDietName}
            onChange={(e) => setNewDietName(e.target.value)}
          />
          <button
            className="bg-gray-600 text-white rounded-2xl px-3 py-1"
            onClick={createDiet}
          >
            + New Diet
          </button>
          <button
            className="bg-gray-600 text-white rounded-2xl px-3 py-1"
            onClick={generateShoppingList}
          >
            Generate Shopping List
          </button>
        </div>
      </Card>

      {/* Main Card */}
      <Card className="min-w-[300px] w-1/2 max-w-[900px] mt-4 bg-white p-2">
        {/* Card Header with the button and the Dropdown */}
        <div className="w-full flex justify-evenly items-center">
          <CardTitle
            title={`Add Meals for ${currentDay}`}
            onClick={() => setSelectMealModalOpen(true)}
          />

          <h3
            className="w-full text-blue-500 mr-4"
            onClick={openMyFitnessPal}
            style={{ cursor: "pointer" }}
          >
            Myfitnesspal Food Diary &gt;
          </h3>

          {/* Top select menu */}
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={currentDay}
            onChange={(event: any) => {
              setCurrentDay(event.target.value as WeekdayType);
            }}
          >
            {Object.keys(activeDiet.meals).map((day, index) => (
              <MenuItem key={index} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Card Body with the selected meals */}
        <CardSectionDivider title="Selected Meals" />
        <div className="flex w-full items-center justify-between px-2 mt-2">
          {selectedMeals.length > 0 && (
            <button
              type="button"
              className="text-xs text-blue-500 underline"
              onClick={() => setSelectedMeals([])}
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="w-full max-h-[400px] my-8 flex flex-col justify-center overflow-y-scroll custom-scrollbar overflow-x-hidden">
          {activeDiet.meals[currentDay].map((meal: MealType) => {
            const isMealSelected = selectedMeals.some(
              (item: MealType) => item.name === meal.name
            );
            const mealCalories = meal.foods.reduce((s, f) => s + f.calories, 0);
            const mealProtein = meal.foods.reduce((s, f) => s + f.protein, 0);
            const mealCost = meal.foods.reduce((s, f) => s + (f.cost ?? 0), 0);
            return (
              <Card
                key={meal.name}
                className={`text-gray-500 p-2 pl-8 hover:glow ${
                  isMealSelected ? "bg-blue-100" : ""
                }`}
                onClick={() => toggleMealSelection(meal)}
              >
                <div className="w-full flex justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600 font-bold">{meal.name}</p>
                  </div>
                  <IoIosRemove
                    size={30}
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeMealFromDiet(meal);
                    }}
                  />
                </div>
                <p>Calories: {mealCalories} (kcal)</p>
                <p>Protein: {mealProtein} (g)</p>
                <p>Cost: {mealCost} (£)</p>
                <p>Taste Score: {meal.tasteScore}/10</p>
                <p className="text-xs">
                  {meal.foods.map((f) => f.name).join(", ")}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Card Footer with the total */}
        <CardSectionDivider title="Daily Total" />
        <Card className="mt-4 p-2">
          <div className="flex md:flex-row flex-col w-full justify-evenly">
            <p>Calories: {currentDayTotal.calories} (kcal)</p>
            <p>Protein: {currentDayTotal.protein} (g)</p>
            <p>Cost: {currentDayTotal.cost} (£)</p>
            <p>Avg Taste Score: {currentDayTotal.tasteScore.toFixed(1)}/10</p>
          </div>
        </Card>
      </Card>

      {/* Weekly Total */}
      <Card className="min-w-[300px] w-1/2 max-w-[900px] mt-4 bg-white p-2">
        <p className="text-gray-600 font-bold">Weekly Total:</p>
        <div className="flex md:flex-row flex-col w-full justify-evenly">
          <p>Calories: {weeklyTotal.calories} (kcal)</p>
          <p>Protein: {weeklyTotal.protein} (g)</p>
          <p>Cost: {weeklyTotal.cost} (£)</p>
          <p>Avg Taste Score: {weeklyTotal.tasteScore.toFixed(1)}/10</p>
        </div>
      </Card>

      <CustomModal
        open={selectMealModalOpen}
        sections={[
          {
            name: "Search Meal",
            value: "default",
            onChange: (e) => console.log(e.target.value),
          },
        ]}
        body={
          <div className="flex h-[150px] w-[210px] flex-col justify-between items-center overflow-x-hidden overflow-y-scroll custom-scrollbar">
            {mealsFromDb.map((meal: MealType) => {
              return (
                <Card className="text-gray-500 mb-2 mx-2 p-2 pl-8" key={meal.name}>
                  <div className="w-full flex justify-between">
                    <p className="text-gray-600 font-bold">{meal.name}</p>
                    <IoIosAdd
                      size={30}
                      className="cursor-pointer"
                      onClick={() => addMealToDiet(meal)}
                    />
                  </div>
                  <p>Taste Score: {meal.tasteScore}/10</p>
                </Card>
              );
            })}
          </div>
        }
        onSubmit={() => console.log("submit")}
        handleClose={() => setSelectMealModalOpen(false)}
      />
    </div>
  );
}
