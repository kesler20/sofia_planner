# Sofia prototype lab

Run `pnpm prototypes` and open http://127.0.0.1:5199/.
Run `pnpm prototypes:type-check` for its independent TypeScript scope.

Candidates live outside production src and are absent from production routing and
build entry points. They import the real PlannerTheme, CSS and shared components.
The lab blocks axios, fetch and XHR HTTP requests. Use synthetic memory-only data.
Do not add real account data, authentication or a live persistence adapter here.

Render alternatives beside their actual controls and label them A, B and C when
visual selection is needed. Review desktop, mobile and keyboard behaviour before
promotion. Promote only the selected stateless components and wire state and
persistence in the production page. Remove superseded candidates or retain a
small demonstration that imports the promoted component, avoiding copied variants.

The retained Configuration candidate is exploratory and has no application route.
The archive preserves retired source as text, including the former configuration
screen, its HTTP adapter and unused controls. Archived files are neither compiled
nor executable. Their source paths remain in their filenames for later review.

## Manual failure inspection

Open /verification/ to mount production storage, budget and investment components
with synthetic responses. Choose failed, malformed, missing or successful reads.
The write counter records memory-only adapter calls. Failed and malformed reads
must show zero writes even after an edit attempt. Hydration must also show zero.
A successful or confirmed-missing resource may save after an explicit edit.
Budget failure and Investment budget failure must show an unavailable state.
This is a manual inspection surface, not an automated test suite.
