import { useAccount } from "../../auth/accountContext";
import { validateFinances, type CategoryType, type Category, type Months, type Finances } from "./financeBudgetTypes";
import { BudgetCategory, type BudgetEditDraft } from "./components/BudgetCategory";
import { PlanningCard as Card, PlanningHeading as Header, PlanningToolbarButton } from "../../components/planning/PlanningComponents";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import * as React from "react";
import { CiCirclePlus } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import { MdContentPaste } from "react-icons/md";
import { clearAccountCache, useCachedValue, useStoredValue } from "../../utils";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";

// =========== //
//             //
//   TYPES     //
//             //
// =========== //

// ============================================================ //
//                                                              //
//   BUDGETS PAGE                                               //
//                                                              //
//   Owns monthly budget edits, controlled drafts and persistence.
//   User events flow to the owning page container.              //
//                                                              //
// ============================================================ //
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
  onEventClearCache: () => void;
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
        <PlanningToolbarButton label="Paste Categories" onEventClick={props.pasteSelectedCategoriesFromClipboard}><MdContentPaste size={16} className="inline" />Paste</PlanningToolbarButton>
        <PlanningToolbarButton label="Export Monthly Balances" onEventClick={props.exportMonthlyBalances}><span className="inline">📤</span>Export</PlanningToolbarButton>
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
            props.onEventClearCache();
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
  onEventClearCache: () => void;
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
          onEventClearCache={props.onEventClearCache}
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

  const email = useAccount();
  const [currentMonth, setCurrentMonth] = useCachedValue<Months>(
    email,
    "January",
    "currentMonth",
  );
  const [cachedMonthlyBalance, setCachedMonthlyBalance, isLoading, loadError] =
    useStoredValue<Finances>(email, defaultMonthlyBalance, "monthlyBalance", undefined, validateFinances);
  const [monthlyBalance, send] = React.useReducer(
    monthlyBalanceReducer,
    cachedMonthlyBalance,
    (initial) => initial,
  );
  const [editing, setEditing] = React.useState<Record<string, BudgetEditDraft>>({});
  React.useEffect(() => { setEditing({}); }, [currentMonth]);
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

  console.log("budget selection", { selectedCount: selectedCategories.length, currentMonth, isLoading, unavailable: !!loadError });

  // =======================//
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // =======================//

  // Hydrate first, then persist reducer edits on later renders.
  const hasInitialized = React.useRef(false);
  React.useEffect(() => { hasInitialized.current = false; }, [email]);
  React.useEffect(() => {
    if (isLoading || loadError) return;
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      send({ type: "SET_MONTHLY_BALANCE", params: cachedMonthlyBalance });
      return;
    }
    setCachedMonthlyBalance(monthlyBalance);
  }, [isLoading, loadError, cachedMonthlyBalance, monthlyBalance, setCachedMonthlyBalance]);

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (loadError) return <p role="alert" className="p-6 text-gray-700">{loadError}</p>;

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  // ------------------------------------------------------ Budget editing
  const handleEventEdit = (key: string, patch: Partial<BudgetEditDraft>) => setEditing(previous => ({...previous, [key]: {...previous[key], ...patch}}));

  const handleEventRemoveDraftIndex = (prefix: string, removed: number) => {
    setEditing(previous => Object.fromEntries(Object.entries(previous).flatMap(([key, draft]) => {
      if (!key.startsWith(prefix)) return [[key, draft]];
      const [index, ...rest] = key.slice(prefix.length).split("/");
      const position = Number(index);
      if (position === removed) return [];
      return [[`${prefix}${position > removed ? position - 1 : position}${rest.length ? "/" + rest.join("/") : ""}`, draft]];
    })));
  };

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

  function handleEventClearCache() {
    try { clearAccountCache(email); window.location.reload(); }
    catch { toastFactory("Unable to clear this account's cache", MessageSeverity.ERROR); }
  }

  // Import monthlyBalance from JSON file
  const importMonthlyBalances = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = validateFinances(JSON.parse(e.target?.result as string));
        // Imported budgets replace the resource, so existing field drafts no longer apply.
        setEditing({});
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
        onEventClearCache={handleEventClearCache}
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
                  <BudgetCategory
                    editKey={`${currentMonth}/${index}`}
                    edits={editing}
                    onEventEdit={handleEventEdit}
                    className="cursor-pointer hover:bg-gray-100"
                    onEventDoubleClick={() => toggleCategorySelection(category)}
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
                    onEventChangeCategoryName={(newCategoryName) => {
                      send({
                        type: "CHANGE_CATEGORY_NAME",
                        params: {
                          currentMonth,
                          index,
                          newCategoryName,
                        },
                      });
                    }}
                    onEventDeleteCategory={() => {
                      handleEventRemoveDraftIndex(`${currentMonth}/`, index);
                      send({
                        type: "DELETE_CATEGORY",
                        params: { index, currentMonth },
                      });
                    }}
                    onEventToggleCategoryVariable={() => {
                      send({
                        type: "TOGGLE_CATEGORY_VARIABLE",
                        params: { index, currentMonth },
                      });
                    }}
                    onEventAddCategoryItem={() => {
                      send({
                        type: "ADD_CATEGORY_ITEM",
                        params: {
                          index,
                          newCategoryItemName: "New Income Item",
                          currentMonth,
                        },
                      });
                    }}
                    onEventChangeCategoryItemName={(newItemName, categoryItemIndex) => {
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
                    onEventChangeCategoryItemValue={(
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
                    onEventDeleteCategoryItem={(categoryItemIndex) => {
                      handleEventRemoveDraftIndex(`${currentMonth}/${index}/section/`, categoryItemIndex);
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
                  <BudgetCategory
                    editKey={`${currentMonth}/${index}`}
                    edits={editing}
                    onEventEdit={handleEventEdit}
                    onEventDoubleClick={() => toggleCategorySelection(category)}
                    key={index}
                    name={category.name}
                    sections={category.sections}
                    isVariable={Boolean(category.isVariable)}
                    onEventChangeCategoryName={(newCategoryName) => {
                      send({
                        type: "CHANGE_CATEGORY_NAME",
                        params: { currentMonth, index, newCategoryName },
                      });
                    }}
                    onEventDeleteCategory={() => {
                      handleEventRemoveDraftIndex(`${currentMonth}/`, index);
                      send({
                        type: "DELETE_CATEGORY",
                        params: { index, currentMonth },
                      });
                    }}
                    onEventToggleCategoryVariable={() => {
                      send({
                        type: "TOGGLE_CATEGORY_VARIABLE",
                        params: { index, currentMonth },
                      });
                    }}
                    onEventAddCategoryItem={() => {
                      send({
                        type: "ADD_CATEGORY_ITEM",
                        params: {
                          index,
                          newCategoryItemName: "New Expense Item",
                          currentMonth,
                        },
                      });
                    }}
                    onEventChangeCategoryItemName={(newItemName, categoryItemIndex) => {
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
                    onEventChangeCategoryItemValue={(newItemValue, categoryItemIndex) => {
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
                    onEventDeleteCategoryItem={(categoryItemIndex) => {
                      handleEventRemoveDraftIndex(`${currentMonth}/${index}/section/`, categoryItemIndex);
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
