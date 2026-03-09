import * as React from "react";
import {
  Plus,
  Image,
  User,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useStoredValue, createResourceInDb } from "../../utils";
import LoadingAnimation from "../../components/LoadingAnimation";
import toastFactory, {
  MessageSeverity,
} from "../../components/notification/ToastMessages";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

type Person = {
  id: string;
  name: string;
  email: string;
  color: string;
};

type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  assignedTo: string[];
};

type Receipt = {
  id: string;
  merchant: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
};

// ====================== //
//                        //
//   RECEIPT PROCESSING   //
//                        //
// ====================== //

type ReceiptApiResponse = {
  receipt: Receipt;
};

const processReceipt = async (file: File): Promise<Receipt> => {
  const formData = new FormData();
  formData.append("receipt", file);

  const backendUrl = import.meta.env.VITE_PROD_BACKEND_URL;
  const response = await fetch(
    `${backendUrl.replace("/resources", "")}/receipts/analyze`,
    {
      method: "POST",
      body: formData,
    }
  );

  const rawPayload = await response.text();

  if (!response.ok) {
    try {
      const parsed = JSON.parse(rawPayload) as { error?: string };
      throw new Error(parsed.error || "Failed to process receipt");
    } catch {
      throw new Error(rawPayload || "Failed to process receipt");
    }
  }

  try {
    const parsed = JSON.parse(rawPayload) as ReceiptApiResponse;
    if (!parsed?.receipt) {
      throw new Error("Missing receipt in response");
    }
    return parsed.receipt;
  } catch (error) {
    console.log("Error decoding receipt response:", error);
    throw new Error("Unexpected server response while processing receipt");
  }
};

// ====================== //
//                        //
//   THEME COLORS (M3)    //
//                        //
// ====================== //

