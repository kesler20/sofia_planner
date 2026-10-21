# Requirements

## Digital Twin public disclosure agreed 21 October 2026

The public deployment hosts a Digital Twin overview and privacy policy for the
personal Google OAuth application. The disclosure names the Google sources the
automation service can access, the enabled purposes, the private local data lake,
Redis-backed resources and account-scoped browser storage. It links Google's User
Data Policy and remains accessible from the Sofia Planner footer. Reusing the
Sofia Planner product description alone was rejected because it would conflate the
frontend's Auth0 identity flow with Automation Engine's direct Google API access.

## Fit daily energy decomposition agreed 20 October 2026

Diet Monitoring separates the selected London day's total Fit expenditure into
estimated Fit maintenance and Fit exercise plus steps, followed by logged intake
and the existing deficit or surplus. Maintenance is the remainder after removing
Fit calories attributed to recorded walking and workout intervals. Their sum
preserves reported total expenditure, avoiding double subtraction of exercise.

Activity attribution uses Google's merged calorie stream grouped by merged
activity segments. Interval energy includes resting expenditure during activity,
so the remainder is an estimate rather than an independent BMR measurement.
Incremental captures replace queried daily activity totals. Missing historical
activity evidence stays unavailable. A successful covered query with no activity
provides zero attributed activity. London midnight allocation uses elapsed time
through daylight saving transitions. The hourly warehouse build owns publication.

## Rolling maintenance and board width agreed 18 October 2026

Maintenance uses the seven preceding London dates with at least one observed
expenditure day. Average Fit expenditure supplies an explicitly uncalibrated
fallback, with observed-day counts. Missing weights or incomplete intake cannot
make that average disappear. Weight correction still requires the complete
rolling interval and aligned weights. The fixed previous-week requirement was
replaced because available recent expenditure should supply a usable estimate.

Plan Diet shares the other dashboards' centered maximum width. The week scrolls
horizontally within the page, preserving its day columns. Nearly full-screen
width was rejected because the canvas was too broad.

## Monitoring date navigation agreed 18 October 2026

Yesterday, Today and Tomorrow controls use the supplied arrow-and-calendar
reference beside the metric selector in a compact row. The right arrow follows
the Tomorrow label. Previous and next actions move relative
to the selected date, allowing repeated navigation. Today resets the London
date. Historical monitoring uses that day's cutoff rather than later totals.
Refresh-waiting banners are omitted across pages while source availability,
observation dates and protection against misdated data remain intact.

Diet Monitoring omits explanatory hints about elapsed-day coverage, raw energy
inputs, freshness and partial days. Compact replacement labels were declined.
The underlying metadata remains available to Analytics and Sofia.

## Cheat-meal layout agreed 18 October 2026

The original card sits centered above the saved-meals list. A second title above
the card is omitted because the form heading already identifies the action.
The side-by-side layout was rejected because it left the card off-center.

## Diet and monitoring agreed 17 October 2026

Cheat meals are plannable immediately from the original eight-field purple card.
Missing facts remain unknown. Agentic ETL may automatically correct reliable facts
with retained original input and field provenance. Requiring enrichment or review
before planning was rejected because incomplete meals must remain usable.

Each saved diet owns an editable reference note. Shared notes, agent instructions
and enforced restrictions were rejected. The weekly Kanban board is the sole
planning view and retains explicit draft saves and repeated portions.

Diet Monitoring shows raw Fit expenditure minus logged intake as a large labelled
equation above the rate cards. Calibration belongs only in the Calorie Calculator
and derives from the previous complete calendar week. A longer rolling window was
rejected to keep the existing week-aligned comparison. Scenario maintenance starts
from the observed estimate and permits a manual override. Combined Loss and its
weights are absent because individual metrics expose the trade-offs directly.

