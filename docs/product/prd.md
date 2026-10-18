# Sofia Planner

Finance Monitoring compares observed spending with saved budgets at
/finance/monitoring. The obsolete forecasting route redirects there.

Spending rankings at /finance/rankings show where actual spending goes across
categories and merchants. The default is the current month. Month and Year
controls and calendar selectors support retained history.

Category composition pairs a top-five-plus-Other donut with the shared
horizontal ranking chart. Descending bars show net spending against a GBP axis.
The chart grows vertically when expanded so additional rows stay readable.
Five ranked entries appear initially. Show all expands the chart. Exact totals
and keyboard category selection are available in its accompanying table.
A Category dropdown, chart bars and the accompanying table select a category.
The Merchants switch replaces the overview with that category's merchant rankings.
It is disabled until a category is selected. Switching off returns to the category
overview and retains the selected category. Only one ranking chart and one donut
are visible at any time. Merchant composition uses top four plus Other.
Category composition uses top five plus Other. Selection survives period changes
and refreshes only while that category remains present. Missing selections reset
the switch to the category overview.

Totals are exact GBP net spending. Refunds remain visible as negative bars and
Net refund labels. Donuts contain positive net spending only and label shares
accordingly. Colours follow category and merchant identities across ranks.
Other appears only when additional positive entries exist. Category selection
works with the keyboard.

Rankings are calculated by Automation Engine Analytics and loaded read-only. Refresh occurs on entry,
focus and every minute while visible. Failed refreshes retain the last successful
display with a message. Loading, unavailable sources, absent coverage, partial
coverage, stale capture and verified zero spending remain distinct. Incomplete
periods show their observed date intervals. Budget rankings, purchased products
and previous-period comparisons are separate iterations.

Rankings reuse the Finance cards, calendar selectors and rounded segmented
controls. Chart typography and grid styling follow the other Finance charts.
The main ranking chart and composition donut use Monitoring's two-to-one desktop
layout and stack vertically on mobile.

## Monitoring

Monitoring uses the current year's existing January–December budget. Month runs
from day 1 to the month's final day. Year runs from month 1 to 12. Actual points
represent daily or monthly aggregate expenses and show cumulative budget remaining.
Observed days without spending are flat. Future observations remain absent.
Matching-revision snapshots from earlier dates in the selected calendar year
remain visible after midnight. The page shows the observation cutoff. Future
snapshots, mismatched expense revisions and other calendar years are not used.
The default view is the month with daily points.

The chart uses a dashed planned line, green and rose background areas, grey actual
fill and endpoint markers. Monthly planned spending is evenly distributed. Annual
planned spending follows each month's individual budget. Left to spend appears
inside the chart. Expense makeup lists merchants and accounts for net refunds.

Cards show Spent and Daily burn rate. Month also shows Weekly burn rate and Weekly
remaining. Year shows Monthly burn rate and Monthly remaining. Remaining means
affordable allowance per time left, including fractional months. Averages use observed dates, including confirmed zero spending days and dated
transactions, while missing dates are excluded. Remaining rates use calendar time
left from the reporting date. Completed periods have no remaining allowance and overspending
preserves negative balances.

Recorded spending and merchant composition remain visible without a separately
category target. In that case the chart shows daily or monthly spending and the
observed spent total. Budget burndown, planned lines and remaining allowances
require a dated category target from the finance note. The combined Food line in monthlyBalance is not used for category monitoring.
Unavailable sources, insufficient history, stale observations and missing budgets
are visible states and never fabricated zeros. Analytics source resources are
read-only. 

# Health

Health contains Personal Records, Burnup and Control charts.
Diet Monitoring is the application landing page.
The pages use the retained Strong, Fitdays and Google Fit histories through
the account-scoped health_analytics resource. Configuration is stored separately
as health_config. Analytics observations are read-only.

Personal Records displays each exercise's heaviest recorded load per calendar
week as a violet area. A blue stepped reference shows the highest
eligible load before each period. Percent change is 100 times period best minus
previous PR, divided by previous PR. A missing positive baseline has no percentage.

Each lift matches the latest preceding Fitdays weigh-in using London timestamps.
The complete lift history is filtered to matched body weights strictly below the
rounded-up latest body weight before records are calculated. This fixed cutoff
applies across historical periods. Earlier lifts without a weigh-in are ineligible.
Latest available muscle mass and body fat show their measurement dates.

