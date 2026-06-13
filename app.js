const CONFIG = {
  rates: { USD: 1, HKD: 7.8, RM: 4.7 },
  proposed: {
    pricePerSeatUsd: 20,
    extraPoolUsd: 500,
    techSeats: 11,
    maxOpsSeats: 6,
    techPeople: ["Yixiong", "Alvin", "Kai Lun", "Athira", "Andy", "Vivienne", "Set Yan", "Guo Feng", "Tristan", "Andy Lim", "Meiyu"],
    opsPeople: ["Eva", "Nancy", "Hong", "Beranrd", "Carol", "Ong"],
  },
};

const state = {
  rows: [],
  selectedMonths: [],
  activeMonth: "",
  activeEmployee: "",
  activeProject: "",
  expandedMonth: "",
  analysisMode: "employee",
  displayCurrency: "USD",
  compareProposed: true,
  country: "all",
  employee: "all",
  subscriptions: [],
  opsSeats: 6,
};

const els = {
  sourceMeta: document.querySelector("#sourceMeta"),
  currencySelect: document.querySelector("#currencySelect"),
  countryFilter: document.querySelector("#countryFilter"),
  employeeFilter: document.querySelector("#employeeFilter"),
  subscriptionDropdown: document.querySelector("#subscriptionDropdown"),
  compareToggle: document.querySelector("#compareToggle"),
  monthChecks: document.querySelector("#monthChecks"),
  selectAllMonths: document.querySelector("#selectAllMonths"),
  employeeMode: document.querySelector("#employeeMode"),
  projectMode: document.querySelector("#projectMode"),
  currentTotal: document.querySelector("#currentTotal"),
  currentOriginal: document.querySelector("#currentOriginal"),
  proposedMonthly: document.querySelector("#proposedMonthly"),
  proposedFormula: document.querySelector("#proposedFormula"),
  savingTotal: document.querySelector("#savingTotal"),
  savingRate: document.querySelector("#savingRate"),
  selectedMonthCount: document.querySelector("#selectedMonthCount"),
  selectedMonthLabel: document.querySelector("#selectedMonthLabel"),
  mainChart: document.querySelector("#mainChart"),
  chartTooltip: document.querySelector("#chartTooltip"),
  opsSeats: document.querySelector("#opsSeats"),
  opsSeatValue: document.querySelector("#opsSeatValue"),
  scenarioTotal: document.querySelector("#scenarioTotal"),
  techPeople: document.querySelector("#techPeople"),
  opsPeople: document.querySelector("#opsPeople"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSubtitle: document.querySelector("#detailSubtitle"),
  employeePie: document.querySelector("#employeePie"),
  employeeBreakdown: document.querySelector("#employeeBreakdown"),
  personTitle: document.querySelector("#personTitle"),
  personSubtitle: document.querySelector("#personSubtitle"),
  personDetails: document.querySelector("#personDetails"),
  clearMonthFocus: document.querySelector("#clearMonthFocus"),
  detailRows: document.querySelector("#detailRows"),
  rowCount: document.querySelector("#rowCount"),
  proposalText: document.querySelector("#proposalText"),
  downloadProposal: document.querySelector("#downloadProposal"),
};

const colors = ["#2f6fbb", "#0d8b79", "#c48321", "#b94747", "#7357a8", "#3f7f5f", "#8c6251", "#476b85"];
const BREAKDOWN_LIMIT = 10;

const countryName = { HK: "Hong Kong", MY: "Malaysia" };

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function monthLabel(month) {
  const [year, mon] = month.split("-");
  return `${year}.${mon}`;
}

function monthIndex(month) {
  const [year, mon] = month.split("-").map(Number);
  return year * 12 + mon;
}

function selectedPeriodLabel() {
  const months = [...state.selectedMonths].sort();
  if (!months.length) return "No month selected";
  if (months.length === 1) return monthLabel(months[0]);
  const isContinuous = months.every((month, index) => index === 0 || monthIndex(month) === monthIndex(months[index - 1]) + 1);
  return isContinuous ? `${monthLabel(months[0])} - ${monthLabel(months.at(-1))}` : months.map(monthLabel).join(", ");
}

function detailPeriodLabel() {
  return state.activeMonth ? monthLabel(state.activeMonth) : selectedPeriodLabel();
}

function monthsLabel(months) {
  const sorted = unique(months);
  if (!sorted.length) return "No active months";
  if (sorted.length === 1) return monthLabel(sorted[0]);
  const isContinuous = sorted.every((month, index) => index === 0 || monthIndex(month) === monthIndex(sorted[index - 1]) + 1);
  return isContinuous ? `${monthLabel(sorted[0])} - ${monthLabel(sorted.at(-1))}` : sorted.map(monthLabel).join(", ");
}

function money(value, currency = state.displayCurrency) {
  return `${currency} ${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 ? 2 : 0,
  })}`;
}

function toUsd(value, currency) {
  return value / CONFIG.rates[currency];
}

function fromUsd(value, currency = state.displayCurrency) {
  return value * CONFIG.rates[currency];
}

function rowUsd(row) {
  return toUsd(row.total, row.currency);
}

function rowDisplay(row) {
  return fromUsd(rowUsd(row));
}

function allocationDisplay(row, allocation) {
  return fromUsd(toUsd(allocation.total, row.currency));
}

function proposedMonthlyUsd() {
  return (CONFIG.proposed.techSeats + state.opsSeats) * CONFIG.proposed.pricePerSeatUsd + CONFIG.proposed.extraPoolUsd;
}

function selectedRows() {
  return state.rows.filter((row) => {
    return (
      state.selectedMonths.includes(row.month) &&
      (state.country === "all" || row.countryCode === state.country) &&
      (state.employee === "all" || row.employee === state.employee) &&
      (!state.subscriptions.length || state.subscriptions.includes(row.subscription))
    );
  });
}

function monthRows(month) {
  return selectedRows().filter((row) => row.month === month);
}

function groupRows(rows, keys, valueGetter = rowDisplay) {
  const map = new Map();
  rows.forEach((row) => {
    const id = keys.map((key) => row[key]).join("||");
    if (!map.has(id)) {
      map.set(id, { total: 0 });
      keys.forEach((key) => {
        map.get(id)[key] = row[key];
      });
    }
    map.get(id).total += valueGetter(row);
  });
  return [...map.values()].map((row) => ({ ...row, total: Math.round(row.total * 100) / 100 }));
}

function projectAllocations(rows) {
  return rows.flatMap((row) =>
    (row.projectAllocations || [{ project: "Unassigned", total: row.total }]).map((allocation) => ({
      ...row,
      project: allocation.project,
      allocationTotal: allocation.total,
      displayTotal: allocationDisplay(row, allocation),
    })),
  );
}

function groupProjectAllocations(rows, keys) {
  const map = new Map();
  projectAllocations(rows).forEach((row) => {
    const id = keys.map((key) => row[key]).join("||");
    if (!map.has(id)) {
      map.set(id, { total: 0, employees: new Set(), subscriptions: new Set(), months: new Set() });
      keys.forEach((key) => {
        map.get(id)[key] = row[key];
      });
    }
    const item = map.get(id);
    item.total += row.displayTotal;
    item.employees.add(row.employee);
    item.subscriptions.add(row.subscription);
    item.months.add(row.month);
  });
  return [...map.values()].map((row) => ({
    ...row,
    total: Math.round(row.total * 100) / 100,
    contributorCount: row.employees.size,
    subscriptionCount: row.subscriptions.size,
    monthCount: row.months.size,
  }));
}

function groupAllocationRows(allocationRows, keys) {
  const map = new Map();
  allocationRows.forEach((row) => {
    const id = keys.map((key) => row[key]).join("||");
    if (!map.has(id)) {
      map.set(id, { total: 0 });
      keys.forEach((key) => {
        map.get(id)[key] = row[key];
      });
    }
    map.get(id).total += row.displayTotal;
  });
  return [...map.values()].map((row) => ({ ...row, total: Math.round(row.total * 100) / 100 }));
}

function topWithOthers(grouped, limit = BREAKDOWN_LIMIT) {
  const sorted = [...grouped].sort((a, b) => b.total - a.total);
  if (sorted.length <= limit) return sorted;
  const visible = sorted.slice(0, limit - 1);
  const rest = sorted.slice(limit - 1);
  visible.push({
    [Object.keys(sorted[0]).find((key) => !["total", "contributorCount", "subscriptionCount", "monthCount"].includes(key)) || "name"]: "Others",
    employee: "Others",
    project: "Others",
    subscription: "Others",
    total: Math.round(rest.reduce((sum, row) => sum + row.total, 0) * 100) / 100,
    children: rest,
  });
  return visible;
}

function sumDisplay(rows) {
  return rows.reduce((total, row) => total + rowDisplay(row), 0);
}

function setOptions(select, values, allLabel, current) {
  select.innerHTML = `<option value="all">${allLabel}</option>${values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;
  select.value = values.includes(current) ? current : "all";
  return select.value;
}

function populateFilters() {
  const countryRows = state.rows.filter((row) => state.country === "all" || row.countryCode === state.country);
  state.employee = setOptions(els.employeeFilter, unique(countryRows.map((row) => row.employee)), "All employees", state.employee);
  renderSubscriptionDropdown(unique(countryRows.map((row) => row.subscription)));
}

function subscriptionSummary(values) {
  if (!state.subscriptions.length) {
    return { button: "All subscriptions", selected: "All subscriptions included" };
  }
  const selected = state.subscriptions.filter((subscription) => values.includes(subscription));
  if (selected.length <= 2) {
    return { button: `${selected.length} selected`, selected: selected.join(", ") };
  }
  return {
    button: `${selected.length} selected`,
    selected: `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`,
  };
}

function renderSubscriptionDropdown(values) {
  state.subscriptions = state.subscriptions.filter((subscription) => values.includes(subscription));
  const summary = subscriptionSummary(values);
  const isOpen = els.subscriptionDropdown?.classList.contains("open");
  els.subscriptionDropdown.innerHTML = `
    <button class="multi-select-button" type="button" aria-haspopup="listbox" aria-expanded="${isOpen ? "true" : "false"}">
      <span>${escapeHtml(summary.button)}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <small class="multi-select-summary">${escapeHtml(summary.selected)}</small>
    <div class="multi-select-menu" role="listbox" aria-label="Subscription filter">
      <button class="multi-option ${state.subscriptions.length ? "" : "selected"}" type="button" data-value="all" role="option" aria-selected="${state.subscriptions.length ? "false" : "true"}">
        <input type="checkbox" tabindex="-1" ${state.subscriptions.length ? "" : "checked"} />
        <span>All subscriptions</span>
      </button>
      <div class="multi-option-list">
    ${values
      .map(
        (value) =>
          `<button class="multi-option ${state.subscriptions.includes(value) ? "selected" : ""}" type="button" data-value="${escapeHtml(value)}" role="option" aria-selected="${state.subscriptions.includes(value) ? "true" : "false"}">
            <input type="checkbox" tabindex="-1" ${state.subscriptions.includes(value) ? "checked" : ""} />
            <span>${escapeHtml(value)}</span>
          </button>`,
      )
      .join("")}
      </div>
      <div class="multi-select-actions">
        <button type="button" data-action="clear">Clear</button>
        <button type="button" data-action="apply">Apply</button>
      </div>
    </div>`;

  if (isOpen) els.subscriptionDropdown.classList.add("open");

  els.subscriptionDropdown.querySelector(".multi-select-button").addEventListener("click", (event) => {
    event.stopPropagation();
    els.subscriptionDropdown.classList.toggle("open");
    const expanded = els.subscriptionDropdown.classList.contains("open");
    els.subscriptionDropdown.querySelector(".multi-select-button").setAttribute("aria-expanded", String(expanded));
  });

  els.subscriptionDropdown.querySelectorAll("[data-value]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const value = button.dataset.value;
      if (value === "all") {
        state.subscriptions = [];
      } else {
        const selected = new Set(state.subscriptions);
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
        state.subscriptions = [...selected];
      }
      state.activeEmployee = "";
      state.activeProject = "";
      render();
      els.subscriptionDropdown.classList.add("open");
    });
  });

  els.subscriptionDropdown.querySelector('[data-action="clear"]').addEventListener("click", (event) => {
    event.stopPropagation();
    state.subscriptions = [];
    state.activeEmployee = "";
    state.activeProject = "";
    render();
  });

  els.subscriptionDropdown.querySelector('[data-action="apply"]').addEventListener("click", (event) => {
    event.stopPropagation();
    els.subscriptionDropdown.classList.remove("open");
  });
}

function renderMonthChecks() {
  const months = unique(state.rows.map((row) => row.month));
  els.monthChecks.innerHTML = months
    .map(
      (month) => `
        <label class="month-chip">
          <input type="checkbox" value="${month}" ${state.selectedMonths.includes(month) ? "checked" : ""} />
          <span>${monthLabel(month)}</span>
        </label>`,
    )
    .join("");

  els.monthChecks.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const month = input.value;
      if (input.checked) {
        state.selectedMonths = unique([...state.selectedMonths, month]);
      } else {
        state.selectedMonths = state.selectedMonths.filter((item) => item !== month);
      }
      state.activeMonth = "";
      state.activeEmployee = "";
      state.activeProject = "";
      state.expandedMonth = "";
      render();
    });
  });
}

function renderKpis(rows) {
  const total = sumDisplay(rows);
  const proposedTotal = fromUsd(proposedMonthlyUsd() * state.selectedMonths.length);
  const saving = total - proposedTotal;
  const hk = rows.filter((row) => row.countryCode === "HK").reduce((sum, row) => sum + row.total, 0);
  const my = rows.filter((row) => row.countryCode === "MY").reduce((sum, row) => sum + row.total, 0);
  const savingPct = total > 0 ? (saving / total) * 100 : 0;

  els.currentTotal.textContent = money(total);
  els.currentOriginal.textContent = `${money(hk, "HKD")} + ${money(my, "RM")}`;
  els.proposedMonthly.textContent = money(proposedTotal);
  els.proposedFormula.textContent = `${money(fromUsd(proposedMonthlyUsd()))} monthly x ${state.selectedMonths.length} month${state.selectedMonths.length === 1 ? "" : "s"}`;
  els.savingTotal.textContent = money(saving);
  els.savingTotal.classList.toggle("negative", saving < 0);
  els.savingRate.textContent = `${savingPct.toFixed(1)}% across selected months`;
  els.selectedMonthCount.textContent = state.selectedMonths.length;
  els.selectedMonthLabel.textContent = selectedPeriodLabel();
}

function monthlyTotals(rows) {
  const grouped = new Map();
  state.selectedMonths.forEach((month) => grouped.set(month, 0));
  rows.forEach((row) => grouped.set(row.month, (grouped.get(row.month) || 0) + rowDisplay(row)));
  return [...grouped.entries()].map(([month, total]) => ({ month, total }));
}

function renderMainChart(rows) {
  const data = monthlyTotals(rows);
  if (!data.length) {
    els.mainChart.innerHTML = `<div class="empty">Select at least one month</div>`;
    return;
  }

  const proposed = fromUsd(proposedMonthlyUsd());
  const max = Math.max(...data.map((item) => item.total), state.compareProposed ? proposed : 0, 1);
  const width = 920;
  const height = 380;
  const pad = { top: 20, right: 32, bottom: 64, left: 74 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (index) => pad.left + (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value) => pad.top + innerH - (value / max) * innerH;
  const proposedPoints = data.map((_, index) => `${x(index)},${y(proposed)}`).join(" ");
  const currentPoints = data.map((item, index) => `${x(index)},${y(item.total)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));

  els.mainChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      ${ticks
        .map(
          (tick) => `
            <line class="tick" x1="${pad.left}" x2="${width - pad.right}" y1="${y(tick)}" y2="${y(tick)}"></line>
            <text class="tick-label" x="10" y="${y(tick) + 4}">${money(tick).replace(state.displayCurrency + " ", "")}</text>`,
        )
        .join("")}
      <line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}"></line>
      ${state.compareProposed ? `<polyline points="${proposedPoints}" fill="none" stroke="#c48321" stroke-width="3" stroke-dasharray="9 7" />` : ""}
      <polyline points="${currentPoints}" fill="none" stroke="#2f6fbb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      ${data
        .map((item, index) => {
          const saving = item.total - proposed;
          return `
            <g class="chart-point" data-month="${item.month}" data-x="${x(index)}" data-y="${y(item.total)}" data-current="${item.total}" data-proposed="${proposed}" data-saving="${saving}">
              <circle cx="${x(index)}" cy="${y(item.total)}" r="${state.activeMonth === item.month ? 8 : 6}" fill="#2f6fbb"></circle>
              ${state.compareProposed ? `<circle cx="${x(index)}" cy="${y(proposed)}" r="5" fill="#c48321"></circle>` : ""}
              <text class="tick-label" x="${x(index)}" y="${height - 26}" text-anchor="middle">${monthLabel(item.month)}</text>
            </g>`;
        })
        .join("")}
    </svg>
    <div class="legend">
      <span><i class="swatch" style="background:#2f6fbb"></i>Current total spend</span>
      ${state.compareProposed ? `<span><i class="swatch" style="background:#c48321"></i>Claude Team proposed</span>` : ""}
    </div>`;

  els.mainChart.querySelectorAll(".chart-point").forEach((point) => {
    point.addEventListener("mouseenter", (event) => showTooltip(event, point.dataset));
    point.addEventListener("mousemove", (event) => moveTooltip(event));
    point.addEventListener("mouseleave", hideTooltip);
    point.addEventListener("click", () => {
      state.activeMonth = point.dataset.month;
      state.activeEmployee = "";
      state.expandedMonth = point.dataset.month;
      renderDetails(rows);
      renderTable(rows);
      renderMainChart(rows);
    });
  });
}

function showTooltip(event, data) {
  const current = Number(data.current);
  const proposed = Number(data.proposed);
  const saving = Number(data.saving);
  const savingPct = current > 0 ? (saving / current) * 100 : 0;
  els.chartTooltip.hidden = false;
  els.chartTooltip.innerHTML = `
    <strong>${monthLabel(data.month)}</strong>
    <span>Current: ${money(current)}</span>
    ${state.compareProposed ? `<span>Proposed: ${money(proposed)}</span><span>Saving: ${money(saving)} (${savingPct.toFixed(1)}%)</span>` : ""}
  `;
  moveTooltip(event);
}

function moveTooltip(event) {
  const rect = els.mainChart.getBoundingClientRect();
  els.chartTooltip.style.left = `${event.clientX - rect.left + 14}px`;
  els.chartTooltip.style.top = `${event.clientY - rect.top + 14}px`;
}

function hideTooltip() {
  els.chartTooltip.hidden = true;
}

function renderScenario() {
  document.querySelector("#techSeats").textContent = `${CONFIG.proposed.techSeats} fixed`;
  els.opsSeatValue.textContent = `${state.opsSeats} seats`;
  els.scenarioTotal.textContent = money(fromUsd(proposedMonthlyUsd()));
  els.techPeople.innerHTML = CONFIG.proposed.techPeople.map((name) => `<span>${escapeHtml(name)}</span>`).join("");
  els.opsPeople.innerHTML = CONFIG.proposed.opsPeople
    .map((name, index) => `<span class="${index < state.opsSeats ? "active" : ""}">${escapeHtml(name)}</span>`)
    .join("");
}

function renderPie(target, rows, key) {
  const grouped = topWithOthers(key === "project" ? groupProjectAllocations(rows, [key]) : groupRows(rows, [key]));
  const total = grouped.reduce((sum, row) => sum + row.total, 0);
  if (!total) {
    target.innerHTML = `<div class="empty small">No data</div>`;
    return;
  }
  let cursor = 0;
  const gradient = grouped
    .map((row, index) => {
      const start = cursor;
      const end = cursor + (row.total / total) * 100;
      cursor = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  target.innerHTML = `
    <div class="pie" style="background: conic-gradient(${gradient})"></div>
    <div class="pie-legend">
      ${grouped
        .map(
          (row, index) => `
          <button type="button" data-value="${escapeHtml(row[key])}">
            <i style="background:${colors[index % colors.length]}"></i>
            <span>${escapeHtml(row[key])}</span>
            <strong>${((row.total / total) * 100).toFixed(1)}%</strong>
          </button>`,
        )
        .join("")}
    </div>`;

  target.querySelectorAll("button[data-value]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.analysisMode === "project") {
        state.activeProject = button.dataset.value;
        renderProjectDetails(state.activeMonth ? monthRows(state.activeMonth) : selectedRows());
      } else {
        state.activeEmployee = button.dataset.value;
        renderPersonDetails(state.activeMonth ? monthRows(state.activeMonth) : selectedRows());
      }
    });
  });
}

function renderBreakdown(target, rows, key, onClick) {
  const grouped = topWithOthers(key === "project" ? groupProjectAllocations(rows, [key]) : groupRows(rows, [key]));
  const max = Math.max(...grouped.map((row) => row.total), 1);
  if (!grouped.length) {
    target.innerHTML = `<div class="empty small">No data</div>`;
    return;
  }
  target.innerHTML = grouped
    .map(
      (row, index) => `
      <button class="bar-row clickable" type="button" data-value="${escapeHtml(row[key])}">
        <span class="bar-label" title="${escapeHtml(row[key])}">${escapeHtml(row[key])}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.max((row.total / max) * 100, 3)}%; background:${colors[index % colors.length]}"></span></span>
        <span class="bar-value">${money(row.total)}</span>
      </button>`,
    )
    .join("");
  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      onClick(button.dataset.value);
    });
  });
}

function renderDetails(rows = selectedRows()) {
  const scopedRows = state.activeMonth ? rows.filter((row) => row.month === state.activeMonth) : rows;
  const scopedMonths = unique(scopedRows.map((row) => row.month));
  const proposed = fromUsd(proposedMonthlyUsd() * Math.max(scopedMonths.length, 1));
  const subject = state.analysisMode === "project" ? "Project Cost Share" : "Employee Cost Share";
  els.detailTitle.textContent = state.activeMonth ? `${monthLabel(state.activeMonth)} ${subject}` : `Selected Period ${subject}`;
  els.detailSubtitle.textContent = scopedRows.length
    ? `Period: ${detailPeriodLabel()} · Current: ${money(sumDisplay(scopedRows))} · Proposed: ${money(proposed)}`
    : "No data for the selected period";
  els.clearMonthFocus.hidden = !state.activeMonth;
  if (state.analysisMode === "project") {
    renderPie(els.employeePie, scopedRows, "project");
    renderBreakdown(els.employeeBreakdown, scopedRows, "project", (project) => {
      state.activeProject = project;
      renderProjectDetails(scopedRows);
    });
    renderProjectDetails(scopedRows);
  } else {
    renderPie(els.employeePie, scopedRows, "employee");
    renderBreakdown(els.employeeBreakdown, scopedRows, "employee", (employee) => {
      state.activeEmployee = employee;
      renderPersonDetails(scopedRows);
    });
    renderPersonDetails(scopedRows);
  }
}

function renderPersonDetails(scopedRows) {
  const employeeRows = groupRows(scopedRows, ["employee"]).sort((a, b) => b.total - a.total);
  const displayedEmployeeRows = topWithOthers(employeeRows);
  const requestedEmployee = state.activeEmployee;
  const hasRealEmployee = employeeRows.some((row) => row.employee === requestedEmployee);
  const hasDisplayedEmployee = displayedEmployeeRows.some((row) => row.employee === requestedEmployee);
  const employee = hasRealEmployee || hasDisplayedEmployee ? requestedEmployee : requestedEmployee ? "" : employeeRows[0]?.employee || "";
  state.activeEmployee = employee;
  if (!employee) {
    els.personTitle.textContent = "Employee Subscription Details";
    els.personSubtitle.textContent = requestedEmployee
      ? "This employee is not available under the current filters"
      : "No employee data in the selected period";
    els.personDetails.innerHTML = `<div class="empty small">Selection no longer available. Please choose another employee from the chart.</div>`;
    return;
  }

  if (employee === "Others") {
    const others = displayedEmployeeRows.find((row) => row.employee === "Others");
    const children = others?.children || [];
    if (!others) {
      els.personTitle.textContent = "Other Employee Breakdown";
      els.personSubtitle.textContent = "No grouped employees under the current filters";
      els.personDetails.innerHTML = `<div class="empty small">Others is not available for the current selection.</div>`;
      return;
    }
    els.personTitle.textContent = `Other Employee Breakdown · ${children.length} employees`;
    els.personSubtitle.textContent = `Grouped for readability · Total ${money(others?.total || 0)}`;
    els.personDetails.innerHTML = `
      <div class="detail-card-list">
        <h3>Other Employee Breakdown</h3>
        ${children
          .map(
            (row) => `
          <button class="detail-action" type="button" data-employee="${escapeHtml(row.employee)}">
            <span>${escapeHtml(row.employee)}</span>
            <strong>${money(row.total)}</strong>
          </button>`,
          )
          .join("")}
      </div>
      <p class="placeholder-note">Others is a visualization grouping only. Click an employee above to open the normal employee detail view.</p>`;
    els.personDetails.querySelectorAll("[data-employee]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeEmployee = button.dataset.employee;
        renderPersonDetails(scopedRows);
      });
    });
    return;
  }

  const personRows = scopedRows.filter((row) => row.employee === employee);
  const subscriptionRows = groupRows(personRows, ["subscription"]).sort((a, b) => b.total - a.total);
  const projectRows = groupProjectAllocations(personRows, ["project"]).sort((a, b) => b.total - a.total);
  const current = sumDisplay(personRows);
  const monthCount = Math.max(unique(personRows.map((row) => row.month)).length, 1);
  const proposed = fromUsd(CONFIG.proposed.pricePerSeatUsd * monthCount);
  const saving = current - proposed;
  const activeMonths = unique(personRows.map((row) => row.month));
  els.personTitle.textContent = `${employee} · Active months: ${monthsLabel(activeMonths)}`;
  els.personSubtitle.textContent = `Current ${money(current)} / Proposed seat ${money(proposed)} / Saving ${money(saving)}`;
  els.personDetails.innerHTML = `
    <div class="person-summary">
      <div><span>Current</span><strong>${money(current)}</strong></div>
      <div><span>Claude seat</span><strong>${money(proposed)}</strong></div>
      <div><span>Saving</span><strong class="${saving < 0 ? "negative" : ""}">${money(saving)}</strong></div>
    </div>
    <div class="detail-card-list">
      <h3>Subscriptions</h3>
      ${subscriptionRows
        .map(
          (row) => `
        <div>
          <span>${escapeHtml(row.subscription)}</span>
          <strong>${money(row.total)}</strong>
        </div>`,
        )
        .join("")}
    </div>
    <div class="detail-card-list">
      <h3>Project allocation</h3>
      ${projectRows
        .map(
          (row) => `
        <div>
          <span>${escapeHtml(row.project)}</span>
          <strong>${money(row.total)}</strong>
        </div>`,
        )
        .join("")}
    </div>
    <p class="placeholder-note">The spreadsheet now supports project cost allocation. Claude admin usage exports can later add token usage, active users, and project usage reports.</p>`;
}

function renderProjectDetails(scopedRows) {
  const projectRows = groupProjectAllocations(scopedRows, ["project"]).sort((a, b) => b.total - a.total);
  const displayedProjectRows = topWithOthers(projectRows);
  const requestedProject = state.activeProject;
  const hasRealProject = projectRows.some((row) => row.project === requestedProject);
  const hasDisplayedProject = displayedProjectRows.some((row) => row.project === requestedProject);
  const project = hasRealProject || hasDisplayedProject ? requestedProject : requestedProject ? "" : projectRows[0]?.project || "";
  state.activeProject = project;
  if (!project) {
    els.personTitle.textContent = "Project Usage Details";
    els.personSubtitle.textContent = requestedProject
      ? "This project is not available under the current filters"
      : "No project data in the selected period";
    els.personDetails.innerHTML = `<div class="empty small">Selection no longer available. Please choose another project from the chart.</div>`;
    return;
  }

  if (project === "Others") {
    const others = displayedProjectRows.find((row) => row.project === "Others");
    const children = others?.children || [];
    if (!others) {
      els.personTitle.textContent = "Other Project Breakdown";
      els.personSubtitle.textContent = "No grouped projects under the current filters";
      els.personDetails.innerHTML = `<div class="empty small">Others is not available for the current selection.</div>`;
      return;
    }
    els.personTitle.textContent = `Other Project Breakdown · ${children.length} projects`;
    els.personSubtitle.textContent = `Grouped for readability · Total ${money(others?.total || 0)}`;
    els.personDetails.innerHTML = `
      <div class="detail-card-list">
        <h3>Other Project Breakdown</h3>
        ${children
          .map(
            (row) => `
          <button class="detail-action" type="button" data-project="${escapeHtml(row.project)}">
            <span>${escapeHtml(row.project)}</span>
            <strong>${money(row.total)}</strong>
          </button>`,
          )
          .join("")}
      </div>
      <p class="placeholder-note">Others is a visualization grouping only. Click a project above to open the normal project detail view.</p>`;
    els.personDetails.querySelectorAll("[data-project]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeProject = button.dataset.project;
        renderProjectDetails(scopedRows);
      });
    });
    return;
  }

  const allocations = projectAllocations(scopedRows).filter((row) => row.project === project);
  const current = allocations.reduce((total, row) => total + row.displayTotal, 0);
  const activeMonths = unique(allocations.map((row) => row.month));
  const activeScopedRows = scopedRows.filter((row) => activeMonths.includes(row.month));
  const allProjects = groupProjectAllocations(activeScopedRows, ["project"]);
  const allProjectTotal = allProjects.reduce((total, row) => total + row.total, 0);
  const scopedMonthCount = Math.max(activeMonths.length, 1);
  const proposedForPeriod = fromUsd(proposedMonthlyUsd() * scopedMonthCount);
  const allocatedProposed = allProjectTotal > 0 ? proposedForPeriod * (current / allProjectTotal) : 0;
  const saving = current - allocatedProposed;
  const employees = groupAllocationRows(allocations, ["employee"]).sort((a, b) => b.total - a.total);
  const subscriptions = groupAllocationRows(allocations, ["subscription"]).sort((a, b) => b.total - a.total);
  const contributorCount = unique(allocations.map((row) => row.employee)).length;
  const costPerContributor = contributorCount ? current / contributorCount : 0;

  els.personTitle.textContent = `${project} · Active months: ${monthsLabel(activeMonths)}`;
  els.personSubtitle.textContent = `Current ${money(current)} / Allocated proposed ${money(allocatedProposed)} / Saving ${money(saving)}`;
  const projectInsight =
    project === "VIO + Mini APP"
      ? `<div class="insight-card">
          <h3>Cost Driver Explanation</h3>
          <p>VIO + Mini APP has the highest AI-related cost because many contributors supporting this project are not core tech team members. As a result, they rely more heavily on AI tools for coding support, troubleshooting, documentation, and task execution. The higher AI spend is therefore not only a subscription cost issue, but also an indicator that this project requires stronger AI-assisted support and clearer resource monitoring.</p>
        </div>`
      : "";
  els.personDetails.innerHTML = `
    <div class="person-summary metric-cards">
      <div><span>Cost by project</span><strong>${money(current)}</strong></div>
      <div><span>Savings by project</span><strong class="${saving < 0 ? "negative" : ""}">${money(saving)}</strong></div>
      <div><span>Cost per contributor</span><strong>${money(costPerContributor)}</strong></div>
    </div>
    ${projectInsight}
    <div class="detail-card-list">
      <h3>Contributors</h3>
      ${employees
        .map(
          (row) => `
        <div>
          <span>${escapeHtml(row.employee)}</span>
          <strong>${money(row.total)}</strong>
        </div>`,
        )
        .join("")}
    </div>
    <div class="detail-card-list">
      <h3>Subscriptions used</h3>
      ${subscriptions
        .map(
          (row) => `
        <div>
          <span>${escapeHtml(row.subscription)}</span>
          <strong>${money(row.total)}</strong>
        </div>`,
        )
        .join("")}
    </div>
    <p class="placeholder-note">Allocated proposed cost is based on this project's share of current spend, so total project savings ties back to the overall savings line.</p>`;
}