Sleep, completed focus hours and scheduled habit completions have cumulative
Burnup charts. Habit completion counts were chosen over percentages or weighted
routine points. Targets are independent week, month and year totals. Daily goals
scaled into every period were rejected to preserve the existing target model.

Targets and limits are edited beside charts. Home and Configuration pages are
absent and Diet Monitoring is the landing page. Sofia-wide settings have no UI
but stored settings retain their behaviour. Sofia judges important shifts from
saved goals, measurements and trends without automatically enabling threshold
rules. Missing evidence remains distinct from measured misses.

## Health agreed 12 October 2026

Personal Records measures actual heaviest load. Estimated one-rep maximum and
division by body weight were rejected. Instead, a latest-weight cutoff filters
the full history using the preceding timestamped Fitdays measurement. The
reference is the all-time eligible record before each period so beating it
produces a positive percentage. Burnup keeps raw training volume independent
of this eligibility filter.

The approved fixed muscle mapping gives full volume to each affected group.
Totals overlap intentionally. Superman Curl belongs only to biceps, Cable
Kickback to triceps and Copenhagen planks to core. Single Leg RdL is a Romanian
deadlift. Alenkad is excluded. Exercise mappings are maintained in the producer
and new unknown names require review.

Manual limits use one upper and one lower boundary. Computed sigma bands and
an editable center line were rejected. A small Configuration page supplies
targets and limits without a broader settings system.

## Agreed 11 October 2026

Option A is selected for both Finance pages, retaining existing Sofia visual
patterns. Monzo-style monitoring uses aggregate daily or monthly expenses rather
than transaction points. The chart owns Left to spend and the cards show burn
rates and affordable remaining allowances.

Monitoring is current-year only because monthlyBalance has no year dimension.
Separate historical budgets would require a later budget-editor change.

Shopping forecasts apply to recurring items and count packs or items. Explicit
aliases and verified capture coverage avoid guessed identities and invented zeros.
The initial baseline averages all complete covered history. Current-period
forecasts remain visible and history offsets are display-only.

# Specifications

## Authored meals and atomic persistence

The cheat_meals resource retains UUID identities, authored revisions and the eight
input fields separately from MFP-owned records. Effective catalogue entries use
stable cheat identities and one ingredient. Version-bound evidence retains source
URLs, timestamps, checksums and field provenance. Only unchanged linked recipe
copies follow enrichment. Customized occurrences require reconciliation, with
quantities, repetitions, ratings, notes and historical consumption preserved.
MFP name matching cannot claim a cheat identity.

Browser saves use the headless backend's conditional Redis endpoint. Redis checks
the complete expected resource and applies replacement atomically. Catalogue
publication guards its input resources and commits foods, meals and diets in one
transaction. Browser-only locking and re-read checks were insufficient because
they left cross-device and browser-to-engine race windows. Conflicts stay visible
and require refreshed state rather than an unconditional retry.

## Observed calibration and daily energy

Date-indexed energy balances and weekly monitoring cutoffs support day-by-day
browsing without recalculating analytics in Planner. Older publications remain
readable for their own reporting date. Later observed intake is excluded from
an earlier selection, and future observations remain unavailable.

The preceding seven completed London dates supply the rolling window. One or
more expenditure observations supply the mean Fit fallback. Missing dates remain
unknown, and intake and paired-day balance counts stay separate. Weight-based
correction requires complete intake and expenditure across that rolling window
with aligned starting and ending weights. Daily correction is the difference
between raw weekly energy balance and measured weight-change energy, divided by
seven. Observed maintenance is mean Fit expenditure plus that correction. The
existing kcal-per-kg constant remains in use. The fitted weight curve describes
calibration and is not independent forecast validation. Manual scenario overrides
never alter published calibration or the raw daily equation.

## Activity targets and source availability

Native reconciled TickTick focus duration supplies hours without counting pauses
twice. Habit-grid rows contribute one completion per scheduled occurrence after
schedule and exclusion checks. Verified empty coverage can produce zero. Missing
windows leave unknown observations and suppress unsupported pace estimates.
Sleep limits use observed-day means while cumulative targets use summed hours.
Sofia receives separate average-sleep and cumulative-sleep assessments.

