import * as React from "react";
import {
  Plus,
  Pencil,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  List,
  ExternalLink,
} from "lucide-react";
import { createResourceInDb, readResourceInDb, useStoredValue } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

export type ShoppingItem = {
  id: string;
  name: string;
  notes: string;
  qty: number;
  link?: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  plannedItems: ShoppingItem[];
  missedItems: ShoppingItem[];
  purchasedItems: ShoppingItem[];
};

// ====================== //
//                        //
//   THEME COLORS (M3)    //
//                        //
// ====================== //

export const theme = {
  primary: "#5b9bd5",
  primaryContainer: "#d6e9f8",
  onPrimaryContainer: "#1a4971",
  secondary: "#7eb8e2",
  secondaryContainer: "#e8f4fc",
  surface: "#ffffff",
  surfaceContainer: "#f8fafc",
  surfaceContainerHigh: "#f1f5f9",
  surfaceContainerHighest: "#e9eff5",
  onSurface: "#1e293b",
  onSurfaceVariant: "#64748b",
  outline: "#94a3b8",
  outlineVariant: "#e2e8f0",
  error: "#dc2626",
  errorContainer: "#fef2f2",
};

// ====================== //
//                        //
//   DUMB COMPONENTS      //
//                        //
// ====================== //

export function M3Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl bg-white ${props.className || ""}`}
      style={{
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
      }}
    >
      {props.children}
    </div>
  );
}

export function M3Button(props: {
  children: React.ReactNode;
  onEventClick: () => void;
  variant?: "filled" | "tonal" | "outlined" | "text";
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const variant = props.variant ?? "filled";

  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200";

  const variantStyles = {
    filled: {
      backgroundColor: theme.primary,
      color: "white",
    },
    tonal: {
      backgroundColor: theme.secondaryContainer,
      color: theme.onPrimaryContainer,
    },
    outlined: {
      backgroundColor: "transparent",
      color: theme.primary,
      border: `1px solid ${theme.outline}`,
    },
    text: {
      backgroundColor: "transparent",
      color: theme.primary,
    },
  };

  return (
    <button
      type="button"
      onClick={props.onEventClick}
      disabled={props.disabled}
      className={`${baseStyles} hover:opacity-90 active:scale-[0.98] disabled:opacity-50`}
      style={variantStyles[variant]}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

function M3IconButton(props: {
  icon: React.ReactNode;
  onEventClick: () => void;
  variant?: "standard" | "filled" | "tonal" | "outlined";
  size?: "sm" | "md";
  title?: string;
  disabled?: boolean;
}) {
  const variant = props.variant ?? "standard";
  const size = props.size ?? "md";

  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
  };

  const variantStyles = {
    standard: {
      backgroundColor: "transparent",
      color: theme.onSurfaceVariant,
    },
    filled: {
      backgroundColor: theme.primary,
      color: "white",
    },
    tonal: {
      backgroundColor: theme.secondaryContainer,
      color: theme.onPrimaryContainer,
    },
    outlined: {
      backgroundColor: "transparent",
      color: theme.onSurfaceVariant,
      border: `1px solid ${theme.outline}`,
    },
  };

  return (
    <button
      title={props.title}
      type="button"
      onClick={props.onEventClick}
      disabled={props.disabled}
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-80 disabled:opacity-50`}
      style={variantStyles[variant]}
    >
      {props.icon}
    </button>
  );
}

function M3TextField(props: {
  label: string;
  value: string | number;
  onEventChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <label
        className="block text-xs font-medium mb-1"
        style={{ color: theme.onSurfaceVariant }}
      >
        {props.label}
      </label>
      <input
        type={props.type ?? "text"}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onEventChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200"
        style={{
          backgroundColor: theme.surfaceContainerHighest,
          color: theme.onSurface,
          border: `1px solid transparent`,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = theme.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "transparent";
        }}
      />
    </div>
  );
}

