# Software Licensing Cost Optimization Dashboard PRD

## 1. Background

The company currently pays for multiple AI and software subscriptions across Cursor, OpenAI, Claude, and other vendors. Costs are split across Hong Kong and Malaysia records, and the current setup makes it difficult to understand monthly spend, employee-level usage, account ownership, and whether spending can be reduced.

The dashboard should help management compare the current fragmented subscription model with a proposed Claude Team centralized billing model.

## 2. Product Goal

Build an interactive dashboard that helps management answer:

- How much are we spending now across Hong Kong and Malaysia?
- How much would we spend after switching to Claude Team?
- How much can we save by month or across selected months?
- Which employees and subscriptions are driving the current cost?
- Why is Claude Team Standard the recommended plan?
- How does centralized billing improve monitoring, account control, and seat recovery?

## 3. Target Users

- Management: approve or reject the subscription change.
- Finance / Admin: understand current spend and expected savings.
- Team leads: review employee-level and subscription-level cost distribution.

## 4. Data Source

Source workbook:

`/Users/nerolifu/Downloads/Summary of software licensing (1).xlsx`

Current sheets used:

- `HK Details Breakdown`
- `MY Details Breakdown`

Current available fields:

- Country / Country Code
- Employee Name
- Vendor
- Subscription Plan
- Subscription
- Month
- Amount
- Total
- Currency
- Project
- Remark

## 4.1 Project Normalization and Allocation

The workbook now includes a `Project` column. Some rows contain multiple projects separated by `/` or `,`.

Project normalization rules:

- `VIO`, `VIO 4`, `miniapp`, `Mini App` -> `VIO + Mini APP`
- `vouchain` -> `VouChain`
- `HR systems` -> `HR Systems`
- `MCP service` -> `MCP Service`

Allocation rules:

- Split slash-separated and comma-separated project values.
- Normalize project names.
- Deduplicate normalized project names within the same transaction.
- Allocate cost equally across the deduplicated project list.
- Do not double-count the original transaction amount.

## 5. Proposed Claude Team Assumptions

### 5.1 Subscription Strategy

- Existing Cursor, OpenAI, Claude individual, and related AI/software subscriptions are assumed to stop.
- The company switches to Claude Team centralized billing.
- The recommended plan is Claude Team Standard.
- Seat cost is USD 20 per user per month.
- Extra token pool is fixed at USD 500 per month.
- Tech team members must each have one seat.
- Operation team usage is uncertain, so operation seats must be scenario-adjustable.

### 5.2 Seat Planning

Current baseline:

- Tech team seats: 11 fixed.
- Operation seats: 0-6 adjustable.
- Default operation seats: 6.

Tech team members:

- Yixiong
- Alvin
- Kai Lun
- Athira
- Andy
- Vivienne
- Set Yan
- Guo Feng
- Tristan
- Andy Lim
- Meiyu

Operation candidates:

- Eva
- Nancy
- Hong
- Beranrd
- Carol
- Ong

Note: Carol and Ong are two separate people. Meiyu should be shown under Tech Team.

Cost formula:

```text
Proposed monthly cost = (Tech seats + Operation seats) x USD 20 + USD 500 fixed extra pool
```

## 6. Currency and Conversion

The dashboard should support display currency selection:

- USD
- HKD
- RM

Savings should use same-currency comparison. USD is the default and primary comparison currency because the proposed Claude Team subscription is billed in USD.

Current fixed exchange-rate assumptions:

```text
1 USD = 7.8 HKD
1 USD = 4.7 RM
```

The detail table should preserve original currency and also show the converted amount in the selected display currency.

## 7. Core Experience

### FR-1 Main Trend Chart

The dashboard should keep a main trend chart in the center of the screen.

The chart should show:

- Current total spend line.
- Optional proposed Claude Team cost line.

Users can turn the proposed comparison line on or off.

The chart must support:

- Single-month selection.
- Multi-month selection.
- Hover tooltip showing current cost, proposed cost, saving amount, and saving rate.
- Data in the selected display currency.

### FR-2 Month Selection

The month selector should support manual multi-select.

Requirements:

- Users can select Jan-April manually.
- Users can select April only.
- Users can select all months.
- Remove the `Latest 4` shortcut. The user will manually select the latest four months when needed.

### FR-3 Multi-Month Aggregation

When multiple months are selected, the dashboard should present aggregate information for all selected months, not only the last selected month.

Example:

If the user selects January-April 2026:

- KPI cards should show the total spend across January-April.
- Savings should compare January-April current total against January-April proposed total.
- Employee breakdown should show the total employee spend across January-April.
- Employee pie chart should show each employee's share across the selected months.
- Employee details should show that employee's subscriptions across all selected months.

If the user clicks a specific point on the chart, the dashboard may temporarily focus the drill-down on that month, but the default view after multi-select should be the selected-period aggregate.