const theme = {
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

function M3Card(props: { children: React.ReactNode; className?: string }) {
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

function M3Button(props: {
  children: React.ReactNode;
  onEventClick: () => void;
  variant?: "filled" | "tonal" | "outlined" | "text";
  icon?: React.ReactNode;
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
      type="button"
      onClick={props.onEventClick}
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-80`}
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

function M3Chip(props: {
  label: string;
  color: string;
  selected?: boolean;
  onEventClick?: () => void;
  onEventRemove?: () => void;
}) {
  if (props.onEventRemove) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: props.color + "20",
          color: props.color,
        }}
      >
        <span>{props.label}</span>
        <button
          title="remove receipt"
          type="button"
          onClick={props.onEventRemove}
          className="hover:opacity-70 w-4 h-4 flex items-center justify-center"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  const isSelected = props.selected ?? false;

  return (
    <button
      type="button"
      onClick={props.onEventClick}
      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
      style={{
        backgroundColor: isSelected ? props.color : "transparent",
        color: isSelected ? "white" : props.color,
        border: `1.5px solid ${props.color}`,
      }}
    >
      {props.label}
    </button>
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

function PersonBadge(props: { person: Person; onEventRemove: () => void }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
      style={{
        backgroundColor: theme.surfaceContainerHigh,
        color: theme.onSurface,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-medium"
        style={{ backgroundColor: props.person.color }}
      >
        {props.person.name.charAt(0).toUpperCase()}
      </div>
      <span>{props.person.name}</span>
      <button
        title="remove person"
        type="button"
        onClick={props.onEventRemove}
        className="hover:opacity-70"
      >
        <X size={14} style={{ color: theme.onSurfaceVariant }} />
      </button>
    </div>
  );
}

function ReceiptItemRow(props: {
  item: ReceiptItem;
  people: Person[];
  isEditMode: boolean;
  onEventUpdateItem: (itemId: string, field: string, value: any) => void;
  onEventToggleAssignment: (itemId: string, personId: string) => void;
  onEventDeleteItem: (itemId: string) => void;
}) {
  const assignedPeople = props.people.filter((p) =>
    props.item.assignedTo.includes(p.id)
  );

  if (!props.isEditMode) {
    return (
      <div
        className="flex items-start justify-between py-3 border-b last:border-0"
        style={{ borderColor: theme.outlineVariant }}
      >
        <div className="flex-1">
          <div className="font-medium" style={{ color: theme.onSurface }}>
            {props.item.name}
          </div>
          <div className="text-sm mt-0.5" style={{ color: theme.onSurfaceVariant }}>
            Qty: {props.item.quantity} × £{props.item.price.toFixed(2)}
          </div>
          {assignedPeople.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {assignedPeople.map((person) => (
                <div
                  key={person.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: person.color + "20",
                    color: person.color,
                  }}
                >
                  {person.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-right font-semibold" style={{ color: theme.onSurface }}>
          £{props.item.price.toFixed(2)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 py-4 border-b last:border-0"
      style={{ borderColor: theme.outlineVariant }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <M3TextField
            label="Item"
            value={props.item.name}
            onEventChange={(value) =>
              props.onEventUpdateItem(props.item.id, "name", value)
            }
          />
          <M3TextField
            label="Qty"
            type="number"
            value={props.item.quantity}
            onEventChange={(value) =>
              props.onEventUpdateItem(
                props.item.id,
                "quantity",
                parseInt(value) || 0
              )
            }
          />
          <M3TextField
            label="Price (£)"
            type="number"
            step="0.01"
            value={props.item.price}
            onEventChange={(value) =>
              props.onEventUpdateItem(props.item.id, "price", parseFloat(value) || 0)
            }
          />
        </div>
        <M3IconButton
          icon={<Trash2 size={18} />}
          onEventClick={() => props.onEventDeleteItem(props.item.id)}
          variant="standard"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm mr-2" style={{ color: theme.onSurfaceVariant }}>
          Assign:
        </span>
        {props.people.map((person) => (
          <M3Chip
            key={person.id}
            label={person.name}
            color={person.color}
            selected={props.item.assignedTo.includes(person.id)}
            onEventClick={() =>
              props.onEventToggleAssignment(props.item.id, person.id)
            }
          />
        ))}
      </div>

      {assignedPeople.length > 0 && (
        <div className="text-sm" style={{ color: theme.onSurfaceVariant }}>
          £{(props.item.price / assignedPeople.length).toFixed(2)} per person
        </div>
      )}
    </div>
  );
}

function ReceiptCard(props: {
  receipt: Receipt;
  people: Person[];
  isEditMode: boolean;
  onEventToggleEditMode: (receiptId: string) => void;
  onEventUpdateReceipt: (receiptId: string, field: string, value: any) => void;
  onEventUpdateItem: (
    receiptId: string,
    itemId: string,
    field: string,
    value: any
  ) => void;
  onEventToggleAssignment: (
    receiptId: string,
    itemId: string,
    personId: string
  ) => void;
  onEventAddItem: (receiptId: string) => void;
  onEventDeleteItem: (receiptId: string, itemId: string) => void;
  onEventDeleteReceipt: (receiptId: string) => void;
}) {
  const totalAmount = props.receipt.items.reduce((sum, item) => sum + item.price, 0);

  const personTotals = props.people.map((person) => {
    const total = props.receipt.items.reduce((sum, item) => {
      if (item.assignedTo.includes(person.id)) {
        return sum + item.price / item.assignedTo.length;
      }
      return sum;
    }, 0);
    return { person, total };
  });

  return (
    <M3Card className="overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {props.isEditMode ? (
              <>
                <input
                  className="text-lg font-semibold bg-transparent outline-none w-full mb-2"
                  style={{ color: theme.onSurface }}
                  value={props.receipt.merchant}
                  onChange={(e) =>
                    props.onEventUpdateReceipt(
                      props.receipt.id,
                      "merchant",
                      e.target.value
                    )
                  }
                  placeholder="Merchant name"
                />
                <input
                  type="date"
                  className="text-sm px-3 py-1.5 rounded-lg outline-none"
                  style={{
                    backgroundColor: theme.surfaceContainerHighest,
                    color: theme.onSurfaceVariant,
                  }}
                  value={props.receipt.date}
                  onChange={(e) =>
                    props.onEventUpdateReceipt(
                      props.receipt.id,
                      "date",
                      e.target.value
                    )
                  }
                />
              </>
            ) : (
              <>
                <div
                  className="text-lg font-semibold mb-1"
                  style={{ color: theme.onSurface }}
                >
                  {props.receipt.merchant}
                </div>
                <div className="text-sm" style={{ color: theme.onSurfaceVariant }}>
                  {new Date(props.receipt.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <M3IconButton
              icon={props.isEditMode ? <Check size={20} /> : <Pencil size={18} />}
              onEventClick={() => props.onEventToggleEditMode(props.receipt.id)}
              variant={props.isEditMode ? "tonal" : "standard"}
            />
            {props.isEditMode && (
              <M3IconButton
                icon={<Trash2 size={18} />}
                onEventClick={() => props.onEventDeleteReceipt(props.receipt.id)}
                variant="standard"
              />
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.onSurfaceVariant }}
            >
              Items
            </h3>
            {props.isEditMode && (
              <M3Button
                variant="text"
                icon={<Plus size={16} />}
                onEventClick={() => props.onEventAddItem(props.receipt.id)}
              >
                Add Item
              </M3Button>
            )}
          </div>

          <div>
            {props.receipt.items.map((item) => (
              <ReceiptItemRow
                key={item.id}
                item={item}
                people={props.people}
                isEditMode={props.isEditMode}
                onEventUpdateItem={(itemId, field, value) =>
                  props.onEventUpdateItem(props.receipt.id, itemId, field, value)
                }
                onEventToggleAssignment={(itemId, personId) =>
                  props.onEventToggleAssignment(props.receipt.id, itemId, personId)
                }
                onEventDeleteItem={(itemId) =>
                  props.onEventDeleteItem(props.receipt.id, itemId)
                }
              />
            ))}
          </div>
        </div>

        {/* Totals */}
        <div
          className="border-t pt-4 space-y-3"
          style={{ borderColor: theme.outlineVariant }}
        >
          <div className="flex justify-between items-center text-lg font-semibold">
            <span style={{ color: theme.onSurface }}>Total</span>
            <span style={{ color: theme.onSurface }}>£{totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2 pt-2">
            {personTotals.map(({ person, total }) => (
              <div key={person.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: person.color }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: theme.onSurfaceVariant }}
                  >
                    {person.name}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: theme.onSurface }}
                >
                  £{total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </M3Card>
  );
}

function AccordionSection(props: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onEventToggle: () => void;
  children: React.ReactNode;
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
        {props.isOpen ? (
          <ChevronUp size={20} style={{ color: theme.onSurfaceVariant }} />
        ) : (
          <ChevronDown size={20} style={{ color: theme.onSurfaceVariant }} />
        )}
      </button>
      {props.isOpen && <div className="px-5 pb-5 space-y-4">{props.children}</div>}
    </M3Card>
  );
}

// ====================== //
//                        //
//   MAIN APP             //
//                        //
// ====================== //

export default function ReceiptSplitManager() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const email = localStorage.getItem("global/email") || "guest";
  const [people, setPeople, isPeopleLoading] = useStoredValue<Person[]>(
    email,
    [],
    "receipts_people"
  );

  const [receipts, setReceipts, isReceiptsLoading] = useStoredValue<Receipt[]>(
    email,
    [],
    "receipts"
  );

  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = React.useState(false);
  const [newPersonName, setNewPersonName] = React.useState("");
  const [newPersonEmail, setNewPersonEmail] = React.useState("");

  const [isUploading, setIsUploading] = React.useState(false);
  const [expandedMerchants, setExpandedMerchants] = React.useState<Set<string>>(
    new Set()
  );
  const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(new Set());
  const [editingReceiptId, setEditingReceiptId] = React.useState<string | null>(
    null
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  // Sync receipts and people to all contributor namespaces when they change
  React.useEffect(() => {
    if (isPeopleLoading || isReceiptsLoading) return;

    const contributors = people.filter((p) => p.email && p.email !== email);

    if (contributors.length === 0) return;

    contributors.forEach((contributor) => {
      // Filter receipts where this contributor is assigned to at least one item
      const contributorReceipts = receipts.filter((receipt) =>
        receipt.items.some((item) => item.assignedTo.includes(contributor.id))
      );

      const sanitizedEmail = contributor.email.replace(/@/g, "_at_");
      const receiptsContent = JSON.stringify(contributorReceipts);
      const peopleContent = JSON.stringify(people);

      createResourceInDb<string>(sanitizedEmail, "receipts", receiptsContent).then(
        ({ error }) => {
          if (error) {
            console.log(
              "Error syncing receipts to contributor:",
              contributor.email,
              error
            );
          }
        }
      );

      createResourceInDb<string>(
        sanitizedEmail,
        "receipts_people",
        peopleContent
      ).then(({ error }) => {
        if (error) {
          console.log(
            "Error syncing people to contributor:",
            contributor.email,
            error
          );
        }
      });
    });
  }, [receipts, people, isPeopleLoading, isReceiptsLoading, email]);

  if (isPeopleLoading || isReceiptsLoading) {
    return <LoadingAnimation />;
  }

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("people", people);
  console.log("receipts", receipts);
  console.log("expandedMerchants", expandedMerchants);
  console.log("expandedMonths", expandedMonths);
  console.log("editingReceiptId", editingReceiptId);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ People
  const handleEventOpenAddPersonModal = () => {
    setIsAddPersonModalOpen(true);
  };

  const handleEventCloseAddPersonModal = () => {
    setIsAddPersonModalOpen(false);
    setNewPersonName("");
    setNewPersonEmail("");
  };

  const handleEventAddPerson = () => {
    if (!newPersonName.trim()) return;

    const colors = [
      "#5b9bd5",
      "#48a999",
      "#e07b53",
      "#9b7ed5",
      "#d5a05b",
      "#5bd59b",
    ];
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: newPersonName.trim(),
      email: newPersonEmail.trim(),
      color: colors[people.length % colors.length],
    };

    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);

    // Sync to new contributor's namespace if they have a valid email
    if (newPerson.email && newPerson.email !== email) {
      // Filter receipts where this new contributor is assigned to at least one item
      // Note: new person won't have any assignments yet, so we share an empty array initially
      const contributorReceipts = receipts.filter((receipt) =>
        receipt.items.some((item) => item.assignedTo.includes(newPerson.id))
      );

      const sanitizedEmail = newPerson.email.replace(/@/g, "_at_");
      const receiptsContent = JSON.stringify(contributorReceipts);
      const peopleContent = JSON.stringify(updatedPeople);

      createResourceInDb<string>(sanitizedEmail, "receipts", receiptsContent).then(
        ({ error }) => {
          if (error) {
            console.log("Error syncing receipts to new contributor:", error);
            toastFactory(
              `Failed to sync receipts to ${newPerson.name}`,
              MessageSeverity.ERROR
            );
          } else {
            toastFactory(
              `${newPerson.name} added as contributor`,
              MessageSeverity.SUCCESS
            );
          }
        }
      );

      createResourceInDb<string>(
        sanitizedEmail,
        "receipts_people",
        peopleContent
      ).then(({ error }) => {
        if (error) {
          console.log("Error syncing people to new contributor:", error);
        }
      });
    }

    handleEventCloseAddPersonModal();
  };

  const handleEventRemovePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    setReceipts((prev) =>
      prev.map((receipt) => ({
        ...receipt,
        items: receipt.items.map((item) => ({
          ...item,
          assignedTo: item.assignedTo.filter((id) => id !== personId),
        })),
      }))
    );
  };

  // ------------------------------------------------------ Receipts
  const handleEventUploadReceipt = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toastFactory("Please upload a PNG, JPG, or PDF file", MessageSeverity.ERROR);
      return;
    }

    setIsUploading(true);
    try {
      const newReceipt = await processReceipt(file);
      setReceipts((prev) => [newReceipt, ...prev]);
    } catch (error) {
      console.error("Error processing receipt:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process receipt";
      toastFactory(errorMessage, MessageSeverity.ERROR);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleEventUpdateReceipt = (
    receiptId: string,
    field: string,
    value: any
  ) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id !== receiptId ? r : { ...r, [field]: value }))
    );
  };

  const handleEventDeleteReceipt = (receiptId: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
  };

  // ------------------------------------------------------ Items
  const handleEventAddItem = (receiptId: string) => {
    const newItem: ReceiptItem = {
      id: crypto.randomUUID(),
      name: "New Item",
      quantity: 1,
      price: 0,
      assignedTo: [],
    };

    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId ? r : { ...r, items: [...r.items, newItem] }
      )
    );
  };

  const handleEventUpdateItem = (
    receiptId: string,
    itemId: string,
    field: string,
    value: any
  ) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId
          ? r
          : {
              ...r,
              items: r.items.map((item) =>
                item.id !== itemId ? item : { ...item, [field]: value }
              ),
            }
      )
    );
  };

  const handleEventToggleAssignment = (
    receiptId: string,
    itemId: string,
    personId: string
  ) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId
          ? r
          : {
              ...r,
              items: r.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      assignedTo: item.assignedTo.includes(personId)
                        ? item.assignedTo.filter((id) => id !== personId)
                        : [...item.assignedTo, personId],
                    }
              ),
            }
      )
    );
  };

  const handleEventDeleteItem = (receiptId: string, itemId: string) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== receiptId
          ? r
          : { ...r, items: r.items.filter((item) => item.id !== itemId) }
      )
    );
  };

  // ------------------------------------------------------ Accordion
  const handleEventToggleMerchant = (merchant: string) => {
    setExpandedMerchants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(merchant)) {
        newSet.delete(merchant);
      } else {
        newSet.add(merchant);
      }
      return newSet;
    });
  };

  const handleEventToggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleEventToggleEditMode = (receiptId: string) => {
    setEditingReceiptId((prev) => (prev === receiptId ? null : receiptId));
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getOrganizedReceipts = () => {
    const byMerchant: Record<string, Receipt[]> = {};

    receipts.forEach((receipt) => {
      if (!byMerchant[receipt.merchant]) {
        byMerchant[receipt.merchant] = [];
      }
      byMerchant[receipt.merchant].push(receipt);
    });

    const organized: Array<{
      merchant: string;
      months: Array<{
        monthYear: string;
        receipts: Receipt[];
      }>;
    }> = [];

    Object.entries(byMerchant).forEach(([merchant, merchantReceipts]) => {
      const byMonth: Record<string, Receipt[]> = {};

      merchantReceipts.forEach((receipt) => {
        const date = new Date(receipt.date);
        const monthYear = `${date.toLocaleString("default", {
          month: "long",
        })} ${date.getFullYear()}`;

        if (!byMonth[monthYear]) {
          byMonth[monthYear] = [];
        }
        byMonth[monthYear].push(receipt);
      });

      const months = Object.entries(byMonth)
        .map(([monthYear, receipts]) => ({
          monthYear,
          receipts: receipts.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        }))
        .sort((a, b) => {
          const dateA = new Date(a.receipts[0].date);
          const dateB = new Date(b.receipts[0].date);
          return dateB.getTime() - dateA.getTime();
        });

      organized.push({ merchant, months });
    });

    return organized.sort((a, b) => a.merchant.localeCompare(b.merchant));
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  const organizedReceipts = getOrganizedReceipts();

  return (
    <div className="h-[80vh] bg-white overflow-y-scroll scrollbar-hide">
      <div className="max-w-2xl mt-4 mx-auto p-4 md:p-6 space-y-4 pb-32">
        {/* People List - Top */}
        <p className="text-slate-400">Registered Contributors</p>
        {people.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <PersonBadge
                key={person.id}
                person={person}
                onEventRemove={() => handleEventRemovePerson(person.id)}
              />
            ))}
          </div>
        )}
        <div className="w-full border-0.1 border-slate-40"></div>

        {/* Receipts Organized by Merchant and Month */}
        <div className="space-y-3">
          {organizedReceipts.length === 0 ? (
            <M3Card className="p-12">
              <div className="text-center" style={{ color: theme.onSurfaceVariant }}>
                <Image size={48} className="mx-auto mb-3 opacity-40" />
                <div>No receipts yet. Upload one to get started!</div>
              </div>
            </M3Card>
          ) : (
            organizedReceipts.map(({ merchant, months }) => (
              <AccordionSection
                key={merchant}
                title={merchant}
                subtitle={`${months.reduce(
                  (sum, m) => sum + m.receipts.length,
                  0
                )} receipts`}
                isOpen={expandedMerchants.has(merchant)}
                onEventToggle={() => handleEventToggleMerchant(merchant)}
              >
                <div className="space-y-3">
                  {months.map(({ monthYear, receipts: monthReceipts }) => {
                    const monthKey = `${merchant}-${monthYear}`;
                    return (
                      <div key={monthKey}>
                        <button
                          type="button"
                          onClick={() => handleEventToggleMonth(monthKey)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200"
                          style={{ backgroundColor: theme.surfaceContainerHighest }}
                        >
                          <div className="text-left">
                            <div
                              className="text-sm font-medium"
                              style={{ color: theme.onSurface }}
                            >
                              {monthYear}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: theme.onSurfaceVariant }}
                            >
                              {monthReceipts.length} receipt
                              {monthReceipts.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          {expandedMonths.has(monthKey) ? (
                            <ChevronUp
                              size={18}
                              style={{ color: theme.onSurfaceVariant }}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                              style={{ color: theme.onSurfaceVariant }}
                            />
                          )}
                        </button>

                        {expandedMonths.has(monthKey) && (
                          <div className="mt-3 space-y-4">
                            {monthReceipts.map((receipt) => (
                              <ReceiptCard
                                key={receipt.id}
                                receipt={receipt}
                                people={people}
                                isEditMode={editingReceiptId === receipt.id}
                                onEventToggleEditMode={handleEventToggleEditMode}
                                onEventUpdateReceipt={handleEventUpdateReceipt}
                                onEventUpdateItem={handleEventUpdateItem}
                                onEventToggleAssignment={handleEventToggleAssignment}
                                onEventAddItem={handleEventAddItem}
                                onEventDeleteItem={handleEventDeleteItem}
                                onEventDeleteReceipt={handleEventDeleteReceipt}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionSection>
            ))
          )}
        </div>
      </div>

      {/* Bottom FAB Buttons - Separated at far ends */}
      <div className="w-[90%] md:w-1/2 fixed bottom-6 left-6 md:left-1/4 flex items-center justify-between md:justify-evenly pointer-events-none">
        {/* Add Person FAB - Left */}
        <button
          title="add user"
          type="button"
          onClick={handleEventOpenAddPersonModal}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg pointer-events-auto"
          style={{
            backgroundColor: theme.secondaryContainer,
            color: theme.onPrimaryContainer,
          }}
        >
          <Plus size={20} />
          <User size={20} />
        </button>

        {/* Upload Receipt FAB - Right */}
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 pointer-events-auto"
          style={{
            backgroundColor: theme.primaryContainer,
            color: theme.onPrimaryContainer,
          }}
        >
          <Plus size={20} />
          <Image size={20} />
          {isUploading && <span className="text-sm font-medium">Processing...</span>}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleEventUploadReceipt}
        className="hidden"
        disabled={isUploading}
      />

      {/* Add Person Modal */}
      <M3Modal
        isOpen={isAddPersonModalOpen}
        onEventClose={handleEventCloseAddPersonModal}
        title="Add Person"
      >
        <div className="space-y-4">
          <M3TextField
            label="Name"
            value={newPersonName}
            onEventChange={setNewPersonName}
            placeholder="Enter name"
          />
          <M3TextField
            label="Email"
            value={newPersonEmail}
            onEventChange={setNewPersonEmail}
            placeholder="Enter email"
          />
          <div className="flex justify-end gap-3 pt-4">
            <M3Button variant="text" onEventClick={handleEventCloseAddPersonModal}>
              Cancel
            </M3Button>
            <M3Button
              variant="filled"
              onEventClick={handleEventAddPerson}
              disabled={!newPersonName.trim()}
            >
              Add
            </M3Button>
          </div>
        </div>
      </M3Modal>
    </div>
  );
}
