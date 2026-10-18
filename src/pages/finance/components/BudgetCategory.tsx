import * as React from "react";
import { TextField } from "@mui/material";
import { FaTrashAlt } from "react-icons/fa";
import { CiCirclePlus } from "react-icons/ci";
import {
  PlanningCard as Card,
  PlanningItemHeading,
  PlanningDeleteButton,
} from "../../../components/planning/PlanningComponents";

// ============================================================ //
//                                                              //
//   BUDGET CATEGORY                                            //
//                                                              //
//   Stateless budget category and section editors. The budget  //
//   page owns drafts and receives edit and commit events.      //
//                                                              //
// ============================================================ //
export type BudgetEditDraft = {
  name?: string;
  value?: number;
  nameEditing?: boolean;
  valueEditing?: boolean;
};

const CategoryItem = React.memo(function CategoryItem(props: {
  name: string;
  value: number;
  onEventDeleteCategoryItem: () => void;
  onEventChangeCategoryItemName: (newItemName: string) => void;
  onEventChangeCategoryItemValue: (newItemValue: number) => void;
  editKey: string;
  edits: Record<string, BudgetEditDraft>;
  onEventEdit: (key: string, patch: Partial<BudgetEditDraft>) => void;
}) {
  const draft = props.edits[props.editKey];
  const nameDisplayMode = draft?.nameEditing ? "edit" : "view";
  const valueDisplayMode = draft?.valueEditing ? "edit" : "view";
  const itemName = draft?.name ?? props.name;
  const itemValue = draft?.value ?? props.value;

  return (
    <div className="flex h-[60px] w-full items-center justify-evenly">
      <div className="w-[60%] flex items-center justify-between">
        {nameDisplayMode === "view" && (
          <h1
            className="md:text-2xl text-gray-400 font-bold"
            onClick={() =>
              props.onEventEdit(props.editKey, { nameEditing: true })
            }
          >
            {itemName}
          </h1>
        )}
        {nameDisplayMode === "edit" && (
          <TextField
            type="text"
            id="outlined-basic"
            label={itemName}
            value={itemName}
            variant="outlined"
            size="small"
            onChange={(event) =>
              props.onEventEdit(props.editKey, { name: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                props.onEventEdit(props.editKey, {
                  nameEditing: false,
                  name: undefined,
                });
                props.onEventChangeCategoryItemName(itemName);
              }
            }}
          />
        )}
        {valueDisplayMode === "view" && (
          <h3
            className="md:text-2xl text-gray-400 font-bold"
            onClick={() =>
              props.onEventEdit(props.editKey, { valueEditing: true })
            }
          >
            {itemValue}
          </h3>
        )}
        {valueDisplayMode === "edit" && (
          <TextField
            type="number"
            id="outlined-basic"
            label={itemValue.toString()}
            variant="outlined"
            value={itemValue}
            onChange={(event) =>
              props.onEventEdit(props.editKey, {
                value: Number(event.target.value),
              })
            }
            size="small"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                props.onEventEdit(props.editKey, {
                  valueEditing: false,
                  value: undefined,
                });
                props.onEventChangeCategoryItemValue(itemValue);
              }
            }}
          />
        )}
      </div>
      {(nameDisplayMode === "edit" || valueDisplayMode === "edit") && (
        <div
          className={`
      w-[60px]
      flex justify-center items-center
      border-[2px] border-gray-[rgb(196,196,196)]
      bg-red-300 p-2 hover:bg-red-200
      rounded-lg
      cursor-pointer
    `}
        >
          <FaTrashAlt
            className="hover:text-gray-600 text-gray-800"
            onClick={props.onEventDeleteCategoryItem}
          />
        </div>
      )}
    </div>
  );
});