function renderTable(rows) {
  const monthly = monthlyTotals(rows);
  els.rowCount.textContent = `${monthly.length} months`;
  els.detailRows.innerHTML = monthly
    .map((monthRow) => {
      const rowsForMonth = rows.filter((row) => row.month === monthRow.month);
      const proposed = fromUsd(proposedMonthlyUsd());
      const saving = monthRow.total - proposed;
      const rate = monthRow.total > 0 ? (saving / monthRow.total) * 100 : 0;
      const isExpanded = state.expandedMonth === monthRow.month;
      return `
        <tr class="summary-row">
          <td>${monthLabel(monthRow.month)}</td>
          <td class="amount">${money(monthRow.total)}</td>
          <td class="amount">${money(proposed)}</td>
          <td class="amount ${saving < 0 ? "negative" : ""}">${money(saving)}</td>
          <td>${rate.toFixed(1)}%</td>
          <td><button class="details-button" type="button" data-month="${monthRow.month}">${isExpanded ? "Hide details" : "Details"}</button></td>
        </tr>
        ${isExpanded ? renderMonthDetailRows(rowsForMonth) : ""}`;
    })
    .join("");

  els.detailRows.querySelectorAll("button[data-month]").forEach((button) => {
    button.addEventListener("click", () => {
      const month = button.dataset.month;
      state.expandedMonth = state.expandedMonth === month ? "" : month;
      state.activeMonth = month;
      state.activeEmployee = "";
      render();
    });
  });
}

