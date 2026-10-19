import { useAccount } from "../../auth/accountContext";
import { SelectedMealsMenu } from "./components/SelectedMealsMenu";
import { CheatMealForm } from "./components/CheatMealForm";
import type { CheatMealInput } from "./cheatMealsData";
import { PlanningCard as Card, PlanningHeading, PlanningToolbarButton } from "../../components/planning/PlanningComponents";
import LoadingAnimation from "../../components/LoadingAnimation";
import { formatNutrient, sumKnown } from "./dietPlanning";
import * as React from "react";
import { z } from "zod";
import { readDietResource } from "./dietAnalyticsData";
import { loadPlanningMeals, saveDietNote, saveCheatMeal, mergeCheatMeals } from "./cheatMealsData";
import { MealPicker } from "./components/MealPicker";
import { MealRecipe } from "./components/MealRecipe";
import { appendMeals, matchesMeal, planCost } from "./dietPlanning";
import BasicModal from "../../components/modal/BasicModal";
import { MenuItem, Select, Popover } from "@mui/material";
import { DietType, DietSchema, MealType, WEEKDAYS, WeekdayType, WeekPlanType } from "../../types";
import { FaTrashAlt } from "react-icons/fa";
import IOSSwitch from "../../components/switch/IOSSwitch";
import { useCachedValue, compareAndSwapResourceInDb, readResourceSnapshot } from "../../utils";
import WeekBoard, { type DayTotals } from "./WeekBoard";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

const emptyWeekPlan: DietType["meals"] = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

const defaultDiets: DietType[] = [
  { name: "Default", active: true, finalizedAt: null, meals: emptyWeekPlan },
];

type DietData = { calories: number | null; protein: number | null; cost: number | null; tasteScore: number | null };

const getFoodQuantity = (food: MealType["foods"][number]) => food.quantity ?? 1;

const emptyCheatMeal = (): CheatMealInput => ({ name: "", calories: null, protein: null, carbs: null, fat: null, cost: null, amount: null, vendor: null });