Latest-history actions preserve the chosen period until explicitly selected.
Dashboards show genuine retained observations and distinguish unavailable,
partial, stale and verified-zero states. Strong's exact aliases reuse existing
muscle families. Unweighted chin-ups retain zero recorded kg volume because
adding body mass or a second repetition metric changes the agreed measure.

## Plan Diet workspace

The wide scrolling week keeps days in one continuous row with larger meal cards.
The board is constrained by the same maximum page width as the other dashboards,
with horizontal overflow scrolling and large day columns. Left-click opens the existing floating
meal action menu so repeated copy and spread buttons do not crowd the cards.
Right-click opens the ingredient breakdown. Weekly total cost remains distinct
from average daily cost and stays unavailable when an ingredient price is unknown.
Repeated meal entries represent separate portions and can be saved. Adding,
pasting and spreading preserve repetitions. Each addition copies the meal so
selection, removal and drag identities distinguish portions without changing
the saved schema. Rejecting same-name meals prevented planning two portions.

## Clear diet

The clear action sits beside the diet selector to make its target explicit.
A named confirmation states that all seven days and unsaved changes will be
emptied. Clearing persists immediately in both views and discards that diet's
board draft so old meals cannot return on a later save. Keeping the diet container
and catalogue allows a fresh plan without recreating the diet or its foods.

## Health data and pages

Dedicated Health ETL uses complete retained source histories because shared
warehouse period summaries calculate means and truncate the daily history.
Timestamp joining and PR eligibility occur in the producer. Automation Engine calculates calendar period maxima, preceding records, Burnup
pace and Control values. Planner selects published period records for charts.

Health reuses Finance cards and controls with violet and blue chart colors.
Control lines connect observed buckets without fabricating values for gaps.
Personal Record areas retain gaps. Configuration uses explicit saves and a
missing resource starts empty. Failed reads never reset existing configuration.
The navigation selectors follow the route, including links between Health pages.

## Spending rankings

The selected layout presents category composition and ranked totals first,
with a Merchants switch replacing the charts for the selected category. It uses Sofia Finance's
existing cards and rounded controls. Category donuts show top five plus Other.
Merchant donuts show top four plus Other independently of list expansion.
The active horizontal ranking chart shows five entries initially. Month and
Year support available history.

The resource owns aggregation, ranking and shares in ETL. Sofia only selects
calendar records and groups chart slices for display. Actual spending was chosen
over budget allocations and receipt products because it answers where money goes
using the retained category and merchant feed. Previous-period comparisons are
outside this iteration to keep composition focused.

Net refunds remain in signed lists, while positive-only shares keep pie areas
valid. Explicit coverage and capture metadata distinguish partial history from
observed zero spending. Rankings need neither forecasts nor budget data.

## Data access and UI

Use readResourceInDb directly, approved as an exception to the absent
DatabaseInterface. Do not use useStoredValue for producer-owned resources because
it writes back after loading. Validate versioned producer resources with Zod.
Partial source failure does not disable unrelated Finance sections.

Each page owns its state, loading, refresh and event handlers. Presentational
components are stateless and emit onEvent events. Seen revisions live in local
storage per user and section. Failures or forecasts from an older input cannot
acknowledge a new actuals revision.

## Budget mapping

Groceries, Eating Out, Transport, Shopping, Hair, Football and Dates map to their
Variable Costs sections. Bills and Subscriptions map to the sums of their sections.
Unmapped Monzo categories retain actuals without a fabricated budget target.
Categorisation is changed in Monzo and there is no Sofia mapping editor.


## Shared horizontal rankings

