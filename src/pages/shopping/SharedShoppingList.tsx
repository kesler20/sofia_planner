import * as React from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, Plus } from "lucide-react";
import { useStoredValue } from "../../utils";
import {
  M3Button,
  M3Card,
  ShoppingItemRow,
  theme,
  type ShoppingItem,
  type ShoppingList,
} from "./ShoppingListManager";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";
import LoadingAnimation from "../../components/LoadingAnimation";

// ====================== //
//                        //
//   THEME + CONSTANTS    //
//                        //
// ====================== //

const actionButtonStyles = {
  purchased: {
    backgroundColor: theme.primary,
    color: "white",
  },
  missed: {
    backgroundColor: theme.errorContainer,
    color: theme.error,
  },
  return: {
    backgroundColor: theme.surfaceContainerHighest,
    color: theme.onSurface,
  },
} as const;

// ====================== //
//                        //
//     UI COMPONENTS      //
//                        //
// ====================== //

function SharedItemRow(props: {
  item: ShoppingItem;
  variant: "planned" | "purchased" | "missed";
  onEventMarkItemPurchased: (itemId: string) => void;
  onEventMarkItemMissed: (itemId: string) => void;
  onEventEditItem: (itemId: string) => void;
  onEventReturnPurchasedItem: (itemId: string) => void;
  onEventDeleteItem: (itemId: string) => void;
}) {
  const safeLink = props.item.link ? normalizeLink(props.item.link) : "";
  const isPurchased = props.variant === "purchased";
  const isMissed = props.variant === "missed";

  const titleClassName = isPurchased ? "font-medium line-through" : "font-medium";
  const titleColor = isPurchased
    ? theme.onSurfaceVariant
    : isMissed
    ? theme.error
    : theme.onSurface;
  const infoColor = isMissed ? theme.error : theme.onSurfaceVariant;

  return (
    <div className="flex items-start gap-3 w-full">
      <div className="flex-1 min-w-0">
        <div className={titleClassName} style={{ color: titleColor }}>
          {props.item.name || "Untitled item"}
        </div>
        <div className="text-sm mt-0.5" style={{ color: infoColor }}>
          Qty: {props.item.qty}
        </div>
        {props.item.notes?.trim() && (
          <div className="text-sm mt-1" style={{ color: infoColor }}>
            {props.item.notes}
          </div>
        )}
        {safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm mt-2 hover:opacity-80"
            style={{ color: theme.primary }}
            title={safeLink}
          >
            <ExternalLink size={14} />
            Open link
          </a>
        )}
      </div>

      {props.variant === "planned" && (
        <>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={actionButtonStyles.purchased}
              onClick={() => props.onEventMarkItemPurchased(props.item.id)}
            >
              Purchased
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={actionButtonStyles.missed}
              onClick={() => props.onEventMarkItemMissed(props.item.id)}
            >
              Missed
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={actionButtonStyles.purchased}
              onClick={() => props.onEventEditItem(props.item.id)}
            >
              Edit
            </button>
            {/* Delete button for all variants */}
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={actionButtonStyles.missed}
              onClick={() => props.onEventDeleteItem(props.item.id)}
              title="Delete item"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {(props.variant === "missed" || props.variant === "purchased") && (
        <>
          <button
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={actionButtonStyles.return}
            onClick={() => props.onEventReturnPurchasedItem(props.item.id)}
          >
            Move to planned
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={actionButtonStyles.missed}
            onClick={() => props.onEventDeleteItem(props.item.id)}
            title="Delete Item"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}

function SharedItemsSection(props: {
  title: string;
  emptyLabel: string;
  items: ShoppingItem[];
  variant: "planned" | "purchased" | "missed";
  onEventMarkItemPurchased: (itemId: string) => void;
  onEventMarkItemMissed: (itemId: string) => void;
  onEventReturnPurchasedItem: (itemId: string) => void;
  onEventDeleteItem: (itemId: string) => void;
  onEventEditItem: (itemId: string) => void;
}) {
  const isEmpty = props.items.length === 0;

  return (
    <div className="space-y-3">
      <div
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: theme.onSurfaceVariant }}
      >
        {props.title}
      </div>

      {isEmpty ? (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: theme.surfaceContainerHighest,
            color: theme.onSurfaceVariant,
          }}
        >
          {props.emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {props.items.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 rounded-xl"
              style={{ backgroundColor: theme.surfaceContainerHigh }}
            >
              <SharedItemRow
                item={item}
                variant={props.variant}
                onEventMarkItemMissed={props.onEventMarkItemMissed}
                onEventMarkItemPurchased={props.onEventMarkItemPurchased}
                onEventReturnPurchasedItem={props.onEventReturnPurchasedItem}
                onEventDeleteItem={props.onEventDeleteItem}
                onEventEditItem={props.onEventEditItem}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== //
//                        //
//   MAIN PAGE            //
//                        //
// ====================== //

export default function SharedShoppingListPage() {
  const params = useParams<{ identifier?: string }>();

  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const [sharedList, setSharedList] = React.useState<ShoppingList | null>(null);
  const [shoppingLists, setShoppingLists, listsLoading] = useStoredValue<
    ShoppingList[]
  >("shared", [], "shopping_lists");
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [showClipboardModal, setShowClipboardModal] = React.useState(false);
  const [clipboardItems, setClipboardItems] = React.useState<ShoppingItem[]>([]);

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("sharedList", sharedList);
  console.log("sharedIdentifier", params.identifier);
  console.log("editingItemId", editingItemId);
  console.log("shoppingLists", shoppingLists);
  console.log("showClipboardModal", showClipboardModal);
  console.log("clipboardItems", clipboardItems);

  React.useEffect(() => {
    if (params.identifier && !listsLoading) {
      // load the shared shopping list from storage
      console.log("shoppingLists", shoppingLists);
      const foundList =
        shoppingLists?.find((list) => list.id === params.identifier) || null;
      console.log("foundList", foundList);
      setSharedList(foundList);
    }
  }, [shoppingLists, params.identifier, listsLoading]);

  // update the shopping lists if the shared list changes
  React.useEffect(() => {
    if (sharedList && shoppingLists) {
      setShoppingLists((prev) => {
        if (!prev) return prev;
        return prev.map((list) => {
          if (list.id === sharedList.id) {
            return sharedList;
          }
          return list;
        });
      });
    }
  }, [sharedList]);

  // check clipboard on mount
  React.useEffect(() => {
    if (sharedList && navigator.clipboard) {
      checkClipboardForItems();
    }
  }, [sharedList?.id]);

  if (!sharedList) {
    return (
      <M3Card className="p-6">
        <div
          className="text-center text-sm"
          style={{ color: theme.onSurfaceVariant }}
        >
          Loading shared shopping list...
        </div>
        <div className="flex justify-center mt-4">
          <LoadingAnimation />
        </div>
      </M3Card>
    );
  }

  const plannedCount = sharedList.plannedItems.length;
  const missedCount = sharedList.missedItems.length;
  const purchasedCount = sharedList.purchasedItems.length;

  // ===================== //
  //                       //
  //   EVENT HANDLERS      //
  //                       //
  // ===================== //

  // ------------------------------------------------------ Clipboard Import
  const handleEventAcceptClipboardItems = () => {
    if (!sharedList || clipboardItems.length === 0) return;

    setSharedList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plannedItems: [...prev.plannedItems, ...clipboardItems],
      };
    });

    setShowClipboardModal(false);
    setClipboardItems([]);
    toastFactory(
      `Added ${clipboardItems.length} items from clipboard`,
      MessageSeverity.SUCCESS
    );
  };

  const handleEventRejectClipboardItems = () => {
    setShowClipboardModal(false);
    setClipboardItems([]);
  };

  // ------------------------------------------------------ Item Editing
  const handleEventAddItem = () => {
    if (!sharedList) return;

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: "New item",
      notes: "",
      qty: 1,
      link: "",
    };

    setEditingItemId(newItem.id);
    setSharedList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plannedItems: [...prev.plannedItems, newItem],
      };
    });

    toastFactory("New item added. You can edit it now.", MessageSeverity.INFO);
  };

  const handleEventUpdateItem = (
    itemId: string,
    field: keyof ShoppingItem,
    value: any
  ) => {
    setSharedList((prev) => {
      if (!prev) return prev;
      const updateArray = (items: ShoppingItem[]) =>
        items.map((item) =>
          item.id !== itemId ? item : { ...item, [field]: value }
        );

      return {
        ...prev,
        plannedItems: updateArray(prev.plannedItems),
        missedItems: updateArray(prev.missedItems),
        purchasedItems: updateArray(prev.purchasedItems),
      };
    });
  };

  const handleEventDeleteItem = (itemId: string) => {
    setEditingItemId((prev) => (prev === itemId ? null : prev));
    setSharedList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plannedItems: prev.plannedItems.filter((item) => item.id !== itemId),
        missedItems: prev.missedItems.filter((item) => item.id !== itemId),
        purchasedItems: prev.purchasedItems.filter((item) => item.id !== itemId),
      };
    });
  };

  const handleEventMoveItem = (itemId: string, target: "planned" | "missed") => {
    setEditingItemId((prev) => (prev === itemId ? null : prev));
    setSharedList((prev) => {
      if (!prev) return prev;
      const fromPlanned = prev.plannedItems.find((item) => item.id === itemId);
      const fromMissed = prev.missedItems.find((item) => item.id === itemId);
      const itemToMove = fromPlanned ?? fromMissed;
      if (!itemToMove) {
        return prev;
      }

      if (target === "missed") {
        return {
          ...prev,
          plannedItems: prev.plannedItems.filter((item) => item.id !== itemId),
          missedItems: [...prev.missedItems, itemToMove],
        };
      }

      return {
        ...prev,
        missedItems: prev.missedItems.filter((item) => item.id !== itemId),
        plannedItems: [...prev.plannedItems, itemToMove],
      };
    });
  };

  // ------------------------------------------------------ Item Status
  const handleEventMarkItemPurchased = (itemId: string) => {
    setEditingItemId((prev) => (prev === itemId ? null : prev));
    setSharedList((prev) => {
      if (!prev) return prev;
      const itemToMove = prev.plannedItems.find((item) => item.id === itemId);
      if (!itemToMove) return prev;

      return {
        ...prev,
        plannedItems: prev.plannedItems.filter((item) => item.id !== itemId),
        purchasedItems: [...prev.purchasedItems, itemToMove],
      };
    });
  };

  const handleEventMarkItemMissed = (itemId: string) => {
    setEditingItemId((prev) => (prev === itemId ? null : prev));
    setSharedList((prev) => {
      if (!prev) return prev;
      const itemToMove = prev.plannedItems.find((item) => item.id === itemId);
      if (!itemToMove) return prev;

      return {
        ...prev,
        plannedItems: prev.plannedItems.filter((item) => item.id !== itemId),
        missedItems: [...prev.missedItems, itemToMove],
      };
    });
  };

  const handleEventReturnPurchasedItem = (itemId: string) => {
    setEditingItemId((prev) => (prev === itemId ? null : prev));
    setSharedList((prev) => {
      if (!prev) return prev;
      const fromPurchased = prev.purchasedItems.find((item) => item.id === itemId);
      const fromMissed = prev.missedItems.find((item) => item.id === itemId);
      const itemToMove = fromPurchased ?? fromMissed;
      if (!itemToMove) return prev;

      return {
        ...prev,
        plannedItems: [...prev.plannedItems, itemToMove],
        purchasedItems: prev.purchasedItems.filter((item) => item.id !== itemId),
        missedItems: prev.missedItems.filter((item) => item.id !== itemId),
      };
    });
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const checkClipboardForItems = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) return;

      const parsedItems = parseClipboardText(text);
      if (parsedItems.length > 0) {
        setClipboardItems(parsedItems);
        setShowClipboardModal(true);
      }
    } catch (error) {
      console.log("Failed to read clipboard:", error);
      // silently fail - user may have denied permission
    }
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  return (
    <div className="h-[80vh] bg-white overflow-y-scroll scrollbar-hide">
      {/* Clipboard import modal */}
      {showClipboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <M3Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: theme.onSurface }}
                >
                  Import from clipboard?
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: theme.onSurfaceVariant }}
                >
                  Found {clipboardItems.length} items in your clipboard
                </div>
              </div>

              {/* Preview */}
              <div
                className="rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto"
                style={{ backgroundColor: theme.surfaceContainerHighest }}
              >
                {clipboardItems.map((item, index) => (
                  <div
                    key={index}
                    className="text-sm"
                    style={{ color: theme.onSurface }}
                  >
                    <span className="font-medium">{item.name}</span>
                    {item.qty > 1 && (
                      <span style={{ color: theme.onSurfaceVariant }}>
                        {" "}
                        (qty: {item.qty})
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <M3Button
                  variant="text"
                  onEventClick={handleEventRejectClipboardItems}
                >
                  Cancel
                </M3Button>
                <M3Button
                  variant="filled"
                  onEventClick={handleEventAcceptClipboardItems}
                >
                  Add items
                </M3Button>
              </div>
            </div>
          </M3Card>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4 pb-32">
        {/* Shared list */}
        <M3Card className="p-6 space-y-6">
          <div>
            <div
              className="text-lg font-semibold"
              style={{ color: theme.onSurface }}
            >
              {sharedList.name || "Untitled list"}
            </div>
            <div className="text-sm mt-1" style={{ color: theme.onSurfaceVariant }}>
              {plannedCount} planned / {missedCount} missed / {purchasedCount}{" "}
              purchased
            </div>
          </div>

          {/* Add item */}
          <div className="flex justify-end">
            <M3Button
              variant="text"
              icon={<Plus size={16} />}
              onEventClick={handleEventAddItem}
            >
              Add item
            </M3Button>
          </div>

          {/* Planned items */}
          <div className="space-y-3">
            <div
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.onSurfaceVariant }}
            >
              Planned items
            </div>

            {plannedCount === 0 ? (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: theme.surfaceContainerHighest,
                  color: theme.onSurfaceVariant,
                }}
              >
                Everything on this list has been taken care of.
              </div>
            ) : (
              <div className="space-y-3">
                {sharedList.plannedItems.map((item) => {
                  const isEditing = editingItemId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border p-4"
                        style={{ borderColor: theme.outlineVariant }}
                      >
                        <ShoppingItemRow
                          item={item}
                          mode="planned"
                          isEditMode
                          onEventUpdateItem={(updatedItemId, field, value) =>
                            handleEventUpdateItem(updatedItemId, field, value)
                          }
                          onEventDeleteItem={
                            (updatedItemId) => handleEventDeleteItem(updatedItemId) // <-- use new handler
                          }
                          onEventMoveItem={(updatedItemId, target) =>
                            handleEventMoveItem(updatedItemId, target)
                          }
                        />

                        <div className="flex flex-wrap items-center justify-center pt-4">
                          <M3Button
                            variant="text"
                            onEventClick={() => setEditingItemId(null)}
                          >
                            Done
                          </M3Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 rounded-xl flex justify-between"
                      style={{ backgroundColor: theme.surfaceContainerHigh }}
                    >
                      <SharedItemRow
                        item={item}
                        variant="planned"
                        onEventMarkItemPurchased={handleEventMarkItemPurchased}
                        onEventMarkItemMissed={handleEventMarkItemMissed}
                        onEventReturnPurchasedItem={handleEventReturnPurchasedItem}
                        onEventDeleteItem={handleEventDeleteItem}
                        onEventEditItem={setEditingItemId}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <SharedItemsSection
            title="Purchased items"
            emptyLabel="Nothing purchased yet."
            items={sharedList.purchasedItems}
            variant="purchased"
            onEventMarkItemPurchased={handleEventMarkItemPurchased}
            onEventMarkItemMissed={handleEventMarkItemMissed}
            onEventReturnPurchasedItem={handleEventReturnPurchasedItem}
            onEventDeleteItem={handleEventDeleteItem}
            onEventEditItem={setEditingItemId}
          />

          <SharedItemsSection
            title="Missed items"
            emptyLabel="Nothing missed yet."
            items={sharedList.missedItems}
            variant="missed"
            onEventMarkItemPurchased={handleEventMarkItemPurchased}
            onEventMarkItemMissed={handleEventMarkItemMissed}
            onEventReturnPurchasedItem={handleEventReturnPurchasedItem}
            onEventDeleteItem={handleEventDeleteItem}
            onEventEditItem={setEditingItemId}
          />
        </M3Card>
      </div>
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

function parseClipboardText(text: string): ShoppingItem[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const items: ShoppingItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to parse quantity patterns like "2x item" or "item x2" or "item (2)"
    const qtyPatterns = [
      /^(\d+)x\s+(.+)$/i, // "2x apples"
      /^(.+?)\s+x(\d+)$/i, // "apples x2"
      /^(.+?)\s*\((\d+)\)$/i, // "apples (2)"
    ];

    let name = trimmed;
    let qty = 1;

    for (const pattern of qtyPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const [, group1, group2] = match;
        // First pattern has qty first, others have name first
        if (pattern.source.startsWith("^(\\d+)")) {
          qty = parseInt(group1, 10);
          name = group2.trim();
        } else {
          name = group1.trim();
          qty = parseInt(group2, 10);
        }
        break;
      }
    }

    items.push({
      id: crypto.randomUUID(),
      name,
      notes: "",
      qty,
      link: "",
    });
  }

  return items;
}