function renderMonthDetailRows(rowsForMonth) {
  const employees = groupRows(rowsForMonth, ["employee"])
    .sort((a, b) => b.total - a.total)
    .map((employeeRow) => {
      const personRows = rowsForMonth.filter((row) => row.employee === employeeRow.employee);
      const subscriptions = unique(personRows.map((row) => row.subscription)).join(", ");
      const countries = unique(personRows.map((row) => countryName[row.countryCode])).join(", ");
      const original = personRows.map((row) => money(row.total, row.currency)).join(" + ");
      const projects = unique(personRows.flatMap((row) => row.projects || ["Unassigned"])).join(", ");
      return `
        <tr class="detail-row">
          <td></td>
          <td colspan="2">
            <strong>${escapeHtml(employeeRow.employee)}</strong>
            <small class="meta-lines"><span><b>Location:</b> ${escapeHtml(countries)}</span><span><b>Subscriptions:</b> ${escapeHtml(subscriptions)}</span><span><b>Projects:</b> ${escapeHtml(projects)}</span></small>
          </td>
          <td class="amount">${escapeHtml(original)}</td>
          <td class="amount">${money(employeeRow.total)}</td>
          <td>${escapeHtml(personRows.map((row) => row.remark || row.supportUser || "").filter(Boolean).join("; "))}</td>
        </tr>`;
    })
    .join("");
  return `<tr class="detail-header"><td></td><td colspan="5">Employee and subscription details</td></tr>${employees}`;
}