Rankings reuse the horizontal chart from Sofia Analytics' Pareto view through
HorizontalRankingChart. Domain pages render the same component, preserving its
rounded bars, grid and label styling. Finance supplies signed pence values,
GBP formatting, category colours and selection events. Expanded rankings grow
vertically with their row count. The Finance cards, selectors and Monitoring's
two-to-one layout remain shared patterns.

The reference clarified that the desired Pareto view is this horizontal ranking
treatment. The vertical bars, cumulative line and 80% guide are discarded.
The published version-two DTO retains cumulative_share for resource compatibility.
Composition donuts retain category top five and merchant top four plus Other.

## Merchant view switch

A Category dropdown and the existing chart/list selection establish the category.
The existing IOSSwitch toggles merchant rankings for that category. The same
ranking chart and donut render either view so switching never adds another pair.
Switching off preserves category selection. A period or refreshed resource that
loses the selected category clears selection and returns to category rankings.
This avoids simultaneously displaying overview and detail charts.

## Sofia configuration

Use the existing Finance section switcher for Sofia settings. Kesler selected
this rendered treatment because it keeps the configuration page shorter.
Health targets and manual limits keep their existing resource and save action.
Sofia alert rules and routine weights use a separate validated resource so a
failed read cannot overwrite a plan or enable inferred thresholds.

The interactive configuration prototype follows Home's Diet, Health and Sofia
sections. Sofia's nested switcher exposes Alerts, Report, Routine, Shopping and
Approvals. Diet reuses the existing ranking and calibration component. Health
retains its target and manual-limit controls. The prototype uses current monitoring
metric identities and TickTick habit identities. Draft values remain in the tab.
Shopping exclusions and approval boundaries are reviewed here before extending
the saved configuration controls. Existing finance and diet plans remain the
authority for their targets.


## Diet and Configuration Home

The reviewed Diet prototype establishes weekly-only analytics with three intake
cards and one shared ranking treatment. Month views were rejected because diet
composition repeats weekly. Catalogue quality and consumed contributions remain
separate. Normalisation makes configurable component weights comparable, while
unknown enabled values prevent invented scores. MFP owns authoring and Sofia owns
ratings and captured versions. Producer-owned catalogue reads are read-only.

Home replaces the retired briefing with shared configuration. Separate Diet,
Health and Sofia resources prevent one save from removing another domain's settings.
The legacy configuration and authoring routes redirect to their current destinations.

The historical body-fat Targets panel supplies the one-off calculator. Check-ins
and active goal tracking are excluded. Fit total expenditure already includes
resting expenditure, so calibration adds a signed correction rather than subtracting
another full maintenance allowance. Week-aligned weights avoid comparing a stale
or midweek measured change with a full-week prediction.

Successful missing-resource reads clear obsolete observations. Failed refreshes
retain the last successful snapshot with an error. Missing daily capture coverage
never becomes zero intake. Source retrieval belongs to deterministic capture and Agentic ETL. The
application validates connector-published results.

## Engine-owned analytics agreed 15 October 2026

Observed-data calculations belong to Automation Engine so reporting, shopping
and application pages share the same results. Planner retains presentation and
immediate unsaved scenarios, including the correction slider and body-fat
calculator. A separate synchronization layer was rejected. Both Processing and
Analytics publish through application connectors.

The centralized Analytics dashboard and its item/category/manual-check-in
resources are retired. Shared chart components remain available to domain pages.
Persisted navigation selections and former Analytics links resolve to Home.

Diet analytics carry the calculation date and input revisions. Weekly Monitoring
and consumed rankings cannot silently display a previous day's snapshot as current.
Calibration preserves its week alignment while allowing an immediate unsaved
correction against the published baseline. User-owned settings retain explicit
save actions and failed reads do not replace saved configuration.

## Partial journal monitoring agreed 16 October 2026