Burnup accumulates steps, sleep hours, completed focus-session hours, completed
scheduled habit occurrences or recorded kg times reps for one selected muscle group.
Each explicitly mapped group receives the full exercise volume. The ten groups
are chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves and
core. Unweighted sets contribute zero volume. Alenkad is excluded. Unknown
exercises remain visibly unmapped. Burnup has no body-weight filter.

Control charts connect observed period values using hollow violet markers and
one shaded region between manual lower and upper limits. Activity values are
period sums. Body measurements and sleep duration average observed daily values.
Hover shows both limits. Personal Records and Control charts initially show
12 buckets ending in the selected period. Offset adds earlier buckets.

Targets are edited beside Burnup charts as weekly totals. Control charts save lower and upper limits beside the selected chart.
Each explicit save preserves unrelated settings. Sleep burnup accumulates hours
while its control chart averages observed daily duration.
Empty settings remain unset. Values must be finite, targets non-negative and
lower limits less than upper limits. Health always uses the selected London calendar week. Weeks start on Monday.

## Sofia settings

Sofia-wide settings have no application editor. Stored alert, report, routine and
shopping settings retain their behaviour. Sofia reads targets, limits, observed
measurements, calibration, freshness and coverage to assess above or below goal,
pace, direction and sustained changes. It judges important new or worsening
findings without repeating unchanged alerts. Discretionary findings remain
distinct from configured threshold alerts. Diet intake targets belong to the
selected weekly plan. Finance monitoring targets come from the canonical finance note through finance_category_targets.

Missing observations remain unavailable. Refresh failures retain previously
loaded resources. Source observation dates remain visible, including stale data.


# Diet

MFP owns its saved food and meal creation and editing. Deterministic personal ingestion captures saved meals and immutable
versions for the existing weekly Plan Diet editor. Catalogue reads never write back.
Former meal and food authoring routes redirect to Plan Diet.

Plan Diet uses the same available page width and desktop outer spacing as Plan Finances.
Its weekly board scrolls horizontally inside that width, retaining large day
columns and meal cards. Left-clicking a
meal opens its copy and spread actions. The weekly board stays active at smaller
screen widths, with horizontal scrolling across the week and accessible draft
save controls. Touch dragging starts after a short hold. Repeated meal entries
represent separate portions. Adding, copying, spreading and dragging can
place the same meal more than once on a day. Each portion can be selected,
removed and moved independently, counts towards nutrition and cost totals, and
can be saved on the board.
Each selected saved diet has an openable, editable reference note. The note stays
with that diet through saves and catalogue refreshes and does not enforce rules
or instruct agents.
Clear diet sits beside the diet selector. After confirming the
selected diet by name, it removes all planned meals from all seven days, including
unsaved changes, so planning can restart from an empty week. Cancelling leaves
the plan unchanged. The diet name, active state, other diets and meal catalogue
are retained. The action is disabled when the selected diet is already empty.
Right-clicking opens its recipe with
food quantities, nutrient contributions and the meal total. The meal picker has
a filter above its scrollable catalogue and matches meal names, ingredients and
vendors. Weekly total cost appears beside the plan and includes unsaved board
changes. Unknown ingredient prices leave the total unavailable. Average daily
cost remains separately labelled.

Diet Monitoring and Meal Rankings consume engine-published diet_analytics and are weekly. Monitoring compares actual MFP intake
with the currently selected diet repeated across Monday through Sunday. Calories show
allowance remaining and protein shows cumulative progress. Both metrics have actual
daily intake rate, required daily intake rate over the remaining days and total
remaining for the week. Logged-day averages use dates with recorded entries or
explicitly completed zero-intake days, without requiring complete calendar coverage.
Logged entries appear through today even when their diary day is unfinished.
Charts and meal contributions identify these as logged amounts, and partial
coverage stays visible. Unconfirmed empty days and future observations remain
absent. Personal ingestion refreshes the journal and publishes these results
every three minutes while the engine is running. Yesterday and Tomorrow move
the selected date one day at a time. Today returns to the current London date.
The three controls sit beside the metric selector with circular arrows and a
calendar icon. The energy equation shows the selected day. Weekly charts, rates
and meal contributions stop at that date. Future and uncaptured observations
remain unavailable.

