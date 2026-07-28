import React from "react";
import CustomModal from "../../components/modal/CustomModal";
import { MenuItem, Select } from "@mui/material";
import { DietType, MealType, WeekdayType } from "../../types";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import {
  MdCalendarMonth,
  MdContentCopy,
  MdContentPaste,
} from "react-icons/md";
import { Table } from "../../components/table/Table";
import MainButton from "../../components/button/MainButton";
import IOSSwitch from "../../components/switch/IOSSwitch";
import { useStoredValue } from "../../utils";
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
    <div className="flex w-auto md:w-full justify-start items-center text-gray-500">
      <div
        className={`
              flex justify-center items-center
              w-[38px] h-[38px]
              border border-gray-900
              rounded-full text-gray-900
              cursor-pointer
              ml-2 md:mr-6`}
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

const getFoodQuantity = (food: MealType["foods"][number]) => food.quantity ?? 1;

function SelectedMealsMenu(props: {
  selectedMeals: MealType[];
  onEventCopyMeals: () => void;
  onEventSpreadMeals: () => void;
  onEventClose: () => void;
}) {
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
        {props.selectedMeals.map((meal) => (
          <li key={meal.name} className="text-gray-700 text-lg font-semibold">
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

export default function Diet() {
  const email = localStorage.getItem("global/email") || "guest";
  const [diets, setDiets] = useStoredValue<DietType[]>(
    email,
    defaultDiets,
    "diets"
  );
  const activeDiet = diets.find((d) => d.active) ?? diets[0];

  // Browsing the dropdown only changes which diet is displayed. The activate
  // switch reflects and updates the displayed diet's actual active state.
  const [previewedDietName, setPreviewedDietName] = React.useState<string | null>(
    null
  );
  const viewedDiet =
    diets.find((d) => d.name === previewedDietName) ?? activeDiet;

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
  const [mealsFromDb, , mealsAreLoading] = useStoredValue<MealType[]>(
    email,
    [],
    "meals"
  );
  const [currentDayTotal, setCurrentDayTotal] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
    tasteScore: 0,
  });
  const [weeklyAverage, setWeeklyAverage] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
    tasteScore: 0,
  });
  const [selectedMeals, setSelectedMeals] = React.useState<MealType[]>([]);

  const updateDietByName = (
    dietName: string,
    updater: (diet: DietType) => DietType
  ) => {
    setDiets((prev) => prev.map((d) => (d.name === dietName ? updater(d) : d)));
  };

  const updateViewedDiet = (updater: (diet: DietType) => DietType) => {
    updateDietByName(viewedDiet.name, updater);
  };

  const averageTasteScore = (meals: MealType[]) =>
    meals.length
      ? meals.reduce((sum, m) => sum + m.tasteScore, 0) / meals.length
      : 0;

  const calculateTotal = React.useCallback(() => {
    const dayMeals = viewedDiet.meals[currentDay];
    const dailyTotal = { calories: 0, protein: 0, cost: 0 };
    dayMeals.forEach((meal: MealType) => {
      meal.foods.forEach((food) => {
        dailyTotal.calories += food.calories * getFoodQuantity(food);
        dailyTotal.protein += food.protein * getFoodQuantity(food);
        dailyTotal.cost += (food.cost ?? 0) * getFoodQuantity(food);
      });
    });
    setCurrentDayTotal({ ...dailyTotal, tasteScore: averageTasteScore(dayMeals) });

    const weekTotal = { calories: 0, protein: 0, cost: 0 };
    let allMeals: MealType[] = [];
    const weekDays = Object.keys(viewedDiet.meals) as WeekdayType[];
    weekDays.forEach((day) => {
      const meals = viewedDiet.meals[day as WeekdayType];
      allMeals = allMeals.concat(meals);
      meals.forEach((meal: MealType) => {
        meal.foods.forEach((food) => {
          weekTotal.calories += food.calories * getFoodQuantity(food);
          weekTotal.protein += food.protein * getFoodQuantity(food);
          weekTotal.cost += (food.cost ?? 0) * getFoodQuantity(food);
        });
      });
    });
    setWeeklyAverage({
      calories: weekTotal.calories / weekDays.length,
      protein: weekTotal.protein / weekDays.length,
      cost: weekTotal.cost / weekDays.length,
      tasteScore: averageTasteScore(allMeals),
    });
  }, [viewedDiet, currentDay]);

  React.useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  React.useEffect(() => {
    setSelectedMeals([]);
  }, [currentDay]);

  const copySelectedMealsToClipboard = () => {
    if (!selectedMeals.length) {
      toastFactory("Select a meal before copying.", MessageSeverity.WARNING);
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(selectedMeals));
    toastFactory("Meals copied to clipboard", MessageSeverity.SUCCESS);
  };

  const pasteSelectedMealsFromClipboard = async () => {
    const text = await navigator.clipboard.readText();
    let copiedMeals: MealType[] = [];
    try {
      copiedMeals = JSON.parse(text) as MealType[];
    } catch {
      toastFactory("Invalid meals in clipboard.", MessageSeverity.ERROR);
      return;
    }

    if (!Array.isArray(copiedMeals) || copiedMeals.length === 0) {
      toastFactory("No meals to paste.", MessageSeverity.WARNING);
      return;
    }

    updateViewedDiet((diet) => ({
      ...diet,
      meals: {
        ...diet.meals,
        [currentDay]: [
          ...diet.meals[currentDay],
          ...copiedMeals.filter(
            (meal) => !diet.meals[currentDay].some((item) => item.name === meal.name),
          ),
        ] as MealType[],
      },
    }));
    toastFactory(`Pasted ${copiedMeals.length} meals`, MessageSeverity.INFO);
  };

  const addMealToDiet = (meal: MealType) => {
    updateViewedDiet((diet) => {
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
    updateViewedDiet((diet) => ({
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

  const spreadSelectedMealsToAllDays = () => {
    if (!selectedMeals.length) {
      toastFactory("Select meals before spreading.", MessageSeverity.WARNING);
      return;
    }

    updateViewedDiet((diet) => {
      const nextMeals = { ...diet.meals };
      (Object.keys(nextMeals) as WeekdayType[]).forEach((day) => {
        nextMeals[day] = [
          ...nextMeals[day],
          ...selectedMeals.filter(
            (meal) => !nextMeals[day].some((item) => item.name === meal.name),
          ),
        ];
      });

      return { ...diet, meals: nextMeals };
    });
    toastFactory(
      `Spread ${selectedMeals.length} meals to all days`,
      MessageSeverity.INFO,
    );
  };

  const activateAndFinalizeDiet = (dietName: string) => {
    setDiets((prev) =>
      prev.map((d) =>
        d.name === dietName
          ? { ...d, active: true, finalizedAt: new Date().toISOString() }
          : { ...d, active: false }
      )
    );
  };

  const handleEventSelectDiet = (dietName: string) => {
    setPreviewedDietName(dietName);
  };

  const handleEventToggleActivateDiet = (checked: boolean) => {
    if (checked) {
      activateAndFinalizeDiet(viewedDiet.name);
      return;
    }

    setDiets((prev) =>
      prev.map((diet) =>
        diet.name !== viewedDiet.name ? diet : { ...diet, active: false }
      )
    );
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
    setPreviewedDietName(newDietName);
    setNewDietName("");
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
    <div className="w-full flex flex-col items-center justify-start min-h-screen bg-white">
      {/* Selected meals menu */}
      {selectedMeals.length > 0 && (
        <SelectedMealsMenu
          selectedMeals={selectedMeals}
          onEventCopyMeals={copySelectedMealsToClipboard}
          onEventSpreadMeals={spreadSelectedMealsToAllDays}
          onEventClose={() => setSelectedMeals([])}
        />
      )}

      {/* Diet selector */}
      <Card className="w-[calc(100%-1rem)] md:w-1/2 max-w-[900px] mt-2 md:mt-4 bg-white p-2 md:p-4 py-4 md:py-6">
        <CardSectionDivider title="Select Diet" />
        <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Select
                className="w-full"
                value={viewedDiet.name}
                onChange={(event: any) => handleEventSelectDiet(event.target.value)}
              >
                {diets.map((diet, index) => (
                  <MenuItem key={index} value={diet.name}>
                    {diet.name}
                    {diet.active ? " (active)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <p className="text-[10px] text-gray-500">Active</p>
              <IOSSwitch
                checked={viewedDiet.active}
                onChange={(event) =>
                  handleEventToggleActivateDiet(event.target.checked)
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border-b text-center w-full outline-none"
              placeholder="New diet name"
              value={newDietName}
              onChange={(e) => setNewDietName(e.target.value)}
            />
            <MainButton
              text="New Diet"
              onSubmit={createDiet}
              iconOnlyOnMobile
              className="!mt-0 !mb-0 shrink-0"
            />
          </div>
        </div>
      </Card>

      {/* Main Card */}
      <Card className="w-[calc(100%-1rem)] md:w-1/2 max-w-[900px] mt-3 md:mt-4 bg-white p-2 md:p-4 py-4 md:py-6">
        {/* Card Header with the button and the Dropdown */}
        <div className="w-full flex flex-nowrap justify-between md:justify-evenly items-center gap-2">
          <CardTitle
            title={`Add Meals for ${currentDay}`}
            onClick={() => setSelectMealModalOpen(true)}
          />

          <button
            type="button"
            className="hidden md:flex md:h-auto md:w-full md:flex-1 items-center justify-start text-blue-500 md:mr-4"
            onClick={openMyFitnessPal}
            title="Open MyFitnessPal food diary"
          >
            Myfitnesspal Food Diary &gt;
          </button>

          {/* Top select menu */}
          <div className="ml-auto flex items-center gap-2">
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              className="h-10 min-w-[128px]"
              value={currentDay}
              onChange={(event: any) => {
                setCurrentDay(event.target.value as WeekdayType);
              }}
            >
              {Object.keys(viewedDiet.meals).map((day, index) => (
                <MenuItem key={index} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
            <button
              type="button"
              className="px-3 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition flex items-center gap-1"
              title="Paste Meals"
              onClick={pasteSelectedMealsFromClipboard}
            >
              <MdContentPaste size={16} />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>
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
        <div className="w-full min-h-[220px] max-h-[400px] my-4 md:my-6 overflow-x-hidden overflow-y-scroll custom-scrollbar rounded-xl border border-gray-200">
          <Table>
            <tbody>
              <tr>
                <th className="hidden md:table-cell">Select</th>
                <th>Meal</th>
                <th className="hidden md:table-cell">Foods</th>
                <th><span className="md:hidden">Kcal</span><span className="hidden md:inline">Calories (Kcal)</span></th>
                <th><span className="md:hidden">Prot</span><span className="hidden md:inline">Protein (g)</span></th>
                <th><span className="md:hidden">Info</span><span className="hidden md:inline">Cost (£)</span></th>
                <th className="hidden md:table-cell">Taste</th>
                <th><span className="sr-only md:not-sr-only">Remove</span></th>
              </tr>
              {viewedDiet.meals[currentDay].map((meal: MealType) => {
                const isMealSelected = selectedMeals.some(
                  (item: MealType) => item.name === meal.name
                );
                const mealCalories = meal.foods.reduce(
                  (s, f) => s + f.calories * getFoodQuantity(f),
                  0,
                );
                const mealProtein = meal.foods.reduce(
                  (s, f) => s + f.protein * getFoodQuantity(f),
                  0,
                );
                const mealCost = meal.foods.reduce(
                  (s, f) => s + (f.cost ?? 0) * getFoodQuantity(f),
                  0,
                );
                return (
                  <tr
                    key={meal.name}
                    className={isMealSelected ? "selected" : ""}
                    onClick={() => toggleMealSelection(meal)}
                  >
                    <td className="hidden md:table-cell">
                      <IoIosAdd size={24} className="cursor-pointer" />
                    </td>
                    <td className="max-w-[96px] truncate text-left md:max-w-none">
                      {meal.name}
                    </td>
                    <td className="hidden md:table-cell">{meal.foods.length}</td>
                    <td>{mealCalories}</td>
                    <td>{mealProtein}</td>
                    <td>
                      <span className="md:hidden">
                        £{mealCost.toFixed(1)} {meal.tasteScore}/10
                      </span>
                      <span className="hidden md:inline">{mealCost.toFixed(2)}</span>
                    </td>
                    <td className="hidden md:table-cell">{meal.tasteScore}/10</td>
                    <td>
                      <IoIosRemove
                        size={24}
                        className="cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeMealFromDiet(meal);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {/* Card Footer with the total */}
        <CardSectionDivider title="Daily Total" />
        <Card className="flex items-center justify-evenly min-h-[70px] mt-4 px-2 md:px-4 py-3 bg-white">
          <div className="grid grid-cols-2 md:flex md:flex-row w-full items-center justify-evenly gap-2">
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Calories:{currentDayTotal.calories} kcal
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Protein:{currentDayTotal.protein} g
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Cost:£{currentDayTotal.cost.toFixed(2)}
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Taste:{currentDayTotal.tasteScore.toFixed(1)}/10
            </p>
          </div>
        </Card>
      </Card>

      {/* Weekly Average */}
      <Card className="w-[calc(100%-1rem)] md:w-1/2 max-w-[900px] mt-3 md:mt-4 mb-8 bg-white p-2 md:p-4 py-4 md:py-6">
        <CardSectionDivider title="Weekly Average" />
        <Card className="flex items-center justify-evenly min-h-[70px] mt-4 px-2 md:px-4 py-3 bg-white">
          <div className="grid grid-cols-2 md:flex md:flex-row w-full items-center justify-evenly gap-2">
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Calories:{weeklyAverage.calories.toFixed(0)} kcal
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Protein:{weeklyAverage.protein.toFixed(0)} g
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Cost:£{weeklyAverage.cost.toFixed(2)}
            </p>
            <p className="text-sm md:text-xl text-gray-400 font-bold">
              Taste:{weeklyAverage.tasteScore.toFixed(1)}/10
            </p>
          </div>
        </Card>
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
          <div className="flex h-[150px] w-[210px] flex-col justify-start items-center overflow-x-hidden overflow-y-scroll custom-scrollbar">
            {mealsAreLoading && (
              <Card className="text-gray-500 mb-2 mx-2 p-2 pl-8">
                <p className="text-gray-600 font-bold">Loading meals</p>
              </Card>
            )}
            {!mealsAreLoading && mealsFromDb.length === 0 && (
              <Card className="text-gray-500 mb-2 mx-2 p-2 pl-8">
                <p className="text-gray-600 font-bold">No meals</p>
              </Card>
            )}
            {!mealsAreLoading && mealsFromDb.map((meal: MealType) => {
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