Monitoring and consumed contributions display logged entries through the current
day without requiring complete diary coverage. Explicit partial-data wording
and isolated observation markers keep unfinished intake visible without implying
that unlogged food is zero. Weekly rates still require complete elapsed days.
Maintenance calibration keeps its complete-week requirement. Personal ingestion
publishes the refreshed journal and diet analytics on its three-minute cycle.


## Captured meals and incomplete values

The warehouse publishes versioned MFP meal observations and verified or estimated
serving prices. Nullable nutrition and portions expose missing evidence rather
than coercing it to zero or omitting the meal. All linked saved diets follow the
current recipe with their occurrence multipliers retained. Customized compositions
are reconciled explicitly rather than overwritten by name matching.

## 2026-10-18 Shared loading and finance scope

Initial page reads use the existing blue spinner in a full-viewport overlay.
Text loading cards are unnecessary. Resource errors remain visible after loading
finishes. Background refreshes retain the successful display.

Finance contains Monitoring, Spending rankings and the planning workspaces. The
Forecasting page and its historical-average analytics producer are removed.
The old route redirects to Monitoring. Investment scenarios and shopping
replenishment cadences remain independent features.

## 2026-10-18 Diet workspace prototype review

The standalone prototype in prototypes/diet-workspace/index.html presents Select
Diet and Plan Diet together for review before working-page changes. It follows
Plan Finances with white rounded cards, serif section headings, green scrollable
meal areas and rose destructive controls. The sketch supplies the compact Save
and Notes icons, calendar heading, weekly cost and integrated daily averages.
Clear diet retains its label and gains a trash icon. The prototype omits the
day selector, add-meals header and Paste button. Its illustrative controls do not
write planning resources. Implementation awaits review of the prototype.

## 2026-10-18 Approved Diet workspace implementation

The prototype layout is approved with the existing app font and Finance controls.
Finance and Diet share the extracted planning card, section heading, item heading
and circular delete button. Diet meal headings use the compact variant at 16 px
and their detail text is 14 px. Finance keeps its existing typography. Native
emoji supply the Diet headings, calendar, Save, Notes and summary symbols.

The Notes popover is enlarged to 800 px with viewport constraints and a large
resizable writing area. Explicit draft saves, conditional resource writes,
per-diet notes, repeated portions and Clear diet confirmation remain intact.
The board keeps horizontal scrolling and each meal area scrolls vertically.

Daily MyFitnessPal link icons use the existing blue-500 and blue-600 hover colours.

## 2026-10-18 Integrated cheat-meal creation

Cheat-meal creation belongs in the Plan Diet workspace. A button in Select Diet
switches between the weekly board and the existing purple creation card. Parent
state retains both drafts. Saving updates the meal picker immediately and returns
to the board. The separate route and saved-meals list are unnecessary because
Add meals already exposes the catalogue. The authored resource and enrichment
contracts stay the same.

## 2026-10-18 Compact Diet toolbar and Finance width

The top selector uses the same action-button component as Finance, without a
Select Diet title or enclosing card. Clear diet becomes a simple toolbar action
and retains its confirmation. New diet requests its name in a dialog after the
button is clicked. The workspace uses Finance's desktop outer spacing and
available width. Week and meal-area scrollbars are hidden while scrolling
remains enabled in both directions. At the user's request these refinements
receive a quick syntax and diff check without another full validation run.

## 2026-10-18 Weekly Health reporting

Health uses calendar weeks throughout the producer and UI. Period toggles are
removed. Date and history controls browse earlier weeks. Weekly rows from existing
snapshots remain readable. Stored monthly and annual settings are preserved by
explicit weekly saves. Daily observations still support Diet Analytics.

## 2026-10-18 Finance monitoring snapshot continuity

Finance Monitoring displays the latest valid publication across day boundaries.
Its expense revision must match, its publication date cannot be in the future,
and its calendar year must match the selected year. The observation date remains
visible. The month continues to show daily chart points. Observed history is
not hidden solely because another London day has begun.

## 2026-10-18 Spending without a separate budget