The Diet toolbar includes a Create cheat meal button. It replaces the weekly Plan
Diet workspace with the original centred white form card and tilted purple
background. Back to Plan Diet restores the board and its unsaved draft. The
form retains its input draft when switching back and forth. Successful saving
returns to the board and immediately adds the entry to the meal picker. There
is no separate Cheat Meals page or saved-meals list. Obsolete cheat-meal routes
redirect to Plan Diet. Existing entries are found through Add meals.
It accepts name, calories, protein, carbs, fat, GBP cost, amount in grams and
vendor. Only name is required. Entries are immediately plannable as
single-component meals, with missing factual values shown as Unknown.
Authored entries have stable identities and revisions separate from MFP records.
Agentic ETL researches changed entries and automatically completes or corrects
reliable facts with retained original inputs and field-level sources. Ambiguous
matches remain unresolved. Matched diet occurrences follow enrichment while
retaining quantities and repetitions. Creation never logs MFP consumption.

Above the daily rate cards, a large labelled equation shows raw Fit calories
burned minus logged MFP intake for the London day. Positive means deficit,
negative means surplus and zero means balanced. Explanatory hints about coverage,
freshness and partial days are omitted. Missing inputs leave the balance unavailable.

Rankings has Catalogue and Consumed views, metric and direction controls, top-five
expansion and a Foods switch replacing the same chart pair. Calories, protein and
cost have composition donuts with rounded values. Taste and convenience have
rankings only. Unknown component values are visible and excluded from numeric
ranks. Ratings are agent-managed.

The Calorie Calculator combines a rolling maintenance estimate and a one-off
kg-only body-fat calculator. The rolling window is the seven preceding London
calendar dates, excluding the unfinished current day. At least one observed Fit
expenditure day supplies an average. Missing days are omitted, never set to zero.
The estimate displays its source, date window and observed-day counts.

When all seven days have complete intake and expenditure plus aligned starting
and ending weights, measured weight change supplies the calculated correction
using the existing energy conversion constant. Otherwise, maintenance uses the
average recorded Fit expenditure and is labelled uncalibrated. Logged intake
averages and paired-day balances retain their own coverage counts. The daily
Monitoring equation always uses raw Fit expenditure.

The body-fat calculator accepts current weight and body fat, target body fat,
timeline and maintenance. Maintenance is prefilled from the observed estimate
when available and accepts a clearly labelled manual scenario override.
It retains the historical constant-lean-mass calculation
and approximate 3500 kcal per lb conversion. Results include starting lean and fat
mass, target fat mass and weight, weight to lose, total and daily deficit, calorie
and protein targets. It does not activate goals or collect check-ins.

# Navigation and data availability

Home and Configuration pages are absent. Their routes and legacy Analytics
routes redirect to Diet Monitoring. Dashboards retain the selected period and
offer access to the latest available real history when it is empty. Source
failures, stale data, partial coverage and verified zeros remain distinct.

## Application boundary

Automation Engine owns reusable observed-data calculations, rankings, calibration
and assessments. Planner reads connector-published resources and owns chart
presentation, selection and immediate unsaved planning scenarios. The centralized
Analytics dashboard, item/category configuration and manual check-ins are absent.
Legacy Analytics routes redirect to Diet Monitoring.

Finance Monitoring consumes published finance_monitoring rates, allowances and
breakdowns when the expense revision matches and the publication belongs to the selected calendar year without a future date.
Health period maxima, preceding records, control values and burnup pace are
published with health_analytics. Diet monitoring and ranking values and weekly
calibration inputs are published with diet_analytics. Current-day figures require
a matching London date. Historical selections use their own dated observations
and never include later intake. Missing observations remain unavailable. Failed
refreshes retain the last valid snapshot.
The body-fat calculator supports immediate unsaved scenarios using published
calibration. Explicit target and limit saves preserve unrelated configuration.

Planner remains authoritative for diets, budgets, investment settings, targets
and configuration. Producer-owned resources are never saved on read.


## Captured meal completeness

Missing nutrition, portion and price fields remain empty and display as Unknown.
Meal and day totals stay incomplete when a required ingredient value is unknown.
Saved meal changes refresh matching occurrences across all saved diets while
preserving each occurrence's portion multiplier, repeated entries, position and
ratings. Independently customized occurrences remain unchanged and are flagged
for reconciliation. Historical consumption is retained.

## Loading

All active pages use the shared LoadingAnimation component during their initial
resource reads. The existing blue spinner covers the viewport and is centred in
both directions. It has an accessible loading status and respects reduced motion.
Failed loads show errors and background refreshes retain existing content.