function M3Modal(props: {
  isOpen: boolean;
  onEventClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/30" onClick={props.onEventClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl p-6 shadow-xl bg-white">
        <h2 className="text-xl font-medium mb-6" style={{ color: theme.onSurface }}>
          {props.title}
        </h2>
        {props.children}
      </div>
    </div>
  );
}

function AccordionSection(props: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onEventToggle: () => void;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <M3Card className="overflow-hidden mb-3">
      <button
        type="button"
        onClick={props.onEventToggle}
        className="w-full px-5 py-4 flex items-center justify-between transition-colors duration-200 hover:bg-slate-50"
      >
        <div className="text-left">
          <div className="font-medium" style={{ color: theme.onSurface }}>
            {props.title}
          </div>
          {props.subtitle && (
            <div className="text-sm" style={{ color: theme.onSurfaceVariant }}>
              {props.subtitle}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {props.rightSlot}
          {props.isOpen ? (
            <ChevronUp size={20} style={{ color: theme.onSurfaceVariant }} />
          ) : (
            <ChevronDown size={20} style={{ color: theme.onSurfaceVariant }} />
          )}
        </div>
      </button>

      {props.isOpen && <div className="px-5 pb-5 space-y-4">{props.children}</div>}
    </M3Card>
  );
}

function EmptyState(props: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <M3Card className="p-12">
      <div className="text-center" style={{ color: theme.onSurfaceVariant }}>
        <div className="mx-auto mb-3 opacity-40 flex justify-center">
          {props.icon}
        </div>
        <div className="font-medium" style={{ color: theme.onSurface }}>
          {props.title}
        </div>
        <div className="text-sm mt-1">{props.subtitle}</div>
      </div>
    </M3Card>
  );
}

