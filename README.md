# TokenCostDashboard

Interactive dashboard for the software licensing summary workbook.

The current version focuses on cost optimization:

- Current monthly spend from HK and MY details sheets
- Current spend vs proposed Claude Team centralized billing
- USD / HKD / RM display currency switcher
- Month multi-select and chart hover details
- Tech fixed seats plus adjustable operation seats scenario
- Employee Usage / Project Usage analysis toggle
- Project cost allocation from the new Project column
- Month, employee, project, and subscription drill-down for available details

Product requirements are tracked in `PRD.md`; changes are tracked in `CHANGELOG.md`.

## Run

From this folder:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Boss demo file

For a no-server demo, open:

`/Users/nerolifu/Documents/mycodebase/TokenCostDashboard/dashboard-demo.html`

This file embeds the CSS, JavaScript, and dashboard data, so it can be opened directly in a browser.

## Refresh data

The dashboard reads `data/dashboard-data.json`, generated from:

`/Users/nerolifu/Downloads/Summary of software licensing (1).xlsx`

To refresh it after the workbook changes:

```bash
python3 scripts/build_data.py
```

Then rebuild the standalone demo file:

```bash
python3 scripts/build_single_html.py
```
