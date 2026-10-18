## Finance source tables

monthlyBalance is the existing yearless object keyed by English month name. Each
month contains categories with name, income or expense type, and sections with
name and GBP value. Optional isVariable and variableId preserve existing budget
editor behaviour. Analytics converts budget amounts to pence without writing them.

finance_expense_actuals and finance_shopping_actuals are Automation Engine resources
with schema_version 1, revision, available, observed_through, captured_at, coverage,
entities and rows. Expense row grain is London date, category identifier and
merchant, with net pence value. Shopping row grain is date and canonical item with
quantity measured in purchased packs or items. Entities include forecast_eligible,
which follows the explicit recurring setting for shopping. Coverage dates are inclusive.

finance_forecasts has schema_version 1, revision and independent expenses and
shopping sections. Sections contain revision, input_revision and rows keyed by
entity_id, period and start. Rows include end, expected_total, expected_remainder,
model, training_periods, training_start and training_end. The historical-average
producer uses complete covered periods. Expense quantities are pence and shopping
quantities are purchased packs or items. All three resources are read-only here.

finance_spending_rankings is an account-scoped read-only Analytics resource with schema
version 2, revision, expense input_revision, available, captured_at,
observed_through and inclusive coverage. Its periods have month or year grain
keyed by period and start, calendar end, observed_coverage, complete or partial
coverage_status, integer-pence net_total and ranked categories. Categories have
id, name, net_total, positive_share, cumulative_share and ranked merchants with
the same fields. Cumulative shares accumulate positive net pence in rank order
against the full positive total and remain flat through refunds.
Shares are fractions of positive net totals at each level. Negative entries
have zero share and zero-total entries are omitted. It derives solely from the
persisted finance expense actuals snapshot.
## Health resource tables

automation_engine owns the version-one health_analytics resource, published
under the existing user namespace through Redis and the JSON resource API.
The full retained Strong export supplies sets. Fitdays supplies timestamped
weigh-ins and body composition. Google Fit supplies daily activity and raw sleep
segments. Sofia reads producer data without writing it back.

daily has London date grain with values by metric id and muscle_volumes by
group id. Metadata supplies metric name, unit, source and sum or mean aggregation.
exercise_daily_bests has date and exercise_id grain and retains load, matched
body_weight, weight_measured_at and lifted_at. Producer eligibility uses the
latest preceding weigh-in and the fixed weight_cutoff before daily maxima.
exercises supplies exact exported names and unmapped_exercises exposes missing
muscle assignments. latest_body contains value and measured_at per body metric.
observed_through supplies per-metric dates and the latest Strong workout date.
revision is content-derived and generated_at identifies snapshot generation.

health_config is a user-owned version-one resource. targets maps activity ids
to optional week, month and year totals. Activity ids are steps or volume followed
by the muscle group. limits maps metric ids and the same periods to lower and
upper values. Missing settings remain unset. Explicit saves use the existing
JSON resource API. No producer reads or overwrites this configuration.

## Sofia resource tables

sofia_config is a version-one account-scoped resource independent of
health_config. Rules have stable IDs, monitoring source keys, periods, alert
kinds, enabled flags, goal directions, tolerance fractions, optional freshness
days and report inclusion. habit_weights maps TickTick habit IDs to non-negative
weights. The initial shopping horizon is seven days and report_hour is 21.

sofia_monitoring supplies dated metric assessments and routine adherence from
automation_engine. Metric source keys and labels populate configuration choices.
Routine habit IDs and names populate weight controls. Resource-read failures
remain distinct from missing configuration and cannot trigger a save of defaults.


## Diet resource inventory

Existing diets and meals are account-scoped planner resources. Diet contains name,
active state, finalizedAt and weekday arrays of meal snapshots. Captured meals have
optional catalogueId, food components and serving quantities, nullable tasteScore
and optional nullable convenienceScore. Captured foods retain nutrition per serving,
GBP cost, amount, servingUnit and optional catalogueId and agent-managed ratings.
Optional priceCatalogueId links a food serving to a verified receipt product.
priceServing records its converted quantity and unit independently of nutrition.
Receipt provenance and links remain attached to copied and saved food records.