Observed Finance spending renders independently of budget mapping. Categories
without a separate budget show their daily or monthly expense points and spent
total. Planned and remaining values stay unknown. The saved combined food budget
is not duplicated into separate Groceries and Eating Out allowances.


## 2026-10-18 Finance note category targets

The canonical Routine finance note owns category targets used by monitoring.
Agentic ETL checks it on every pass and saves a dated, evidence-backed
finance_category_targets resource using observed Monzo IDs. This avoids guessing
allocations from unrelated cash-flow labels. The monthlyBalance label mapping is
removed from monitoring and Sofia assessments. Explicit zero remains distinct
from a missing target. Dates include years and stop at the note's planning horizon.

The current note provides nine categories for October 2026 through September 2027.
Groceries is £478.15 monthly. October travel is £0 and November travel is £200.
October Bills includes the additional September rent paid in October. Subscription
targets include annual charges in their due months, without adding reserve funding
as another expense. Source notes, supporting passages and extraction history are
retained. A source change or target revision conflict requires a fresh extraction.

The initial 108 entries are persisted and read back from Planner Redis. October
monitoring is republished against retained actuals, with Groceries £282.76 spent
and £195.39 remaining. Six focused Python checks, role YAML and harness mirror
checks pass. Software changes remain local. No bank settings or payments change.


## 2026-10-18 Calorie Calculator publication and isolated observations

The rolling-window producer is published through the composed retained-data
pipeline, replacing the older fixed-week snapshot. The published resource reads
back with no pipeline failures, seven expenditure days, two intake days and one
weight observation. Observed maintenance is approximately 2,010 kcal per day.
Weight correction stays unavailable without complete paired evidence and aligned
endpoint weights. Weight charts render point markers so a single observation is
visible without connecting across missing dates. The actual frontend resource
schema and calibration selector accept the published snapshot. Chart syntax and
diff checks pass. Browser confirmation remains unavailable.


## 2026-10-18 Diary ingestion history and completion

The eight-date capture horizon omitted existing older food records. A live check
confirmed thirteen food entries on 6 October outside that horizon. Capture now
revisits thirty previous London dates plus today and supports an explicit history
length. The live backfill retained thirty-one diary dates and recovered food
records on 28 September and 6 October. Empty source diaries remain empty.

The ingestion layer discarded explicit completed-day evidence by forcing every
day incomplete. Parsing now reads the source's completed or unfinished marker and
capture preserves it. Completion is never inferred from successful requests or
nonempty entries. Contradictory states fail validation. Thirty-one focused
capture and bug regressions pass, with targeted type checking for both source
files. The current weight export contains 123 rows through 13 October, normalized
into 107 distinct measurements over 76 dates. Later weights are absent from that
source rather than removed by the calculator. No consumption is added or edited.

The live composed Diet rebuild and publication complete without failures. Redis
readback confirms thirty-one diary dates, five dates with food records and the
completed 6 October diary. The current rolling estimate remains based on its
actual seven expenditure days and two intake days.


## 2026-10-18 Calculator chart and balance removal

The user removed the weight graph and paired-day balance card from the Calorie
Calculator. Intake, expenditure and maintenance remain above a full-width
observed-calibration card showing daily correction and both weekly change values.
The proposed thirty-day weight-chart extension is removed from production and
tests. Observed measurements and seven-day maintenance calculations are retained.
The layout receives a quick syntax and diff check.


## 2026-10-18 Scenario weight comparison

Starting weight and target weight form the first pair of body-fat calculator
results. Starting weight reflects the editable current-weight input, preserving
the scenario calculation and remaining result values.


## 2026-10-18 Health save endpoint and chart preview

The deployed backend returns 404 for conditional saves, so the local frontend
uses the local headless_backend through Vite rather than weakening simultaneous
save protection. Production deployment remains outside this handoff. The local
backend is built and running hidden on port 3000 against shared Redis, with
credentials supplied only through its environment.

