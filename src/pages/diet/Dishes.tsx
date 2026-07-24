import React from "react";
import MainButton from "../../components/button/MainButton";
import { FoodAttributeType, FoodType } from "../../types";
import FoodsTable from "../../components/table/FoodTable";
import { createResourceInDb, readResourceInDb, useCachedValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

export default function Foods() {
  const email = localStorage.getItem("global/email") || "guest";
  const [foodsFromDb, setFoodsFromDb] = useCachedValue<FoodType[]>(
    email,
    [],
    "foods"
  );

  // this state is required to allow the user to edit multiple foods at once and then update
  const [foodsChanged, setFoodsChanged] = React.useState<FoodType[]>([]);

  React.useEffect(() => {
    readResourceInDb<string>(email, "foods").then(({ result, error }) => {
      if (error) {
        console.error("Error reading foods from serverless DB", error);
        toastFactory("Failed to load foods from database", MessageSeverity.ERROR);
      }
      if (result) {
        const parsed = JSON.parse(result);
        setFoodsFromDb(parsed);
      }
    });
  }, []);

  const deleteFood = (foodName: string) => {
    try {
      setFoodsFromDb((prev: FoodType[]) =>
        prev.filter((f: FoodType) => f.name !== foodName)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const editFood = (
    foodName: string,
    foodAttribute: FoodAttributeType,
    value: number | string | null
  ) => {
    const foodToUpdate = foodsFromDb.find((f: FoodType) => f.name === foodName);
    if (!foodToUpdate) {
      return;
    }

    (foodToUpdate[foodAttribute as keyof FoodType] as typeof value) = value;

    setFoodsFromDb(
      foodsFromDb.map((food: FoodType) => {
        if (food.name === foodName) {
          return foodToUpdate;
        }
        return food;
      })
    );

    setFoodsChanged([...foodsChanged, foodToUpdate]);
  };

  const saveChanges = () => {
    createResourceInDb<FoodType[]>(
      email,
      "foods",
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
        <FoodsTable
          foods={foodsFromDb}
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
