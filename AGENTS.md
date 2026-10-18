# Frontend Development

You are a code assistant working in a React + TypeScript codebase.
## 0. Prime Directive

This codebase uses a simple, event-driven React style:

* Users interact with UI elements (e.g. `onClick`, `onChange`, `onSubmit`).
* “Dumb” UI components are stateless and **only emit events** upward via props named `onEventXYZ(...)`.
* “Container” components (page/top level component) are stateful and handle all logic in functions named `handleEventXYZ(...)`.
* Each Page should have one Container component
* Each handler does one of two things:

  1. triggers a side-effect (API call, toast, navigation, etc.)
  2. updates state using small, predictable `setState` patterns.

When using `useReducer` or `xstate`, the page should still be the single container, but UI triggers call `send("event_name", payload)` instead of calling many `handleEventXYZ` functions.

When using react functions and when using libraries in general, try to import the library as follows:
`import * as React from "react"` this will allow you to access most of its functionality like the following: `React.useState`, `React.useEffect` etc... which I prefer more.

Overall keep React code boring, explicit, and easy to scan.

### Verification

Do not write automated tests for Kesler's React applications unless he explicitly
asks for them. This includes tests for their TypeScript helpers, hooks and data
adapters. Do not add test frameworks, fixtures or test scripts without that
instruction. Verify changes with type checking, linting, builds and direct browser
checks as appropriate.


---

## 1. Project Structure

### 1.1 Stack (typical)

* React + TypeScript
* TailwindCSS
* Optional: `useReducer` / `xstate` when truly required

### 1.2 Folder structure (pattern)

* Pages: `src/pages/<page_name>/...` (pages can be recursive)
* Page components: `src/pages/<page_name>/<PageName>.tsx`
* Page-local components: `src/pages/<page_name>/components/...`
* Page-local reducer/machine: `src/pages/<page_name>/state/...`
* Shared components: `src/components/...`

Rule: **one reducer or one state machine per page** (not shared across multiple pages unless truly generic).

---

## 2. Naming Conventions

### 2.1 Events and handlers

* **UI component prop**: `onEventXYZ(...)`
* **Page handler**: `handleEventXYZ(...)`

Example:

* Child button: `onClick={() => props.onEventDeleteItem(itemId)}`
* Page function: `const handleEventDeleteItem = (itemId: string) => { ... }`

### 2.2 Entity-scoped handler grouping

Inside page components, handlers must be grouped by the entity being acted on.

Use headings like:

* `// ------------------------------------------------------ Collection`
* `// ------------------------------------------------------ Item`
* `// ------------------------------------------------------ Option`

---

## 3. Page Template (Block Comments + OBSERVE STATE + UTILS)

### 3.1 File Header Comment

Every file that exports a page or a component starts with a full-width block comment placed after the imports and before the export. This is separate from the internal section dividers in 3.3 — it documents the file as a whole, not a region within it.

Structure: border, blank line, the name in caps (matching the component/page name), blank line, a 2-4 line description, blank line, border. The description must say two things: what the component renders/does, and where it sits in the app — its relationship to parent/child components, which direction data or events flow, and any spec references (e.g. `PRD §5.2`) if they exist.

```tsx
// ============================================================ //
//                                                              //
//   NODE EDITOR PANEL                                          //
//                                                              //
//   Authoring surface for a single policy node (PRD §5.2). The //
//   body is edited as plain markdown; typed references are     //
//   parsed live into chips, and a palette inserts new tokens.  //
//   Edits are emitted upward — the page owns persistence.      //
//                                                              //
// ============================================================ //
```

A page's header additionally states what the page lists/renders and what the primary user actions do (e.g. "Pausing/resuming writes through the API; opening a session routes to the policy editor"). A leaf component's header states what it renders and, if it is not self-contained, how it communicates with its parent (e.g. "Dumb top navigation bar... Routing is the side-effect, so it leans on NavLink rather than emitting events upward").

```tsx
// ============================================================ //
//                                                              //
//   SESSIONS PAGE                                              //
//                                                              //
//   Lists agent-loop runs with summary tiles, status filters,  //
//   and search. Pausing/resuming writes through the API;       //
//   opening a session routes to the policy editor (PRD §5).    //
//                                                              //
// ============================================================ //
```

