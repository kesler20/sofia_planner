import React from "react";
import CustomModal from "../../components/modal/CustomModal";
import { MenuItem, Select } from "@mui/material";
import { DietType, DishType, WeekdayType } from "../../types";
import { IoIosAdd, IoIosRemove } from "react-icons/io";
import { readResourceInDb, useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

function Card(props: {
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

const defaultDietPlan: DietType = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

type DietData = { calories: number; protein: number; cost: number };

export default function Diet() {
  const email = localStorage.getItem("global/email") || "guest";
  const [dietPlan, setDietPlan] = useStoredValue<DietType>(
    email,
    defaultDietPlan,
    "diet_plan"
  );
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
  const [selectDishModalOpen, setSelectDishModalOpen] = React.useState(false);
  const today = new Date();
  const todayWeekday = jsDayToWeekday[today.getDay()];
  const [currentDay, setCurrentDay] = React.useState<WeekdayType>(todayWeekday);
  const [foodsFromDb, setFoodsFromDb] = useCachedValue<DishType[]>(
    email,
    [],
    "dishes"
  );
  const [currentDayTotal, setCurrentDayTotal] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
  });
  const [weeklyTotal, setWeeklyTotal] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
  });
  const [selectedFoods, setSelectedFoods] = React.useState<DishType[]>([]);

  React.useEffect(() => {
    calculateTotal();
    readResourceInDb<string>(email, "dishes").then(({ result, error }) => {
      if (error) {
        console.error("Error reading dishes from serverless DB", error);
        toastFactory(
          "Failed to load dishes from database",
          MessageSeverity.ERROR
        );
      }
      if (result) {
        const parsed = JSON.parse(result);
        console.info("Successfully read dishes from serverless DB", parsed);
        setFoodsFromDb(parsed);
      }
    });
  }, []);

  React.useEffect(() => {
    calculateTotal();
    setSelectedFoods([]);
  }, [currentDay]);

  // listen to the copy and paste events
  React.useEffect(() => {
    document.addEventListener("copy", copySelectedFoodsToClipboard);
    document.addEventListener("paste", pasteSelectedFoodsFromClipboard);

    return () => {
      document.removeEventListener("copy", copySelectedFoodsToClipboard);
      document.removeEventListener("paste", pasteSelectedFoodsFromClipboard);
    };
  }, [selectedFoods]);

  const copySelectedFoodsToClipboard = () => {
    if (!selectedFoods.length) {
      toastFactory("Select a dish before copying.", MessageSeverity.WARNING);
      return;
    }
    const text = selectedFoods.map((food: DishType) => food.name).join(", ");
    navigator.clipboard.writeText(text);
    toastFactory("Copied Dish to clipboard", MessageSeverity.SUCCESS);
  };

  const pasteSelectedFoodsFromClipboard = async () => {
    const text = await navigator.clipboard.readText();
    const foodNamesCopiedToClipboard = text.split(", ");
    setDietPlan((prev: DietType) => {
      return {
        ...prev,
        [currentDay]: [
          ...prev[currentDay as WeekdayType],
          ...foodNamesCopiedToClipboard.map((foodName) => {
            if (
              prev[currentDay as WeekdayType].some(
                (item: DishType) => item.name === foodName
              )
            ) {
              return;
            }

            return foodsFromDb.find((f: DishType) => f.name === foodName);
          }),
        ].filter(Boolean) as DishType[],
      } as DietType;
    });
  };

  const calculateTotal = () => {
    let dailyTotal = {
      calories: 0,
      protein: 0,
      cost: 0,
    };
    dietPlan[currentDay].forEach((food: DishType) => {
      dailyTotal.calories += food.calories;
      dailyTotal.protein += food.protein;
      dailyTotal.cost += food.cost;
    });

    setCurrentDayTotal(dailyTotal);

    let weekTotal = {
      calories: 0,
      protein: 0,
      cost: 0,
    };
    Object.keys(dietPlan).forEach((day) => {
      dietPlan[day as WeekdayType].forEach((food: DishType) => {
        weekTotal.calories += food.calories;
        weekTotal.protein += food.protein;
        weekTotal.cost += food.cost;
      });
    });
    setWeeklyTotal(weekTotal);
  };

  const addFoodToDiet = (food: DishType) => {
    setDietPlan((prev: DietType) => {
      if (
        prev[currentDay as WeekdayType].some(
          (item: DishType) => item.name === food.name
        )
      ) {
        return prev; // Return the previous state if the food already exists
      }
      return {
        ...prev,
        [currentDay]: [...prev[currentDay as WeekdayType], food],
      } as DietType;
    });
  };

  const removedFoodFromDiet = (food: DishType) => {
    setDietPlan((prev: DietType) => {
      return {
        ...prev,
        [currentDay]: prev[currentDay as WeekdayType].filter(
          (item: DishType) => item.name !== food.name
        ) as DishType[],
      } as DietType;
    });
  };

  const toggleFoodSelection = (food: DishType) => {
    setSelectedFoods((prev: DishType[]) => {
      if (prev.some((item: DishType) => item.name === food.name)) {
        return prev.filter((item: DishType) => item.name !== food.name);
      } else {
        return [...prev, food];
      }
    });
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
      {/* Main Card */}
      <Card className="min-w-[300px] w-1/2 max-w-[900px] mt-4 bg-white p-2">
        {/* Card Header with the button and the Dropdown */}
        <div className="w-full flex justify-evenly items-center">
          <CardTitle
            title={`Add Meals for ${currentDay}`}
            onClick={() => setSelectDishModalOpen(true)}
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
            {Object.keys(dietPlan).map((day, index) => (
              <MenuItem key={index} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Card Body with the selected dishes */}
        <CardSectionDivider title="Selected Dishes" />
        <div className="flex w-full items-center justify-between px-2 mt-2">
          {selectedFoods.length > 0 && (
            <button
              type="button"
              className="text-xs text-blue-500 underline"
              onClick={() => setSelectedFoods([])}
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="w-full max-h-[400px] my-8 flex flex-col justify-center overflow-y-scroll custom-scrollbar overflow-x-hidden">
          {dietPlan[currentDay].map((food: DishType) => {
            const isFoodSelected = selectedFoods.some(
              (item: DishType) => item.name === food.name
            );
            return (
              <Card
                key={food.name}
                className={`text-gray-500 p-2 pl-8 hover:glow ${
                  isFoodSelected ? "bg-blue-100" : ""
                }`}
                onClick={() => toggleFoodSelection(food)}
              >
                <div className="w-full flex justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-600 font-bold">{food.name}</p>
                  </div>
                  <IoIosRemove
                    size={30}
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      removedFoodFromDiet(food);
                    }}
                  />
                </div>
                <p>Calories: {food.calories} (kcal)</p>
                <p>Protein: {food.protein} (g)</p>
                <p>Cost: {food.cost} (£)</p>
                <p>{food.vendor}</p>
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
        </div>
      </Card>

      <CustomModal
        open={selectDishModalOpen}
        sections={[
          {
            name: "Search Meal",
            value: "default",
            onChange: (e) => console.log(e.target.value),
          },
        ]}
        body={
          <div className="flex h-[150px] w-[210px] flex-col justify-between items-center overflow-x-hidden overflow-y-scroll custom-scrollbar">
            {foodsFromDb.map((food: DishType) => {
              return (
                <Card className="text-gray-500 mb-2 mx-2 p-2 pl-8">
                  <div className="w-full flex justify-between">
                    <p className="text-gray-600 font-bold">{food.name}</p>
                    <IoIosAdd
                      size={30}
                      className="cursor-pointer"
                      onClick={() => addFoodToDiet(food)}
                    />
                  </div>
                  <p>Calories: {food.calories} (kcal)</p>
                  <p>Protein: {food.protein} (g)</p>
                  <p>Cost: {food.cost} (£)</p>
                  <p>{food.vendor}</p>
                </Card>
              );
            })}
          </div>
        }
        onSubmit={() => console.log("submit")}
        handleClose={() => setSelectDishModalOpen(false)}
      />
    </div>
  );
}