Diet configuration is diet_config with schema_version 1, signed correction in
kcal per day and rules keyed by calories, protein, cost, taste and convenience.
Each rule has a non-negative finite weight and minimise or maximise direction.
Health and Sofia configuration remain their existing independent resources.

MFP diary observations are consumed through diet_actuals with schema_version 1,
revision, captured_at and days. Each day has a unique London YYYY-MM-DD date,
complete flag and entries. An entry has unique id, optional meal identity expressed
as nullable meal_id, name, positive servings, actual calories and protein, nullable
actual GBP cost and optional foods. Food observations have id, name, actual calories
and protein and nullable GBP cost. Nutrition and cost are totals for the logged
quantity, not per-serving values. meal_id and food id link captured immutable
catalogue records. Unmatched entries retain their supplied name and amounts.
Automation Engine capture owns explicit completeness and its Planner connector owns publication. The application
reads this resource without writing observations or manufacturing capture coverage.

health_analytics supplies daily total calories expended and measured weight for
maintenance calibration, plus latest body measurements for calculator inputs.
Prediction uses complete diary and expenditure days for the previous calendar week.
The starting weight is observed on the preceding day. Observed weekly change requires
a weight at the same week-ending boundary. Source schemas remain unchanged.

## Published analytics source inventory

### diet_analytics

- Location. Account-scoped diet_analytics JSON resource.
- Produced by. Automation Engine domain Analytics from retained diary observations,
  catalogue, plans, diet configuration and health inputs. Its Planner connector
  publishes the validated snapshot.
- Used in. Diet Monitoring, Meal Rankings and maintenance calibration.
- Grain. One versioned snapshot containing current weekly views and calibration.
- Schema.

| Column | Alias | Type | Description |
|---|---|---|---|
| schema_version | Schema version | integer | Version 1 |
| revision | Revision | string | Content identity |
| input_revisions | Input revisions | object | Identities of contributing snapshots |
| generated_at | Generated at | datetime | Snapshot calculation time |
| as_of | Calculation date | date | London day used for elapsed-day coverage |
| monitoring | Weekly monitoring | object | Diet-name keys with calories and protein views |
| monitoring.*.*.partial | Partial intake | boolean | True when any elapsed or current diary date lacks explicit completeness |
| monitoring.*.*.actual | Logged intake | number or null | Sum of logged intake through today, including unfinished diary dates |
| monitoring.*.*.points | Logged series | array | Plan and cumulative logged values with absent points for unconfirmed empty dates and future dates |
| rankings | Meal rankings | object | Catalogue and consumed component values, servings and loss |
| calibration | Maintenance calibration | object | Week-aligned observed values and baseline prediction |

### health_analytics period projections

- Location. Account-scoped health_analytics JSON resource.
- Produced by. Automation Engine Analytics from retained Strong, Fitdays and Google
  Fit histories and health configuration, published by its Planner connector.
- Used in. Personal Records, Burnup and Control charts.
- Grain. Calendar period and activity or exercise within a versioned snapshot.
- Schema.

| Column | Alias | Type | Description |
|---|---|---|---|
| periods | Period analytics | array | Calendar period, start, end, control values and exercise records |
| burnup | Burnup analytics | array | Calendar period and entity with dated cumulative values and pace |
| periods.records | Exercise records | array | Load, preceding PR, percentage and matched weight evidence |
| burnup.points | Burnup series | array | Date, observed cumulative value and target pace |

### finance_monitoring

- Location. Account-scoped finance_monitoring JSON resource.
- Produced by. Automation Engine Analytics from expense actuals and captured budget
  configuration, published by its Planner connector.
- Used in. Finance Monitoring budget remaining, burn rates and expense breakdown.
- Grain. Current-year category with twelve monthly views and one annual view.
- Schema.

| Column | Alias | Type | Description |
|---|---|---|---|
| schema_version | Schema version | integer | Version 1 |
| revision | Revision | string | Content identity |
| generated_at | Generated at | datetime | Snapshot calculation time |
| as_of | Calculation date | date | London day used to determine elapsed time |
| input_revision | Expense revision | string | Revision of the expense actuals snapshot |
| views | Monitoring views | object | Category keys with months and year views |
| views.months | Monthly views | array | Twelve views containing points, budget, signed balances, rates and merchant breakdown |
| views.year | Annual view | object | Annual points, budget, signed balances, rates and merchant breakdown |