### 3.2 Page Body Sections

Use these sections in this order. Keep each section short.
Block comments MUST have exactly 5 lines. 3-line block comments are categorically forbidden.
```tsx
export default function SomePage() {
  
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //
  
  // const [state, setState] = useState()
  // or [state, send] = useReducer(machine)

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //
  
  // console.log(...) key states

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //
  
  // useEffect(...) only when needed

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //
  
  // group by entity
  // ------------------------------------------------------ EntityA
  // handleEventXYZ(...)

  // ------------------------------------------------------ EntityB
  // handleEventXYZ(...)

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //
  
  // keep page-local helpers here (inside the component)

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //
  
  return <div />;
}
```

### 3.3 OBSERVE STATE

Keep an “OBSERVE STATE” section near the top of the page component and log the important state variables.

Example:

```ts
// Keep important page state visible together during development.
console.log("items", items);
console.log("selectedCollectionId", selectedCollectionId);
console.log("hasUnsavedChanges", hasUnsavedChanges);
```

### 3.4 UI Section Comments

Always add JSX comments to separate major UI regions.

Example:

```tsx
/* Separate the page's major visual regions in the JSX. */
return (
  <div>
    {/* Top bar */}

    {/* Main layout */}

    {/* Sidebar */}
  </div>
);
```

---

## 4. State Management Rules (Simple + Predictable)

### 4.1 Default: `useState`

Prefer `useState` unless the state transitions are genuinely complex.

### 4.2 Allowed `setState` patterns

#### Update an object by field (guard + shallow copy)

```ts
// Update one object only when the current entity matches the requested target.
setItem((prev) => {
  if (prev.id !== itemId) return prev;
  return { ...prev, [field]: value };
});
```

#### Update an array item (map + guard)

```ts
// Replace only the matching array item while preserving every other item.
setItems((prev) =>
  prev.map((it) => (it.id !== itemId ? it : { ...it, [field]: value }))
);
```

#### Append to an array

```ts
// Append a new item without mutating the existing array.
setItems((prev) => [...prev, newItem]);
```

#### Replace an object

```ts
// Replace the current object when no previous fields need to be retained.
setCollection(newCollection);
```

#### Delete from an array

```ts
// Remove the matching item without mutating the existing array.
setItems((prev) => prev.filter((it) => it.id !== itemId));
```

#### Append into an array field (within an object)

```ts
// Append a nested value while preserving the other object fields.
setItem((prev) => {
  if (prev.id !== itemId) return prev;
  return { ...prev, tags: [...prev.tags, newTag] };
});
```

Use more advanced patterns only when strictly necessary.

---

## 5. Dumb UI Components vs Stateful Containers

### 5.1 Dumb UI components

* Stateless (no business state).
* Render-only.
* Emit events upward via `onEventXYZ(...)` props.

### 5.2 Container components (pages)

* Own all state for the page.
* Own all side-effects.
* Own all event handlers (or `send(...)` when using `useReducer` / `xstate`).

Rule: each page is responsible for its own state. Avoid cross-page shared state unless absolutely required.

### 5.3 Prop Types: Always Inline

Define prop types inline on the component function. Never define a separate `type Props = { ... }` unless that type is explicitly referenced elsewhere in the code (e.g. passed to a utility function or imported by another module).

```tsx
// CORRECT: inline
function ItemRow(props: {
  item: Item;
  onEventDeleteItem: (itemId: string) => void;
}) { ... }

// WRONG: separate type that is never referenced elsewhere
type ItemRowProps = { item: Item; onEventDeleteItem: (itemId: string) => void };
function ItemRow(props: ItemRowProps) { ... }
```

### 5.4 Layout and Structure Stay in the Page Component

Rows, groups, grids, and overall structural `div`/`span` wrappers belong in the page component's JSX, not inside dumb child components — unless strictly necessary (e.g. a component that is inherently a row or a card by design).

Keep the skeleton of the layout visible at the page level so the structure is easy to scan.

