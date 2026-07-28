import { Table } from "./Table";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FoodAttributeType, FoodType } from "../../types";

export default function FoodsTable(props: {
  foods: FoodType[];
  onDeleteFood: (foodName: string) => void;
  onChangeFood: (
    foodName: string,
    foodAttribute: FoodAttributeType,
    value: number | string | null
  ) => void;
}) {
  return (
    <Table>
      <tbody>
        <tr>
          <th className="min-w-[160px] sm:min-w-[220px]">Name</th>
          <th><span className="sm:hidden">Kcal</span><span className="hidden sm:inline">Calories (Kcal)</span></th>
          <th><span className="sm:hidden">Prot</span><span className="hidden sm:inline">Protein (g)</span></th>
          <th>Carbs (g)</th>
          <th>Fat (g)</th>
          <th>Cost (£)</th>
          <th>Amount (g)</th>
          <th>Vendor</th>
          <th>Delete</th>
        </tr>
        {props.foods.map((food, foodId) => {
          return (
            <tr key={food.name || foodId} className="pointer-cursor">
              <td className="min-w-[160px] sm:min-w-[220px] text-left">
                {food.name}
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  value={food.calories}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "calories", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  value={food.protein}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "protein", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  value={food.carbs}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "carbs", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  value={food.fat}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "fat", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  placeholder="unmatched"
                  value={food.cost ?? ""}
                  onChange={(e) =>
                    props.onChangeFood(
                      food.name,
                      "cost",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="w-14 sm:w-auto text-center"
                  value={food.amount}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "amount", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  className="w-24 sm:w-auto text-center"
                  placeholder="unmatched"
                  value={food.vendor ?? ""}
                  onChange={(e) =>
                    props.onChangeFood(
                      food.name,
                      "vendor",
                      e.target.value === "" ? null : e.target.value
                    )
                  }
                />
              </td>
              <td>
                <RiDeleteBin6Line onClick={() => props.onDeleteFood(food.name)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
