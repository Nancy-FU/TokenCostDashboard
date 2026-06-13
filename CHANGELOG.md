# Changelog

## 2026-06-02

### Added

- Added support for the new `Project` column in `Summary of software licensing (1).xlsx`.
- Added project allocation for slash-separated project values.
- Added Employee Usage / Project Usage analysis toggle.
- Added project-level breakdown: cost by project, savings by project, cost per project contributor, contributors, and subscriptions used.
- Added employee-level project allocation in employee details.
- Added recommendation messaging for the current monitoring gap: the current setup cannot clearly show each person's project focus or spend focus.
- Added Claude Team reporting rationale: admin exports can become recurring employee and project usage reports.
- Added Proposal Report Builder requirement: downloadable proposal, editable narrative text, and selectable dashboard visuals.
- Added recommendation requirement explaining why tech team accounts should not be shared.
- Added return-measurement narrative for cost savings now and Claude admin usage exports later.
- Implemented proposal builder in the dashboard with editable text, selectable visuals, and downloadable HTML proposal.
- Implemented the first version of multi-select subscription filtering.
- Replaced visible subscription chips with a compact dropdown multi-select and selected summary for management demo use.
- Implemented active-month labeling for employee and project details.
- Implemented detail cards with stronger visual separation.
- Refined the default proposal narrative around current monitoring shortage, tech seat non-sharing rationale, centralized billing, and return measurement.
- Implemented `Others` drill-down for Project Usage and Employee Usage so grouped small items can be inspected and opened individually.
- Added a `VIO + Mini APP` cost driver explanation in Project Details to explain why this project has high AI-related cost.
- Removed the oversized `Immediate Financial Impact` subheading from the proposal text to keep the numbered report hierarchy consistent.
- Re-read the latest workbook allocation changes and regenerated dashboard data from `Summary of software licensing (1).xlsx`.

### Changed

- Dashboard data source changed to `/Users/nerolifu/Downloads/Summary of software licensing (1).xlsx`.
- Main savings trend chart remains the primary visual anchor; Employee / Project toggle only changes the breakdown area below it.
- Project savings are estimated by allocating proposed Claude Team cost based on each project's share of current spend.
- Project splitting now supports both `/` and `,` separators.

### Normalized

- `VIO`, `VIO 4`, `miniapp`, and `Mini App` are grouped as `VIO + Mini APP`.
- `vouchain` is normalized to `VouChain`.
- `HR systems` is normalized to `HR Systems`.
- `MCP service` is normalized to `MCP Service`.
- Duplicate normalized projects within the same transaction are deduplicated before equal cost allocation.

## 2026-05-28

### Requested

- Rewrite all dashboard UI copy in English.
- Remove the `Latest 4` month shortcut.
- Move Meiyu into Tech Team.
- Split `Carol Ong` into two operation candidates: Carol and Ong.
- Multi-month selection should show aggregate dashboard totals and aggregate breakdowns by default.
- Claude Team Standard recommendation should be visually prominent.
- Cost details should default to monthly totals with a Details button for employee/subscription breakdown.
- Tech seats should become 11 after moving Meiyu into Tech Team.
- Selected period labels should show a continuous range only for continuous months.
- Non-continuous month selections should use comma-separated labels.
- A standalone HTML demo file is needed for management review without running a local server.

### Changed

- Dashboard direction changed from cost reporting to cost optimization and proposal comparison.
- Existing Cursor, OpenAI, Claude and related subscriptions are treated as replaced by Claude Team.
- Savings analysis now uses a same-currency comparison, with USD as the default view.
- Extra token pool confirmed as a fixed monthly cost of USD 500.
- Tech team seats are fixed and mandatory; operation seats are scenario-based because usage is uncertain.

### Added

- Main center chart for current spend vs proposed Claude Team cost.
- Month multi-select controls, including all months and latest 4 months shortcuts.
- Toggle to show or hide proposed Claude Team comparison.
- Tooltip requirement for chart points showing current spend, proposed cost, saving amount and saving rate.
- Seat Scenario panel next to the main chart.
- Operation seats slider that updates proposed monthly cost.
- Currency selector for USD, HKD and RM.
- Month drill-down showing employee cost share and employee ranking.
- Employee drill-down showing subscription-level details and estimated saving against one Claude seat.
- Plan comparison section for Individual Pro, Claude Team Standard and Team Premium.
- Data availability boundary for future project-level usage details.
- Implemented English-only dashboard copy.
- Implemented selected-period aggregate breakdowns by default.
- Implemented monthly summary table with Details buttons.
- Implemented stronger visual emphasis for Claude Team Standard.
- Implemented standalone `dashboard-demo.html` generation.
- Implemented continuous vs non-continuous selected period labels.

### Corrected

- Andy Lim and Andy Wong are separate people; the scenario list now treats Andy Lim as one tech seat.
- Meiyu is now included in Tech Team; Tech Team fixed seats updated to 11.
- Carol and Ong are now split into separate operation candidates.
