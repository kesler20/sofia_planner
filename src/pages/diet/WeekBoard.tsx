import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
import { CiCirclePlus } from "react-icons/ci";
import { IoIosClose } from "react-icons/io";
import { MealType, WEEKDAYS, WeekdayType, WeekPlanType } from "../../types";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

export type DayTotals = {
  calories: number;
  protein: number;
  cost: number;
  tasteScore: number;
};

// Local Card, matching the one BudgetsPage.tsx keeps for its category columns, so the
// board shares the finance visual language without importing back from Diet.tsx.
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
    ${props.className ?? ""}`}
    >
      {props.children}
    </div>
  );
}

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

// Days never contain "::" so the first occurrence always separates day from meal name.
const cardId = (day: WeekdayType, mealName: string) => `${day}::${mealName}`;

const parseCardId = (id: string) => {
  const separator = id.indexOf("::");
  return {
    day: id.slice(0, separator) as WeekdayType,
    mealName: id.slice(separator + 2),
  };
};

const isColumnId = (id: string): id is WeekdayType =>
  (WEEKDAYS as string[]).includes(id);

const mealCalories = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  meal.foods.reduce((sum, food) => sum + food.calories * quantityOf(food), 0);

const mealProtein = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  meal.foods.reduce((sum, food) => sum + food.protein * quantityOf(food), 0);

const mealCost = (meal: MealType, quantityOf: (food: MealType["foods"][number]) => number) =>
  meal.foods.reduce((sum, food) => sum + (food.cost ?? 0) * quantityOf(food), 0);

function MealCard(props: {
  meal: MealType;
  slot: string;
  quantityOf: (food: MealType["foods"][number]) => number;
  onRemove?: () => void;
  isOverlay?: boolean;
}) {
  return (
    <Card className="bg-white p-2 mb-2">
      <div className="flex items-center justify-between">
        <span className="rounded-full px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700">
          {props.slot}
        </span>
        {!props.isOverlay && (
          <IoIosClose
            size={22}
            className="cursor-pointer text-red-300 hover:text-red-200"
            title={`Remove ${props.meal.name}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              props.onRemove?.();
            }}
          />
        )}
      </div>
      <p className="text-sm text-gray-400 font-bold break-words mt-1">
        {props.meal.name}
      </p>
      <p className="text-xs text-gray-400">
        {mealCalories(props.meal, props.quantityOf)} kcal &middot;{" "}
        {mealProtein(props.meal, props.quantityOf)} g
      </p>
      <p className="text-xs text-gray-400">
        &pound;{mealCost(props.meal, props.quantityOf).toFixed(2)} &middot;{" "}
        {props.meal.tasteScore}/10
      </p>
    </Card>
  );
}

function SortableMealCard(props: {
  day: WeekdayType;
  meal: MealType;
  slot: string;
  quantityOf: (food: MealType["foods"][number]) => number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cardId(props.day, props.meal.name) });

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
  onRemoveMeal: (mealName: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: props.day });

  // The width lives on a wrapper, not on the Card: Card hardcodes `w-full`, so a
  // `w-[200px]` alongside it loses and every column renders full width, leaving only the
  // first one on screen.
  return (
    <div className="shrink-0 w-[200px] flex">
    <Card
      className={`bg-white p-2 flex flex-col ${
        props.isCurrent ? "ring-2 ring-blue-400" : ""
      } ${isOver ? "bg-blue-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <CiCirclePlus
          size={24}
          className="cursor-pointer hover:text-gray-600 text-gray-800 shrink-0"
          title={`Add a meal to ${props.day}`}
          onClick={props.onAddMeal}
        />
        <h2
          className="text-base md:text-lg text-gray-800 font-bold cursor-pointer truncate mx-1"
          onClick={props.onSelectDay}
        >
          {props.day}
        </h2>
        {props.isToday ? (
          <span className="rounded-full px-2 py-1 text-xs font-semibold bg-blue-500 text-white shrink-0">
            Today
          </span>
        ) : (
          <span className="w-[1px] shrink-0" />
        )}
      </div>

      {/* flex-1 keeps an empty day the same height as a full one, so every column stays
          a visible, full-size drop target rather than collapsing to a stub. */}
      <div
        ref={setNodeRef}
        className="mt-2 flex-1 min-h-[140px] max-h-[420px] overflow-y-auto hidden-scrollbar"
      >
        <SortableContext
          items={props.meals.map((meal) => cardId(props.day, meal.name))}
          strategy={verticalListSortingStrategy}
        >
          {props.meals.map((meal, index) => (
            <SortableMealCard
              key={cardId(props.day, meal.name)}
              day={props.day}
              meal={meal}
              slot={mealSlot(index)}
              quantityOf={props.quantityOf}
              onRemove={() => props.onRemoveMeal(meal.name)}
            />
          ))}
        </SortableContext>
        {props.meals.length === 0 && (
          <div
            className={`h-full min-h-[140px] rounded-xl border-2 border-dashed flex items-center justify-center ${
              isOver ? "border-blue-400 text-blue-400" : "border-gray-200 text-gray-400"
            }`}
          >
            <span className="text-xs">Drop a meal here</span>
          </div>
        )}
      </div>

      <Card className="flex flex-col items-center justify-center mt-4 px-4 py-1 bg-gray-50 border border-gray-200 rounded-xl shadow">
        <span className="text-base md:text-lg font-semibold text-gray-500">
          {Math.round(props.totals.calories)} kcal
        </span>
        <span className="text-xs font-semibold text-gray-500">
          {Math.round(props.totals.protein)} g &middot; &pound;
          {props.totals.cost.toFixed(2)} &middot;{" "}
          {props.totals.tasteScore.toFixed(1)}/10
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
  onRemoveMeal: (day: WeekdayType, mealName: string) => void;
  onChange: (meals: WeekPlanType) => void;
}) {
  const [activeCard, setActiveCard] = React.useState<{
    meal: MealType;
    slot: string;
  } | null>(null);

  // A small activation distance so a click on the remove icon is not read as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { day, mealName } = parseCardId(String(event.active.id));
    const index = props.meals[day].findIndex((meal) => meal.name === mealName);
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
    const sourceIndex = sourceMeals.findIndex((meal) => meal.name === from.mealName);
    if (sourceIndex === -1) return;

    if (from.day === toDay) {
      const targetIndex = isColumnId(overId)
        ? sourceMeals.length - 1
        : sourceMeals.findIndex(
            (meal) => meal.name === parseCardId(overId).mealName
          );
      if (targetIndex === -1 || targetIndex === sourceIndex) return;
      props.onChange({
        ...props.meals,
        [from.day]: arrayMove(sourceMeals, sourceIndex, targetIndex),
      });
      return;
    }

    // Meals are identified by name within a day, so the same meal cannot land twice on
    // one day. Reject rather than silently dropping the move.
    if (props.meals[toDay].some((meal) => meal.name === from.mealName)) {
      toastFactory(
        `${toDay} already has ${from.mealName}`,
        MessageSeverity.WARNING
      );
      return;
    }

    const meal = sourceMeals[sourceIndex];
    const targetMeals = props.meals[toDay];
    const insertAt = isColumnId(overId)
      ? targetMeals.length
      : targetMeals.findIndex(
          (item) => item.name === parseCardId(overId).mealName
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
      <div className="w-full flex gap-3 overflow-x-auto hidden-scrollbar pb-2 items-stretch">
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
            onRemoveMeal={(mealName) => props.onRemoveMeal(day, mealName)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-[184px]">
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
