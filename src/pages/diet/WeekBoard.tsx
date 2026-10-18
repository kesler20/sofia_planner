import { PlanningCard as Card, PlanningItemHeading, PlanningDeleteButton, PlanningAddButton } from "../../components/planning/PlanningComponents";
import * as React from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { MealType, WEEKDAYS, WeekdayType, WeekPlanType } from "../../types";
import { mealTotals, formatNutrient, sumKnown } from "./dietPlanning";

export type DayTotals = {
  calories: number | null;
  protein: number | null;
  cost: number | null;
  tasteScore: number | null;
};

/**
 * The slot chip is derived from position, never stored: the first meal of a day reads
 * Breakfast, the second Lunch, the third Dinner, and everything after that Snack. That
 * keeps MealType untouched and relabels cards the moment they are reordered.
 */
const mealSlot = (index: number): string => {
  if (index === 0) return "Breakfast";
  if (index === 1) return "Lunch";
  if (index === 2) return "Dinner";
  return "Snack";
};

const parseCardId = (id: string) => {
  const separator = id.indexOf("::");
  return {
    day: id.slice(0, separator) as WeekdayType,
    token: id.slice(separator + 2),
  };
};

const isColumnId = (id: string): id is WeekdayType =>
  (WEEKDAYS as string[]).includes(id);

const mealCalories = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  sumKnown(meal.foods.map(food => food.calories === null ? null : food.calories * quantityOf(food)));

const mealProtein = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  sumKnown(meal.foods.map(food => food.protein === null ? null : food.protein * quantityOf(food)));

const mealCost = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  meal.foods.reduce((sum, food) => sum + (food.cost ?? 0) * quantityOf(food), 0);

function MealCard(props: {
  meal: MealType;
  slot: string;
  quantityOf: (food: MealType["foods"][number]) => number;
  onRemove?: () => void;
  onEventRecipe?: () => void;
  onEventSelect?: () => void;
  isOverlay?: boolean;
}) {
  return (
    <Card className="bg-white p-2 mb-3 cursor-pointer" onEventClick={props.onEventSelect} onEventContextMenu={event => { if (props.onEventRecipe) { event.preventDefault(); props.onEventRecipe(); } }}>
      <div className="flex items-center justify-between">
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700">
          {props.slot}
        </span>
        {!props.isOverlay && (
          <PlanningDeleteButton label={`Remove ${props.meal.name}`} onEventDelete={() => props.onRemove?.()} />
        )}
      </div>
      <div className="mt-3 break-words"><PlanningItemHeading compact>{props.meal.name}</PlanningItemHeading></div>
      <p className="text-sm leading-relaxed text-gray-500">
        {formatNutrient(mealCalories(props.meal, props.quantityOf))} kcal &middot;{" "}
        {formatNutrient(mealProtein(props.meal, props.quantityOf))} g
      </p>
      <p className="text-sm leading-relaxed text-gray-500">
        {mealTotals(props.meal).cost === null ? "Cost unknown" : `£${mealCost(props.meal, props.quantityOf).toFixed(2)}`} &middot;{" "}
        {props.meal.tasteScore === null ? "Unrated" : `${props.meal.tasteScore}/10`}
      </p>

    </Card>
  );
}

function SortableMealCard(props: {
  id: string;
  meal: MealType;
  slot: string;
  quantityOf: (food: MealType["foods"][number]) => number;
  onRemove: () => void;
  onEventRecipe: () => void;
  onEventSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <MealCard
        meal={props.meal}
        slot={props.slot}
        quantityOf={props.quantityOf}
        onRemove={props.onRemove}
        onEventRecipe={props.onEventRecipe}
        onEventSelect={props.onEventSelect}
      />
    </div>
  );
}

