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
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  React.useEffect(() => {
    readResourceInDb<string>(email, "foods").then(({ result, error }) => {
      if (error) {
        console.error("Error reading foods from serverless DB", error);
        toastFactory("Failed to load foods from database", MessageSeverity.ERROR);
      }
      if (result) {
        const parsed = JSON.parse(result) as FoodType[];
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
    setFoodsFromDb((prev) =>
      prev.map((food: FoodType) =>
        food.name !== foodName
          ? food
          : ({ ...food, [foodAttribute]: value } as FoodType)
      )
    );
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
      }
    });
  };

  const handleEventSearchFoods = (query: string) => {
    setSearchQuery(query);
  };

  const getFoodMatchesSearch = (food: FoodType) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      food.name,
      food.calories,
      food.protein,
      food.carbs,
      food.fat,
      food.cost ?? "unmatched",
      food.amount,
      food.vendor ?? "unmatched",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  };

  const filteredFoods = foodsFromDb.filter(getFoodMatchesSearch);

  return (
    <div className="w-full flex flex-col justify-start items-center h-[calc(100vh-88px)] box-border overflow-hidden p-2 sm:p-3">
      {/* Header */}
      <div className="w-full max-w-[1100px] flex flex-wrap justify-between items-center gap-2 sm:gap-4 mb-2">
        <div className="w-auto sm:w-1/3 flex items-center justify-center">
          <p className="font-bold text-gray-600">Edit Foods</p>
        </div>
        <div className="flex-1 min-w-[170px] sm:w-1/3 flex items-center justify-center">
          <input
            className="border-b w-full text-center outline-none"
            placeholder="Search foods"
            value={searchQuery}
            onChange={(event) => handleEventSearchFoods(event.target.value)}
          />
        </div>
        <div className="w-auto sm:w-1/3 flex items-center justify-center">
          <MainButton
            text={"Save Changes"}
            onSubmit={saveChanges}
            iconOnlyOnMobile
            className="!mt-0 !mb-0"
          />
        </div>
      </div>

      {/* Foods */}
      <div className="w-full max-w-[1100px] flex-1 min-h-0 overflow-x-auto overflow-y-scroll scrollbar-hide">
        <FoodsTable
          foods={filteredFoods}
          onDeleteFood={deleteFood}
          onChangeFood={editFood}
        />
      </div>
    </div>
  );
}
