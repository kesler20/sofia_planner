import { Table } from "./Table";
import { RiDeleteBin6Line } from "react-icons/ri";
import { DishAttributeType, DishType } from "../../types";

export default function DishesTable(props: {
  dishes: DishType[];
  onDeleteFood: (foodName: string) => void;
  onChangeFood: (
    foodName: string,
    foodAttribute: DishAttributeType,
    value: number | string
  ) => void;
}) {
  return (
    <Table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Calories (Kcal)</th>
          <th>Protein (g)</th>
          <th>Cost (£)</th>
          <th>Amount (g)</th>
          <th>Vendor</th>
          <th>Delete</th>
        </tr>
        {props.dishes.map((food, foodId) => {
          return (
            <tr key={foodId} className="pointer-cursor">
              <td>{food.name}</td>
              <td>
                <input
                  type="number"
                  className="text-center"
                  value={food.calories}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "calories", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="text-center"
                  value={food.protein}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "protein", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="text-center"
                  value={food.cost}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "cost", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  className="text-center"
                  value={food.amount}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "amount", Number(e.target.value))
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  className="text-center"
                  value={food.vendor}
                  onChange={(e) =>
                    props.onChangeFood(food.name, "vendor", e.target.value)
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