```tsx
// CORRECT: structure is in the page
return (
  <div className="grid grid-cols-2 gap-4">
    {items.map((item) => (
      <ItemCard key={item.id} item={item} onEventSelect={handleEventSelectItem} />
    ))}
  </div>
);

function ItemCard(props: { ... }) {
  return (
    <div className="grid grid-cols-2 gap-4"> {/* structural layout belongs in the page */}
      ...
    </div>
  );
}
```

---

## 6. Data Access Pattern: `DatabaseInterface`

Use `DatabaseInterface` for backend calls.

Rules:

* Instantiate in the page (or in a small helper hook for that page).
* Pass generic types to strongly type `result`.
* Always handle both `{ result }` and `{ error }`.
* Always log errors with context: `console.log("Error ...:", error)`.
* Prefer user-visible feedback on failures (toast).

Example:

```ts
import DatabaseInterface from "../../DatabaseInterface";
import toastFactory, { MessageSeverity } from "../../components/ToastMessage";
import * as Schema from "../../schema";

const db = new DatabaseInterface(import.meta.env.VITE_DEV_BACKEND_URL_V1);

db.READ<Schema.QuestionnaireListResponse>("questionnaires").then(
  ({ result, error }) => {
    if (result) {
      setQuestionnaires(result.entities);
    } else {
      console.log("Error loading questionnaires:", error);
      toastFactory("Failed to load questionnaires", MessageSeverity.ERROR);
    }
  }
);
```

Important Note: DO NOT Create the DatabaseInterface class if you can't find it, I will add it myself

---

## 7. Styling Rules (Tailwind, but simple)

* Prefer plain strings: `className="..."`.
* Do NOT build Tailwind classes using arrays + `.join(" ")`.
* For conditionals, use a simple ternary string.

Examples:

```tsx
<div className="flex items-center gap-2" />

<button className={isActive ? "bg-slate-900 text-white" : "bg-white text-slate-900"} />
```

---

## 8. Example Pattern: Item Collection (Child Entity)

Default mental model:

* A **Collection** is a named container.
* An **Item** is a child entity of that collection.
* Items are rendered by dumb child components.
* The page is the container.

```tsx
import * as React from "react";

type Item = { id: string; label: string; done: boolean };
type ItemCollection = { id: string; name: string; items: Item[] };

function ItemRow(props: {
  item: Item;
  onEventToggleDone: (itemId: string) => void;
  onEventChangeLabel: (itemId: string, label: string) => void;
  onEventDeleteItem: (itemId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={props.item.done}
        onChange={() => props.onEventToggleDone(props.item.id)}
      />
      <input
        className="border rounded px-2 py-1"
        value={props.item.label}
        onChange={(e) => props.onEventChangeLabel(props.item.id, e.target.value)}
      />
      <button
        type="button"
        className="border rounded px-2 py-1"
        onClick={() => props.onEventDeleteItem(props.item.id)}
      >
        Delete
      </button>
    </div>
  );
}

export default function ItemCollectionPage() {
  
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const [collection, setCollection] = React.useState<ItemCollection>({
    id: "col-1",
    name: "My Collection",
    items: [],
  });

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("collection", collection);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Collection
  const handleEventRenameCollection = (name: string) => {
    setCollection((prev) => ({ ...prev, name }));
  };

  // ------------------------------------------------------ Item
  const handleEventAddItem = () => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      label: "New Item",
      done: false,
    };
    setCollection((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleEventToggleDone = (itemId: string) => {
    setCollection((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id !== itemId ? it : { ...it, done: !it.done }
      ),
    }));
  };

  const handleEventChangeLabel = (itemId: string, label: string) => {
    setCollection((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id !== itemId ? it : { ...it, label })),
    }));
  };

  const handleEventDeleteItem = (itemId: string) => {
    setCollection((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== itemId),
    }));
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getDoneCount = () => collection.items.filter((i) => i.done).length;

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <input
          className="border rounded px-2 py-1"
          value={collection.name}
          onChange={(e) => handleEventRenameCollection(e.target.value)}
        />
        <button
          type="button"
          className="border rounded px-3 py-1"
          onClick={handleEventAddItem}
        >
          Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-600">Done: {getDoneCount()}</div>

      {/* Items */}
      <div className="space-y-2">
        {collection.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onEventToggleDone={handleEventToggleDone}
            onEventChangeLabel={handleEventChangeLabel}
            onEventDeleteItem={handleEventDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 9. `useReducer` Pattern (Reducer Outside, Page Uses `send(...)`)

Use `useReducer` when:

* you have multiple event types, and
* it is cleaner to centralize transitions in a reducer.

Rules:

* Keep the reducer in a separate file under the page folder.
* The page should not contain dozens of `handleEventXYZ` functions.
* UI triggers should call `send("event_name", payload)`.

### 9.1 Example: `src/pages/item_collection/state/reducer.ts`

```ts
export type Item = { id: string; label: string; done: boolean };
export type ItemCollection = { id: string; name: string; items: Item[] };