## Plan Diet workspace

The Diet toolbar and Plan Diet reuse the Finance action buttons, planning card,
heading and circular delete controls. They inherit the existing application font and Finance colour
classes. Meal titles use the shared compact 16 px heading and nutrition details
use 14 px text. Native emoji label the workspace headings and Save and Notes
buttons. Clear diet is a simple Finance-style toolbar button with a trash icon.
The toolbar has no Select Diet heading or surrounding card. New diet opens a
name dialog only after clicking the button. Cancel creates nothing. Successful
creation uses the existing conditional save and selects the new diet.

The header contains Save, Notes, the calendar and Plan Diet title, with the total
weekly cost on the right. Save retains explicit draft persistence and enables
only for unsaved changes. Discard remains available for drafts. Daily averages
for calories, protein, cost and taste sit inside the workspace footer.

The weekly board scrolls horizontally with its scrollbar hidden. Each green
meal area scrolls vertically with its scrollbar hidden,
keeping daily totals below it. Add and MyFitnessPal diary controls belong to
each day. The diary link icon is blue. Diary links open that day in the current Monday-to-Sunday week. There
is no separate day selector, add-meals header or Paste control.

Notes opens an editable popover up to 800 px wide, constrained to the viewport,
with a large writing area. It retains per-diet identity and conditional saving.
Closing or cancelling does not publish note edits.

## Weekly Health periods

Personal Records, Burnup and Control charts use Monday-to-Sunday weeks only.
There is no Week, Month or Year selector. The week-containing date and earlier
weeks controls select retained history. The engine publishes only weekly Health
periods and burnups. The frontend accepts earlier published snapshots and selects
only their weekly rows. Daily observations remain available for diet calculations.
Weekly target and limit saves preserve other stored settings.


## Finance category targets

The Finances section of OBSIDIAN_ACTIVITIES/00 Life OS/04 Routine.md owns Monzo
category monitoring targets. Agentic ETL reads the current note every firing and
persists finance_category_targets in Planner Redis, followed by analytics refresh
and publication. The resource contains exact observed Monzo category IDs, year
and month, integer pence, supporting passages, source path and checksum, checked
time and a stable content revision. Original notes and extractions are retained.

Monthly exceptions and annual charges apply only to their stated dates. Funding
and reserve transfers do not add expense allowances. Missing categories and dates
remain unknown. Monitoring and Sofia assessments use these targets directly.
There is no inference from monthlyBalance group or section labels. Plan Finances
continues to store the separate cash-flow plan. Conditional saves reject changed
note content and concurrent target revisions. Rechecks of unchanged targets keep
stable content revisions and verify the persisted result.


## Diary history capture

Deterministic MyFitnessPal ingestion revisits the preceding thirty London dates
and the current date. Older retained dates survive overlapping captures. The
capture use case accepts an explicit history-day count for bounded backfills.
Original HTML is retained before parsing. Diary completeness requires the source's
explicit completed-day marker. Fetch success, elapsed time and food entries alone
do not prove completeness. Contradictory completion markers fail validation.
The source's verified completion state survives capture and warehouse publication.


## Calorie Calculator presentation

The calculator shows average logged intake, observed Fit expenditure and
maintenance. The observed-calibration card retains calculated daily correction,
raw predicted weekly change and observed weekly change. There is no weight graph
or paired-day balance card. The body-fat scenario recalculates as fields change
and requires target body fat below current body fat.

The body-fat scenario results begin with starting weight beside target weight.
Starting weight uses the current-weight scenario input and updates with edits.


## Health setting persistence and previews

Valid target and control-limit drafts preview immediately beside their charts.
Save reads the latest configuration, merges the selected metric and weekly field,
and uses the normal deployed resource-save endpoint to Redis. Other metrics,
stored monthly and annual values and unknown metadata are preserved. Successful
saves are verified by readback. Simultaneous changes use last-save-wins behavior.
Older in-flight refreshes cannot replace freshly saved settings. Invalid drafts
do not render invalid chart bounds. Inputs are disabled during a save.

Observed totals and daily pace remain engine-owned. Target-reference pace,
remaining allowance and required pace project the edited target against published
observations and calendar coverage without waiting for analytics publication.
Required pace uses the remaining calendar days whenever observations and a
target are available. Partial coverage does not suppress observed averages.

Local development and production both use the configured deployed resource API.
Health settings use the same ordinary save route as the rest of the application
and do not require a local backend or a backend deployment.


