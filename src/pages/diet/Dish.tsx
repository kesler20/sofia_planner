import React from "react";
import { DishType } from "../../types";
import CustomForm from "../../components/forms/CustomForm";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import { useStoredValue } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";

export default function Dish() {
  const [dish, setFood] = React.useState<DishType>({
    name: "",
    calories: 0,
    protein: 0,
    cost: 0,
    amount: 0,
    vendor: "",
  });
  const email = localStorage.getItem("global/email") || "guest";
  const [dishesFromDb, setDishesFromDb, isLoading] = useStoredValue<DishType[]>(
    email,
    [],
    "dishes"
  );
  if (isLoading) {
    return <LoadingAnimation />;
  }

  const createDish = () => {
    try {
      setDishesFromDb([...dishesFromDb, dish]);
      toastFactory("Dish created successfully", MessageSeverity.SUCCESS);
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
              name: "Dish Name",
              value: dish.name,
              onChange: (e) => setFood({ ...dish, name: e.target.value }),
            },
            {
              name: "Calories (Kcal)",
              value: dish.calories,
              onChange: (e) =>
                setFood({ ...dish, calories: Number(e.target.value) }),
            },
            {
              name: "Protein (g)",
              value: dish.protein,
              onChange: (e) => setFood({ ...dish, protein: Number(e.target.value) }),
            },
            {
              name: "Cost (£)",
              value: dish.cost,
              onChange: (e) => setFood({ ...dish, cost: Number(e.target.value) }),
            },
            {
              name: "Amount (g)",
              value: dish.amount,
              onChange: (e) => setFood({ ...dish, amount: Number(e.target.value) }),
            },
            {
              name: "Vendor Name",
              value: dish.vendor,
              onChange: (e) => setFood({ ...dish, vendor: e.target.value }),
            },
          ]}
          longer={true}
          onSubmit={() => createDish()}
        />
      </div>
    </div>
  );
}