export function ShoppingItemRow(props: {
  item: ShoppingItem;
  mode: "planned" | "missed";
  isEditMode: boolean;

  onEventUpdateItem: (itemId: string, field: keyof ShoppingItem, value: any) => void;
  onEventDeleteItem: (itemId: string) => void;

  onEventMoveItem: (itemId: string, target: "planned" | "missed") => void;
}) {
  const safeLink = props.item.link ? normalizeLink(props.item.link) : "";

  if (!props.isEditMode) {
    return (
      <div
        className="space-y-3 py-4 border-b last:border-0"
        style={{ borderColor: theme.outlineVariant }}
      >
        <div className="flex items-start flex-col justify-between gap-3">
          <div className="w-full flex flex-col gap-3">
            <M3TextField
              label="Item name"
              value={props.item.name}
              onEventChange={(value) =>
                props.onEventUpdateItem(props.item.id, "name", value)
              }
              placeholder="e.g. Chicken breast"
            />
            <M3TextField
              label="Notes (optional)"
              value={props.item.notes}
              onEventChange={(value) =>
                props.onEventUpdateItem(props.item.id, "notes", value)
              }
              placeholder="e.g. Get the 2kg pack if available"
            />
          </div>
          <div className="w-full flex gap-2">
            <div className="w-[10%]">
              <M3TextField
                label="Qty"
                type="number"
                value={props.item.qty}
                onEventChange={(value) =>
                  props.onEventUpdateItem(
                    props.item.id,
                    "qty",
                    Math.max(0, parseInt(value) || 0)
                  )
                }
                placeholder="1"
              />
            </div>
            <div className="w-[80%]">
              <M3TextField
                label="Link (optional)"
                value={safeLink}
                onEventChange={(value) =>
                  props.onEventUpdateItem(props.item.id, "link", value)
                }
                placeholder="tesco.com/..."
              />
            </div>
            <div className="w-[10%] flex items-center gap-1">
              {props.mode === "planned" ? (
                <M3IconButton
                  title="Move to missed"
                  icon={<ChevronDown size={18} />}
                  onEventClick={() => props.onEventMoveItem(props.item.id, "missed")}
                  variant="standard"
                  size="md"
                />
              ) : (
                <M3IconButton
                  title="Move back to planned"
                  icon={<ChevronUp size={18} />}
                  onEventClick={() =>
                    props.onEventMoveItem(props.item.id, "planned")
                  }
                  variant="standard"
                  size="md"
                />
              )}

              <M3IconButton
                title="Delete item"
                icon={<Trash2 size={18} />}
                onEventClick={() => props.onEventDeleteItem(props.item.id)}
                variant="standard"
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 py-4 border-b last:border-0"
      style={{ borderColor: theme.outlineVariant }}
    >
      <div className="flex items-start flex-col justify-between gap-3">
        <div className="w-full flex flex-col gap-3">
          <M3TextField
            label="Item name"
            value={props.item.name}
            onEventChange={(value) =>
              props.onEventUpdateItem(props.item.id, "name", value)
            }
            placeholder="e.g. Chicken breast"
          />
          <M3TextField
            label="Notes (optional)"
            value={props.item.notes}
            onEventChange={(value) =>
              props.onEventUpdateItem(props.item.id, "notes", value)
            }
            placeholder="e.g. Get the 2kg pack if available"
          />
        </div>
        <div className="w-full flex gap-2">
          <div className="w-[10%]">
            <M3TextField
              label="Qty"
              type="number"
              value={props.item.qty}
              onEventChange={(value) =>
                props.onEventUpdateItem(
                  props.item.id,
                  "qty",
                  Math.max(0, parseInt(value) || 0)
                )
              }
              placeholder="1"
            />
          </div>
          <div className="w-[80%]">
            <M3TextField
              label="Link (optional)"
              value={props.item.link ?? ""}
              onEventChange={(value) =>
                props.onEventUpdateItem(props.item.id, "link", value)
              }
              placeholder="tesco.com/..."
            />
          </div>
          <div className="w-[10%] flex items-center gap-1">
            {props.mode === "planned" ? (
              <M3IconButton
                title="Move to missed"
                icon={<ChevronDown size={18} />}
                onEventClick={() => props.onEventMoveItem(props.item.id, "missed")}
                variant="standard"
                size="md"
              />
            ) : (
              <M3IconButton
                title="Move back to planned"
                icon={<ChevronUp size={18} />}
                onEventClick={() => props.onEventMoveItem(props.item.id, "planned")}
                variant="standard"
                size="md"
              />
            )}

            <M3IconButton
              title="Delete item"
              icon={<Trash2 size={18} />}
              onEventClick={() => props.onEventDeleteItem(props.item.id)}
              variant="standard"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingListPanel(props: {
  list: ShoppingList;
  isEditMode: boolean;

  onEventToggleEditMode: () => void;
  onEventRenameList: (name: string) => void;
  onEventDeleteList: () => void;

  onEventAddItem: () => void;

  onEventUpdateItem: (itemId: string, field: keyof ShoppingItem, value: any) => void;
  onEventDeleteItem: (itemId: string) => void;
  onEventMoveItem: (itemId: string, target: "planned" | "missed") => void;
}) {
  const plannedCount = props.list.plannedItems.length;
  const missedCount = props.list.missedItems.length;

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {props.isEditMode && (
            <M3TextField
              label="List name"
              value={props.list.name}
              onEventChange={props.onEventRenameList}
              placeholder="e.g. Tesco shop"
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          {props.isEditMode && (
            <M3IconButton
              title="Delete list"
              icon={<Trash2 size={18} />}
              onEventClick={props.onEventDeleteList}
              variant="standard"
            />
          )}
        </div>
      </div>

      {/* Add item */}
      <div className="flex justify-end">
        <M3Button
          variant="text"
          icon={<Plus size={16} />}
          onEventClick={props.onEventAddItem}
        >
          Add item
        </M3Button>
      </div>

      {/* Planned */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.onSurfaceVariant }}
          >
            Planned
          </h3>
          <div className="text-xs" style={{ color: theme.onSurfaceVariant }}>
            {plannedCount} item{plannedCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="w-full border-slate-300 border-2"></div>

        {plannedCount === 0 ? (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: theme.surfaceContainerHighest,
              color: theme.onSurfaceVariant,
            }}
          >
            No planned items yet.
          </div>
        ) : (
          <div>
            {props.list.plannedItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                mode="planned"
                isEditMode={props.isEditMode}
                onEventUpdateItem={props.onEventUpdateItem}
                onEventDeleteItem={props.onEventDeleteItem}
                onEventMoveItem={props.onEventMoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Missed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.onSurfaceVariant }}
          >
            Missed
          </h3>
          <div className="text-xs" style={{ color: theme.onSurfaceVariant }}>
            {missedCount} item{missedCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="w-full border-slate-3s00 border-2"></div>

        {missedCount === 0 ? (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: theme.surfaceContainerHighest,
              color: theme.onSurfaceVariant,
            }}
          >
            No missed items.
          </div>
        ) : (
          <div>
            {props.list.missedItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                mode="missed"
                isEditMode={props.isEditMode}
                onEventUpdateItem={props.onEventUpdateItem}
                onEventDeleteItem={props.onEventDeleteItem}
                onEventMoveItem={props.onEventMoveItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================== //
//                        //
//   MAIN APP             //
//                        //
// ====================== //

export default function ShoppingListManager() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const [lists, setLists, isLoading] = useStoredValue<ShoppingList[]>(
    email,
    [],
    "shopping_lists"
  );

  /**
   * State variable that holds a set of shopping list IDs representing the currently expanded lists.
   * Initially, if there are any lists, the first list's ID is expanded by default; otherwise, the set is empty.
   * Used to track which shopping lists are expanded in the UI.
   */
  const [expandedListIds, setExpandedListIds] = React.useState<Set<string>>(
    new Set()
  );

  const [activeListId, setActiveListId] = React.useState<string | null>(null);

  const [editingListId, setEditingListId] = React.useState<string | null>(null);

  const [isAddListModalOpen, setIsAddListModalOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("lists", lists);
  console.log("expandedListIds", expandedListIds);
  console.log("activeListId", activeListId);
  console.log("editingListId", editingListId);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    if (lists.length === 0) {
      setExpandedListIds(new Set());
      setActiveListId(null);
      return;
    }

    setExpandedListIds((prev) => {
      const hasValidSelection = Array.from(prev).some((id) =>
        lists.some((list) => list.id === id)
      );
      if (hasValidSelection) {
        return prev;
      }
      return new Set([lists[0].id]);
    });

    setActiveListId((prev) => {
      if (prev !== null && lists.some((list) => list.id === prev)) {
        return prev;
      }
      return lists[0].id;
    });
  }, [lists]);

  if (isLoading) {
    return <LoadingAnimation />;
  }

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Lists
  const handleEventToggleListExpanded = (listId: string) => {
    setExpandedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  const handleEventToggleEditMode = (listId: string) => {
    setEditingListId((prev) => (prev === listId ? null : listId));
    setActiveListId(listId);
    setExpandedListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });
  };

  const handleEventOpenAddListModal = () => {
    setIsAddListModalOpen(true);
  };

  const handleEventCloseAddListModal = () => {
    setIsAddListModalOpen(false);
    setNewListName("");
  };

  const handleEventAddList = () => {
    const name = newListName.trim();
    if (!name) return;

    const newList: ShoppingList = {
      id: crypto.randomUUID(),
      name,
      plannedItems: [],
      missedItems: [],
      purchasedItems: [],
    };

    setLists((prev) => [newList, ...prev]);
    setEditingListId(newList.id);
    handleEventCloseAddListModal();
  };

  const handleEventRenameList = (listId: string, name: string) => {
    setLists((prev) => prev.map((l) => (l.id !== listId ? l : { ...l, name })));
  };

  const handleEventDeleteList = (listId: string) => {
    const fallbackListId = rememberingFallbackListId(lists, listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));

    setExpandedListIds((prev) => {
      const next = new Set(prev);
      next.delete(listId);
      return next;
    });

    setEditingListId((prev) => (prev === listId ? null : prev));
    setActiveListId((prev) => (prev === listId ? fallbackListId : prev));
  };

  const handleShareShoppingList = (list: ShoppingList) => {
    let existingSharedLists: ShoppingList[] = [];
    // read existing shared lists from the "shared" storage
    readResourceInDb<ShoppingList[]>("shared", "shopping_lists").then(
      ({ result, error }) => {
        if (error) {
          console.error("Error reading shared shopping lists:", error);
          return;
        }
        existingSharedLists = result || [];
      }
    );
    // Remove any existing list with the same id, then add the new list
    existingSharedLists = existingSharedLists.filter((l) => l.id !== list.id);
    existingSharedLists.push(list);

    // write back to the "shared" storage
    createResourceInDb(
      "shared",
      "shopping_lists",
      JSON.stringify(existingSharedLists)
    ).then(({ result, error }) => {
      if (error) {
        console.error("Error sharing shopping list:", error);
        toastFactory("Failed to share shopping list.", MessageSeverity.ERROR);
      }
      if (result) {
        toastFactory("Shopping list shared successfully!", MessageSeverity.SUCCESS);
      }
    });
    window.open(`${window.location.origin}/shopping/share/${list.id}`, "_blank");
  };

  // ------------------------------------------------------ Items
  const handleEventAddItem = (listId: string) => {
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: "New item",
      notes: "",
      qty: 1,
      link: "",
    };

    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId ? l : { ...l, plannedItems: [...l.plannedItems, newItem] }
      )
    );

    setEditingListId(listId);
    setExpandedListIds((prev) => {
      const next = new Set(prev);
      next.add(listId);
      return next;
    });
    setActiveListId(listId);
  };

  const handleEventUpdateItem = (
    listId: string,
    itemId: string,
    field: keyof ShoppingItem,
    value: any
  ) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;

        const updateInArray = (items: ShoppingItem[]) =>
          items.map((it) => (it.id !== itemId ? it : { ...it, [field]: value }));

        return {
          ...l,
          plannedItems: updateInArray(l.plannedItems),
          missedItems: updateInArray(l.missedItems),
          purchasedItems: updateInArray(l.purchasedItems),
        };
      })
    );
  };

  const handleEventDeleteItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;

        return {
          ...l,
          plannedItems: l.plannedItems.filter((it) => it.id !== itemId),
          missedItems: l.missedItems.filter((it) => it.id !== itemId),
          purchasedItems: l.purchasedItems.filter((it) => it.id !== itemId),
        };
      })
    );
  };

  const handleEventMoveItem = (
    listId: string,
    itemId: string,
    target: "planned" | "missed"
  ) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;

        const fromPlanned = l.plannedItems.find((it) => it.id === itemId);
        const fromMissed = l.missedItems.find((it) => it.id === itemId);
        const item = fromPlanned ?? fromMissed;
        if (!item) return l;

        if (target === "missed") {
          return {
            ...l,
            plannedItems: l.plannedItems.filter((it) => it.id !== itemId),
            missedItems: [...l.missedItems, item],
          };
        }

        return {
          ...l,
          missedItems: l.missedItems.filter((it) => it.id !== itemId),
          plannedItems: [...l.plannedItems, item],
        };
      })
    );
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getListSubtitle = (list: ShoppingList) => {
    const planned = list.plannedItems.length;
    const missed = list.missedItems.length;
    return `${planned} planned / ${missed} missed`;
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  return (
    <div className="h-[80vh] bg-white overflow-y-scroll scrollbar-hide">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4 pb-32">
        <div className="space-y-3">
          {/* Manage lists */}
          {lists.length === 0 ? (
            <EmptyState
              title="No shopping lists yet"
              subtitle="Create one to start tracking planned and missed items."
              icon={<List size={48} />}
            />
          ) : (
            lists.map((list) => (
              <AccordionSection
                key={list.id}
                title={list.name || "Untitled list"}
                subtitle={getListSubtitle(list)}
                isOpen={expandedListIds.has(list.id)}
                onEventToggle={() => handleEventToggleListExpanded(list.id)}
                rightSlot={
                  <div
                    className="flex items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      className="px-3 flex gap-2 py-1.5 rounded-full text-xs font-semibold"
                      style={{ border: `1px solid ${theme.outline}` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleShareShoppingList(list);
                      }}
                    >
                      <p>Share List</p>
                      <ExternalLink size={15} />
                    </div>
                    <M3IconButton
                      title="Edit"
                      icon={
                        editingListId === list.id ? (
                          <Check size={18} />
                        ) : (
                          <Pencil size={16} />
                        )
                      }
                      onEventClick={() => handleEventToggleEditMode(list.id)}
                      variant={editingListId === list.id ? "tonal" : "standard"}
                      size="sm"
                    />
                  </div>
                }
              >
                <ShoppingListPanel
                  list={list}
                  isEditMode={editingListId === list.id}
                  onEventToggleEditMode={() => handleEventToggleEditMode(list.id)}
                  onEventRenameList={(name) => handleEventRenameList(list.id, name)}
                  onEventDeleteList={() => handleEventDeleteList(list.id)}
                  onEventAddItem={() => handleEventAddItem(list.id)}
                  onEventUpdateItem={(itemId, field, value) =>
                    handleEventUpdateItem(list.id, itemId, field, value)
                  }
                  onEventDeleteItem={(itemId) =>
                    handleEventDeleteItem(list.id, itemId)
                  }
                  onEventMoveItem={(itemId, target) =>
                    handleEventMoveItem(list.id, itemId, target)
                  }
                />
              </AccordionSection>
            ))
          )}
        </div>
      </div>

      {/* Bottom FAB Buttons */}
      <div className="w-full md:w-1/2 fixed bottom-6 left-6 md:left-1/4 flex items-center justify-between md:justify-evenly pointer-events-none">
        {/* Add List FAB - Left */}
        <button
          title="Add list"
          type="button"
          onClick={handleEventOpenAddListModal}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg pointer-events-auto"
          style={{
            backgroundColor: theme.secondaryContainer,
            color: theme.onPrimaryContainer,
          }}
        >
          <Plus size={20} />
          <List size={20} />
        </button>
      </div>

      {/* Add List Modal */}
      <M3Modal
        isOpen={isAddListModalOpen}
        onEventClose={handleEventCloseAddListModal}
        title="Create shopping list"
      >
        <div className="space-y-4">
          <M3TextField
            label="List name"
            value={newListName}
            onEventChange={setNewListName}
            placeholder="e.g. Tesco shopping"
          />
          <div className="flex justify-end gap-3 pt-4">
            <M3Button variant="text" onEventClick={handleEventCloseAddListModal}>
              Cancel
            </M3Button>
            <M3Button
              variant="filled"
              onEventClick={handleEventAddList}
              disabled={!newListName.trim()}
            >
              Create
            </M3Button>
          </div>
        </div>
      </M3Modal>
    </div>
  );
}

// ====================== //
//                        //
//   UTILS (MODULE)       //
//                        //
// ====================== //

function normalizeLink(link: string) {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://${trimmed}`;
}

function rememberingFallbackListId(lists: ShoppingList[], deletedId: string) {
  const remaining = lists.filter((l) => l.id !== deletedId);
  return remaining.length > 0 ? remaining[0].id : null;
}