## Diary macro extraction

MyFitnessPal food macros are read from visible nested cell text. Grams are read
from the first nutrient value, independently of the displayed percentage. Plain
calorie cells and nested macro cells both retain their observed numeric values.
The captured food protein feeds diary actuals, monitoring progress and meal
contributions through the same publication pipeline.


Health charts render observed point markers, including isolated observations and
verified zero values. Burnup connects recorded cumulative points and shades the
area beneath them. Source gaps remain null in the data, with coverage states
preserved. Other chart types retain their existing gap behavior.


## Observed-day averages

Health, Diet and Finance calculate averages from available observed days without
requiring full calendar coverage. Confirmed zero days count in the denominator.
Missing dates remain unknown and are excluded, never filled with zero. A partial
logged day contributes its recorded amount. No observations means no average.
The UI labels these as observed-day or logged-day averages and displays the sample
count. The full-coverage warning is absent. Source coverage and freshness remain
available as metadata.

Required pace uses the recorded accumulated total and the calendar days remaining,
including the unfinished current day. Missing historical dates are not future days.
An unknown target still prevents target-dependent values. Diet's remaining rate is
labelled remaining logged allowance per day, preserving its recorded-intake basis.
Sofia can assess sampled target pace using target allowances for observed dates,
with sample counts and partial metadata. Missing measurements are not failures to
meet a goal. Weight-derived calibration still requires aligned endpoint weights
and the evidence necessary for the weight-change calculation.

## Navigation

Desktop navigation shows a translucent sidebar with direct links to all eleven
pages, grouped under Diet, Finance and Health. Every page takes one click.
On mobile and narrow screens, a translucent floating bottom dock opens the
selected domain's page list. Every page takes at most two taps. Current-page
highlighting follows the URL, including direct links and browser history.
The page list supports keyboard focus, Escape and outside dismissal. Navigation
reserves space below content and respects the device's bottom safe area.

Navigation preserves the existing fonts, gradient sofiaPlanner logo and username
greeting with sparkles. The desktop sidebar is 264px wide with a soft mint
glass tint and larger labels. The mobile dock shares the sidebar's mint glass
tint. The page list uses the translucent white Finance copy popup treatment.
Pages provide their own top spacing below the header.

Sidebar and mobile dock section icons use food, money and strength emojis. Save diet uses the
existing green-to-cyan primary gradient button with a text label. Its saving
and disabled states follow the current draft-save behaviour.


## Visual language

All pages and Material controls use the system font rendered by Plan Finances.
Analytics cards use 16px corners and 20px padding. Fields use 8px corners and
consistent horizontal and vertical padding. Meal picker and recipe panels share
card spacing. Add meal is a compact plain green button. Save diet retains its
original green-to-cyan primary gradient.

Diet Monitoring, Gym Personal Records, Burnup and Calorie Calculator use white
cards. Health charts use violet actuals and blue references. Diet charts use
slate actuals and green plan lines. Finance burndown retains its green and red
background regions, dashed plan and shaded actual series. Categorical charts
use their multicolour palettes. Chart colours remain fixed across observations.

## Saved plan availability

Plan Finances and Investments wait for saved data before enabling edits.
Unavailable or malformed saved data displays a failure state and leaves the
saved resource untouched. Viewing a saved plan does not save it again.
Investment allocations use confirmed monthly budget values and never substitute
illustrative balances when that budget is unavailable.

## Account access

Users sign in through the configured Auth0 application, including Google sign-in.
A fresh browser or supported device returns to the application base and then the
requested local page. Failed sign-in offers a deliberate retry without redirect loops.

The configured owner sees their saved plans, analytics and drafts. Other signed-in
identities are denied access. Pages wait for authorization before loading data.
Pending operations cannot cross a session change, and caches remain scoped to the
authorized identity. The owner setting preserves the existing resource namespace.


## Public website and personal access

The public Sofia website offers a browser-local interactive demo and Google
personal sign-in. Demo uses synthetic resources with independent browser storage,
a reset action and sample analytics. It cannot read or write private backend data.
The personal deployment accepts only its configured owner's identity. Other users
clone the open-source repository and configure their own hosted version.

A successful personal sign-in remembers that browser's preference. Later visits
skip the website, while authentication remains required when the session expires.
Direct demo links override the preference. About Sofia opens the website explicitly,
and signing out clears the personal preference. Both modes reuse the same pages.