### FR-4 Seat Scenario Panel

The main chart should have a Seat Scenario panel nearby.

Requirements:

- Tech team seats are fixed.
- Operation seats are adjustable.
- Cost per seat is USD 20.
- Extra token pool is fixed at USD 500.
- Changing operation seats should immediately update the proposed cost line and savings.
- Meiyu should be listed in Tech Team.
- Carol and Ong should be listed as separate operation candidates.

### FR-5 Savings Summary

The dashboard should show:

- Current spend for selected period.
- Proposed Claude Team cost for selected period.
- Estimated saving for selected period.
- Saving percentage.
- Original HKD and RM spend.

For single-month selection, the selected period is that month.

For multi-month selection, the selected period is the total across all selected months.

### FR-5B Subscription Filter

The subscription filter should be a compact dropdown multi-select instead of a visible chip list.

Requirements:

- Default state is `All subscriptions`.
- Users can select one or multiple subscription types.
- The control should show a concise selected summary after selection.
- The dropdown should include an `All subscriptions` option.
- The dropdown should include `Clear` and `Apply` actions.
- The filter must work together with country, employee, currency, month, and Employee / Project Usage mode.
- The control should avoid horizontal or vertical scrolling in the main toolbar so the demo remains clean for management review.

### FR-6 Drill-Down Behavior

The drill-down section should support two period modes:

1. Selected-period aggregate mode.
2. Specific-month mode after clicking one month on the chart.

In selected-period aggregate mode, show:

- Employee cost share pie chart across all selected months.
- Employee cost ranking across all selected months.

In specific-month mode, show:

- Employee cost share pie chart for that month.
- Employee cost ranking for that month.

User should be able to return to selected-period aggregate mode.

The drill-down section should also support two analysis modes:

- Employee Usage: shows who consumed the spend.
- Project Usage: shows which projects consumed the spend.

The main Current Spend vs Proposed Claude Team trend chart must remain the primary visual anchor. The Employee / Project toggle should only change the breakdown section below the main chart.

### FR-7 Employee Details

When a user clicks an employee, the dashboard should show:

- Employee current spend.
- Proposed Claude Team seat cost.
- Estimated saving.
- Subscription-level details.

If multiple months are selected, employee details should aggregate that employee's subscriptions across the selected period.

Employee details should also show project allocation based on the new Project column.

### FR-7B Project Details

When a user switches to Project Usage and clicks a project, the dashboard should show:

- Cost by project.
- Savings by project.
- Cost per project contributor.
- Before vs proposed subscription cost.
- Contributors by employee.
- Subscriptions used by that project.

Project savings should be estimated by allocating proposed Claude Team cost based on each project's share of current spend. This keeps project-level savings reconciled to total dashboard savings.

### FR-7C Others Drill-Down

When the chart or ranking combines smaller items into `Others`, users should be able to click `Others` and inspect the underlying items.

Requirements:

- In Project Usage mode, clicking `Others` should show the projects included in `Others`.
- In Employee Usage mode, clicking `Others` should show the employees included in `Others`.
- The drill-down should show each item's cost in the selected display currency.
- Users should be able to click an item inside `Others` and open its normal project or employee detail view.
- `Others` should be treated as a visualization grouping only, not as a real project or employee.

### FR-7D Project Business Interpretation

Project detail view should support a business explanation section for selected projects.

For `VIO + Mini APP`, show a short explanation that helps management understand why the project has the highest AI-related cost:

```text
VIO + Mini APP has the highest AI-related cost because many contributors supporting this project are not core tech team members. As a result, they rely more heavily on AI tools for coding support, troubleshooting, documentation, and task execution. The higher AI spend is therefore not only a subscription cost issue, but also an indicator that this project requires stronger AI-assisted support and clearer resource monitoring.
```

Placement:

- Show this inside the right-side Project Details panel.
- Place it below the project title and metric summary.
- Keep it visually secondary to the numbers, but visible enough to support management discussion.

### FR-8 Plan Recommendation Section

The recommendation must be visually obvious.

Requirements:

- Claude Team Standard should be clearly highlighted as the recommended plan.
- Individual Pro and Team Premium should look secondary.
- Avoid mixing all plan information with equal visual weight.
- The recommended card should explain the business value clearly:
  - Centralized billing.
  - Usage monitoring.
  - Account ownership by the company.
  - Account recovery when employees leave.
- Shared token planning with a fixed extra pool.
  - Current shortage: the current setup cannot clearly show each person's project focus or spend focus.
  - Future reporting: Claude admin exports can be turned into monthly reports showing usage by employee and project.

The recommendation should also explain why tech team seats should not be shared:

- The tech team's current token usage is already not enough for shared access.
- Claude usage limits refresh every 5 hours, so shared accounts would create unstable availability for technical work.
- Individual seats make usage measurable by person, helping management understand workload, project focus, and contribution.
- Shared accounts hide who used the tokens and for which work.
- Centralized billing still lets the company manage the overall pool and allocate additional usage where demand is higher.
- This reduces waste compared with the current fragmented setup, where some individual USD 20 subscriptions may be underused while others run out of capacity.

### FR-8B Proposal Report Builder

The dashboard should include a proposal report section that can be downloaded and shared with management.

Requirements:

- The proposal report should be downloadable.
- The report text should be editable before download.
- Users should be able to select which dashboard visuals to include in the proposal.
- Selectable visuals may include:
  - Current Spend vs Claude Team trend chart.
  - Employee Usage breakdown.
  - Project Usage breakdown.
  - Monthly Cost Summary.
  - Seat Scenario panel.
  - Recommendation / Return Measurement panel.
- The report should preserve selected dashboard images or chart snapshots in the exported proposal.
- The exported proposal should remain editable where possible, especially the narrative text.
- The proposal should explain:
  - Current shortage.
  - Why shared tech accounts are not recommended.
  - Proposed Claude Team setup.
  - Expected cost saving.
  - Project-level cost allocation.
  - How returns can be measured now.
  - How Claude admin exports can support future monthly usage reports.
- The proposal heading hierarchy should stay clean and consistent. Numbered sections should be the main structure; avoid sudden oversized subheadings inside a numbered section.

Recommended first export format:

- Editable HTML proposal or `.docx`.

Future export options:

- PDF for final management circulation.
- PowerPoint for presentation use.

### FR-9 Cost Details Table

The cost details section should first show monthly totals instead of immediately listing every transaction.

Default table view:

- Month
- Current total
- Proposed total
- Estimated saving
- Saving rate
- Details button

When the user clicks the Details button for a month:

- Show that month's employee-level rows.
- Each employee row can show employee name, country, subscriptions, original amount, converted amount, and notes.

This prevents the dashboard from overwhelming management with too much detail on first view.

## 8. Language Requirement

All dashboard UI copy should be in English.

This includes:

- Page title
- Filters
- KPI labels
- Chart labels
- Seat Scenario panel
- Plan comparison cards
- Details table
- Empty states
- Buttons
- Tooltips

## 9. Data Availability Boundary

Current spreadsheet supports:

- Monthly spend.
- Country-level spend.
- Employee-level spend.
- Subscription-level spend.
- Project-level cost allocation.
- Transaction/detail records.

Current spreadsheet does not yet support:

- Claude token usage exported from admin console.
- Active user / token usage metrics.
- Exact token usage by project.
- Reliable operation-team seat demand.

The dashboard should distinguish between project cost allocation available now and usage/return metrics enabled later by Claude Team exports.

## 10. Non-Functional Requirements

- The dashboard can run as a local static page.
- A standalone single-file HTML demo should be available for management review without starting a local server.
- No login is required.
- Excel is preprocessed into JSON; the frontend should not parse Excel directly.
- The dashboard should be suitable for presenting live to management.
- Layout must be readable on desktop and usable on smaller screens.
- The interface should reduce clutter and show summary first, details on demand.
- Proposal export should preserve editable narrative text where possible.
- Proposal export should support selected dashboard visuals without requiring manual screenshot stitching.

## 11. Run Instructions

```bash
cd /Users/nerolifu/Documents/mycodebase/TokenCostDashboard
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173
```

If the workbook changes, regenerate dashboard data:

```bash
python3 scripts/build_data.py
```

Then regenerate the standalone demo file:

```bash
python3 scripts/build_single_html.py
```

## 12. Acceptance Criteria

- All dashboard UI text is in English.
- `Latest 4` shortcut is removed.
- Users can manually select one month or multiple months.
- Multi-month selection shows aggregate totals and aggregate breakdowns by default.
- The main chart shows current spend and optional proposed Claude Team cost.
- Chart hover shows current spend, proposed spend, saving amount, and saving rate.
- Seat Scenario shows Meiyu under Tech Team.
- Operation candidates show Carol and Ong as separate people.
- Claude Team Standard recommendation is visually prominent.
- Cost details default to monthly totals.
- Monthly total rows have a Details button.
- Clicking Details reveals employee/subscription breakdown for that month.
- Employee Usage / Project Usage toggle is available.
- Project Usage shows cost by project, savings by project, cost per contributor, contributors, and subscriptions used.
- Slash-separated projects are normalized, deduplicated, and equally allocated without double-counting.
- Currency selector supports USD, HKD, and RM.
- Operation seats changes update proposed cost and savings.
- A standalone `dashboard-demo.html` file can be opened directly in a browser and supports the same interactions as the local-server version.
- Proposal report text can be edited before export.
- Users can choose which dashboard visuals to include in the proposal.
- Proposal report can be downloaded.
- Proposal explains current shortage, no shared tech accounts, expected savings, project allocation, and return measurement.
