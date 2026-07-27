import React from "react";
import { FoodType } from "../../types";
import CustomForm from "../../components/forms/CustomForm";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import { useStoredValue } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";

export default function Dish() {
  const [food, setFood] = React.useState<FoodType>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    cost: null,
    amount: 0,
    vendor: null,
  });
  const email = localStorage.getItem("global/email") || "guest";
  const [foodsFromDb, setFoodsFromDb, isLoading] = useStoredValue<FoodType[]>(
    email,
    [],
    "foods"
  );
  if (isLoading) {
    return <LoadingAnimation />;
  }

  const createFood = () => {
    try {
      setFoodsFromDb([...foodsFromDb, food]);
      toastFactory("Food created successfully", MessageSeverity.SUCCESS);
    } catch (error) {
      toastFactory("Failed to create food", MessageSeverity.ERROR);
      console.error(error);
    }
  };

  return (
    <div className="h-[80vh] overflow-x-hidden w-full pt-8 flex flex-col items-center justify-start text-[0.9rem]">
      <div className="lg:h-[100px]"></div>
      <div className="relative">
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[15deg]
            w-[250px] h-[350px] z-[-100]
            rounded-[15px]
            bg-[rgb(144,80,204)]
            shadow-[20px_20px_20px_rgb(155,155,155)]
          `}
        />
        <CustomForm
          sections={[
            {
              name: "Food Name",
              value: food.name,
              onChange: (e) => setFood({ ...food, name: e.target.value }),
            },
            {
              name: "Calories (Kcal)",
              value: food.calories,
              onChange: (e) =>
                setFood({ ...food, calories: Number(e.target.value) }),
            },
            {
              name: "Protein (g)",
              value: food.protein,
              onChange: (e) => setFood({ ...food, protein: Number(e.target.value) }),
            },
            {
              name: "Carbs (g)",
              value: food.carbs,
              onChange: (e) => setFood({ ...food, carbs: Number(e.target.value) }),
            },
            {
              name: "Fat (g)",
              value: food.fat,
              onChange: (e) => setFood({ ...food, fat: Number(e.target.value) }),
            },
            {
              name: "Cost (£)",
              value: food.cost ?? "",
              onChange: (e) =>
                setFood({
                  ...food,
                  cost: e.target.value === "" ? null : Number(e.target.value),
                }),
            },
            {
              name: "Amount (g)",
              value: food.amount,
              onChange: (e) => setFood({ ...food, amount: Number(e.target.value) }),
            },
            {
              name: "Vendor Name",
              value: food.vendor ?? "",
              onChange: (e) =>
                setFood({
                  ...food,
                  vendor: e.target.value === "" ? null : e.target.value,
                }),
            },
          ]}
          longer={true}
          onSubmit={() => createFood()}
        />
      </div>
    </div>
  );
}
