import { MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import * as React from "react";
import { CiCirclePlus } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import { MdContentPaste } from "react-icons/md";
import { useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";

// =========== //
//             //
//   TYPES     //
//             //
// =========== //

type CategoryType = "income" | "expense";
type Category = {
  name: string;
  type: CategoryType;
  sections: { name: string; value: number }[];
  isVariable?: boolean;
  variableId?: string;
};
export type Months =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";
export type Finances = Record<
  Months,
  {
    categories: Category[];
  }
>;

// ================== //
//                    //
//   UI COMPONENTS    //
//                    //
// ================== //

function PopupMenu(props: {
  copySelectedCategoriesToClipboard: () => void;
  pasteSelectedCategoriesFromClipboard: () => void;
  selectedCategories: Category[];
  onClose?: () => void;
  onSpread?: () => void;
}) {
  return (
    <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md px-8 py-6 flex flex-col items-center min-w-[320px]">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-bold mb-4 text-gray-800 font-serif">
          Selected Categories
        </h2>
        <button
          className="w-8 h-8 flex items-center mb-4 justify-center rounded-full bg-red-400 hover:bg-red-500 text-white text-xl font-bold shadow transition"
          title="Close"
          onClick={props.onClose}
        >
          <span>✕</span>
        </button>
      </div>
      <ul className="list-disc pl-6 mb-6 w-full">
        {props.selectedCategories.map((category, index) => (
          <li key={index} className="text-gray-700 text-lg font-semibold">
            {category.name}
          </li>
        ))}
      </ul>
      <div className="flex gap-6 mt-2">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold shadow transition"
          title="Copy"
          onClick={props.copySelectedCategoriesToClipboard}
        >
          <span>📋</span>
        </button>
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold shadow transition"
          title="Spread"
          onClick={props.onSpread}
        >
          <span>📅</span>
        </button>
      </div>
    </div>
  );
}

function Card(props: {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={props.onClick}
      style={props.style}
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

type CategoryItemProps = {
  name: string;
  value: number;
  onDeleteCategoryItem: () => void;
  onChangeCategoryItemName: (newItemName: string) => void;
  onChangeCategoryItemValue: (newItemValue: number) => void;
};

const CategoryItem = React.memo(function CategoryItem(props: CategoryItemProps) {
  const [nameDisplayMode, setNameDisplayMode] = React.useState<"edit" | "view">(
    "view",
  );
  const [valueDisplayMode, setValueDisplayMode] = React.useState<"edit" | "view">(
    "view",
  );
  const [itemName, setItemName] = React.useState<string>(props.name);
  const [itemValue, setItemValue] = React.useState<number>(props.value);

  // keep local state in sync with parent updates
  React.useEffect(() => setItemName(props.name), [props.name]);
  React.useEffect(() => setItemValue(props.value), [props.value]);

  return (
    <div className="flex h-[60px] w-full items-center justify-evenly">
      <div className="w-[60%] flex items-center justify-between">
        {nameDisplayMode === "view" && (
          <h1
            className="md:text-2xl text-gray-400 font-bold"
            onClick={() => setNameDisplayMode("edit")}
          >
            {itemName}
          </h1>
        )}
        {nameDisplayMode === "edit" && (
          <TextField
            type="text"
            id="outlined-basic"
            label={itemName}
            variant="outlined"
            size="small"
            onChange={(event) => setItemName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setNameDisplayMode("view");
                props.onChangeCategoryItemName(itemName);
              }
            }}
          />
        )}
        {valueDisplayMode === "view" && (
          <h3
            className="md:text-2xl text-gray-400 font-bold"
            onClick={() => setValueDisplayMode("edit")}
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
            onChange={(event) => setItemValue(Number(event.target.value))}
            size="small"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setValueDisplayMode("view");
                props.onChangeCategoryItemValue(itemValue);
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
            onClick={props.onDeleteCategoryItem}
          />
        </div>
      )}
    </div>
  );
});

// TODO: the className, style and onClick property could be replaced using a higher order component

type CategoryProps = {
  name: string;
  sections: { name: string; value: number }[];
  isVariable: boolean;
  onChangeCategoryName: (newCategoryName: string) => void;
  onDeleteCategory: () => void;
  onAddCategoryItem: () => void;
  onChangeCategoryItemName: (newItemName: string, categoryItemIndex: number) => void;
  onChangeCategoryItemValue: (
    newItemValue: number,
    categoryItemIndex: number,
  ) => void;
  onDeleteCategoryItem: (categoryItemIndex: number) => void;
  onToggleCategoryVariable: () => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDoubleClick?: () => void;
};

const Category = React.memo(function Category(props: CategoryProps) {
  const [viewMode, setViewMode] = React.useState<"edit" | "view">("view");
  const [categoryName, setCategoryName] = React.useState<string>(props.name);

  React.useEffect(() => setCategoryName(props.name), [props.name]);

  // Calculate total value for this category
  const totalValue = React.useMemo(
    () => props.sections.reduce((sum, section) => sum + section.value, 0),
    [props.sections],
  );

  return (
    <div onDoubleClick={props.onDoubleClick}>
      <Card
        className={`w-[96%] mt-4 bg-white p-2 ${props.className}`}
        onClick={props.onClick}
        style={props.style}
      >
        <div className="flex items-center justify-between">
          {/* Add Category Item Button */}
          <CiCirclePlus
            size={36}
            className="cursor-pointer hover:text-gray-600 text-gray-800 mr-4"
            onClick={props.onAddCategoryItem}
          />
          {/* Category Name */}
          {viewMode === "edit" ? (
            <TextField
              type="text"
              id="outlined-basic"
              label={categoryName}
              variant="outlined"
              size="small"
              onChange={(event) => setCategoryName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setViewMode("view");
                  props.onChangeCategoryName(categoryName);
                }
              }}
            />
          ) : (
            <h2
              className="md:text-2xl text-gray-800 font-bold"
              onClick={() => setViewMode("edit")}
            >
              {categoryName}
            </h2>
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
            onClick={props.onToggleCategoryVariable}
          >
            Var
          </button>
          {/* Delete Category Button */}
          <div
            className="border-gray-800 border-[1.5px] rounded-full p-2 flex items-center justify-center ml-4"
            onClick={props.onDeleteCategory}
          >
            <FaTrashAlt className="cursor-pointer hover:text-red-200 text-red-300" />
          </div>
        </div>
        {props.sections.map((section, index) => (
          <CategoryItem
            key={index}
            name={section.name}
            value={section.value}
            onDeleteCategoryItem={() => props.onDeleteCategoryItem(index)}
            onChangeCategoryItemName={(newItemName) =>
              props.onChangeCategoryItemName(newItemName, index)
            }
            onChangeCategoryItemValue={(newItemValue) =>
              props.onChangeCategoryItemValue(newItemValue, index)
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

function CategoryContainer(props: {
  children?: React.ReactNode;
  categoryType: CategoryType;
}) {
  return props.categoryType === "income" ? (
    <div className="flex flex-col w-full bg-green-100 rounded-2xl p-4 overflow-y-scroll scrollbar-hide h-[45vh]">
      {props.children}
    </div>
  ) : (
    <div className="flex flex-col w-full bg-red-100 rounded-2xl p-4 overflow-y-scroll scrollbar-hide h-[45vh]">
      {props.children}
    </div>
  );
}

function Header(props: { text: string; className?: string }) {
  return (
    <h1
      className={`text-xl md:text-4xl text-gray-800 font-serif font-bold ${props.className}`}
    >
      {props.text}
    </h1>
  );
}

function Column(props: { children?: React.ReactNode }) {
  return (
    <Card
      className={`
      flex flex-col justify-start items-center 
      w-full min-h-64
      pt-4 mx-2
      overflow-y-scroll scrollbar-hide  
    `}
    >
      {props.children}
    </Card>
  );
}

function TotalValueCard(props: { value: number; text: string }) {
  return (
    <Card className="flex items-center justify-center h-[70px] mt-2 w-[99%]">
      <h1 className="md:text-2xl text-gray-400 font-bold">{props.text}</h1>
      <h3 className="md:text-2xl text-gray-400 font-bold">
        {props.value.toFixed(2)}
      </h3>
    </Card>
  );
}

function MonthlyActionButtons(props: {
  pasteSelectedCategoriesFromClipboard: () => void;
  exportMonthlyBalances: () => void;
  importMonthlyBalances: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Track screen width
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 400 : false,
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 400);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // For file input in dropdown
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isMobile) {
    return (
      <div className="flex items-center">
        <button
          className="ml-2 px-3 h-14 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition flex items-center gap-1"
          title="Paste Categories"
          onClick={props.pasteSelectedCategoriesFromClipboard}
        >
          <MdContentPaste size={16} className="inline" />
          Paste
        </button>
        <button
          className="ml-2 px-3 h-14 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition flex items-center gap-1"
          title="Export Monthly Balances"
          onClick={props.exportMonthlyBalances}
        >
          <span className="inline">📤</span>
          Export
        </button>
        <label
          className="ml-2 px-3 h-14 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1"
          title="Import Monthly Balances"
        >
          <span className="inline">📥</span>
          Import
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={props.importMonthlyBalances}
          />
        </label>
      </div>
    );
  }

  // Mobile: use MUI Select as dropdown
  return (
    <div className="mr-6">
      <Select
        open={isDropdownOpen}
        onOpen={() => setIsDropdownOpen(true)}
        onClose={() => setIsDropdownOpen(false)}
        displayEmpty
        value=""
        renderValue={() => <span className="flex items-center">Actions</span>}
        MenuProps={{
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
        }}
        sx={{
          minWidth: 120,
          height: "55px",
        }}
      >
        <MenuItem
          onClick={() => {
            setIsDropdownOpen(false);
            props.pasteSelectedCategoriesFromClipboard();
          }}
        >
          <MdContentPaste size={16} className="inline" />
          Paste
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsDropdownOpen(false);
            localStorage.clear();
            window.location.reload();
          }}
        >
          <FaTrashAlt size={16} className="inline" />
          Clear Cache
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsDropdownOpen(false);
            props.exportMonthlyBalances();
          }}
        >
          <span className="inline">📤</span>
          Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            setIsDropdownOpen(false);
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <span className="inline">📥</span>
          Import
          <input
            title="Import Monthly Balances"
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={props.importMonthlyBalances}
          />
        </MenuItem>
      </Select>
    </div>
  );
}

function Navbar(props: {
  currentMonth: Months;
  updateCurrentMonth: (event: SelectChangeEvent<Months>) => void;
  pasteSelectedCategoriesFromClipboard: () => void;
  exportMonthlyBalances: () => void;
  importMonthlyBalances: (event: React.ChangeEvent<HTMLInputElement>) => void;
  monthlyBalance: Finances;
}) {
  return (
    <div className="flex items-center justify-center w-full py-4">
      {/* Left: Month Select + Action Buttons */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Select
          className="ml-4"
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={props.currentMonth}
          onChange={props.updateCurrentMonth}
        >
          {Object.keys(props.monthlyBalance).map((month, index) => (
            <MenuItem key={index} value={month}>
              {month}
            </MenuItem>
          ))}
        </Select>
        {/* Actions to apply to selected categories and monthly balances  */}
        <MonthlyActionButtons
          pasteSelectedCategoriesFromClipboard={
            props.pasteSelectedCategoriesFromClipboard
          }
          exportMonthlyBalances={props.exportMonthlyBalances}
          importMonthlyBalances={props.importMonthlyBalances}
        />
      </div>
    </div>
  );
}

// ========================= //
//                           //
//   APPLICATION STATE       //
//                           //
// ========================= //

type ActionsType =
  | {
      type: "SET_MONTHLY_BALANCE";
      params: Finances;
    }
  | {
      type: "ADD_CATEGORY";
      params: {
        currentMonth: Months;
        newCategoryType: "income" | "expense";
        newCategoryName: string;
      };
    }
  | {
      type: "ADD_CATEGORIES";
      params: {
        currentMonth: Months;
        newCategories: Category[];
      };
    }
  | {
      type: "DELETE_CATEGORY";
      params: { index: number; currentMonth: Months };
    }
  | {
      type: "ADD_CATEGORY_ITEM";
      params: { index: number; currentMonth: Months; newCategoryItemName: string };
    }
  | {
      type: "CHANGE_CATEGORY_NAME";
      params: { index: number; currentMonth: Months; newCategoryName: string };
    }
  | {
      type: "CHANGE_CATEGORY_ITEM_NAME";
      params: {
        index: number;
        currentMonth: Months;
        categoryItemIndex: number;
        newCategoryItemName: string;
      };
    }
  | {
      type: "CHANGE_CATEGORY_ITEM_VALUE";
      params: {
        index: number;
        currentMonth: Months;
        categoryItemIndex: number;
        newCategoryItemValue: number;
      };
    }
  | {
      type: "DELETE_CATEGORY_ITEM";
      params: { index: number; currentMonth: Months; categoryItemIndex: number };
    }
  | {
      type: "TOGGLE_CATEGORY_VARIABLE";
      params: { index: number; currentMonth: Months };
    };

const monthlyBalanceReducer = (prev: Finances, action: ActionsType) => {
  const updateCategoriesAcrossMonths = (
    variableId: string,
    updateCategory: (category: Category) => Category | null,
  ) => {
    const next: Finances = { ...prev };
    (Object.keys(prev) as Months[]).forEach((month) => {
      next[month] = {
        ...prev[month],
        categories: prev[month].categories.flatMap((category) => {
          if (category.variableId !== variableId) {
            return category;
          }
          const updated = updateCategory(category);
          return updated ? [updated] : [];
        }),
      };
    });
    return next;
  };

  switch (action.type) {
    case "SET_MONTHLY_BALANCE":
      return action.params;
    case "ADD_CATEGORY":
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: [
            ...prev[action.params.currentMonth].categories,
            {
              name: action.params.newCategoryName,
              type: action.params.newCategoryType,
              sections: [],
              isVariable: false,
            },
          ],
        },
      };
    case "ADD_CATEGORIES":
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: [
            ...prev[action.params.currentMonth].categories,
            ...action.params.newCategories,
          ],
        },
      };
    case "DELETE_CATEGORY": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(targetCategory.variableId, () => null);
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.filter(
            (_, i) => i !== action.params.index,
          ),
        },
      };
    }
    case "CHANGE_CATEGORY_NAME": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            name: action.params.newCategoryName,
          }),
        );
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.map((cat, i) =>
            i === action.params.index
              ? { ...cat, name: action.params.newCategoryName }
              : cat,
          ),
        },
      };
    }
    case "ADD_CATEGORY_ITEM": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            sections: [
              ...category.sections,
              { name: action.params.newCategoryItemName, value: 0 },
            ],
          }),
        );
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.map((cat, i) => {
            if (i === action.params.index) {
              return {
                ...cat,
                sections: [
                  ...cat.sections,
                  { name: action.params.newCategoryItemName, value: 0 },
                ],
              };
            }
            return cat;
          }),
        },
      };
    }
    case "CHANGE_CATEGORY_ITEM_NAME": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            sections: category.sections.map((section, j) =>
              j === action.params.categoryItemIndex
                ? { ...section, name: action.params.newCategoryItemName }
                : section,
            ),
          }),
        );
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.map((cat, i) => {
            if (i === action.params.index) {
              return {
                ...cat,
                sections: cat.sections.map((section, j) =>
                  j === action.params.categoryItemIndex
                    ? { ...section, name: action.params.newCategoryItemName }
                    : section,
                ),
              };
            }
            return cat;
          }),
        },
      };
    }
    case "CHANGE_CATEGORY_ITEM_VALUE": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            sections: category.sections.map((section, j) =>
              j === action.params.categoryItemIndex
                ? { ...section, value: action.params.newCategoryItemValue }
                : section,
            ),
          }),
        );
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.map((cat, i) => {
            if (i === action.params.index) {
              return {
                ...cat,
                sections: cat.sections.map((section, j) =>
                  j === action.params.categoryItemIndex
                    ? {
                        ...section,
                        value: action.params.newCategoryItemValue,
                      }
                    : section,
                ),
              };
            }
            return cat;
          }),
        },
      };
    }
    case "DELETE_CATEGORY_ITEM": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (targetCategory?.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            sections: category.sections.filter(
              (_, j) => j !== action.params.categoryItemIndex,
            ),
          }),
        );
      }
      return {
        ...prev,
        [action.params.currentMonth]: {
          ...prev[action.params.currentMonth],
          categories: prev[action.params.currentMonth].categories.map((cat, i) => {
            if (i === action.params.index) {
              return {
                ...cat,
                sections: cat.sections.filter(
                  (_, j) => j !== action.params.categoryItemIndex,
                ),
              };
            }
            return cat;
          }),
        },
      };
    }
    case "TOGGLE_CATEGORY_VARIABLE": {
      const targetCategory =
        prev[action.params.currentMonth].categories[action.params.index];
      if (!targetCategory) {
        return prev;
      }
      if (targetCategory.isVariable && targetCategory.variableId) {
        return updateCategoriesAcrossMonths(
          targetCategory.variableId,
          (category) => ({
            ...category,
            isVariable: false,
            variableId: undefined,
          }),
        );
      }
      const variableId = crypto.randomUUID();
      const next: Finances = { ...prev };
      (Object.keys(prev) as Months[]).forEach((month) => {
        next[month] = {
          ...prev[month],
          categories: prev[month].categories.map((category) =>
            category.name === targetCategory.name &&
            category.type === targetCategory.type
              ? { ...category, isVariable: true, variableId }
              : category,
          ),
        };
      });
      return next;
    }
    default:
      return prev;
  }
};