export type State = {
  collection: ItemCollection;
};

export type PageEvent =
  | { name: "collection.rename"; payload: { name: string } }
  | { name: "item.add"; payload: { item: Item } }
  | { name: "item.toggleDone"; payload: { itemId: string } }
  | { name: "item.changeLabel"; payload: { itemId: string; label: string } }
  | { name: "item.delete"; payload: { itemId: string } };

export function reducer(state: State, event: PageEvent): State {
  switch (event.name) {
    case "collection.rename":
      return { ...state, collection: { ...state.collection, name: event.payload.name } };

    case "item.add":
      return {
        ...state,
        collection: {
          ...state.collection,
          items: [...state.collection.items, event.payload.item],
        },
      };

    case "item.toggleDone":
      return {
        ...state,
        collection: {
          ...state.collection,
          items: state.collection.items.map((it) =>
            it.id !== event.payload.itemId ? it : { ...it, done: !it.done }
          ),
        },
      };

    case "item.changeLabel":
      return {
        ...state,
        collection: {
          ...state.collection,
          items: state.collection.items.map((it) =>
            it.id !== event.payload.itemId ? it : { ...it, label: event.payload.label }
          ),
        },
      };

    case "item.delete":
      return {
        ...state,
        collection: {
          ...state.collection,
          items: state.collection.items.filter((it) => it.id !== event.payload.itemId),
        },
      };

    default:
      return state;
  }
}
```

### 9.2 Example Page Usage

```tsx
import * as React from "react";
import { reducer, State, PageEvent, Item } from "./state/reducer";

export default function ItemCollectionPage() {
  const [state, send] = React.useReducer(reducer, {
    collection: { id: "col-1", name: "My Collection", items: [] },
  } satisfies State);

  console.log("state", state);

  return (
    <div>
      {/* Header */}
      <input
        value={state.collection.name}
        onChange={(e) => send("collection.rename", { name: e.target.value })}
      />

      {/* Items */}
      <button
        type="button"
        onClick={() => {
          const newItem: Item = { id: crypto.randomUUID(), label: "New Item", done: false };
          send("item.add", { item: newItem });
        }}
      >
        Add Item
      </button>
    </div>
  );
}
```

---

## 10. `xstate` Pattern (One Machine per Page)

When using `xstate`:

* One machine per page.
* UI components remain dumb.
* Page uses `send("event_name", payload)`.
* Keep side-effects in machine actions/services or in a page-level bridge hook.

---

## 11. Common Code Smells (Avoid)

* Complex state transformations inside JSX event props
* Business logic inside presentational components
* Multiple sources of truth for the same data
* Large `useEffect` blocks that should be a handler or a small helper
* Multiple reducers/machines fighting over the same page state

## 12. No Unsolicited UI Copy

Do not add explanatory hint text, status captions, or helper descriptions next to a UI element unless specifically asked for. A control should be self-evident from its own label or icon; don't pair it with a sentence describing what it does or what state it's in.

```tsx
// WRONG: hint text nobody asked for
<p>Active diet: {activeDiet.name} {activeDiet.finalizedAt ? "(finalized)" : "(not finalized)"}</p>
<Button onClick={finalizeDiet}>Finalize Diet</Button>

// CORRECT: the control speaks for itself
<Switch checked={isActive} onChange={handleEventToggle} />
```

## Rationale
The results + a pool that you map from their total errors and actually in