Valid drafts preview target and limit reference lines immediately. Burnup target
pace and remaining allowance project the edited target against published totals.
The UI confirms saves only after resource readback and discards older in-flight
configuration refreshes. Unknown settings and other periods are preserved.

A disposable resource exercised the actual Vite proxy, backend conditional save,
Redis readback, preservation of unrelated settings and stale-write rejection. It
was removed afterward. A real published Health snapshot verified edited, zero and
unset target projections. Frontend type checking and diff checks pass. Browser
interaction remains unverified because Chrome automation is unavailable.


## 2026-10-18 Standard Health save route

Kesler explicitly chose the ordinary resource-save route and accepts simultaneous
saves overwriting each other. Health reads the latest config, merges the selected
field, saves through the existing deployed API and verifies persisted readback.
The local API proxy and temporary backend are removed. All app resource calls
again use the configured deployed backend. Valid draft previews and stale-refresh
protection remain. The actual Health save function was exercised against a
disposable resource through the deployed endpoint, including save, readback,
preservation of unrelated fields and unsetting a weekly target. Cleanup succeeds.


## 2026-10-18 Nested MyFitnessPal nutrient values

Protein was published as zero because ingestion read cell.text while the source
puts macro values in nested elements. Nutrient extraction now joins descendant
text nodes and reads the first numeric value, separating grams from subsequent
percentages. Plain calorie extraction remains correct. A focused regression
covers adjacent nested nutrient and percentage spans. Diary parser checkpoints
use mfp-diary-2. Source observations are recaptured and replayed through the
composed Diet publication pipeline.


## 2026-10-18 Isolated training-volume observations

Weekly training-volume burnups contain observations on workout dates, with missing
dates retained as unknown. Area charts previously hid markers, so isolated dates
separated by unknown values drew no visible actual trace. Observed markers now
render without connecting gaps or manufacturing rest-day zeros. The published
week beginning 12 October has two observed workout dates. Chest has verified zero
recorded kg times reps while quads and glutes each total 3562. Syntax and diff
checks cover the marker-only UI correction.


## 2026-10-18 Connected cumulative Burnup presentation

The user wants a connected shaded burnup rather than separated workout markers.
The shared Burnup area joins recorded cumulative points across missing dates so
the area fill draws. Markers, source nulls and partial-coverage labels remain.
This is a chart presentation change without changing observations or totals.


## 2026-10-18 Partial observations and average availability

Kesler does not require full coverage to use an average and removed the partial
coverage warning. Health burnups divide observed totals by the count of observed
dates, including explicit zero values. Diet divides logged amounts by recorded
or explicitly completed diary dates. Finance uses captured zero-spending days and
known transaction dates, retaining gaps rather than suppressing the whole period.
Required pace uses calendar time left rather than delaying missing dates into the
future. Unfinished today is not required to establish completed-day coverage.

Source gaps, zero values and missing targets remain distinct. The UI shows sample
counts and no full-coverage warning. Sofia receives observation counts and partial
metadata and compares sampled totals to corresponding target allowances. The agent
is instructed to judge sample selection, freshness and context. Workout-day means
do not assert how often training happened on unobserved dates. Weight correction
retains its evidence requirements because missing endpoint or energy observations
cannot be replaced by an ordinary sample average.

Ninety-six focused Python checks pass. Targeted mypy, frontend type checking, role
YAML and harness mirror synchronization pass. The retained-observation replay has
no calculation failures. Software changes remain local and calculated resources
are published through the composed analytics workflow with alerts disabled.

## Navigation agreed 18 October 2026

