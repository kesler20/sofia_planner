import React from "react";
import MainButton from "../../components/button/MainButton";
import { DishAttributeType, DishType } from "../../types";
import DishesTable from "../../components/table/FoodTable";
import { createResourceInDb, readResourceInDb, useCachedValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

export default function Meal() {
  const email = localStorage.getItem("global/email") || "guest";
  const [foodsFromDb, setFoodsFromDb] = useCachedValue<DishType[]>(
    email,
    [],
    "dishes"
  );

  // this state is required to allow the user to edit multiple foods at once and then update
  const [foodsChanged, setFoodsChanged] = React.useState<DishType[]>([]);

  React.useEffect(() => {
    readResourceInDb<string>(email, "dishes").then(({ result, error }) => {
      if (error) {
        console.error("Error reading dishes from serverless DB", error);
        toastFactory("Failed to load dishes from database", MessageSeverity.ERROR);
      }
      if (result) {
        const parsed = JSON.parse(result);
        setFoodsFromDb(parsed);
      }
    });
  }, []);

  const deleteFood = (foodName: string) => {
    try {
      setFoodsFromDb((prev: DishType[]) =>
        prev.filter((f: DishType) => f.name !== foodName)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const editFood = (
    foodName: string,
    foodAttribute: DishAttributeType,
    value: number | string
  ) => {
    const foodToUpdate = foodsFromDb.find((f: DishType) => f.name === foodName);
    if (!foodToUpdate) {
      return;
    }

    (foodToUpdate[foodAttribute as keyof DishType] as typeof value) = value;

    setFoodsFromDb(
      foodsFromDb.map((food: DishType) => {
        if (food.name === foodName) {
          return foodToUpdate;
        }
        return food;
      })
    );

    setFoodsChanged([...foodsChanged, foodToUpdate]);
  };

  const saveChanges = () => {
    createResourceInDb<DishType[]>(
      email,
      "dishes",
      JSON.stringify(foodsFromDb)
    ).then(({ result, error }) => {
      if (error) {
        toastFactory("Failed to save changes", MessageSeverity.ERROR);
        console.error(error);
      }
      if (result) {
        toastFactory("Changes saved successfully", MessageSeverity.SUCCESS);
        setFoodsChanged([]);
      }
    });
  };

  return (
    <div className="w-full flex flex-col justify-start items-center h-[70vh] mt-24">
      <div className="min-w-[300px] w-[60%] max-w-[1100px] overflow-x-scroll">
        <DishesTable
          dishes={foodsFromDb}
          onDeleteFood={deleteFood}
          onChangeFood={editFood}
        />
      </div>
      <div className="w-full flex items-center justify-center">
        <MainButton text={"Save Changes"} onSubmit={saveChanges} />
      </div>
    </div>
  );
}