export default function Diet() {
  const email = useAccount();
  const [diets, setDiets] = React.useState<DietType[]>(defaultDiets);
  const [dietsLoading, setDietsLoading] = React.useState(true);
  const [dietsReady, setDietsReady] = React.useState(false);
  const [dietSaving, setDietSaving] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    void readDietResource(email, "diets", z.array(DietSchema)).then(value => {
      if (active) { setDiets(value?.length ? value : structuredClone(defaultDiets)); setDietsReady(true); }
    }).catch(() => { if (active) toastFactory("Unable to load diets. Refresh before editing.", MessageSeverity.ERROR); }).finally(() => { if (active) setDietsLoading(false); });
    return () => { active = false; };
  }, [email]);
  const activeDiet = diets.find((d) => d.active) ?? diets[0];

  // Browsing the dropdown only changes which diet is displayed. The activate
  // switch reflects and updates the displayed diet's actual active state.
  const [previewedDietName, setPreviewedDietName] = React.useState<string | null>(
    null
  );
  const viewedDiet =
    diets.find((d) => d.name === previewedDietName) ?? activeDiet;

  // Infer today's weekday as default
  const jsDayToWeekday: WeekdayType[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [selectMealModalOpen, setSelectMealModalOpen] = React.useState(false);
  const [mealQuery, setMealQuery] = React.useState("");
  const [recipeMeal, setRecipeMeal] = React.useState<MealType | null>(null);
  const [tasteDraft, setTasteDraft] = React.useState("");
  const [tasteMessage, setTasteMessage] = React.useState("");
  const [workspace, setWorkspace] = React.useState<"plan" | "cheat">("plan");
  const [cheatInput, setCheatInput] = React.useState<CheatMealInput>(emptyCheatMeal);
  const [cheatSaving, setCheatSaving] = React.useState(false);
  const [cheatMessage, setCheatMessage] = React.useState("");
  const [newDietDialog, setNewDietDialog] = React.useState(false);
  const [newDietName, setNewDietName] = React.useState("");
  const [noteEditor, setNoteEditor] = React.useState<{ diet: string; original: string; draft: string } | null>(null);
  const [noteAnchor, setNoteAnchor] = React.useState<HTMLElement | null>(null);
  const [noteSaving, setNoteSaving] = React.useState(false);
  const [noteMessage, setNoteMessage] = React.useState("");
  const today = new Date();
  const todayWeekday = jsDayToWeekday[today.getDay()];
  const [currentDay, setCurrentDay] = React.useState<WeekdayType>(todayWeekday);
  const [mealsFromDb, setMealsFromDb] = React.useState<MealType[]>([]);
  const [mealsAreLoading, setMealsAreLoading] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    void loadPlanningMeals(email).then(meals => {
      if (active) setMealsFromDb(meals ?? []);
    }).catch(error => {
      console.log("Error loading meal catalogue", error instanceof Error ? error.name : "UnknownError");
      if (active) toastFactory("Unable to load meals", MessageSeverity.ERROR);
    }).finally(() => { if (active) setMealsAreLoading(false); });
    return () => { active = false; };
  }, [email]);
  const [weeklyAverage, setWeeklyAverage] = React.useState<DietData>({
    calories: 0,
    protein: 0,
    cost: 0,
    tasteScore: 0,
  });
  const [selectedMeals, setSelectedMeals] = React.useState<MealType[]>([]);
  // Board edits are a draft until saved, unlike the table which persists on change. It
  // is keyed by diet name so switching diets cannot apply one diet's draft to another.
  const [boardDraft, setBoardDraft] = useCachedValue<{
    dietName: string;
    meals: WeekPlanType;
  } | null>(email, null, "dietBoardDraft");
  const [pendingClearDiet, setPendingClearDiet] = React.useState<string | null>(null);
  const [dayTotals, setDayTotals] = React.useState<Record<WeekdayType, DayTotals>>(
    () =>
      WEEKDAYS.reduce(
        (totals, day) => ({
          ...totals,
          [day]: { calories: 0, protein: 0, cost: 0, tasteScore: 0 },
        }),
        {} as Record<WeekdayType, DayTotals>
      )
  );

  // A draft is session state: a reload refetches from Redis and wins, so clear whatever
  // localStorage still holds on the first render rather than resurrecting stale edits.
  const draftClearedOnMount = React.useRef(false);
  if (!draftClearedOnMount.current) {
    draftClearedOnMount.current = true;
    if (boardDraft !== null) {
      setBoardDraft(null);
    }
  }

  const handleEventPersistDiets = async (updater: (current: DietType[]) => DietType[], expectedMeals?: { name: string; meals: WeekPlanType }) => {
    if (!dietsReady || dietSaving) return false;
    setDietSaving(true);
    try {
      return await navigator.locks.request(`sofia-diets-${email}`, async () => {
        const raw = await readResourceSnapshot(email, "diets");
        const stored = raw ? z.array(DietSchema).parse(raw.key) : null;
        const current = stored?.length ? stored : structuredClone(defaultDiets);
        if (expectedMeals && JSON.stringify(current.find(diet => diet.name === expectedMeals.name)?.meals) !== JSON.stringify(expectedMeals.meals)) throw new Error("This diet changed. Refresh before replacing its meals.");
        const next = updater(current);
        await compareAndSwapResourceInDb(email, "diets", raw, { ...raw, key: next });
        setDiets(next);
        return true;
      });
    } catch (error) { toastFactory(error instanceof Error ? error.message : "Unable to save diet.", MessageSeverity.ERROR); return false; }
    finally { setDietSaving(false); }
  };
  const updateDietByName = (dietName: string, updater: (diet: DietType) => DietType, expectedMeals?: WeekPlanType) =>
    handleEventPersistDiets(current => current.map(diet => diet.name === dietName ? updater(diet) : diet), expectedMeals ? { name: dietName, meals: expectedMeals } : undefined);
  const updateViewedDiet = (updater: (diet: DietType) => DietType) => updateDietByName(viewedDiet.name, updater, viewedDiet.meals);

  // What the board shows: the unsaved draft when there is one for this diet, else the
  // saved plan. All totals read from here so the columns update as cards are dragged.
  const boardMeals =
    boardDraft && boardDraft.dietName === viewedDiet.name
      ? boardDraft.meals
      : viewedDiet.meals;
  const hasUnsavedBoardChanges =
    boardDraft !== null && boardDraft.dietName === viewedDiet.name;

  const hasMealsToClear = WEEKDAYS.some(day =>
    viewedDiet.meals[day].length > 0 || boardMeals[day].length > 0
  );

  // ------------------------------------------------------ Diet
  const handleEventClearDiet = async () => {
    if (pendingClearDiet === null) return;
    const saved = await updateDietByName(pendingClearDiet, diet => ({
      ...diet,
      meals: structuredClone(emptyWeekPlan),
    }), diets.find(diet => diet.name === pendingClearDiet)?.meals);
    if (!saved) return;
    setBoardDraft(previous => previous?.dietName === pendingClearDiet ? null : previous);
    setSelectedMeals([]);
    setPendingClearDiet(null);
    toastFactory("Diet cleared", MessageSeverity.SUCCESS);
  };


  const handleEventBoardChange = (meals: WeekPlanType) => {
    if (dietSaving) return;
    setBoardDraft({ dietName: viewedDiet.name, meals });
  };

  const handleEventSaveBoard = async () => {
    if (!hasUnsavedBoardChanges) return true;
    const meals = boardMeals;
    const saved = await updateViewedDiet((diet) => ({ ...diet, meals }));
    if (!saved) return false;
    setBoardDraft(null);
    toastFactory("Week saved", MessageSeverity.SUCCESS);
    return true;
  };

  const handleEventDiscardBoard = () => {
    setBoardDraft(null);
  };

  const handleEventRemoveMealFromDay = (day: WeekdayType, index: number) => {
    setSelectedMeals(selected => selected.filter(meal => meal !== boardMeals[day][index]));
    handleEventBoardChange({
      ...boardMeals,
      [day]: boardMeals[day].filter((_, mealIndex) => mealIndex !== index),
    });
  };

  const averageTasteScore = (meals: MealType[]) => {
    const rated = meals.filter(meal => meal.tasteScore !== null);
    return rated.length ? rated.reduce((sum, meal) => sum + (meal.tasteScore ?? 0), 0) / rated.length : null;
  };

  const calculateTotal = React.useCallback(() => {
    // One pass over the week produces every per-day total, the current day's total and
    // the weekly average, so the board columns and the two summary cards cannot drift.
    const weekTotal: Pick<DietData, "calories" | "protein" | "cost"> = { calories: 0, protein: 0, cost: 0 };
    let allMeals: MealType[] = [];
    const weekDays = Object.keys(boardMeals) as WeekdayType[];
    const totalsByDay = {} as Record<WeekdayType, DayTotals>;

    weekDays.forEach((day) => {
      const meals = boardMeals[day];
      allMeals = allMeals.concat(meals);
      const dailyTotal: Pick<DietData, "calories" | "protein" | "cost"> = { calories: 0, protein: 0, cost: 0 };
      meals.forEach((meal: MealType) => {
        meal.foods.forEach((food) => {
          dailyTotal.calories = dailyTotal.calories === null || food.calories === null ? null : dailyTotal.calories + food.calories * getFoodQuantity(food);
          dailyTotal.protein = dailyTotal.protein === null || food.protein === null ? null : dailyTotal.protein + food.protein * getFoodQuantity(food);
          dailyTotal.cost = dailyTotal.cost === null || food.cost === null ? null : dailyTotal.cost + food.cost * getFoodQuantity(food);
        });
      });
      totalsByDay[day] = {
        ...dailyTotal,
        tasteScore: averageTasteScore(meals),
      };
      weekTotal.calories = sumKnown([weekTotal.calories, dailyTotal.calories]);
      weekTotal.protein = sumKnown([weekTotal.protein, dailyTotal.protein]);
      weekTotal.cost = weekTotal.cost === null || dailyTotal.cost === null ? null : weekTotal.cost + dailyTotal.cost;
    });

    setDayTotals(totalsByDay);
    setWeeklyAverage({
      calories: weekTotal.calories === null ? null : weekTotal.calories / weekDays.length,
      protein: weekTotal.protein === null ? null : weekTotal.protein / weekDays.length,
      cost: weekTotal.cost === null ? null : weekTotal.cost / weekDays.length,
      tasteScore: averageTasteScore(allMeals),
    });
  }, [boardMeals, currentDay]);

  React.useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleEventDay = (day: WeekdayType) => {
    setCurrentDay(day);
    setSelectedMeals([]);
  };

  const handleEventSelectBoardMeal = (day: WeekdayType, meal: MealType) => {
    setCurrentDay(day);
    setSelectedMeals([meal]);
  };

  const handleEventRecipe = (meal: MealType) => {
    setRecipeMeal(meal);
    setTasteDraft(meal.tasteScore?.toString() ?? "");
    setTasteMessage("");
  };

  const handleEventPlanChange = handleEventBoardChange;

  const copySelectedMealsToClipboard = async (meals = selectedMeals) => {
    if (!meals.length) { toastFactory("Select a meal before copying.", MessageSeverity.WARNING); return; }
    try {
      await navigator.clipboard.writeText(JSON.stringify(meals));
      toastFactory("Meals copied to clipboard", MessageSeverity.SUCCESS);
    } catch (error) {
      console.log("Error copying meals", error);
      toastFactory("Clipboard access failed. Allow clipboard access and try again.", MessageSeverity.ERROR);
    }
  };

  const addMealToDiet = (meal: MealType) => {
    handleEventPlanChange(appendMeals(boardMeals, [currentDay], [meal]));
  };

  const spreadSelectedMealsToAllDays = (meals = selectedMeals) => {
    if (!meals.length) { toastFactory("Select meals before spreading.", MessageSeverity.WARNING); return; }
    handleEventPlanChange(appendMeals(boardMeals, WEEKDAYS, meals));
    toastFactory(`Spread ${meals.length} meals across the week`, MessageSeverity.INFO);
  };

  const activateAndFinalizeDiet = (dietName: string) => {
    void handleEventPersistDiets((prev) =>
      prev.map((d) =>
        d.name === dietName
          ? { ...d, active: true, finalizedAt: new Date().toISOString() }
          : { ...d, active: false }
      )
    );
  };

  const handleEventSaveCheatMeal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (cheatSaving) return;
    setCheatSaving(true); setCheatMessage("");
    try {
      const saved = await saveCheatMeal(email, cheatInput, 0);
      setMealsFromDb(previous => mergeCheatMeals(previous, [saved]));
      setCheatInput(emptyCheatMeal()); setWorkspace("plan");
      toastFactory("Cheat meal saved and available in Add meals", MessageSeverity.SUCCESS);
    } catch (error) { setCheatMessage(error instanceof Error ? error.message : "Unable to save meal."); }
    finally { setCheatSaving(false); }
  };

  const handleEventOpenNote = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNoteAnchor(event.currentTarget);
    setNoteEditor({ diet: viewedDiet.name, original: viewedDiet.note ?? "", draft: viewedDiet.note ?? "" });
    setNoteMessage("");
  };
  const handleEventCloseNote = () => {
    if (!noteSaving) { setNoteEditor(null); setNoteAnchor(null); }
  };

  const handleEventSaveNote = async () => {
    if (!noteEditor) return;
    setNoteSaving(true);
    try {
      const next = await saveDietNote(email, noteEditor.diet, noteEditor.draft, noteEditor.original);
      setDiets(next);
      setNoteEditor(null); setNoteAnchor(null); setNoteMessage("");
      toastFactory("Note saved", MessageSeverity.SUCCESS);
    } catch (error) { setNoteMessage(error instanceof Error ? error.message : "Unable to save note."); }
    finally { setNoteSaving(false); }
  };

  const handleEventSelectDiet = (dietName: string) => {
    setPreviewedDietName(dietName);
    setSelectedMeals([]);
  };

  const handleEventToggleActivateDiet = (checked: boolean) => {
    if (checked) {
      activateAndFinalizeDiet(viewedDiet.name);
      return;
    }

    void handleEventPersistDiets((prev) =>
      prev.map((diet) =>
        diet.name !== viewedDiet.name ? diet : { ...diet, active: false }
      )
    );
  };

  const createDiet = async () => {
    const name = newDietName.trim();
    if (!name) { toastFactory("Give the new diet a unique name.", MessageSeverity.WARNING); return; }
    const saved = await handleEventPersistDiets(current => {
      if (current.some(diet => diet.name === name)) throw new Error("Give the new diet a unique name.");
      return [...current.map(diet => ({ ...diet, active: false })), { name, active: true, finalizedAt: null, meals: structuredClone(emptyWeekPlan) }];
    });
    if (saved) { setPreviewedDietName(name); setNewDietName(""); setNewDietDialog(false); }
  };

  // Map WeekdayType to JS day index
  const weekdayToJsDay: Record<WeekdayType, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const handleEventOpenMyFitnessPal = (selectedDay: WeekdayType) => {
    // Today's date
    const now = new Date();
    // Find the offset between selected day and today
    const todayIdx = now.getDay();
    const selectedIdx = weekdayToJsDay[selectedDay];
    // Calculate the date for the selected day in the current week (past or future)
    const diff = ((selectedIdx + 6) % 7) - ((todayIdx + 6) % 7);
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    window.open(
      `https://www.myfitnesspal.com/food/diary?date=${dateString}`,
      "_blank"
    );
  };

  if (dietsLoading || mealsAreLoading) return <LoadingAnimation />;
  if (!dietsReady) return <p role="alert" className="p-6 text-red-700">Unable to load diets. Refresh before editing.</p>;
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col items-center justify-start bg-white px-4 md:px-6 lg:px-8">
      {/* Selected meals menu */}
      {workspace === "plan" && selectedMeals.length > 0 && (
        <SelectedMealsMenu
          selectedMeals={selectedMeals}
          onEventCopyMeals={() => { void copySelectedMealsToClipboard(); }}
          onEventSpreadMeals={() => spreadSelectedMealsToAllDays()}
          onEventClose={() => setSelectedMeals([])}
        />
      )}

      {/* Finance-style planning toolbar */}
      <div role="toolbar" aria-label="Diet actions" className="flex w-full flex-wrap items-center justify-center gap-y-3 py-4">
        <Select inputProps={{ "aria-label": "Diet" }} className="min-w-[180px]" value={viewedDiet.name} onChange={event => handleEventSelectDiet(event.target.value)}>
          {diets.map(diet => <MenuItem key={diet.name} value={diet.name}>{diet.name}{diet.active ? " (active)" : ""}</MenuItem>)}
        </Select>
        <label className="mx-3 flex items-center gap-2 text-sm text-gray-500"><IOSSwitch checked={viewedDiet.active} disabled={dietSaving} inputProps={{ "aria-label": "Active diet" }} onChange={event => handleEventToggleActivateDiet(event.target.checked)} />Active</label>
        <PlanningToolbarButton label="New diet" disabled={dietSaving} onEventClick={() => { setNewDietName(""); setNewDietDialog(true); }}><span aria-hidden="true">➕</span>New diet</PlanningToolbarButton>
        <PlanningToolbarButton label="Clear diet" disabled={!hasMealsToClear || dietSaving} onEventClick={() => setPendingClearDiet(viewedDiet.name)}><FaTrashAlt aria-hidden="true" />Clear diet</PlanningToolbarButton>
        <PlanningToolbarButton label={workspace === "plan" ? "Create cheat meal" : "Back to Plan Diet"} disabled={cheatSaving} pressed={workspace === "cheat"} onEventClick={() => setWorkspace(previous => previous === "plan" ? "cheat" : "plan")}><span aria-hidden="true">{workspace === "plan" ? "🍔" : "📅"}</span>{workspace === "plan" ? "Create cheat meal" : "Back to Plan Diet"}</PlanningToolbarButton>
      </div>

      <BasicModal open={newDietDialog} handleClose={() => { if (!dietSaving) setNewDietDialog(false); }} customModal={<form role="dialog" aria-modal="true" aria-labelledby="new-diet-title" className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-md" onSubmit={event => { event.preventDefault(); void createDiet(); }}>
        <h2 id="new-diet-title" className="mb-5 text-xl font-bold text-gray-800">New diet</h2>
        <label htmlFor="new-diet-name" className="mb-2 block text-sm text-gray-600">Diet name</label><input id="new-diet-name" autoFocus required value={newDietName} onChange={event => setNewDietName(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:outline-blue-400" />
        <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={dietSaving} onClick={() => setNewDietDialog(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">Cancel</button><button type="submit" disabled={dietSaving} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-100 disabled:opacity-50">{dietSaving ? "Creating…" : "Create diet"}</button></div>
      </form>} />

      {/* Selected workspace retains its drafts in this page. */}
      {workspace === "cheat" ? <CheatMealForm input={cheatInput} saving={cheatSaving} message={cheatMessage} onEventInput={setCheatInput} onEventSave={handleEventSaveCheatMeal} /> : <Card className="w-full min-w-0 mt-5 mb-8 bg-white p-4 md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" aria-label="Save diet" title={dietSaving ? "Saving diet" : hasUnsavedBoardChanges ? "Save diet" : "Diet saved"} disabled={!hasUnsavedBoardChanges || dietSaving} className="modal__card__btn--create shrink-0 text-sm font-semibold disabled:cursor-default disabled:opacity-40" onClick={() => { void handleEventSaveBoard(); }}>{dietSaving ? "Saving…" : "Save diet"}</button>
            <button type="button" aria-label="Diet notes" title="Diet notes" aria-expanded={noteEditor !== null} aria-controls={noteEditor ? "diet-note-editor" : undefined} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-800 text-gray-800 hover:bg-gray-100" onClick={handleEventOpenNote}><span aria-hidden="true" className="text-2xl">📝</span></button>
            <div className="flex items-center gap-2 md:gap-3"><PlanningHeading text="📅 Plan Diet" /></div>
          </div>
          <div className="ml-auto flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 shadow-sm"><span className="text-xs font-bold text-gray-400 md:text-sm">Weekly cost</span><strong className="text-xl text-gray-500 md:text-2xl">{planCost(boardMeals) === null ? "Unknown" : `£${planCost(boardMeals)!.toFixed(2)}`}</strong></div>
        </div>
        {hasUnsavedBoardChanges && <div className="mb-3 flex items-center justify-end gap-3 text-xs text-gray-500"><span role="status">Unsaved week</span><button type="button" disabled={dietSaving} className="underline hover:text-gray-800" onClick={handleEventDiscardBoard}>Discard changes</button></div>}
        <div className={dietSaving ? "pointer-events-none opacity-60" : ""}>
          <WeekBoard meals={boardMeals} dayTotals={dayTotals} currentDay={currentDay} todayWeekday={todayWeekday} quantityOf={getFoodQuantity} onSelectDay={handleEventDay} onAddMeal={day => { handleEventDay(day); setSelectMealModalOpen(true); }} onRemoveMeal={handleEventRemoveMealFromDay} onChange={handleEventBoardChange} onEventRecipe={handleEventRecipe} onEventSelectMeal={handleEventSelectBoardMeal} onEventOpenDiary={handleEventOpenMyFitnessPal} />
        </div>
        <div aria-label="Daily averages" className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 p-4 text-sm font-bold text-gray-400 shadow-sm lg:grid-cols-4 md:text-xl">
          <p className="flex flex-wrap items-center justify-center gap-2"><span aria-hidden="true">🔥</span>Calories <span className="text-gray-500">{formatNutrient(weeklyAverage.calories)} <span className="text-xs font-normal">kcal</span></span></p>
          <p className="flex flex-wrap items-center justify-center gap-2"><span aria-hidden="true">💪</span>Protein <span className="text-gray-500">{formatNutrient(weeklyAverage.protein)} <span className="text-xs font-normal">g</span></span></p>
          <p className="flex flex-wrap items-center justify-center gap-2"><span aria-hidden="true">💷</span>Cost <span className="text-gray-500">{weeklyAverage.cost === null ? "Unknown" : `£${weeklyAverage.cost.toFixed(2)}`}</span></p>
          <p className="flex flex-wrap items-center justify-center gap-2"><span aria-hidden="true">⭐</span>Taste <span className="text-gray-500">{weeklyAverage.tasteScore === null ? "Unrated" : `${weeklyAverage.tasteScore.toFixed(1)}/10`}</span></p>
        </div>
      </Card>}

      <Popover open={noteEditor !== null} anchorEl={noteAnchor} onClose={handleEventCloseNote} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} slotProps={{ paper: { sx: { width: 800, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)", borderRadius: "16px", mt: 1, border: "1px solid #e5e7eb" } } }}>
        <div id="diet-note-editor" role="dialog" aria-labelledby="diet-note-title" className="p-5 md:p-8">
          <h2 id="diet-note-title" className="mb-5 text-xl font-bold text-gray-800">{noteEditor?.diet} notes</h2>
          <textarea autoFocus aria-label="Diet reference note" className="h-[45vh] min-h-[260px] w-full resize-y rounded-xl border border-gray-200 p-4 text-base leading-relaxed text-gray-800 focus:outline-blue-400" value={noteEditor?.draft ?? ""} onChange={event => setNoteEditor(previous => previous && { ...previous, draft: event.target.value })} />
          <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={noteSaving} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 disabled:opacity-50" onClick={handleEventCloseNote}>Close</button><button type="button" disabled={noteSaving} className="rounded-lg border border-gray-200 bg-green-100 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-green-200 disabled:opacity-50" onClick={() => { void handleEventSaveNote(); }}>{noteSaving ? "Saving…" : "Save note"}</button></div>
          {noteMessage && <p role="alert" className="mt-3 text-sm text-red-700">{noteMessage}</p>}
        </div>
      </Popover>

      <MealPicker open={selectMealModalOpen} day={currentDay} meals={mealsFromDb.filter(meal => matchesMeal(meal, mealQuery))} loading={mealsAreLoading} query={mealQuery} onEventQuery={setMealQuery} onEventAdd={addMealToDiet} onEventRecipe={handleEventRecipe} onEventClose={() => setSelectMealModalOpen(false)} />
      <MealRecipe meal={recipeMeal} taste={tasteDraft} message={tasteMessage} onEventTaste={setTasteDraft} onEventSave={() => setTasteMessage("Taste rating scope is awaiting your selection.")} onEventClose={() => setRecipeMeal(null)} />

      {/* Clear the selected diet */}
      <BasicModal
        open={pendingClearDiet !== null}
        handleClose={() => setPendingClearDiet(null)}
        customModal={
          <div className="w-[calc(100vw-2rem)] max-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-md px-5 py-6">
            <h2 id="modal-modal-title" className="text-xl font-bold text-gray-800 mb-3">
              Clear {pendingClearDiet}?
            </h2>
            <p id="modal-modal-description" className="text-sm text-gray-600 mb-6">
              Remove every planned meal from all seven days of {pendingClearDiet}, including unsaved changes. Your meal catalogue stays available.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold shadow transition"
                onClick={() => setPendingClearDiet(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 h-10 rounded-lg bg-red-400 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
                onClick={handleEventClearDiet}
              >
                Clear diet
              </button>
            </div>
          </div>
        }
      />


    </div>
  );
}