Option B uses a desktop page rail and a mobile domain dock. The rail exposes all
pages in one click while the dock opens domain page lists within two taps.
Rounded floating tabs were considered, but hide desktop destinations behind a
menu. A single launcher keeps the header smaller but hides domain navigation.
The desktop sidebar uses the selected 264px soft mint glass treatment with
larger labels and a pale green gradient inspired by the supplied reference.
The wider 288px, stronger mint alternative was declined. The mobile dock shares
the sidebar's mint gradient and border to keep navigation surfaces consistent.
The page sheet matches the Finance copy popup's 30% white surface, 12px blur,
gray border and shadow. Top spacing belongs to the pages because adding shell
padding duplicates the gap below the header. Inherited fonts preserve the app's existing theme. The original gradient
sofiaPlanner logo and username greeting with sparkles stay at the top.


## Card and chart styling agreed 18 October 2026

White cards and the original chart palettes are retained. Semantic card tints
and dynamic red and green chart shading were declined after visual review.
Plan Finances supplies the shared system typography. Material controls inherit
that font and use the same field corner radius. Plain green Add meal buttons
are selected while Save diet retains its gradient.

## Saved resources and component ownership

Resource reads and edits have separate lifecycles. Failed reads remain read-only,
and successful hydration does not save a resource. Investment allocations require
confirmed budget data so illustrative values cannot appear as actual availability.

Cards, selectors, segmented controls and donut rendering shared by multiple domains
belong in the common components directory. Domain pages retain grouping, calculations,
legends and persistence. Planning cards keep their existing appearance independently
of analytics cards. Budget drafts belong to the budget page and flow into stateless
editors. Feature-specific charts remain feature-specific rather than becoming one
configurable chart framework.

## Isolated UI candidates

UI candidates run outside production source with their own entry points and type
scope. They share the application theme and components, use synthetic data and
block live HTTP. Only selected components are promoted into production pages.
Retired screens and uniquely authored candidate work are retained outside the
production compilation scope, avoiding both accidental deletion and dead app code.

## Authenticated account boundaries agreed 18 October 2026

The resource API validates Auth0 access tokens and resolves account namespaces from
issuer and subject. The browser waits for the resolved account, attaches bearer
tokens to resource requests and keys pages and caches to that account. Caller-supplied
email prefixes were rejected as authorization because another caller can choose them.
Explicit server-side bindings preserve existing namespaces without automatically
linking equal emails across providers. Provider linking requires deliberate ownership
verification rather than email equivalence.

OAuth callbacks use the application base for the GitHub Pages deployment and localhost
for local development. Return destinations stay inside the hash router. Memory token
storage and an explicit retry state avoid reliance on an existing browser cache or
an endless redirect loop. Tenant allowlists and API audience must be verified before
coordinated rollout. A native browser-control failure does not change OAuth protections.


## Public demo and owner-only hosting agreed 18 October 2026

The public website and personal app share a static deployment but use separate
roots. Demo reuses production pages with a local synthetic resource transport.
Its navigation preference is independent of authentication and never grants
backend access. Shared demo credentials were rejected because a browser-local
copy avoids shared mutable data and eliminates an unnecessary login.

Personal access retains Google sign-in and RS256 API tokens. Exactly one reviewed
subject binding owns each deployment. Unknown subjects are rejected rather than
receiving new accounts. The backend package lives in the application repository
with an independent runtime environment and build. Direct owner subject and account
topic settings replace a JSON identity mapping to make single-owner configuration
explicit. Prototypes stay in a Git-ignored local folder rather than being published.
Contributors clone and host
independent instances instead of joining the maintainer's personal deployment.


## Landing A and Navbar B agreed 18 October 2026

The selected public website uses the reference-led centred hero and open-book card.
A tilted gradient backing, yellow circle and lighter purple circular motif retain
the project's visual character. Feature selection changes the sample content in
both pages and its demo destination. The proposed domain tagline was removed.

Compact icon actions keep Demo and Website alongside sign-out in the existing
header. Separate navigation toolbars were rejected to keep navigation in one place.
Labels remain available through accessible names and tooltips, and the demo's
sample-data notice retains its reset control. The local prototype imports the
promoted book component rather than maintaining another implementation.