export const BudgetCategory = React.memo(function Category(props: {
  name: string;
  sections: { name: string; value: number }[];
  isVariable: boolean;
  onEventChangeCategoryName: (newCategoryName: string) => void;
  onEventDeleteCategory: () => void;
  onEventAddCategoryItem: () => void;
  onEventChangeCategoryItemName: (
    newItemName: string,
    categoryItemIndex: number,
  ) => void;
  onEventChangeCategoryItemValue: (
    newItemValue: number,
    categoryItemIndex: number,
  ) => void;
  onEventDeleteCategoryItem: (categoryItemIndex: number) => void;
  onEventToggleCategoryVariable: () => void;
  className?: string;
  style?: React.CSSProperties;
  onEventClick?: () => void;
  onEventDoubleClick?: () => void;
  editKey: string;
  edits: Record<string, BudgetEditDraft>;
  onEventEdit: (key: string, patch: Partial<BudgetEditDraft>) => void;
}) {
  const draft = props.edits[props.editKey];
  const viewMode = draft?.nameEditing ? "edit" : "view";
  const categoryName = draft?.name ?? props.name;
  // Calculate total value for this category
  const totalValue = React.useMemo(
    () => props.sections.reduce((sum, section) => sum + section.value, 0),
    [props.sections],
  );

  return (
    <div onDoubleClick={props.onEventDoubleClick}>
      <Card
        className={`w-[96%] mt-4 bg-white p-2 ${props.className}`}
        onEventClick={props.onEventClick}
        style={props.style}
      >
        <div className="flex items-center justify-between">
          {/* Add Category Item Button */}
          <CiCirclePlus
            size={36}
            className="cursor-pointer hover:text-gray-600 text-gray-800 mr-4"
            onClick={props.onEventAddCategoryItem}
          />
          {/* Category Name */}
          {viewMode === "edit" ? (
            <TextField
              type="text"
              id="outlined-basic"
              label={categoryName}
              value={categoryName}
              variant="outlined"
              size="small"
              onChange={(event) =>
                props.onEventEdit(props.editKey, { name: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  props.onEventEdit(props.editKey, {
                    nameEditing: false,
                    name: undefined,
                  });
                  props.onEventChangeCategoryName(categoryName);
                }
              }}
            />
          ) : (
            <PlanningItemHeading
              onEventClick={() =>
                props.onEventEdit(props.editKey, { nameEditing: true })
              }
            >
              {categoryName}
            </PlanningItemHeading>
          )}
          <button
            type="button"
            className={
              props.isVariable
                ? "ml-2 px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold"
                : "ml-2 px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold"
            }
            title={
              props.isVariable ? "Variable category (shared)" : "Local category"
            }
            onClick={props.onEventToggleCategoryVariable}
          >
            Var
          </button>
          {/* Delete Category Button */}
          <PlanningDeleteButton
            label={`Delete ${categoryName}`}
            onEventDelete={props.onEventDeleteCategory}
          />
        </div>
        {props.sections.map((section, index) => (
          <CategoryItem
            editKey={`${props.editKey}/section/${index}`}
            edits={props.edits}
            onEventEdit={props.onEventEdit}
            key={index}
            name={section.name}
            value={section.value}
            onEventDeleteCategoryItem={() =>
              props.onEventDeleteCategoryItem(index)
            }
            onEventChangeCategoryItemName={(newItemName) =>
              props.onEventChangeCategoryItemName(newItemName, index)
            }
            onEventChangeCategoryItemValue={(newItemValue) =>
              props.onEventChangeCategoryItemValue(newItemValue, index)
            }
          />
        ))}
        {/* Show total at the bottom if more than 1 item */}
        {props.sections.length > 1 && (
          <Card className="flex items-center justify-center h-[40px] mt-4 px-4 py-1 bg-gray-50 border border-gray-200 rounded-xl shadow">
            <span className="text-base md:text-lg font-semibold text-gray-500">
              Total: {totalValue.toFixed(2)}
            </span>
          </Card>
        )}
      </Card>
    </div>
  );
});