function proposalDefaults(rows = selectedRows()) {
  const total = sumDisplay(rows);
  const proposed = fromUsd(proposedMonthlyUsd() * state.selectedMonths.length);
  const saving = total - proposed;
  const savingPct = total > 0 ? (saving / total) * 100 : 0;
  return `
<h2>Proposal: Move AI Subscriptions to Claude Team Centralized Billing</h2>
<h3>1. Current shortage</h3>
<p>Current AI subscription spending is fragmented across employees, tools, and billing methods. Management can see reimbursement cost, but it is difficult to monitor each person's project focus, identify which projects consume the most budget, recover accounts when employees leave, or prepare recurring reports without manual spreadsheet consolidation.</p>
<h3>2. Proposed solution</h3>
<p>Move AI subscriptions to Claude Team Standard with centralized billing. The proposed model uses fixed tech team seats, adjustable operation seats, and a fixed monthly extra usage pool so the company can manage cost and capacity from one place.</p>
<h3>3. Why tech team accounts should not be shared</h3>
<p>Shared accounts are not recommended for the tech team. Their token demand is already high, and Claude usage limits refresh every 5 hours. Sharing seats would create unstable availability for technical work and make it unclear who used tokens for which project.</p>
<p>Individual tech seats make usage measurable by person, helping management understand workload, project focus, and contribution. Centralized billing still lets the company monitor the overall pool and shift extra usage to higher-demand users, reducing waste compared with standalone USD 20 subscriptions that may be underused by some users while others run out of capacity.</p>
<h3>4. Expected Return</h3>
<p>For the selected period (${selectedPeriodLabel()}), current spend is <strong>${money(total)}</strong>, proposed Claude Team cost is <strong>${money(proposed)}</strong>, and estimated variance is <strong>${money(saving)}</strong> (${savingPct.toFixed(1)}%).</p>
<p>Although direct subscription savings are limited, centralized billing provides operational visibility and resource management capabilities that are not available under the current reimbursement model.</p>
<h3>5. Future ROI Measurement Framework</h3>
<p>The current dashboard already provides visibility into AI spending through metrics such as monthly cost, cost by employee, cost by project, and cost per contributor.</p>
<p>Once Claude Team usage exports become available, these reports can be extended to include AI usage by employee and project, project-level cost allocation, workload visibility, and budget accountability.</p>
<p>Over time, this framework can support project ROI analysis by linking AI usage, manpower investment, infrastructure cost, project duration, and business outcomes. This allows management to evaluate not only how much is spent on AI, but also how effectively resources are allocated across projects and teams.</p>`;
}

