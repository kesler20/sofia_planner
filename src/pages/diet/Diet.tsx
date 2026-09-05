import * as React from "react";
import CustomModal from "../../components/modal/CustomModal";
import BasicModal from "../../components/modal/BasicModal";
import { MenuItem, Select } from "@mui/material";
import { DietType, MealType, WEEKDAYS, WeekdayType, WeekPlanType } from "../../types";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import {
  MdCalendarMonth,
  MdContentCopy,
  MdContentPaste,
} from "react-icons/md";
import { Table } from "../../components/table/Table";
import MainButton from "../../components/button/MainButton";
import IOSSwitch from "../../components/switch/IOSSwitch";
import { useCachedValue, useStoredValue } from "../../utils";
import WeekBoard, { type DayTotals } from "./WeekBoard";
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
  const [dietView, setDietView] = useCachedValue<"table" | "board">(
    email,
    "table",
    "dietView"
  );
  // Board edits are a draft until saved, unlike the table which persists on change. It
  // is keyed by diet name so switching diets cannot apply one diet's draft to another.
  const [boardDraft, setBoardDraft] = useCachedValue<{
    dietName: string;
    meals: WeekPlanType;
  } | null>(email, null, "dietBoardDraft");
  const [pendingViewSwitch, setPendingViewSwitch] = React.useState(false);
  const [isBoardWidth, setIsBoardWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  React.useEffect(() => {
    const handleResize = () => setIsBoardWidth(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [dayTotals, setDayTotals] = React.useState<Record<WeekdayType, DayTotals>>(
    () =>
      WEEKDAYS.reduce(
        (totals, day) => ({
          ...totals,
          [day]: { calories: 0, protein: 0, cost: 0, tasteScore: 0 },
        }),
        {} as Record<WeekdayType, DayTotals>
      )
  );

  // A draft is session state: a reload refetches from Redis and wins, so clear whatever
  // localStorage still holds on the first render rather than resurrecting stale edits.
  const draftClearedOnMount = React.useRef(false);
  if (!draftClearedOnMount.current) {
    draftClearedOnMount.current = true;
    if (boardDraft !== null) {
      setBoardDraft(null);
    }
  }

  const updateDietByName = (
    dietName: string,
    updater: (diet: DietType) => DietType
  ) => {
    setDiets((prev) => prev.map((d) => (d.name === dietName ? updater(d) : d)));
  };

  const updateViewedDiet = (updater: (diet: DietType) => DietType) => {
    updateDietByName(viewedDiet.name, updater);
  };

  // What the board shows: the unsaved draft when there is one for this diet, else the
  // saved plan. All totals read from here so the columns update as cards are dragged.
  const boardMeals =
    boardDraft && boardDraft.dietName === viewedDiet.name
      ? boardDraft.meals
      : viewedDiet.meals;
  const hasUnsavedBoardChanges =
    boardDraft !== null && boardDraft.dietName === viewedDiet.name;

  const activeView = dietView === "board" && isBoardWidth ? "board" : "table";

  const handleEventBoardChange = (meals: WeekPlanType) => {
    setBoardDraft({ dietName: viewedDiet.name, meals });
  };

  const handleEventSaveBoard = () => {
    if (!hasUnsavedBoardChanges) return;
    const meals = boardMeals;
    updateViewedDiet((diet) => ({ ...diet, meals }));
    setBoardDraft(null);
    toastFactory("Week saved", MessageSeverity.SUCCESS);
  };

  const handleEventDiscardBoard = () => {
    setBoardDraft(null);
  };

  // Leaving the board with unsaved drags would show a table that disagrees with what was
  // just arranged, so ask before switching rather than silently saving or discarding.
  const handleEventRequestView = (nextView: "table" | "board") => {
    if (nextView === "table" && hasUnsavedBoardChanges) {
      setPendingViewSwitch(true);
      return;
    }
    setDietView(nextView);
  };

  const handleEventRemoveMealFromDay = (day: WeekdayType, mealName: string) => {
    handleEventBoardChange({
      ...boardMeals,
      [day]: boardMeals[day].filter((meal) => meal.name !== mealName),
    });
  };

  const averageTasteScore = (meals: MealType[]) =>
    meals.length
      ? meals.reduce((sum, m) => sum + m.tasteScore, 0) / meals.length
      : 0;

  const calculateTotal = React.useCallback(() => {
    // One pass over the week produces every per-day total, the current day's total and
    // the weekly average, so the board columns and the two summary cards cannot drift.
    const weekTotal = { calories: 0, protein: 0, cost: 0 };
    let allMeals: MealType[] = [];
    const weekDays = Object.keys(boardMeals) as WeekdayType[];
    const totalsByDay = {} as Record<WeekdayType, DayTotals>;

    weekDays.forEach((day) => {
      const meals = boardMeals[day];
      allMeals = allMeals.concat(meals);
      const dailyTotal = { calories: 0, protein: 0, cost: 0 };
      meals.forEach((meal: MealType) => {
        meal.foods.forEach((food) => {
          dailyTotal.calories += food.calories * getFoodQuantity(food);
          dailyTotal.protein += food.protein * getFoodQuantity(food);
          dailyTotal.cost += (food.cost ?? 0) * getFoodQuantity(food);
        });
      });
      totalsByDay[day] = {
        ...dailyTotal,
        tasteScore: averageTasteScore(meals),
      };
      weekTotal.calories += dailyTotal.calories;
      weekTotal.protein += dailyTotal.protein;
      weekTotal.cost += dailyTotal.cost;
    });

    setDayTotals(totalsByDay);
    setCurrentDayTotal(totalsByDay[currentDay]);
    setWeeklyAverage({
      calories: weekTotal.calories / weekDays.length,
      protein: weekTotal.protein / weekDays.length,
      cost: weekTotal.cost / weekDays.length,
      tasteScore: averageTasteScore(allMeals),
    });
  }, [boardMeals, currentDay]);

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
    // On the board an add is part of the unsaved draft, matching every other board edit.
    if (activeView === "board") {
      if (boardMeals[currentDay].some((m) => m.name === meal.name)) {
        toastFactory(
          `${currentDay} already has ${meal.name}`,
          MessageSeverity.WARNING
        );
        return;
      }
      handleEventBoardChange({
        ...boardMeals,
        [currentDay]: [...boardMeals[currentDay], meal],
      });
      return;
    }

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
      {activeView === "table" && selectedMeals.length > 0 && (
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
              text="Create New Diet"
              onSubmit={createDiet}
              iconOnlyOnMobile
              className="!mt-0 !mb-0 shrink-0"
            />
          </div>
        </div>
      </Card>

      {/* Main Card */}
      <Card
        className={`w-[calc(100%-1rem)] mt-3 md:mt-4 bg-white p-2 md:p-4 py-4 md:py-6 ${
          activeView === "board"
            ? "md:w-[96%] max-w-[1600px]"
            : "md:w-1/2 max-w-[900px]"
        }`}
      >
        {/* Card Header with the button and the Dropdown */}
        <div className="w-full flex flex-nowrap justify-between md:justify-evenly items-center gap-2">
          <CardTitle
            title={`Add Meals for ${currentDay}`}
            onClick={() => setSelectMealModalOpen(true)}
          />

          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 shadow transition md:mr-auto"
            onClick={openMyFitnessPal}
            title="Open MyFitnessPal food diary"
          >
            <FaArrowUpRightFromSquare size={12} />
            <span>MyFitnessPal</span>
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

            {/* The board is only offered from md up: seven columns cannot fit a phone. */}
            <div className="hidden md:flex items-center rounded-lg border border-gray-300 shadow overflow-hidden">
              {(["table", "board"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`px-3 h-10 text-xs font-semibold transition ${
                    dietView === view
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title={view === "table" ? "Day table" : "Week board"}
                  onClick={() => handleEventRequestView(view)}
                >
                  {view === "table" ? "Day" : "Week"}
                </button>
              ))}
            </div>

            {activeView === "table" && (
              <button
                type="button"
                className="px-3 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition flex items-center gap-1"
                title="Paste Meals"
                onClick={pasteSelectedMealsFromClipboard}
              >
                <MdContentPaste size={16} />
                <span className="hidden sm:inline">Paste</span>
              </button>
            )}
          </div>
        </div>

        {/* Card Body: the week board on md and up, otherwise the day table */}
        {activeView === "board" ? (
          <div className="w-full">
            <CardSectionDivider title="Week" />
            <div className="my-4 md:my-6">
              <WeekBoard
                meals={boardMeals}
                dayTotals={dayTotals}
                currentDay={currentDay}
                todayWeekday={todayWeekday}
                quantityOf={getFoodQuantity}
                onSelectDay={setCurrentDay}
                onAddMeal={(day) => {
                  setCurrentDay(day);
                  setSelectMealModalOpen(true);
                }}
                onRemoveMeal={handleEventRemoveMealFromDay}
                onChange={handleEventBoardChange}
              />
            </div>
            <div className="flex w-full items-center justify-end gap-3">
              {hasUnsavedBoardChanges && (
                <button
                  type="button"
                  className="px-3 h-10 rounded-lg border-[2px] border-gray-200 bg-red-300 hover:bg-red-200 text-gray-800 text-xs font-semibold shadow transition whitespace-nowrap"
                  onClick={handleEventDiscardBoard}
                >
                  Discard changes
                </button>
              )}
              <MainButton
                text={hasUnsavedBoardChanges ? "Save Changes" : "Saved"}
                onSubmit={handleEventSaveBoard}
                className={`!mt-0 !mb-0 shrink-0 ${
                  hasUnsavedBoardChanges ? "" : "opacity-50 pointer-events-none"
                }`}
              />
            </div>
          </div>
        ) : null}

        {/* Card Body with the selected meals */}
        <div className={activeView === "board" ? "hidden" : "contents"}>
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
        </div>

        {/* Card Footer with the total. The board's columns each show their own day
            total, so this only earns its place in the table view. */}
        {activeView === "table" && (
          <>
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
          </>
        )}
      </Card>

      {/* Weekly Average */}
      <Card
        className={`w-[calc(100%-1rem)] mt-3 md:mt-4 mb-8 bg-white p-2 md:p-4 py-4 md:py-6 ${
          activeView === "board"
            ? "md:w-[96%] max-w-[1600px]"
            : "md:w-1/2 max-w-[900px]"
        }`}
      >
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

      <BasicModal
        open={pendingViewSwitch}
        handleClose={() => setPendingViewSwitch(false)}
        customModal={
          <div className="w-[calc(100vw-2rem)] max-w-[360px] bg-white border border-gray-200 rounded-2xl shadow-md px-5 py-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800 font-serif">
              Unsaved changes
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              The week board has changes that have not been saved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="px-4 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold shadow transition"
                onClick={() => {
                  handleEventSaveBoard();
                  setPendingViewSwitch(false);
                  setDietView("table");
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="px-4 h-10 rounded-lg bg-red-400 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
                onClick={() => {
                  handleEventDiscardBoard();
                  setPendingViewSwitch(false);
                  setDietView("table");
                }}
              >
                Discard
              </button>
              <button
                type="button"
                className="px-4 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition"
                onClick={() => setPendingViewSwitch(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