function DayColumn(props: {
  day: WeekdayType;
  meals: MealType[];
  totals: DayTotals;
  isToday: boolean;
  isCurrent: boolean;
  quantityOf: (food: MealType["foods"][number]) => number;
  onSelectDay: () => void;
  onAddMeal: () => void;
  onEventOpenDiary?: () => void;
  onRemoveMeal: (index: number) => void;
  cardId: (day: WeekdayType, meal: MealType) => string;
  onEventRecipe: (meal: MealType) => void;
  onEventSelect: (meal: MealType) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: props.day });

  // The width lives on a wrapper, not on the Card: Card hardcodes `w-full`, so a
  // `w-[200px]` alongside it loses and every column renders full width, leaving only the
  // first one on screen.
  return (
    <div className="flex-1 min-w-[270px] flex">
    <Card
      className={`bg-white p-3 flex flex-col ${
        props.isCurrent ? "ring-2 ring-blue-400" : ""
      } ${isOver ? "bg-blue-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <PlanningAddButton label={`Add a meal to ${props.day}`} onEventAdd={props.onAddMeal} />
        <button type="button" className="mx-1 truncate font-bold text-gray-800 md:text-2xl" onClick={props.onSelectDay}>{props.day}{props.isToday && <span className="ml-1 text-xs font-normal text-blue-600">Today</span>}</button>
        {props.onEventOpenDiary && <button type="button" aria-label={`Open ${props.day} in MyFitnessPal`} title={`Open ${props.day} in MyFitnessPal`} className="shrink-0 text-blue-500 hover:text-blue-600" onClick={props.onEventOpenDiary}><FaArrowUpRightFromSquare size={17} aria-hidden="true" /></button>}
      </div>


      {/* flex-1 keeps an empty day the same height as a full one, so every column stays
          a visible, full-size drop target rather than collapsing to a stub. */}
      <div
        ref={setNodeRef}
        className={`mt-4 h-[45vh] min-h-[300px] overflow-y-auto scrollbar-hide rounded-2xl p-3 ${isOver ? "bg-green-200" : "bg-green-100"}`}
      >
        <SortableContext
          items={props.meals.map((meal) => props.cardId(props.day, meal))}
          strategy={verticalListSortingStrategy}
        >
          {props.meals.map((meal, index) => (
            <SortableMealCard
              key={props.cardId(props.day, meal)}
              id={props.cardId(props.day, meal)}
              meal={meal}
              slot={mealSlot(index)}
              quantityOf={props.quantityOf}
              onRemove={() => props.onRemoveMeal(index)}
              onEventRecipe={() => props.onEventRecipe(meal)}
              onEventSelect={() => props.onEventSelect(meal)}
            />
          ))}
        </SortableContext>
        {props.meals.length === 0 && (
          <div
            className={`h-full min-h-[140px] rounded-xl border-2 border-dashed flex items-center justify-center ${
              isOver ? "border-green-400 text-green-700" : "border-green-200 text-gray-500"
            }`}
          >
            <span className="text-xs">Drop a meal here</span>
          </div>
        )}
      </div>

      <Card className="flex flex-col items-center justify-center mt-4 px-4 py-1 bg-gray-50 border border-gray-200 rounded-xl shadow">
        <span className="text-base md:text-lg font-semibold text-gray-500">
          {formatNutrient(props.totals.calories)} kcal
        </span>
        <span className="text-xs font-semibold text-gray-500">
          {formatNutrient(props.totals.protein)} g &middot; &pound;
          {props.totals.cost === null ? "unknown" : props.totals.cost.toFixed(2)} &middot;{" "}
          {props.totals.tasteScore === null ? "Unrated" : `${props.totals.tasteScore.toFixed(1)}/10`}
        </span>
      </Card>
    </Card>
    </div>
  );
}

export default function WeekBoard(props: {
  meals: WeekPlanType;
  dayTotals: Record<WeekdayType, DayTotals>;
  currentDay: WeekdayType;
  todayWeekday: WeekdayType;
  quantityOf: (food: MealType["foods"][number]) => number;
  onSelectDay: (day: WeekdayType) => void;
  onAddMeal: (day: WeekdayType) => void;
  onRemoveMeal: (day: WeekdayType, index: number) => void;
  onChange: (meals: WeekPlanType) => void;
  onEventRecipe?: (meal: MealType) => void;
  onEventSelectMeal?: (day: WeekdayType, meal: MealType) => void;
  onEventOpenDiary?: (day: WeekdayType) => void;
}) {
  const [activeCard, setActiveCard] = React.useState<{
    meal: MealType;
    slot: string;
  } | null>(null);

  // Each portion has a separate drag identity without changing the saved schema.
  const identities = React.useRef(new WeakMap<MealType, string>());
  const cardId = (day: WeekdayType, meal: MealType): string => {
    let token = identities.current.get(meal);
    if (!token) {
      token = crypto.randomUUID();
      identities.current.set(meal, token);
    }
    return `${day}::${token}`;
  };

  // A small activation distance so a click on the remove icon is not read as a drag.
  const sensors = useSensors(
    // Separate mouse and touch activation so a touch scroll does not start the
    // pointer sensor before the long-press touch sensor can take control.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { day } = parseCardId(String(event.active.id));
    const index = props.meals[day].findIndex((meal) => cardId(day, meal) === String(event.active.id));
    if (index === -1) return;
    setActiveCard({ meal: props.meals[day][index], slot: mealSlot(index) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const from = parseCardId(String(active.id));
    const overId = String(over.id);
    const toDay = isColumnId(overId) ? overId : parseCardId(overId).day;

    const sourceMeals = props.meals[from.day];
    const sourceIndex = sourceMeals.findIndex((meal) => cardId(from.day, meal) === String(active.id));
    if (sourceIndex === -1) return;

    if (from.day === toDay) {
      const targetIndex = isColumnId(overId)
        ? sourceMeals.length - 1
        : sourceMeals.findIndex(
            (meal) => cardId(toDay, meal) === overId
          );
      if (targetIndex === -1 || targetIndex === sourceIndex) return;
      props.onChange({
        ...props.meals,
        [from.day]: arrayMove(sourceMeals, sourceIndex, targetIndex),
      });
      return;
    }

    const meal = structuredClone(sourceMeals[sourceIndex]);
    const targetMeals = props.meals[toDay];
    const insertAt = isColumnId(overId)
      ? targetMeals.length
      : targetMeals.findIndex(
          (item) => cardId(toDay, item) === overId
        );

    props.onChange({
      ...props.meals,
      [from.day]: sourceMeals.filter((_, index) => index !== sourceIndex),
      [toDay]: [
        ...targetMeals.slice(0, insertAt === -1 ? targetMeals.length : insertAt),
        meal,
        ...targetMeals.slice(insertAt === -1 ? targetMeals.length : insertAt),
      ],
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <div role="region" aria-label="Weekly diet board" tabIndex={0} className="w-full max-w-full min-w-0 flex gap-4 overflow-x-auto scrollbar-hide pb-4 items-stretch">
        {WEEKDAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            meals={props.meals[day]}
            totals={props.dayTotals[day]}
            isToday={day === props.todayWeekday}
            isCurrent={day === props.currentDay}
            quantityOf={props.quantityOf}
            onSelectDay={() => props.onSelectDay(day)}
            onAddMeal={() => props.onAddMeal(day)}
            onEventOpenDiary={props.onEventOpenDiary ? () => props.onEventOpenDiary?.(day) : undefined}
            onRemoveMeal={(index) => props.onRemoveMeal(day, index)}
            cardId={cardId}
            onEventRecipe={meal => props.onEventRecipe?.(meal)}
            onEventSelect={meal => props.onEventSelectMeal?.(day, meal)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-[270px]">
            <MealCard
              meal={activeCard.meal}
              slot={activeCard.slot}
              quantityOf={props.quantityOf}
              isOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