function renderProposalDefaults() {
  if (!els.proposalText || els.proposalText.dataset.touched === "true") return;
  els.proposalText.innerHTML = proposalDefaults();
}

function proposalSectionHtml(id, title, selector) {
  const node = document.querySelector(selector);
  if (!node) return "";
  return `<section class="proposal-visual" data-visual="${id}"><h2>${escapeHtml(title)}</h2>${node.outerHTML}</section>`;
}

function embeddedStyles() {
  return [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
}

function downloadProposal() {
  const selected = new Set([...document.querySelectorAll(".visual-options input:checked")].map((input) => input.value));
  const visuals = [
    selected.has("trend") ? proposalSectionHtml("trend", "Current Spend vs Claude Team", ".chart-panel") : "",
    selected.has("seat") ? proposalSectionHtml("seat", "Seat Scenario", ".scenario-panel") : "",
    selected.has("breakdown") ? proposalSectionHtml("breakdown", "Selected Breakdown", ".grid.two") : "",
    selected.has("monthly") ? proposalSectionHtml("monthly", "Monthly Cost Summary", ".table-panel") : "",
    selected.has("recommendation") ? proposalSectionHtml("recommendation", "Recommendation and Return Measurement", ".plan-comparison") : "",
  ].join("");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Claude Team Proposal</title>
  <style>${embeddedStyles()}</style>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#17202a;line-height:1.45}
    h1{font-size:30px;margin-bottom:8px} h2{font-size:22px;margin-top:28px} h3{font-size:16px;margin-top:18px}
    .proposal-text{border:1px solid #dbe3ea;border-radius:8px;padding:18px;background:#fff}
    .proposal-visual{margin-top:24px;border:1px solid #dbe3ea;border-radius:8px;padding:16px;break-inside:avoid;background:#fff}
    .proposal-visual button,.proposal-visual input,.proposal-visual select{pointer-events:none}
    .chart-tooltip{display:none}
    @media print{body{margin:18mm}.proposal-visual{box-shadow:none}}
  </style>
</head>
<body>
  <h1>Claude Team Subscription Proposal</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()} · <strong>Period:</strong> ${selectedPeriodLabel()} · <strong>Currency:</strong> ${state.displayCurrency}</p>
  <div class="proposal-text" contenteditable="true">${els.proposalText.innerHTML}</div>
  ${visuals}
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `claude-team-proposal-${new Date().toISOString().slice(0, 10)}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function render() {
  populateFilters();
  const rows = selectedRows();
  renderMonthChecks();
  renderScenario();
  renderKpis(rows);
  renderMainChart(rows);
  renderDetails(rows);
  renderTable(rows);
  renderProposalDefaults();
}

function bindControls() {
  els.currencySelect.addEventListener("change", () => {
    state.displayCurrency = els.currencySelect.value;
    render();
  });
  els.countryFilter.addEventListener("change", () => {
    state.country = els.countryFilter.value;
    render();
  });
  els.employeeFilter.addEventListener("change", () => {
    state.employee = els.employeeFilter.value;
    render();
  });
  els.compareToggle.addEventListener("change", () => {
    state.compareProposed = els.compareToggle.checked;
    render();
  });
  els.employeeMode.addEventListener("click", () => {
    state.analysisMode = "employee";
    state.activeProject = "";
    els.employeeMode.classList.add("active");
    els.projectMode.classList.remove("active");
    render();
  });
  els.projectMode.addEventListener("click", () => {
    state.analysisMode = "project";
    state.activeEmployee = "";
    els.projectMode.classList.add("active");
    els.employeeMode.classList.remove("active");
    render();
  });
  els.clearMonthFocus.addEventListener("click", () => {
    state.activeMonth = "";
    state.activeEmployee = "";
    state.expandedMonth = "";
    render();
  });
  els.opsSeats.addEventListener("input", () => {
    state.opsSeats = Number(els.opsSeats.value);
    render();
  });
  els.selectAllMonths.addEventListener("click", () => {
    state.selectedMonths = unique(state.rows.map((row) => row.month));
    state.activeMonth = "";
    state.expandedMonth = "";
    render();
  });
  els.proposalText?.addEventListener("input", () => {
    els.proposalText.dataset.touched = "true";
  });
  els.downloadProposal?.addEventListener("click", downloadProposal);
  document.addEventListener("click", (event) => {
    if (!els.subscriptionDropdown?.contains(event.target)) {
      els.subscriptionDropdown?.classList.remove("open");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") els.subscriptionDropdown?.classList.remove("open");
  });
}

async function init() {
  const data = window.DASHBOARD_DATA || (await (await fetch("./data/dashboard-data.json")).json());
  state.rows = data.rows;
  const months = unique(state.rows.map((row) => row.month));
  state.selectedMonths = months.slice(-4);
  state.activeMonth = "";
  els.sourceMeta.textContent = `Source: ${data.sourceFile.split("/").pop()} · Updated ${new Date(data.generatedAt).toLocaleString()}`;
  bindControls();
  render();
}

init().catch((error) => {
  document.body.innerHTML = `<main><section class="panel"><h2>Data failed to load</h2><p>${escapeHtml(error.message)}</p></section></main>`;
});