const defaultMonthlyBalance: Finances = {
  January: { categories: [] },
  February: { categories: [] },
  March: { categories: [] },
  April: { categories: [] },
  May: { categories: [] },
  June: { categories: [] },
  July: { categories: [] },
  August: { categories: [] },
  September: { categories: [] },
  October: { categories: [] },
  November: { categories: [] },
  December: { categories: [] },
};

export default function BudgetsPage() {
  // =======================//
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // =======================//

  const email = localStorage.getItem("global/email") || "guest";
  const [currentMonth, setCurrentMonth] = useCachedValue<Months>(
    email,
    "January",
    "currentMonth",
  );
  const [cachedMonthlyBalance, setCachedMonthlyBalance, isLoading] =
    useStoredValue<Finances>(email, defaultMonthlyBalance, "monthlyBalance");
  const [monthlyBalance, send] = React.useReducer(
    monthlyBalanceReducer,
    cachedMonthlyBalance,
    (initial) => initial,
  );
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

  // Derived totals for instant UI updates
  const currentMonthTotals = React.useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    monthlyBalance[currentMonth].categories.forEach((category) => {
      category.sections.forEach((section) => {
        if (category.type === "income") totalIn += section.value;
        else totalOut += section.value;
      });
    });
    return { totalIn, totalOut };
  }, [monthlyBalance, currentMonth]);

  const annualNet = React.useMemo(() => {
    let net = 0;
    (Object.keys(monthlyBalance) as Months[]).forEach((month) => {
      let tin = 0;
      let tout = 0;
      monthlyBalance[month].categories.forEach((category) => {
        category.sections.forEach((section) => {
          if (category.type === "income") tin += section.value;
          else tout += section.value;
        });
      });
      net += tin - tout;
    });
    return net;
  }, [monthlyBalance]);

  console.log("selectedCategories", selectedCategories);
  console.log("cachedMonthlyBalance", monthlyBalance[currentMonth]);

  // =======================//
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // =======================//

  // Sync from database to reducer once when data loads
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!isLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      send({ type: "SET_MONTHLY_BALANCE", params: cachedMonthlyBalance });
    }
  }, [isLoading]);

  // Update cachedMonthlyBalance when monthlyBalance changes (persist to DB)
  React.useEffect(() => {
    if (!isLoading && hasInitialized.current) {
      setCachedMonthlyBalance(monthlyBalance);
    }
  }, [monthlyBalance, setCachedMonthlyBalance, isLoading]);

  if (isLoading) {
    return <LoadingAnimation />;
  }

  // ======================//
  //                       //
  //   COMPONENT METHODS   //
  //                       //
  // ======================//

  const copySelectedCategoriesToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedCategories));
    toastFactory("Categories copied to clipboard!", MessageSeverity.INFO);
  };

  const getCategorySelectionKey = (category: Category) =>
    category.variableId ?? category.name;

  // Modified pasteSelectedCategoriesFromClipboard to accept a filter by type
  const pasteSelectedCategoriesFromClipboard = () => {
    navigator.clipboard.readText().then((text) => {
      let newCategories = [];
      try {
        newCategories = JSON.parse(text) as Category[];
      } catch {
        toastFactory("Invalid JSON format in clipboard!", MessageSeverity.ERROR);
        return;
      }
      if (newCategories.length > 0) {
        const variableCategories = newCategories.map((category) => ({
          ...category,
          isVariable: true,
          variableId: category.variableId ?? crypto.randomUUID(),
        }));
        toastFactory(
          `Pasting ${newCategories.length} categories from clipboard!`,
          MessageSeverity.INFO,
        );
        send({
          type: "ADD_CATEGORIES",
          params: { currentMonth, newCategories: variableCategories },
        });
      }
    });
  };

  const toggleCategorySelection = (category: Category) => {
    const categoryKey = getCategorySelectionKey(category);
    setSelectedCategories((prev) => {
      if (prev.some((item) => getCategorySelectionKey(item) === categoryKey)) {
        return prev.filter((item) => getCategorySelectionKey(item) !== categoryKey);
      } else {
        return [...prev, category];
      }
    });
  };

  const updateCurrentMonth = (event: SelectChangeEvent<Months>) => {
    setCurrentMonth(event.target.value as Months);
  };

  // Spread selected categories to all months
  const spreadSelectedCategoriesToAllMonths = () => {
    if (!selectedCategories.length) return;
    Object.keys(monthlyBalance).forEach((month) => {
      send({
        type: "ADD_CATEGORIES",
        params: {
          currentMonth: month as Months,
          newCategories: selectedCategories,
        },
      });
    });
    toastFactory(
      `Spread ${selectedCategories.length} categories to all months!`,
      MessageSeverity.INFO,
    );
  };

  // Export monthlyBalance as JSON file
  const exportMonthlyBalances = () => {
    const dataStr = JSON.stringify(monthlyBalance, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monthlyBalances.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastFactory("Exported monthly balances!", MessageSeverity.INFO);
  };

  // Import monthlyBalance from JSON file
  const importMonthlyBalances = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setCachedMonthlyBalance(json);
        send({ type: "SET_MONTHLY_BALANCE", params: json });
        toastFactory("Imported monthly balances!", MessageSeverity.INFO);
      } catch {
        toastFactory("Invalid JSON file!", MessageSeverity.ERROR);
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    event.target.value = "";
  };

  // ==========================//
  //                           //
  //   RENDER ui COMPONENT     //
  //                           //
  // ==========================//

  return (
    <div className="md:px-64 h-[88vh] overflow-y-scroll scrollbar-hide">
      {/* Popup menu */}
      {selectedCategories.length > 0 && (
        <PopupMenu
          selectedCategories={selectedCategories}
          copySelectedCategoriesToClipboard={copySelectedCategoriesToClipboard}
          pasteSelectedCategoriesFromClipboard={() =>
            pasteSelectedCategoriesFromClipboard()
          }
          onClose={() => setSelectedCategories([])}
          onSpread={spreadSelectedCategoriesToAllMonths}
        />
      )}
      {/* Top Navbar */}
      <Navbar
        currentMonth={currentMonth}
        updateCurrentMonth={updateCurrentMonth}
        pasteSelectedCategoriesFromClipboard={pasteSelectedCategoriesFromClipboard}
        exportMonthlyBalances={exportMonthlyBalances}
        importMonthlyBalances={importMonthlyBalances}
        monthlyBalance={monthlyBalance}
      />
      {/* Two columns Container */}
      <div className="flex items-center justify-between w-full flex-col md:flex-row">
        {/* First Column */}
        <Column>
          <div className="flex w-full items-center justify-between p-2">
            <CiCirclePlus
              size={36}
              className="cursor-pointer hover:text-gray-600 text-gray-800 ml-4"
              onClick={() => {
                send({
                  type: "ADD_CATEGORY",
                  params: {
                    newCategoryName: "New Income Category",
                    newCategoryType: "income",
                    currentMonth,
                  },
                });
              }}
            />
            <Header text="💰 Income & Assets" />
          </div>
          <CategoryContainer categoryType="income">
            {monthlyBalance[currentMonth].categories.map((category, index) => {
              if (category.type === "income") {
                return (
                  <Category
                    className="cursor-pointer hover:bg-gray-100"
                    onDoubleClick={() => toggleCategorySelection(category)}
                    style={{
                      borderColor: selectedCategories.some(
                        (item) =>
                          getCategorySelectionKey(item) ===
                          getCategorySelectionKey(category),
                      )
                        ? "blue"
                        : "white",
                    }}
                    key={index}
                    name={category.name}
                    sections={category.sections}
                    isVariable={Boolean(category.isVariable)}
                    onChangeCategoryName={(newCategoryName) => {
                      send({
                        type: "CHANGE_CATEGORY_NAME",
                        params: {
                          currentMonth,
                          index,
                          newCategoryName,
                        },
                      });
                    }}
                    onDeleteCategory={() => {
                      send({
                        type: "DELETE_CATEGORY",
                        params: { index, currentMonth },
                      });
                    }}
                    onToggleCategoryVariable={() => {
                      send({
                        type: "TOGGLE_CATEGORY_VARIABLE",
                        params: { index, currentMonth },
                      });
                    }}
                    onAddCategoryItem={() => {
                      send({
                        type: "ADD_CATEGORY_ITEM",
                        params: {
                          index,
                          newCategoryItemName: "New Income Item",
                          currentMonth,
                        },
                      });
                    }}
                    onChangeCategoryItemName={(newItemName, categoryItemIndex) => {
                      send({
                        type: "CHANGE_CATEGORY_ITEM_NAME",
                        params: {
                          index,
                          currentMonth,
                          newCategoryItemName: newItemName,
                          categoryItemIndex,
                        },
                      });
                    }}
                    onChangeCategoryItemValue={(
                      newCategoryItemValue,
                      categoryItemIndex,
                    ) => {
                      send({
                        type: "CHANGE_CATEGORY_ITEM_VALUE",
                        params: {
                          index,
                          currentMonth,
                          newCategoryItemValue,
                          categoryItemIndex,
                        },
                      });
                    }}
                    onDeleteCategoryItem={(categoryItemIndex) => {
                      send({
                        type: "DELETE_CATEGORY_ITEM",
                        params: {
                          index,
                          currentMonth,
                          categoryItemIndex,
                        },
                      });
                    }}
                  />
                );
              }
            })}
          </CategoryContainer>
          <TotalValueCard text="Total In: " value={currentMonthTotals.totalIn} />
        </Column>
        {/* Second Column */}
        <Column>
          <div className="flex w-full items-center justify-between p-2">
            <CiCirclePlus
              size={36}
              className="cursor-pointer hover:text-gray-600 text-gray-800 ml-4"
              onClick={() => {
                send({
                  type: "ADD_CATEGORY",
                  params: {
                    newCategoryName: "New Expense Category",
                    newCategoryType: "expense",
                    currentMonth,
                  },
                });
              }}
            />
            <Header text="💸 Xpenses & Liabilities" />
          </div>
          <CategoryContainer categoryType="expense">
            {monthlyBalance[currentMonth].categories.map((category, index) => {
              if (category.type === "expense") {
                return (
                  <Category
                    onDoubleClick={() => toggleCategorySelection(category)}
                    key={index}
                    name={category.name}
                    sections={category.sections}
                    isVariable={Boolean(category.isVariable)}
                    onChangeCategoryName={(newCategoryName) => {
                      send({
                        type: "CHANGE_CATEGORY_NAME",
                        params: { currentMonth, index, newCategoryName },
                      });
                    }}
                    onDeleteCategory={() => {
                      send({
                        type: "DELETE_CATEGORY",
                        params: { index, currentMonth },
                      });
                    }}
                    onToggleCategoryVariable={() => {
                      send({
                        type: "TOGGLE_CATEGORY_VARIABLE",
                        params: { index, currentMonth },
                      });
                    }}
                    onAddCategoryItem={() => {
                      send({
                        type: "ADD_CATEGORY_ITEM",
                        params: {
                          index,
                          newCategoryItemName: "New Expense Item",
                          currentMonth,
                        },
                      });
                    }}
                    onChangeCategoryItemName={(newItemName, categoryItemIndex) => {
                      send({
                        type: "CHANGE_CATEGORY_ITEM_NAME",
                        params: {
                          index,
                          currentMonth,
                          categoryItemIndex,
                          newCategoryItemName: newItemName,
                        },
                      });
                    }}
                    onChangeCategoryItemValue={(newItemValue, categoryItemIndex) => {
                      send({
                        type: "CHANGE_CATEGORY_ITEM_VALUE",
                        params: {
                          index,
                          currentMonth,
                          categoryItemIndex,
                          newCategoryItemValue: newItemValue,
                        },
                      });
                    }}
                    onDeleteCategoryItem={(categoryItemIndex) => {
                      send({
                        type: "DELETE_CATEGORY_ITEM",
                        params: {
                          index,
                          currentMonth,
                          categoryItemIndex,
                        },
                      });
                    }}
                  />
                );
              }
            })}
          </CategoryContainer>
          <TotalValueCard text="Total Out: " value={currentMonthTotals.totalOut} />
        </Column>
      </div>
      {/* Final Result Container */}
      <Card className="flex items-center justify-evenly h-[70px] my-2 w-full">
        <div className="flex items-center justify-center">
          <h1 className="md:text-2xl text-gray-400 font-bold">Monthly Net: </h1>
          <h3 className="md:text-2xl text-gray-400 font-bold">
            {(currentMonthTotals.totalIn - currentMonthTotals.totalOut).toFixed(2)}
          </h3>
        </div>
        <div className="flex items-center justify-center">
          <h1 className="md:text-2xl text-gray-400 font-bold">Annual Net: </h1>
          <h3 className="md:text-2xl text-gray-400 font-bold">
            {annualNet.toFixed(2)}
          </h3>
        </div>
      </Card>
    </div>
  );
}
