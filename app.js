// ════════════════════════════
//  Init
// ════════════════════════════
let editingCalendarEventId = null;
let _detailPersonId = null;
const SELECTED_CALENDAR_STORAGE_KEY = "selected_calendar_id";
let editModalComp = null;
let calendarEventModalComp = null;
let csvModalComp = null;
let addUnmatchedModalComp = null;
let matchModalComp = null;
let unmatchedListModalComp = null;
let invalidStatusListModalComp = null;
let fixInvalidStatusModalComp = null;
let personDetailModalComp = null;
let pauseReminderModalComp = null;
let invoicePreviewModalComp = null;
let pauseReminderQueue = [];
let currentPauseReminderGroup = null;

document.addEventListener("DOMContentLoaded", () => {
  const _weekday = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(YEAR, MONTH - 1, DAY).getDay()
  ];
  document.getElementById("headerDate").textContent =
    `${YEAR}년 ${MONTH}월 ${DAY}일 (${_weekday})`;
  updateMonthHeader();

  // ── Static buttons ──
  document
    .getElementById("btn-overlay-open")
    .addEventListener("click", openFile);
  document
    .getElementById("btn-overlay-new")
    .addEventListener("click", createNewFile);
  document
    .getElementById("btn-header-open")
    .addEventListener("click", openFile);
  document
    .getElementById("btn-header-save")
    .addEventListener("click", saveFile);
  document
    .getElementById("btn-auth")
    .addEventListener("click", handleAuthClick);
  document
    .getElementById("btn-refresh")
    .addEventListener("click", refreshCalendar);
  document
    .getElementById("btn-month-prev")
    .addEventListener("click", prevMonthView);
  document
    .getElementById("btn-month-next")
    .addEventListener("click", nextMonthView);
  document.getElementById("btn-add-event").addEventListener("click", () => {
    closeCalendarActionsMenu();
    openCalendarEventModal();
  });
  document.getElementById("btn-change-cal").addEventListener("click", () => {
    closeCalendarActionsMenu();
    showCalendarSelector();
  });
  document.getElementById("btn-signout").addEventListener("click", () => {
    closeCalendarActionsMenu();
    handleSignoutClick();
  });
  document
    .getElementById("btn-calendar-menu")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCalendarActionsMenu();
    });
  document
    .getElementById("btn-select-all-cal")
    .addEventListener("click", selectAllCalendar);
  document
    .getElementById("btn-deselect-all-cal")
    .addEventListener("click", deselectAllCalendar);
  document
    .getElementById("btn-preview-invoices")
    .addEventListener("click", openInvoicePreviewModal);
  document
    .getElementById("btn-print-invoices")
    .addEventListener("click", printInvoices);
  document
    .getElementById("btn-add-person")
    .addEventListener("click", openAddPersonModal);
  document
    .getElementById("btn-import-update")
    .addEventListener("click", importUpdate);
  document
    .getElementById("btn-import-skip")
    .addEventListener("click", importSkip);
  document
    .getElementById("btn-close-csv")
    .addEventListener("click", closeCsvModal);
  document
    .getElementById("btn-close-edit")
    .addEventListener("click", closeEditModal);
  document.getElementById("btn-save-edit").addEventListener("click", saveEdit);
  document
    .getElementById("editClientGroup")
    .addEventListener("change", updateEditFormVisibility);
  document
    .getElementById("editActive")
    .addEventListener("change", updateEditFormVisibility);
  document
    .getElementById("editPauseStart")
    .addEventListener("change", updatePauseEndFromWeeks);
  document
    .getElementById("editPauseWeeks")
    .addEventListener("change", updatePauseEndFromWeeks);
  ["editName", "editPrice"].forEach((id) => {
    document.getElementById(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveEdit();
    });
  });
  document.getElementById("btn-open-keyword-modal").addEventListener("click", () => {
    renderExcludedKeywords();
    document.getElementById("keywordModal").classList.add("show");
    document.getElementById("excludedKeywordInput").focus();
  });
  document.getElementById("btn-close-keyword-modal").addEventListener("click", () => {
    document.getElementById("keywordModal").classList.remove("show");
  });
  document.getElementById("keywordModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("show");
  });
  document
    .getElementById("btn-add-excluded-keyword")
    .addEventListener("click", addExcludedKeyword);
  document
    .getElementById("excludedKeywordInput")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) addExcludedKeyword();
    });
  document
    .getElementById("excludedKeywordList")
    .addEventListener("click", (e) => {
      const el = e.target.closest("[data-action='remove-excluded-keyword']");
      if (!el) return;
      removeExcludedKeyword(Number(el.dataset.idx));
    });
  document
    .getElementById("btn-close-cal-event")
    .addEventListener("click", closeCalendarEventModal);
  document
    .getElementById("btn-save-cal-event")
    .addEventListener("click", saveCalendarEvent);
  document
    .getElementById("btn-open-add-unmatched-from-cal")
    .addEventListener("click", openAddUnmatchedFromCalendarEvent);
  document
    .getElementById("btn-close-add-unmatched")
    .addEventListener("click", closeAddUnmatchedModal);
  document
    .getElementById("btn-save-add-unmatched")
    .addEventListener("click", saveAddUnmatched);
  document
    .getElementById("btn-close-match")
    .addEventListener("click", closeMatchModal);
  document
    .getElementById("btn-save-match")
    .addEventListener("click", saveMatch);
  document
    .getElementById("btn-payment-prev")
    .addEventListener("click", prevPaymentMonth);
  document
    .getElementById("btn-payment-next")
    .addEventListener("click", nextPaymentMonth);
  document
    .getElementById("btn-unmatched-summary")
    .addEventListener("click", openUnmatchedModal);
  document
    .getElementById("btn-invalid-status-summary")
    .addEventListener("click", openInvalidStatusModal);
  document
    .getElementById("btn-close-unmatched-modal")
    .addEventListener("click", closeUnmatchedModal);
  document
    .getElementById("btn-close-invalid-status-modal")
    .addEventListener("click", closeInvalidStatusModal);
  document
    .getElementById("btn-close-invoice-preview")
    .addEventListener("click", closeInvoicePreviewModal);
  document
    .getElementById("btn-close-pause-reminder")
    .addEventListener("click", closePauseReminderModal);
  document
    .getElementById("btn-confirm-pause-reminder")
    .addEventListener("click", confirmPauseReminder);
  document
    .getElementById("btn-dismiss-pause-reminder")
    .addEventListener("click", dismissCurrentPauseReminder);
  document
    .getElementById("btn-close-fix-invalid-status")
    .addEventListener("click", closeFixInvalidStatusModal);
  document
    .getElementById("btn-save-fix-invalid-status")
    .addEventListener("click", saveFixInvalidStatus);
  document
    .getElementById("btn-close-person-detail")
    .addEventListener("click", closePersonDetail);
  document
    .querySelector("#personDetailModal .detail-body")
    .addEventListener("click", (e) => {
      const el = e.target.closest('[data-action="cancel-pause-period"]');
      if (el) {
        cancelPausePeriod(el.dataset.personId, el.dataset.periodId);
        return;
      }
      const memoAction = e.target.closest("[data-memo-action]");
      if (!memoAction) return;
      if (memoAction.dataset.memoAction === "edit") startDetailMemoEdit();
      if (memoAction.dataset.memoAction === "cancel") cancelDetailMemoEdit();
      if (memoAction.dataset.memoAction === "save") saveDetailMemo();
    });
  document
    .getElementById("btn-delete-from-detail")
    .addEventListener("click", () => {
      if (!_detailPersonId) return;
      const id = _detailPersonId;
      closePersonDetail();
      deletePerson(id);
    });
  document
    .getElementById("btn-edit-from-detail")
    .addEventListener("click", () => {
      if (!_detailPersonId) return;
      const id = _detailPersonId;
      closePersonDetail();
      openEditModal(id);
    });
  document
    .getElementById("unmatchedModalList")
    .addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const { action, idx } = el.dataset;
      if (action === "add-unmatched") openAddUnmatchedModal(Number(idx));
      if (action === "open-match") openMatchModal(Number(idx));
    });
  document
    .getElementById("invalidStatusModalList")
    .addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const { action, idx } = el.dataset;
      if (action === "fix-invalid-status")
        openFixInvalidStatusModal(Number(idx));
    });

  // ── Tabs ──
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // ── Drop zone ──
  const dropZone = document.getElementById("dropZone");
  const csvInput = document.getElementById("csvInput");
  if (dropZone && csvInput) {
    dropZone.addEventListener("click", () => csvInput.click());
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () =>
      dropZone.classList.remove("dragover"),
    );
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const f = e.dataTransfer.files[0];
      if (f) processCSV(f);
    });
    csvInput.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) processCSV(f);
      e.target.value = "";
    });
  }

  // ── Modal init (backdrop + ESC + close hooks) ──
  initModal({
    id: "csvModal",
    onClose: () => {
      pendingCSV = [];
    },
  });
  initModal({
    id: "editModal",
    onClose: () => {
      editingId = null;
    },
  });
  initModal({
    id: "calendarEventModal",
    onClose: () => {
      editingCalendarEventId = null;
    },
  });
  initModal({
    id: "addUnmatchedModal",
    onClose: () => {
      addingUnmatchedIdx = -1;
    },
  });
  initModal({
    id: "matchModal",
    onClose: () => {
      matchingUnmatchedIdx = -1;
    },
  });
  initModal({ id: "unmatchedListModal" });
  initModal({
    id: "personDetailModal",
    onClose: () => {
      _detailPersonId = null;
    },
  });
  initModal({ id: "invalidStatusListModal" });
  initModal({
    id: "fixInvalidStatusModal",
    onClose: () => {
      fixingInvalidStatusIdx = -1;
    },
  });
  initModal({ id: "invoicePreviewModal" });
  initModal({
    id: "pauseReminderModal",
    onClose: () => {
      currentPauseReminderGroup = null;
    },
  });
  editModalComp = createModalComponent({
    id: "editModal",
    selectors: { title: "#editModalTitle" },
  });
  calendarEventModalComp = createModalComponent({
    id: "calendarEventModal",
    selectors: { title: "#calendarEventModalTitle" },
  });
  csvModalComp = createModalComponent({ id: "csvModal" });
  addUnmatchedModalComp = createModalComponent({ id: "addUnmatchedModal" });
  matchModalComp = createModalComponent({ id: "matchModal" });
  unmatchedListModalComp = createModalComponent({ id: "unmatchedListModal" });
  invalidStatusListModalComp = createModalComponent({
    id: "invalidStatusListModal",
  });
  fixInvalidStatusModalComp = createModalComponent({
    id: "fixInvalidStatusModal",
  });
  personDetailModalComp = createModalComponent({
    id: "personDetailModal",
    selectors: { title: ".detail-name", body: ".detail-body" },
  });
  pauseReminderModalComp = createModalComponent({
    id: "pauseReminderModal",
    selectors: { body: "#pauseReminderBody" },
  });
  invoicePreviewModalComp = createModalComponent({ id: "invoicePreviewModal" });

  // ── Event delegation: groupFilterTabs ──
  document.getElementById("groupFilterTabs").addEventListener("click", (e) => {
    const el = e.target.closest('[data-action="filter-client-group"]');
    if (!el) return;
    clientGroupFilter = el.dataset.group;
    renderGroupFilterTabs();
    renderDataTable();
  });

  // ── Event delegation: billingGroupTabs ──
  document.getElementById("billingGroupTabs").addEventListener("click", (e) => {
    const el = e.target.closest('[data-action="filter-billing-group"]');
    if (!el) return;
    billingGroupFilter = el.dataset.group;
    renderPeopleList();
  });

  // ── Event delegation: dataTableBody ──
  const dataTableBody = document.getElementById("dataTableBody");
  dataTableBody.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (el) {
      const { action, id, name } = el.dataset;
      if (action === "edit") openEditModal(id);
      if (action === "delete") deletePerson(id);
      if (action === "add-searched-person") openAddPersonWithName(name);
      return;
    }
    const row = e.target.closest("tr[data-id]");
    if (row) openPersonDetail(row.dataset.id);
  });
  // ── Event delegation: peopleList ──
  const peopleList = document.getElementById("peopleList");
  peopleList.addEventListener("change", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, id } = el.dataset;
    if (action === "toggle-person") togglePerson(id, el.checked);
    if (action === "toggle-calendar-person")
      toggleCalendarPerson(id, el.checked);
  });

  // ── Event delegation: calendarGrid ──
  document.getElementById("calendarGrid").addEventListener("click", (e) => {
    const el = e.target.closest('[data-action="edit-cal-event"]');
    if (!el) return;
    e.stopPropagation();
    openCalendarEventModal({
      eventId: el.dataset.eventId,
      baseName: el.dataset.baseName || "",
      eventStatus: el.dataset.eventStatus || "",
      date: el.dataset.date || "",
      time: el.dataset.time || "10:00",
    });
  });

  // ── Event delegation: calendar-selector ──
  document
    .getElementById("calendar-selector")
    .addEventListener("click", (e) => {
      const el = e.target.closest('[data-action="select-calendar"]');
      if (!el) return;
      selectCalendar(Number(el.dataset.idx));
    });

  // ── Event delegation: historyContent ──
  document.getElementById("historyContent").addEventListener("click", (e) => {
    const del = e.target.closest('[data-action="delete-history"]');
    if (del) {
      deleteHistory(del.dataset.id);
      return;
    }
    const reissue = e.target.closest('[data-action="reissue-history"]');
    if (reissue) reissueHistory(reissue.dataset.id);
  });

  // ── Event delegation: paymentContent ──
  document.getElementById("paymentContent").addEventListener("change", (e) => {
    const el = e.target.closest('[data-action="set-paid-at"]');
    if (!el) return;
    const { personId, year, month } = el.dataset;
    savePaymentDate(Number(year), Number(month), personId, el.value || null);
  });

  document.getElementById("paymentContent").addEventListener("click", (e) => {
    const el = e.target.closest('[data-action="delete-payment-entry"]');
    if (!el) return;
    const { personId, year, month } = el.dataset;
    deletePaymentEntry(Number(year), Number(month), personId);
  });

  document.getElementById("personSearch").addEventListener("input", () => {
    renderDataTable();
  });

  // ── Event delegation: manualInvoiceRows ──
  document.getElementById("manualInvoiceRows").addEventListener("change", (e) => {
    const el = e.target.closest('[data-action="manual-invoice-field"]');
    if (!el) return;
    updateManualInvoiceRowField(el.dataset.rowId, el.dataset.field, el.value);
  });
  document.getElementById("manualInvoiceRows").addEventListener("click", (e) => {
    const el = e.target.closest('[data-action="manual-invoice-remove-row"]');
    if (!el) return;
    removeManualInvoiceRow(el.dataset.rowId);
  });
  document
    .getElementById("btn-add-manual-invoice-row")
    .addEventListener("click", addManualInvoiceRow);
  document
    .getElementById("btn-issue-manual-invoice")
    .addEventListener("click", issueManualInvoice);
  document
    .getElementById("manualInvoiceMonth")
    .addEventListener("change", renderManualInvoicePreview);

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("calendarActionsMenu");
    if (!menu) return;
    if (!menu.contains(e.target)) closeCalendarActionsMenu();
  });

  initClientGroupSelect();
  loadFromStorage();
  renderExcludedKeywords();
});

// ════════════════════════════
//  Form Helpers
// ════════════════════════════
function initClientGroupSelect() {
  const select = document.getElementById("editClientGroup");
  if (!select) return;
  select.innerHTML = CLIENT_GROUP_OPTIONS.map(
    (option) =>
      `<option value="${option.value}">${escapeHtml(option.label)}</option>`,
  ).join("");
}

function getSelectedClientGroupOption() {
  const value = document.getElementById("editClientGroup")?.value;
  return getClientGroupOption(value);
}

function updateEditFormVisibility() {
  const group = getSelectedClientGroupOption();
  const isDirect = group.billingType === "DIRECT";
  const priceRow = document.getElementById("editPriceRow");
  const pauseFields = document.getElementById("editPauseFields");
  const statusValue = document.getElementById("editActive").value;
  const priceInput = document.getElementById("editPrice");
  if (priceRow) {
    priceRow.style.display = "";
    if (priceInput) {
      priceInput.disabled = !isDirect;
      if (!isDirect) priceInput.value = "";
    }
  }
  if (pauseFields)
    pauseFields.style.display = statusValue === "paused" ? "grid" : "none";
}

function updatePauseEndFromWeeks() {
  const start = document.getElementById("editPauseStart").value;
  const weeks = Number(document.getElementById("editPauseWeeks").value);
  if (!start || !Number.isFinite(weeks) || weeks <= 0) return;
  document.getElementById("editPauseEnd").value = addDaysToDate(
    start,
    weeks * 7,
  );
}

function getStatusFromEditValue(value) {
  if (value === "false") return "INACTIVE";
  if (value === "paused") return "PAUSED";
  return "ACTIVE";
}

function getEditValueFromStatus(person) {
  if (person?.status === "PAUSED") return "paused";
  return person?.active === false || person?.status === "INACTIVE"
    ? "false"
    : "true";
}

function buildPausePeriodFromEdit(status) {
  if (status !== "PAUSED") return null;
  const startDate = document.getElementById("editPauseStart").value;
  const endDate = document.getElementById("editPauseEnd").value;
  const weeksValue = document.getElementById("editPauseWeeks").value;
  const weeks = weeksValue ? Number(weeksValue) : null;
  const reason =
    document.getElementById("editPauseReason").value.trim() || null;
  if (!startDate || !endDate) {
    showToast("휴진 시작일과 종료일을 입력하세요.");
    return null;
  }
  if (endDate < startDate) {
    showToast("휴진 종료일을 시작일 이후로 입력하세요.");
    return null;
  }
  return {
    id: generateId(),
    startDate,
    endDate,
    weeks: Number.isFinite(weeks) ? weeks : null,
    reason,
    affectedEvents: [],
    createdAt: new Date().toISOString(),
    updatedAt: null,
    canceledAt: null,
  };
}

function mergePausePeriod(periods, nextPeriod) {
  const normalized = Array.isArray(periods) ? periods : [];
  if (!nextPeriod) return normalized;
  const sameActivePeriod = normalized.some(
    (period) =>
      !period.canceledAt &&
      period.startDate === nextPeriod.startDate &&
      period.endDate === nextPeriod.endDate,
  );
  return sameActivePeriod ? normalized : [...normalized, nextPeriod];
}

function isSamePausePeriod(a, b) {
  return !!a && !!b && a.startDate === b.startDate && a.endDate === b.endDate;
}

function updatePausePeriod(target, source) {
  if (!target || !source) return;
  target.weeks = source.weeks;
  target.reason = source.reason;
  target.updatedAt = new Date().toISOString();
}

async function applyPauseToCalendarEvents(person, pausePeriod) {
  if (!selectedCalendarId || !Array.isArray(rawCalendarEvents)) return;
  const targetEvents = rawCalendarEvents.filter((event) => {
    const parsed = parseCalendarSummary(event.summary);
    const dateStr = getEventDateString(event);
    return (
      parsed.baseName === person.name &&
      isDateWithinRange(dateStr, pausePeriod.startDate, pausePeriod.endDate) &&
      !parsed.isPause
    );
  });
  if (targetEvents.length === 0) return;

  const affectedEvents = [];
  try {
    await Promise.all(
      targetEvents.map(async (event) => {
        const pausedTitle = toPausedTitle(event.summary);
        await apiUpdateEvent(selectedCalendarId, event.id, {
          summary: pausedTitle,
        });
        affectedEvents.push({
          eventId: event.id,
          originalTitle: event.summary || "",
          pausedTitle,
          eventDate: getEventDateString(event),
        });
      }),
    );
    pausePeriod.affectedEvents = [
      ...(pausePeriod.affectedEvents || []),
      ...affectedEvents,
    ];
    pausePeriod.updatedAt = new Date().toISOString();
    rawCalendarEvents = rawCalendarEvents.map((event) => {
      const changed = affectedEvents.find((item) => item.eventId === event.id);
      return changed ? { ...event, summary: changed.pausedTitle } : event;
    });
  } catch (err) {
    handleApiError(err, "휴진 일정명 변경에 실패했습니다.");
  }
}

// ════════════════════════════
//  Pause Reminder / Cancellation
// ════════════════════════════
function getTodayDateString() {
  return `${YEAR}-${String(MONTH).padStart(2, "0")}-${String(DAY).padStart(2, "0")}`;
}

function dateDiffInDays(fromDateStr, toDateStr) {
  const from = new Date(`${fromDateStr}T00:00:00`);
  const to = new Date(`${toDateStr}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.round((to - from) / 86400000);
}

function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr || "—";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function isMonthPanelActive() {
  return document.getElementById("panel-month")?.classList.contains("active");
}

function readPauseReminderDismissals() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PAUSE_REMINDER_DISMISS_STORAGE_KEY) || "{}",
    );
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (e) {
    return {};
  }
}

function writePauseReminderDismissals(dismissals) {
  localStorage.setItem(
    PAUSE_REMINDER_DISMISS_STORAGE_KEY,
    JSON.stringify(dismissals || {}),
  );
}

function cleanupPauseReminderDismissals() {
  const today = getTodayDateString();
  const dismissals = readPauseReminderDismissals();
  let changed = false;
  Object.keys(dismissals).forEach((endDate) => {
    if (endDate < today) {
      delete dismissals[endDate];
      changed = true;
    }
  });
  if (changed) writePauseReminderDismissals(dismissals);
  return dismissals;
}

function collectPauseReminderGroups() {
  const today = getTodayDateString();
  const dismissals = cleanupPauseReminderDismissals();
  const byEndDate = new Map();

  db.data.forEach((person) => {
    if (!person || person.deleted || person.active === false) return;
    (person.pausedPeriods || []).forEach((period) => {
      if (!period || period.canceledAt || !period.endDate) return;
      const daysLeft = dateDiffInDays(today, period.endDate);
      if (
        daysLeft == null ||
        daysLeft < 0 ||
        daysLeft > PAUSE_REMINDER_WINDOW_DAYS ||
        dismissals[period.endDate]
      ) {
        return;
      }

      const group = byEndDate.get(period.endDate) || {
        endDate: period.endDate,
        daysLeft,
        items: [],
      };
      group.items.push({
        personId: person.id,
        personName: person.name,
        startDate: period.startDate,
        endDate: period.endDate,
        weeks: period.weeks,
        reason: period.reason,
      });
      byEndDate.set(period.endDate, group);
    });
  });

  return [...byEndDate.values()].sort((a, b) =>
    a.endDate.localeCompare(b.endDate),
  );
}

function showPauseEndRemindersIfNeeded() {
  if (!isMonthPanelActive() || !pauseReminderModalComp) return;
  const root = pauseReminderModalComp.getRoot();
  if (root?.classList.contains("show")) return;
  pauseReminderQueue = collectPauseReminderGroups();
  openNextPauseReminderGroup();
}

function buildPauseReminderHtml(group) {
  const count = group.items.length;
  const dayLabel =
    group.daysLeft === 0 ? "오늘" : `${group.daysLeft}일 뒤`;
  const rows = group.items
    .map(
      (item) => `
        <tr>
          <td><strong>${escapeHtml(item.personName)}</strong></td>
          <td>${formatDateLabel(item.startDate)} ~ ${formatDateLabel(item.endDate)}</td>
          <td>${item.weeks ? `${item.weeks}주` : "—"}</td>
        </tr>`,
    )
    .join("");

  return `
    <div class="pause-reminder-summary">
      <strong>${count}명</strong>의 휴진이 ${dayLabel} 종료됩니다.
      <span>${formatDateLabel(group.endDate)}</span>
    </div>
    <table class="detail-table pause-reminder-table">
      <thead>
        <tr>
          <th>내담자</th>
          <th>휴진 기간</th>
          <th>주수</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function openNextPauseReminderGroup() {
  if (!pauseReminderQueue.length || !pauseReminderModalComp) return;
  currentPauseReminderGroup = pauseReminderQueue.shift();
  pauseReminderModalComp.setBody(buildPauseReminderHtml(currentPauseReminderGroup), {
    html: true,
  });
  pauseReminderModalComp.open();
}

function closePauseReminderModal() {
  pauseReminderQueue = [];
  pauseReminderModalComp.close();
}

function confirmPauseReminder() {
  pauseReminderModalComp.close();
  setTimeout(openNextPauseReminderGroup, 0);
}

function dismissCurrentPauseReminder() {
  if (currentPauseReminderGroup?.endDate) {
    const dismissals = readPauseReminderDismissals();
    dismissals[currentPauseReminderGroup.endDate] = new Date().toISOString();
    writePauseReminderDismissals(dismissals);
  }
  pauseReminderModalComp.close();
  setTimeout(openNextPauseReminderGroup, 0);
}

async function restorePauseCalendarEvents(period) {
  const affectedEvents = (period.affectedEvents || []).filter(
    (event) => event.eventId && event.originalTitle,
  );
  if (affectedEvents.length === 0) return { restored: 0, failed: 0, skipped: 0 };
  if (!selectedCalendarId) {
    return { restored: 0, failed: 0, skipped: affectedEvents.length };
  }

  const results = await Promise.allSettled(
    affectedEvents.map((event) =>
      apiUpdateEvent(selectedCalendarId, event.eventId, {
        summary: event.originalTitle,
      }),
    ),
  );
  const restoredEvents = affectedEvents.filter(
    (_, idx) => results[idx].status === "fulfilled",
  );
  rawCalendarEvents = rawCalendarEvents.map((event) => {
    const restored = restoredEvents.find((item) => item.eventId === event.id);
    return restored ? { ...event, summary: restored.originalTitle } : event;
  });
  return {
    restored: restoredEvents.length,
    failed: results.length - restoredEvents.length,
    skipped: 0,
  };
}

async function cancelPausePeriod(personId, periodId) {
  const person = db.data.find((p) => p.id === personId);
  const period = person?.pausedPeriods?.find((item) => item.id === periodId);
  if (!person || !period || period.canceledAt) return;

  const affectedCount = Array.isArray(period.affectedEvents)
    ? period.affectedEvents.length
    : 0;
  const restoreMessage = affectedCount
    ? `\n연결된 캘린더 일정 ${affectedCount}건은 원래 제목으로 되돌립니다.`
    : "";
  if (
    !confirm(
      `"${person.name}" 휴진을 취소하시겠습니까?\n` +
        `${period.startDate || "—"} ~ ${period.endDate || "—"}${restoreMessage}`,
    )
  ) {
    return;
  }

  let restoreResult = { restored: 0, failed: 0, skipped: 0 };
  try {
    restoreResult = await restorePauseCalendarEvents(period);
  } catch (err) {
    handleApiError(err, "휴진 일정 원복 중 오류가 발생했습니다.");
  }

  period.canceledAt = new Date().toISOString();
  period.updatedAt = period.canceledAt;

  const today = getTodayDateString();
  const hasActiveCurrentPause = (person.pausedPeriods || []).some(
    (item) =>
      item.id !== period.id &&
      !item.canceledAt &&
      isDateWithinRange(today, item.startDate, item.endDate),
  );
  if (person.status === "PAUSED" && !hasActiveCurrentPause) {
    person.status = "ACTIVE";
    person.active = true;
  }

  await autosave();
  if (rawCalendarEvents.length > 0) {
    processAndRenderEvents(rawCalendarEvents);
  } else {
    renderAll();
  }
  if (_detailPersonId === personId) openPersonDetail(personId);

  if (restoreResult.skipped > 0) {
    showToast("휴진은 취소됐지만 캘린더 미연동으로 일정명은 원복하지 못했습니다.");
  } else if (restoreResult.failed > 0) {
    showToast(
      `휴진은 취소됐고 일정 ${restoreResult.restored}건 원복, ${restoreResult.failed}건 실패했습니다.`,
    );
  } else {
    showToast("휴진이 취소되었습니다.");
  }
}

// ════════════════════════════
//  Persistence
// ════════════════════════════
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") {
      console.error(
        "[loadFromStorage]",
        "파싱된 데이터가 유효하지 않음",
        parsed,
      );
      return;
    }
    db = normalizeDbSchema(parsed);
    backupLegacyData(parsed, "localStorage");
    document.getElementById("noFileOverlay").style.display = "none";
    document.getElementById("fileNameLabel").textContent = "변경사항 없음";
    renderAll();
    showPauseEndRemindersIfNeeded();
  } catch (e) {
    console.error("[loadFromStorage]", "localStorage 데이터 파싱 실패", e);
  }
}

// ════════════════════════════
//  File I/O
// ════════════════════════════
async function openFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "JSON 데이터베이스",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    fileHandle = handle;
    const file = await handle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    backupLegacyData(parsed, file.name);
    db = normalizeDbSchema(parsed);
    document.getElementById("noFileOverlay").style.display = "none";
    document.getElementById("fileNameLabel").textContent = file.name;
    autosave();
    renderAll();
    showPauseEndRemindersIfNeeded();
    showToast(`"${file.name}" 불러왔습니다.`);
  } catch (e) {
    if (e.name !== "AbortError") {
      console.error("[openFile]", "파일 열기 실패", e);
      showToast("파일 열기 실패: " + e.message);
    } else {
    }
  }
}

async function saveFile() {
  if (!fileHandle) {
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "billing-db.json",
        types: [
          {
            description: "JSON 데이터베이스",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const fileName = (await fileHandle.getFile()).name;
      document.getElementById("fileNameLabel").textContent = fileName;
    } catch (e) {
      return;
    }
  }
  try {
    await flushScheduledAutosave();
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(getPersistableDb(), null, 2));
    await writable.close();
    showToast("저장되었습니다.");
  } catch (e) {
    console.error("[saveFile]", "파일 저장 실패", e);
    showToast("저장 실패: " + e.message);
  }
}

function createNewFile() {
  db = normalizeDbSchema({ data: [], printHistory: [], payments: [] });
  fileHandle = null;
  document.getElementById("noFileOverlay").style.display = "none";
  document.getElementById("fileNameLabel").textContent = "새 파일 (미저장)";
  autosave();
  renderAll();
  showPauseEndRemindersIfNeeded();
}

// ════════════════════════════
//  Tabs
// ════════════════════════════
function switchTab(name) {
  document
    .querySelectorAll(".tab[data-tab]")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  if (name === "history") renderHistory();
  if (name === "payment")
    renderPaymentHistory(paymentViewYear, paymentViewMonth);
  if (name === "month") showPauseEndRemindersIfNeeded();
  if (name === "manual") renderManualInvoice();
}

function isCurrentMonthView() {
  return monthViewYear === YEAR && monthViewMonth === MONTH;
}

function updateMonthHeader() {
  document.getElementById("monthTitle").textContent =
    `${monthViewYear}년 ${monthViewMonth}월`;
  const nextBtn = document.getElementById("btn-month-next");
  if (nextBtn) nextBtn.disabled = false;
}

function prevMonthView() {
  monthViewMonth -= 1;
  if (monthViewMonth < 1) {
    monthViewMonth = 12;
    monthViewYear -= 1;
  }
  updateMonthHeader();
  if (selectedCalendarId) fetchCalendarEvents();
}

function nextMonthView() {
  monthViewMonth += 1;
  if (monthViewMonth > 12) {
    monthViewMonth = 1;
    monthViewYear += 1;
  }
  updateMonthHeader();
  if (selectedCalendarId) fetchCalendarEvents();
}

// ════════════════════════════
//  People CRUD
// ════════════════════════════
function togglePerson(id, checked) {
  checked ? selectedForPrint.add(id) : selectedForPrint.delete(id);
  const card = document.getElementById("card-" + id);
  if (card) card.classList.toggle("excluded", !checked);
  updateCount();
}

function toggleCalendarPerson(id, checked) {
  checked ? selectedForPrint.add(id) : selectedForPrint.delete(id);
  const card = document.getElementById("card-" + id);
  if (card) card.classList.toggle("excluded", !checked);
  setSelectedCountLabels(selectedForPrint.size);
  updatePrintButtonState();
}

function selectAllCalendar() {
  if (calendarDisplayItems) {
    calendarDisplayItems
      .filter((p) => p.clientGroup === "PERSONAL")
      .forEach((p) => selectedForPrint.add(p.id));
    renderCalendarList(calendarDisplayItems, unmatchedItemsList);
  }
}

function deselectAllCalendar() {
  if (calendarDisplayItems) {
    calendarDisplayItems
      .filter((p) => p.clientGroup === "PERSONAL")
      .forEach((p) => selectedForPrint.delete(p.id));
  } else {
    selectedForPrint.clear();
  }
  if (calendarDisplayItems) {
    renderCalendarList(calendarDisplayItems, unmatchedItemsList);
  }
}

function snapshotCurrentMonthPrice(person, price) {
  if (!person) return;
  if (!person.monthlyData || typeof person.monthlyData !== "object") {
    person.monthlyData = {};
  }

  const monthKey = getMonthKey(YEAR, MONTH);
  const normalizedPrice = Number.isFinite(+price) ? +price : null;
  const entry = normalizeMonthlyEntry(
    person.monthlyData[monthKey],
    normalizedPrice,
  );
  entry.price = normalizedPrice;
  entry.totalPrice =
    normalizedPrice == null
      ? 0
      : normalizedPrice *
        (Number.isFinite(+entry.visitCount) ? +entry.visitCount : 0);
  person.monthlyData[monthKey] = entry;
}

function openAddPersonModal() {
  editingId = null;
  editModalComp.setTitle("내담자 등록");
  document.getElementById("btn-save-edit").textContent = "등록";
  document.getElementById("editName").value = "";
  document.getElementById("editClientGroup").value = "PERSONAL";
  document.getElementById("editPrice").value = "";
  document.getElementById("editActive").value = "true";
  document.getElementById("editPauseStart").value = "";
  document.getElementById("editPauseWeeks").value = "4";
  document.getElementById("editPauseEnd").value = "";
  document.getElementById("editPauseReason").value = "";
  updateEditFormVisibility();
  editModalComp.open();
}

function openEditModal(id) {
  editingId = id;
  const isNew = !id;
  editModalComp.setTitle(isNew ? "내담자 등록" : "정보 수정");
  document.getElementById("btn-save-edit").textContent = isNew
    ? "등록"
    : "저장";

  if (!isNew) {
    const p = db.data.find((x) => x.id === id);
    if (!p) return;
    document.getElementById("editName").value = p.name;
    document.getElementById("editClientGroup").value =
      p.clientGroup || "PERSONAL";
    document.getElementById("editPrice").value =
      p.currentPrice ?? p.price ?? "";
    document.getElementById("editActive").value = getEditValueFromStatus(p);
    const activePause = (p.pausedPeriods || []).find(
      (period) => !period.canceledAt && p.status === "PAUSED",
    );
    document.getElementById("editPauseStart").value =
      activePause?.startDate || "";
    document.getElementById("editPauseWeeks").value =
      activePause?.weeks == null ? "" : String(activePause.weeks);
    document.getElementById("editPauseEnd").value = activePause?.endDate || "";
    document.getElementById("editPauseReason").value =
      activePause?.reason || "";
  } else {
    document.getElementById("editName").value = "";
    document.getElementById("editClientGroup").value = "PERSONAL";
    document.getElementById("editPrice").value = "";
    document.getElementById("editActive").value = "true";
    document.getElementById("editPauseStart").value = "";
    document.getElementById("editPauseWeeks").value = "4";
    document.getElementById("editPauseEnd").value = "";
    document.getElementById("editPauseReason").value = "";
  }
  updateEditFormVisibility();
  editModalComp.open();
}

function closeEditModal() {
  editModalComp.close();
}

async function saveEdit() {
  const isUpdate = !!editingId;
  const name = document.getElementById("editName").value.trim();
  const group = getSelectedClientGroupOption();
  const price = parseInt(document.getElementById("editPrice").value, 10);
  const isDirect = group.billingType === "DIRECT";
  const status = getStatusFromEditValue(
    document.getElementById("editActive").value,
  );
  const isActive = status !== "INACTIVE";

  if (!name) {
    showToast("이름을 입력하세요.");
    return;
  }
  if (isDirect && (isNaN(price) || price < 0)) {
    showToast("가격을 확인하세요.");
    return;
  }
  const currentPrice = isDirect ? price : null;
  const priceValue = isDirect ? price : null;
  const pausePeriod = buildPausePeriodFromEdit(status);
  if (status === "PAUSED" && !pausePeriod) return;
  let savedPerson = null;
  let savedPausePeriod = null;

  if (editingId) {
    const p = db.data.find((x) => x.id === editingId);
    if (!p) return;
    const prevName = p.name;
    const prevPrice = p.currentPrice ?? p.price ?? 0;
    const previousActivePause = (p.pausedPeriods || []).find(
      (period) => !period.canceledAt && p.status === "PAUSED",
    );
    p.name = name;
    p.active = isActive;
    p.status = status;
    p.clientType = group.clientType;
    p.clientGroup = group.value;
    p.billingType = group.billingType;
    p.currentPrice = currentPrice;
    p.price = priceValue;
    p.pausedPeriods = Array.isArray(p.pausedPeriods) ? p.pausedPeriods : [];
    savedPerson = p;

    if (previousActivePause && status !== "PAUSED") {
      await restorePauseCalendarEvents(previousActivePause);
      previousActivePause.canceledAt = new Date().toISOString();
      previousActivePause.updatedAt = previousActivePause.canceledAt;
    } else if (previousActivePause && pausePeriod) {
      if (isSamePausePeriod(previousActivePause, pausePeriod)) {
        updatePausePeriod(previousActivePause, pausePeriod);
      } else {
        await restorePauseCalendarEvents(previousActivePause);
        previousActivePause.canceledAt = new Date().toISOString();
        previousActivePause.updatedAt = previousActivePause.canceledAt;
        p.pausedPeriods.push(pausePeriod);
        savedPausePeriod = pausePeriod;
      }
    } else if (pausePeriod) {
      p.pausedPeriods = mergePausePeriod(p.pausedPeriods, pausePeriod);
      savedPausePeriod = p.pausedPeriods.find(
        (period) =>
          !period.canceledAt &&
          period.startDate === pausePeriod.startDate &&
          period.endDate === pausePeriod.endDate,
      );
    }
    if (prevName !== name) selectedForPrint.delete(p.id);
    if (prevPrice !== currentPrice) snapshotCurrentMonthPrice(p, currentPrice);
  } else {
    const dup = db.data.find((p) => p.name === name);
    if (dup) {
      showToast("이미 존재하는 이름입니다.");
      return;
    }
    const newPerson = {
      id: generateId(),
      name,
      active: isActive,
      status,
      registeredAt: new Date().toISOString(),
      clientType: group.clientType,
      clientGroup: group.value,
      billingType: group.billingType,
      currentPrice,
      price: priceValue,
      memo: null,
      pausedPeriods: pausePeriod ? [pausePeriod] : [],
      monthlyData: {},
    };
    snapshotCurrentMonthPrice(newPerson, currentPrice);
    db.data.push(newPerson);
    savedPerson = newPerson;
    savedPausePeriod = newPerson.pausedPeriods[0] || null;
  }

  if (savedPerson && savedPausePeriod) {
    await applyPauseToCalendarEvents(savedPerson, savedPausePeriod);
  }

  const savedId = editingId;
  closeEditModal();
  await autosave();
  if (selectedCalendarId && rawCalendarEvents.length > 0) {
    processAndRenderEvents(rawCalendarEvents);
  } else {
    renderAll();
  }
  showToast(isUpdate ? "수정되었습니다." : "등록되었습니다.");
  if (isUpdate && savedId) openPersonDetail(savedId);
  showPauseEndRemindersIfNeeded();
}

function toggleActive(id, active) {
  const p = db.data.find((x) => x.id === id);
  if (p) {
    p.active = active;
    p.status = active ? "ACTIVE" : "INACTIVE";
    autosave();
    renderPeopleList();
  }
}

function deletePerson(id) {
  const target = db.data.find((p) => p.id === id);
  if (!target) return;
  if (
    !confirm(
      `"${target.name}"을(를) 데이터베이스에서 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`,
    )
  )
    return;
  db.data = db.data.filter((p) => p.id !== id);
  db.payments = (db.payments || [])
    .map((record) => ({
      ...record,
      entries: (record.entries || []).filter((entry) => entry.personId !== id),
    }))
    .filter((record) => (record.entries || []).length > 0);
  selectedForPrint.delete(id);
  autosave();
  renderAll();
  showToast(`"${target.name}" 삭제되었습니다.`);
}

function openAddPersonWithName(name) {
  editingId = null;
  editModalComp.setTitle("내담자 등록");
  document.getElementById("btn-save-edit").textContent = "등록";
  document.getElementById("editName").value = name;
  document.getElementById("editClientGroup").value = "PERSONAL";
  document.getElementById("editPrice").value = "";
  document.getElementById("editActive").value = "true";
  document.getElementById("editPauseStart").value = "";
  document.getElementById("editPauseWeeks").value = "4";
  document.getElementById("editPauseEnd").value = "";
  document.getElementById("editPauseReason").value = "";
  updateEditFormVisibility();
  editModalComp.open();
  document.getElementById("editPrice").focus();
}

// ════════════════════════════
//  CSV Import
// ════════════════════════════
function processCSV(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const lines = evt.target.result.trim().split("\n");
    const parsed = [];
    const startIdx = /이름|name/i.test(lines[0]) ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
      if (cols.length < 2) continue;
      let name, price;
      if (cols.length >= 3) {
        name = cols[0];
        price = cols[2];
      } else {
        [name, price] = cols;
      }
      if (!name || isNaN(+price)) continue;
      parsed.push({ name, price: parseInt(price) });
    }

    if (parsed.length === 0) {
      showToast("유효한 데이터가 없습니다.");
      return;
    }

    const dups = parsed.filter((row) =>
      db.data.some((p) => p.name === row.name),
    );
    if (dups.length > 0) {
      pendingCSV = parsed;
      document.getElementById("dupList").innerHTML = dups
        .map((d) => {
          const ex = db.data.find((p) => p.name === d.name);
          return `
          <div class="dup-item">
            <strong>${escapeHtml(d.name)}</strong>
            <span class="dup-price-change">
              ${(ex.price ?? ex.currentPrice ?? 0).toLocaleString()}
              <span class="dup-arrow">→</span>
              ${d.price.toLocaleString()}
            </span>
          </div>`;
        })
        .join("");
      csvModalComp.open();
    } else {
      applyCSV(parsed, false);
    }
  };
  reader.readAsText(file, "UTF-8");
}

function importUpdate() {
  applyCSV(pendingCSV, true);
  closeCsvModal();
}
function importSkip() {
  applyCSV(pendingCSV, false);
  closeCsvModal();
}

function applyCSV(data, update) {
  let added = 0,
    updated = 0;
  data.forEach((row) => {
    const ex = db.data.find((p) => p.name === row.name);
    if (ex) {
      if (update) {
        ex.currentPrice = row.price;
        ex.price = row.price;
        snapshotCurrentMonthPrice(ex, row.price);
        updated++;
      }
    } else {
      const newPerson = {
        id: generateId(),
        name: row.name,
        active: true,
        status: "ACTIVE",
        registeredAt: new Date().toISOString(),
        clientType: "PERSONAL",
        clientGroup: "PERSONAL",
        billingType: "DIRECT",
        currentPrice: row.price,
        price: row.price,
        memo: null,
        pausedPeriods: [],
        monthlyData: {},
      };
      snapshotCurrentMonthPrice(newPerson, row.price);
      db.data.push(newPerson);
      added++;
    }
  });
  autosave();
  renderAll();
  showToast(`추가 ${added}명, 업데이트 ${updated}명 완료`);
}

function closeCsvModal() {
  csvModalComp.close();
}

// ════════════════════════════
//  Print
// ════════════════════════════
function parseDateLike(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function buildConsultDateMap(events) {
  const dateMap = new Map();

  (events || []).forEach((event) => {
    if (
      isExcludedEvent(event?.summary, db.settings?.excludedEventKeywords || [])
    ) {
      return;
    }
    const parsedSummary = parseCalendarSummary(event?.summary);
    const name = parsedSummary.baseName;
    const dateStr = getEventDateString(event);
    const dbPerson = db.data.find((p) => p.name === name);
    if (
      !name ||
      parsedSummary.isExcludedFromBilling ||
      isDateInPausedPeriods(dateStr, dbPerson?.pausedPeriods)
    ) {
      return;
    }

    const startTimeStr = event?.start?.dateTime || event?.start?.date;
    const eventDate = parseDateLike(startTimeStr);
    if (!eventDate) return;

    if (
      eventDate.getFullYear() !== monthViewYear ||
      eventDate.getMonth() + 1 !== monthViewMonth
    ) {
      return;
    }

    const saved = dateMap.get(name) || { firstDate: null, lastDate: null };
    if (!saved.firstDate || eventDate < saved.firstDate)
      saved.firstDate = eventDate;
    if (!saved.lastDate || eventDate > saved.lastDate)
      saved.lastDate = eventDate;
    dateMap.set(name, saved);
  });

  return dateMap;
}

function formatConsultRange({ count, firstDate, lastDate }) {
  const visitCount = Number.isFinite(+count) ? +count : 0;
  const first = parseDateLike(firstDate);
  const last = parseDateLike(lastDate);
  const start = first || last;
  const end = last || first;

  const formatMonthDay = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

  if (!start) return "";
  if (visitCount <= 1 || !end || start.getTime() === end.getTime()) {
    return formatMonthDay(start);
  }
  return `${formatMonthDay(start)} ~ ${formatMonthDay(end)}`;
}

function getLogoSrc() {
  try {
    return new URL("logo.png", document.baseURI).href;
  } catch {
    return "logo.png";
  }
}

function waitForImageLoad(img, timeoutMs = 2000) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve) => {
    const cleanup = () => {
      img.removeEventListener("load", onDone);
      img.removeEventListener("error", onDone);
      clearTimeout(timer);
    };
    const onDone = () => {
      cleanup();
      resolve();
    };
    const timer = setTimeout(onDone, timeoutMs);
    img.addEventListener("load", onDone, { once: true });
    img.addEventListener("error", onDone, { once: true });
  });
}

async function waitForPrintImages(container) {
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.all(images.map((img) => waitForImageLoad(img)));
}

function renderInvoices(entries, yearMonthOverride) {
  const invoiceYear = yearMonthOverride?.year ?? monthViewYear;
  const invoiceMonth = yearMonthOverride?.month ?? monthViewMonth;
  const logoSrc = getLogoSrc();
  const pages = [];

  for (let i = 0; i < entries.length; i += 3) {
    const pageEntries = entries.slice(i, i + 3);
    while (pageEntries.length < 3) pageEntries.push(null);
    pages.push(pageEntries);
  }

  const renderCard = (p) => {
    if (!p)
      return `<article class="invoice-card invoice-card-empty" aria-hidden="true"></article>`;

    const unitPrice = Number.isFinite(+p.price) ? +p.price : 0;
    const count = Number.isFinite(+p.count) ? +p.count : 0;
    const total = unitPrice * count;
    const consultRange = formatConsultRange(p) || " ";
    const lastConsultDate = parseDateLike(p.lastDate);
    const footerDate = lastConsultDate
      ? `${lastConsultDate.getFullYear()}년 ${lastConsultDate.getMonth() + 1}월 ${lastConsultDate.getDate()}일`
      : "";

    return `
      <article class="invoice-card">
        <div class="invoice-header">
          <img class="invoice-logo" src="${logoSrc}" alt="세종로 로고" />
        </div>
        <div class="invoice-title">상담료청구서</div>
        <div class="invoice-recipient">
          <span class="invoice-recipient-group">
            <span class="invoice-recipient-name">${escapeHtml(p.name)}</span><span class="invoice-recipient-label">귀하</span>
          </span>
        </div>
        <div class="invoice-intro">${invoiceYear}년 ${invoiceMonth}월 상담료는 아래와 같습니다.</div>
        <table class="invoice-detail-table">
          <tr><td>${consultRange}</td></tr>
          <tr><td>${count}회기 X ${unitPrice.toLocaleString()}원</td></tr>
          <tr><td>${total.toLocaleString()} 원</td></tr>
        </table>
        <div class="invoice-footer">
          <div>${footerDate}</div>
          <div>세종로정신분석연구회</div>
          <div>김지아</div>
        </div>
      </article>`;
  };

  return pages
    .map((page, idx) => {
      const isLast = idx === pages.length - 1;
      return `
      <section class="invoice-page${isLast ? " invoice-page-last" : ""}">
        <div class="invoice-grid">
          ${page.map(renderCard).join("")}
        </div>
      </section>`;
    })
    .join("");
}

function getSelectedEntriesForPrint() {
  if (calendarDisplayItems && calendarDisplayItems.length > 0) {
    return calendarDisplayItems.filter((p) => selectedForPrint.has(p.id));
  }
  return db.data.filter((p) => selectedForPrint.has(p.id));
}

function enrichEntriesForInvoice(toPrint) {
  const consultDateMap = buildConsultDateMap(rawCalendarEvents);
  const monthKey = getMonthKey(monthViewYear, monthViewMonth);
  return toPrint.map((p) => {
    const dateInCalendar = consultDateMap.get(p.name) || {};
    const dbPerson = db.data.find((row) => row.id === p.id);
    const dbMonthEntry = dbPerson?.monthlyData?.[monthKey];

    return {
      ...p,
      firstDate: dateInCalendar.firstDate || p.firstDate || null,
      lastDate:
        dateInCalendar.lastDate ||
        p.lastDate ||
        dbMonthEntry?.lastVisitDate ||
        null,
    };
  });
}

function renderInvoicePreview(targetId = "invoicePreviewModalArea") {
  const previewArea = document.getElementById(targetId);
  if (!previewArea) return;

  const toPrint = getSelectedEntriesForPrint();
  if (toPrint.length === 0) {
    previewArea.innerHTML =
      '<div class="invoice-preview-empty">선택된 청구 대상이 없습니다.</div>';
    return;
  }

  const missingCount = toPrint.filter(
    (p) => p.count === undefined || p.count === null,
  );
  if (missingCount.length > 0) {
    previewArea.innerHTML =
      '<div class="invoice-preview-empty">캘린더 연동 후 회수 데이터가 있어야 미리보기를 표시할 수 있습니다.</div>';
    return;
  }

  previewArea.innerHTML = renderInvoices(enrichEntriesForInvoice(toPrint));
}

function openInvoicePreviewModal() {
  renderInvoicePreview("invoicePreviewModalArea");
  invoicePreviewModalComp.open();
}

function closeInvoicePreviewModal() {
  invoicePreviewModalComp.close();
}

async function printInvoices() {
  const toPrint = getSelectedEntriesForPrint();

  if (toPrint.length === 0) {
    showToast("선택된 인원이 없습니다.");
    return;
  }

  const missingCount = toPrint.filter(
    (p) => p.count === undefined || p.count === null,
  );
  if (missingCount.length > 0) {
    console.error(
      "[printInvoices]",
      "count 데이터 없는 인원 존재",
      missingCount.map((p) => p.name),
    );
    showToast("캘린더 연동 후 회수 데이터가 있어야 인쇄할 수 있습니다.");
    return;
  }

  const enriched = enrichEntriesForInvoice(toPrint);
  const printArea = document.getElementById("print-area");
  printArea.innerHTML = renderInvoices(enriched);
  await waitForPrintImages(printArea);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const toDate = (v) => (v instanceof Date ? v.toISOString() : v || null);
  const pendingHistEntry = {
    id: "hist_" + Date.now(),
    year: monthViewYear,
    month: monthViewMonth,
    printedAt: new Date().toISOString(),
    entries: enriched.map((p) => ({
      name: p.name,
      price: p.price,
      count: p.count,
      total: p.price * p.count,
      firstDate: toDate(p.firstDate),
      lastDate: toDate(p.lastDate),
    })),
  };
  const printCount = toPrint.length;

  const handleAfterPrint = () => {
    window.removeEventListener("afterprint", handleAfterPrint);
    db.printHistory.unshift(pendingHistEntry);
    db.printHistory = db.printHistory.slice(0, 10);
    autosave();
    showToast(`${printCount}명 인쇄 완료 · 이력 누적 저장됨`);
  };

  window.addEventListener("afterprint", handleAfterPrint);
  window.print();
}

// ════════════════════════════
//  Manual invoice
// ════════════════════════════
function addManualInvoiceRow() {
  manualInvoiceRows.push({
    rowId: ++manualInvoiceRowSeq,
    clientId: "",
    count: "",
    lastDate: "",
    price: "",
  });
  renderManualInvoiceRows();
  renderManualInvoicePreview();
}

function removeManualInvoiceRow(rowId) {
  manualInvoiceRows = manualInvoiceRows.filter(
    (r) => String(r.rowId) !== String(rowId),
  );
  if (manualInvoiceRows.length === 0) addManualInvoiceRow();
  renderManualInvoiceRows();
  renderManualInvoicePreview();
}

function updateManualInvoiceRowField(rowId, field, value) {
  const row = manualInvoiceRows.find((r) => String(r.rowId) === String(rowId));
  if (!row) return;
  row[field] = value;
  if (field === "clientId") {
    const client = db.data.find((p) => String(p.id) === String(value));
    row.price = client ? client.currentPrice ?? client.price ?? 0 : "";
  }
  renderManualInvoiceRows();
  renderManualInvoicePreview();
}

async function issueManualInvoice() {
  const rows = manualInvoiceRows.filter(
    (r) => r.clientId || r.count || r.lastDate,
  );
  if (rows.length === 0) {
    showToast("청구인원을 추가해주세요.");
    return;
  }
  const invalidRows = rows.filter(
    (r) =>
      !r.clientId ||
      !r.count ||
      Number(r.count) <= 0 ||
      !r.lastDate ||
      Number(r.lastDate) < 1 ||
      Number(r.lastDate) > 31,
  );
  if (invalidRows.length > 0) {
    showToast("내담자, 회기, 마지막 상담일을 모두 입력해주세요.");
    return;
  }

  const { year, month } = readManualInvoiceYearMonth();
  const entries = rows.map((row) => {
    const client = db.data.find((p) => String(p.id) === String(row.clientId));
    return {
      name: client ? client.name : "",
      price: Number(row.price) || 0,
      count: Number(row.count) || 0,
      lastDate: buildManualInvoiceDateStr(year, month, row.lastDate),
    };
  });

  const printArea = document.getElementById("print-area");
  printArea.innerHTML = renderInvoices(entries, { year, month });
  await waitForPrintImages(printArea);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const pendingHistEntry = {
    id: "hist_" + Date.now(),
    year,
    month,
    printedAt: new Date().toISOString(),
    entries: entries.map((e) => ({
      name: e.name,
      price: e.price,
      count: e.count,
      total: e.price * e.count,
      firstDate: null,
      lastDate: e.lastDate,
    })),
  };
  const printCount = entries.length;

  const handleAfterPrint = () => {
    window.removeEventListener("afterprint", handleAfterPrint);
    db.printHistory.unshift(pendingHistEntry);
    db.printHistory = db.printHistory.slice(0, 10);
    autosave();
    renderHistory();
    showToast(`${printCount}명 발행 완료 · 이력 누적 저장됨`);
  };

  window.addEventListener("afterprint", handleAfterPrint);
  window.print();
}

// ════════════════════════════
//  History
// ════════════════════════════
function deleteHistory(id) {
  if (!confirm("이 인쇄 이력을 삭제하시겠습니까?")) return;
  db.printHistory = db.printHistory.filter((h) => h.id !== id);
  autosave();
  renderHistory();
  showToast("이력이 삭제되었습니다.");
}

async function reissueHistory(id) {
  const h = db.printHistory.find((h) => h.id === id);
  if (!h) return;

  const entries = h.entries.map((e) => ({
    name: e.name,
    price: e.price,
    count: e.count,
    firstDate: e.firstDate || null,
    lastDate: e.lastDate || null,
  }));

  const printArea = document.getElementById("print-area");
  printArea.innerHTML = renderInvoices(entries);
  await waitForPrintImages(printArea);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const pendingHistEntry = {
    id: "hist_" + Date.now(),
    year: h.year,
    month: h.month,
    printedAt: new Date().toISOString(),
    entries: h.entries,
  };
  const printCount = h.entries.length;

  const handleAfterPrint = () => {
    window.removeEventListener("afterprint", handleAfterPrint);
    db.printHistory.unshift(pendingHistEntry);
    db.printHistory = db.printHistory.slice(0, 10);
    autosave();
    showToast(`${printCount}명 재발행 완료 · 이력 누적 저장됨`);
  };

  window.addEventListener("afterprint", handleAfterPrint);
  window.print();
}

// ════════════════════════════
//  Auth
// ════════════════════════════
function isAuthError(err) {
  return (
    err?.status === 401 ||
    err?.result?.error?.code === 401 ||
    err?.result?.error?.status === "UNAUTHENTICATED"
  );
}

function handleApiError(err, fallbackMessage) {
  console.error(fallbackMessage, err);
  if (isAuthError(err)) {
    handleSignoutClick();
    showToast("Google 인증이 만료되었습니다. 다시 로그인해 주세요.");
  } else {
    showToast(fallbackMessage);
  }
}

function handleAuthClick() {
  if (!tokenClient) {
    showToast("Google 연동 초기화 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      console.error("[handleAuthClick/callback]", "OAuth 응답 에러", resp);
      throw resp;
    }
    document.getElementById("btn-auth").style.display = "none";
    document.getElementById("btn-signout").style.display = "inline-flex";
    document.getElementById("btn-calendar-menu").style.display = "inline-flex";
    const calInfo = document.getElementById("calendar-info");
    if (calInfo) calInfo.style.display = "none";
    await fetchCalendarList();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

function handleSignoutClick() {
  closeCalendarActionsMenu();
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
  }

  selectedCalendarId = null;
  _calendarList = [];
  rawCalendarEvents = [];
  unmatchedItemsList = [];
  invalidStatusItemsList = [];
  calendarDisplayItems = [];
  const hdr = document.getElementById("month-section-header");
  if (hdr) hdr.style.display = "none";

  _setVisible("btn-auth", true);
  _setVisible("btn-signout", false);
  _setVisible("btn-calendar-menu", false);
  _setVisible("btn-refresh", false);
  _setVisible("btn-add-event", false);
  _setVisible("btn-change-cal", false);

  document.getElementById("month-data-section").style.display = "none";
  document.getElementById("calendar-selector").style.display = "none";
  const calInfo = document.getElementById("calendar-info");
  if (calInfo) calInfo.style.display = "block";

  const grid = document.getElementById("calendarGrid");
  if (grid) grid.innerHTML = "";
  document.getElementById("peopleList").innerHTML = "";
  setSelectedCountLabels(0);
  document.getElementById("btn-unmatched-summary").style.display = "none";
  document.getElementById("btn-invalid-status-summary").style.display = "none";
  updatePrintButtonState();
}

function _setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? "inline-flex" : "none";
}

// ════════════════════════════
//  Calendar Orchestration
// ════════════════════════════
async function fetchCalendarList({ skipAutoSelect = false } = {}) {
  try {
    const calendars = await apiListCalendars();
    const editableCalendars = calendars.filter((c) =>
      ["owner", "writer"].includes(c.accessRole),
    );
    _calendarList = editableCalendars;

    if (_calendarList.length === 0) {
      renderCalendarSelector([]);
      showToast("편집 가능한 캘린더가 없습니다.");
      return;
    }

    if (!skipAutoSelect) {
      const savedCalendarId = localStorage.getItem(
        SELECTED_CALENDAR_STORAGE_KEY,
      );
      if (savedCalendarId) {
        const savedIdx = _calendarList.findIndex(
          (c) => c.id === savedCalendarId,
        );
        if (savedIdx >= 0) {
          selectCalendar(savedIdx);
          return;
        }
        localStorage.removeItem(SELECTED_CALENDAR_STORAGE_KEY);
      }
    }

    renderCalendarSelector(_calendarList);
  } catch (err) {
    handleApiError(err, "캘린더 목록을 불러오지 못했습니다.");
  }
}

function selectCalendar(idx) {
  const cal = _calendarList[idx];
  if (!cal) {
    console.error("[selectCalendar]", `인덱스 ${idx}에 해당하는 캘린더 없음`);
    return;
  }
  selectedCalendarId = cal.id;
  localStorage.setItem(SELECTED_CALENDAR_STORAGE_KEY, cal.id);
  document.getElementById("calendar-selector").style.display = "none";
  _setVisible("btn-refresh", true);
  _setVisible("btn-add-event", true);
  _setVisible("btn-change-cal", true);
  fetchCalendarEvents();
}

function showCalendarSelector() {
  closeCalendarActionsMenu();
  document.getElementById("month-data-section").style.display = "none";
  _setVisible("btn-refresh", false);
  _setVisible("btn-add-event", false);
  _setVisible("btn-change-cal", false);
  calendarDisplayItems = [];
  fetchCalendarList({ skipAutoSelect: true });
}

function toggleCalendarActionsMenu() {
  const menu = document.getElementById("calendarActionsMenu");
  const trigger = document.getElementById("btn-calendar-menu");
  if (!menu || !trigger) return;
  const willOpen = !menu.classList.contains("open");
  menu.classList.toggle("open", willOpen);
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function closeCalendarActionsMenu() {
  const menu = document.getElementById("calendarActionsMenu");
  const trigger = document.getElementById("btn-calendar-menu");
  if (!menu || !trigger) return;
  menu.classList.remove("open");
  trigger.setAttribute("aria-expanded", "false");
}

function renderExcludedKeywords() {
  const list = document.getElementById("excludedKeywordList");
  if (!list) return;
  const keywords = db.settings?.excludedEventKeywords || [];
  if (keywords.length === 0) {
    list.innerHTML = `<span class="excluded-keyword-empty">등록된 제외 키워드가 없습니다.</span>`;
    return;
  }
  list.innerHTML = keywords
    .map(
      (keyword, idx) => `
      <button
        class="excluded-keyword-chip"
        data-action="remove-excluded-keyword"
        data-idx="${idx}"
        title="삭제"
      >
        ${escapeHtml(keyword)}
        <span aria-hidden="true">×</span>
      </button>`,
    )
    .join("");
}

function addExcludedKeyword() {
  const input = document.getElementById("excludedKeywordInput");
  const keyword = input.value.trim();
  if (!keyword) {
    showToast("제외할 키워드를 입력하세요.");
    return;
  }
  db.settings = normalizeSettings(db.settings);
  if (db.settings.excludedEventKeywords.includes(keyword)) {
    showToast("이미 등록된 키워드입니다.");
    return;
  }
  db.settings.excludedEventKeywords.push(keyword);
  input.value = "";
  scheduleAutosave();
  renderExcludedKeywords();
  if (rawCalendarEvents.length > 0) processAndRenderEvents(rawCalendarEvents);
}

function removeExcludedKeyword(idx) {
  db.settings = normalizeSettings(db.settings);
  db.settings.excludedEventKeywords.splice(idx, 1);
  scheduleAutosave();
  renderExcludedKeywords();
  if (rawCalendarEvents.length > 0) processAndRenderEvents(rawCalendarEvents);
}

async function fetchCalendarEvents() {
  if (!selectedCalendarId) {
    console.error("[fetchCalendarEvents]", "캘린더가 선택되지 않음");
    return;
  }
  try {
    const items = await apiListEvents(
      selectedCalendarId,
      monthViewYear,
      monthViewMonth,
    );
    processAndRenderEvents(items);
  } catch (err) {
    handleApiError(err, "일정을 불러오는 중 오류가 발생했습니다.");
  }
}

async function refreshCalendar() {
  showToast("캘린더 새로고침 중...");
  await fetchCalendarEvents();
}

function processAndRenderEvents(events) {
  rawCalendarEvents = events || [];
  const hdr = document.getElementById("month-section-header");
  if (hdr) hdr.style.display = "";
  if (!events || events.length === 0) {
    const monthKey = getMonthKey(monthViewYear, monthViewMonth);
    db.data.forEach((person) => {
      const basePrice = isDirectBillingPerson(person)
        ? (person.currentPrice ?? person.price ?? null)
        : null;
      person.currentPrice = basePrice;
      person.price = basePrice;
      if (!person.monthlyData || typeof person.monthlyData !== "object") {
        person.monthlyData = {};
      }
      person.monthlyData[monthKey] = normalizeMonthlyEntry(
        person.monthlyData[monthKey],
        basePrice,
      );
      person.monthlyData[monthKey].visitCount = 0;
      person.monthlyData[monthKey].noShowCount = 0;
      person.monthlyData[monthKey].sameDayCancelCount = 0;
      person.monthlyData[monthKey].advanceCancelCount = 0;
      person.monthlyData[monthKey].pauseCount = 0;
      person.monthlyData[monthKey].noShowDates = [];
      person.monthlyData[monthKey].sameDayCancelDates = [];
      person.monthlyData[monthKey].advanceCancelDates = [];
      person.monthlyData[monthKey].pauseDates = [];
      person.monthlyData[monthKey].totalPrice = 0;
      person.monthlyData[monthKey].lastVisitDate = null;
    });

    selectedForPrint.clear();
    calendarDisplayItems = [];
    unmatchedItemsList = [];
    invalidStatusItemsList = [];
    renderCalendarGrid([]);
    document.getElementById("month-data-section").style.display = "block";
    renderCalendarList([], []);
    return;
  }

  const grouped = {};
  const invalidGrouped = {};
  const monthKey = getMonthKey(monthViewYear, monthViewMonth);

  db.data.forEach((person) => {
    const basePrice = isDirectBillingPerson(person)
      ? (person.currentPrice ?? person.price ?? null)
      : null;
    person.currentPrice = basePrice;
    person.price = basePrice;
    if (!person.monthlyData || typeof person.monthlyData !== "object") {
      person.monthlyData = {};
    }
    person.monthlyData[monthKey] = normalizeMonthlyEntry(
      person.monthlyData[monthKey],
      basePrice,
    );
    person.monthlyData[monthKey].visitCount = 0;
    person.monthlyData[monthKey].noShowCount = 0;
    person.monthlyData[monthKey].sameDayCancelCount = 0;
    person.monthlyData[monthKey].advanceCancelCount = 0;
    person.monthlyData[monthKey].pauseCount = 0;
    person.monthlyData[monthKey].noShowDates = [];
    person.monthlyData[monthKey].sameDayCancelDates = [];
    person.monthlyData[monthKey].advanceCancelDates = [];
    person.monthlyData[monthKey].pauseDates = [];
    person.monthlyData[monthKey].totalPrice = 0;
    person.monthlyData[monthKey].lastVisitDate = null;
  });

  events.forEach((event) => {
    if (
      isExcludedEvent(event.summary, db.settings?.excludedEventKeywords || [])
    ) {
      return;
    }
    const parsed = parseCalendarSummary(event.summary);
    const name = parsed.baseName;
    if (!name) return;

    const startTimeStr = event.start.dateTime || event.start.date;
    const eventDate = new Date(startTimeStr);
    const dateStr = getEventDateString(event);
    const dbPersonForEvent = db.data.find((p) => p.name === name);
    const isPauseEvent =
      parsed.isPause ||
      isDateInPausedPeriods(dateStr, dbPersonForEvent?.pausedPeriods);
    if (!grouped[name]) {
      grouped[name] = {
        count: 0,
        lastDate: null,
        eventIds: [],
        noShowCount: 0,
        sameDayCancelCount: 0,
        advanceCancelCount: 0,
        pauseCount: 0,
        noShowDates: [],
        sameDayCancelDates: [],
        advanceCancelDates: [],
        pauseDates: [],
      };
    }

    grouped[name].eventIds.push(event.id);

    if (parsed.hasStatusIssue) {
      const invalidKey = `${parsed.baseName}__${parsed.invalidStatusRaw || ""}`;
      if (!invalidGrouped[invalidKey]) {
        invalidGrouped[invalidKey] = {
          baseName: parsed.baseName,
          invalidStatusRaw: parsed.invalidStatusRaw || "",
          count: 0,
          eventIds: [],
        };
      }
      invalidGrouped[invalidKey].count += 1;
      invalidGrouped[invalidKey].eventIds.push(event.id);
    }

    if (parsed.suffix === "노쇼") {
      grouped[name].noShowCount += 1;
      grouped[name].noShowDates.push(dateStr);
    }
    if (parsed.suffix === "당일취소") {
      grouped[name].sameDayCancelCount += 1;
      grouped[name].sameDayCancelDates.push(dateStr);
    }
    if (parsed.suffix === "사전취소") {
      grouped[name].advanceCancelCount += 1;
      grouped[name].advanceCancelDates.push(dateStr);
    }
    if (isPauseEvent) {
      grouped[name].pauseCount += 1;
      grouped[name].pauseDates.push(dateStr);
    }

    if (!parsed.isExcludedFromBilling && !isPauseEvent) {
      grouped[name].count += 1;
    }

    if (!parsed.isExcludedFromLastDate && !isPauseEvent) {
      if (!grouped[name].lastDate || eventDate > grouped[name].lastDate) {
        grouped[name].lastDate = eventDate;
      }
    }
  });

  const displayItems = [];
  const directDisplayItems = [];
  const newUnmatched = [];
  selectedForPrint.clear();

  for (const [name, data] of Object.entries(grouped)) {
    const dbPerson = db.data.find((p) => p.name === name);
    if (dbPerson && dbPerson.active !== false) {
      const personPrice = dbPerson.currentPrice ?? dbPerson.price ?? 0;
      const prevMonthEntry = normalizeMonthlyEntry(
        dbPerson.monthlyData[monthKey],
        personPrice,
      );
      dbPerson.monthlyData[monthKey] = {
        visitCount: data.count,
        noShowCount: data.noShowCount,
        sameDayCancelCount: data.sameDayCancelCount,
        advanceCancelCount: data.advanceCancelCount,
        pauseCount: data.pauseCount,
        noShowDates: data.noShowDates,
        sameDayCancelDates: data.sameDayCancelDates,
        advanceCancelDates: data.advanceCancelDates,
        pauseDates: data.pauseDates,
        price: isDirectBillingPerson(dbPerson) ? personPrice : null,
        totalPrice: isDirectBillingPerson(dbPerson)
          ? personPrice * data.count
          : 0,
        lastVisitDate:
          data.lastDate instanceof Date ? data.lastDate.toISOString() : null,
        paidAt: prevMonthEntry.paidAt || null,
      };
      if (data.count > 0) {
        const displayItem = {
          id: dbPerson.id,
          name,
          count: data.count,
          price: isDirectBillingPerson(dbPerson) ? personPrice : 0,
          clientGroup: dbPerson.clientGroup,
          billingType: dbPerson.billingType,
          lastDate: data.lastDate,
          noShowCount: data.noShowCount,
          sameDayCancelCount: data.sameDayCancelCount,
          advanceCancelCount: data.advanceCancelCount,
          pauseCount: data.pauseCount,
        };
        displayItems.push(displayItem);
        if (isDirectBillingPerson(dbPerson)) {
          directDisplayItems.push(displayItem);
          selectedForPrint.add(dbPerson.id);
        }
      }
    } else if (!dbPerson) {
      newUnmatched.push({
        name,
        count: data.count,
        lastDate: data.lastDate,
        eventIds: data.eventIds,
        noShowCount: data.noShowCount,
        sameDayCancelCount: data.sameDayCancelCount,
        advanceCancelCount: data.advanceCancelCount,
      });
    } else {
    }
  }

  unmatchedItemsList = newUnmatched;
  invalidStatusItemsList = Object.values(invalidGrouped);
  renderCalendarGrid(events);
  document.getElementById("month-data-section").style.display = "block";
  renderCalendarList(displayItems, newUnmatched);
  syncPaymentEntries(directDisplayItems);
  scheduleAutosave();
}

// ════════════════════════════
//  Calendar CRUD
// ════════════════════════════
function openCalendarEventModal(payload = null) {
  const titleEl = calendarEventModalComp.getTitleEl();
  const saveBtn = document.getElementById("btn-save-cal-event");
  const nameSelect = document.getElementById("calEventName");
  const statusSelect = document.getElementById("calEventStatus");
  const dateInput = document.getElementById("calEventDate");
  const timeInput = document.getElementById("calEventTime");
  const unregisteredNotice = document.getElementById(
    "calEventUnregisteredNotice",
  );
  const addUnmatchedBtn = document.getElementById(
    "btn-open-add-unmatched-from-cal",
  );

  // 활성 내담자 목록으로 select 채우기
  const activeClients = db.data.filter((p) => p.active !== false);
  const targetName = payload?.baseName || "";
  const inDb = activeClients.some((p) => p.name === targetName);
  const isUnregisteredEdit = !!payload?.eventId && !!targetName && !inDb;

  let options = '<option value="">내담자 선택</option>';
  // 편집 모드에서 DB에 없는 이름이면 별도 옵션으로 추가
  if (targetName && !inDb) {
    options += `<option value="${escapeHtml(targetName)}">${escapeHtml(targetName)} (미등록)</option>`;
  }
  options += activeClients
    .map(
      (p) =>
        `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`,
    )
    .join("");
  nameSelect.innerHTML = options;
  nameSelect.value = targetName;
  if (unregisteredNotice) {
    unregisteredNotice.style.display = isUnregisteredEdit ? "flex" : "none";
  }
  if (addUnmatchedBtn) addUnmatchedBtn.dataset.name = targetName;

  if (payload && payload.eventId) {
    editingCalendarEventId = payload.eventId;
    statusSelect.value = payload.eventStatus || "";
    dateInput.value =
      payload.date ||
      `${YEAR}-${String(MONTH).padStart(2, "0")}-${String(DAY).padStart(2, "0")}`;
    timeInput.value = payload.time || "10:00";
    if (titleEl)
      titleEl.innerHTML =
        '<svg class="icon"><use href="icons.svg#icon-calendar" /></svg> 캘린더 일정 변경';
    if (saveBtn) saveBtn.textContent = "변경 저장";
  } else {
    editingCalendarEventId = null;
    statusSelect.value = "";
    const lastDateInViewMonth = new Date(
      monthViewYear,
      monthViewMonth,
      0,
    ).getDate();
    const safeDay = Math.min(DAY, lastDateInViewMonth);
    dateInput.value =
      `${monthViewYear}-${String(monthViewMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    timeInput.value = "10:00";
    if (titleEl)
      titleEl.innerHTML =
        '<svg class="icon"><use href="icons.svg#icon-calendar" /></svg> 캘린더 일정 추가';
    if (saveBtn) saveBtn.textContent = "추가";
  }

  [nameSelect, statusSelect, dateInput, timeInput].forEach((el) => {
    if (el) el.disabled = isUnregisteredEdit;
  });
  if (saveBtn) {
    saveBtn.disabled = isUnregisteredEdit;
    saveBtn.title = isUnregisteredEdit
      ? "DB에 등록되지 않은 일정은 먼저 내담자로 등록해야 합니다."
      : "";
  }

  calendarEventModalComp.open();
}

function closeCalendarEventModal() {
  calendarEventModalComp.close();
}

async function saveCalendarEvent() {
  const baseName = document.getElementById("calEventName").value.trim();
  const eventStatus = document.getElementById("calEventStatus").value || null;
  const date = document.getElementById("calEventDate").value;
  const time = document.getElementById("calEventTime").value;

  if (!baseName) {
    showToast("항목을 선택해주세요.");
    return;
  }
  if (
    editingCalendarEventId &&
    !db.data.some((p) => p.active !== false && p.name === baseName)
  ) {
    showToast("미등록 일정은 먼저 DB에 등록해주세요.");
    return;
  }
  if (!date) {
    showToast("날짜를 선택하세요.");
    return;
  }
  if (!time) {
    showToast("시간을 선택하세요.");
    return;
  }

  const [h, m] = time.split(":").map(Number);
  const endH = (h + 1) % 24;
  const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const summary = composeCalendarSummary(baseName, eventStatus);

  const resource = {
    summary,
    start: { dateTime: `${date}T${time}:00`, timeZone: "Asia/Seoul" },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: "Asia/Seoul" },
  };
  const isEditMode = !!editingCalendarEventId;
  try {
    if (isEditMode) {
      await apiUpdateEvent(
        selectedCalendarId,
        editingCalendarEventId,
        resource,
      );
    } else {
      const result = await apiInsertEvent(selectedCalendarId, resource);
    }
    closeCalendarEventModal();
    showToast(`"${summary}" 일정이 ${isEditMode ? "변경" : "추가"}되었습니다.`);
    await fetchCalendarEvents();
  } catch (err) {
    handleApiError(err, `일정 ${isEditMode ? "변경" : "추가"}에 실패했습니다.`);
  }
}

function openAddUnmatchedFromCalendarEvent() {
  const targetName =
    document.getElementById("btn-open-add-unmatched-from-cal")?.dataset.name ||
    "";
  const idx = unmatchedItemsList.findIndex((item) => item.name === targetName);
  if (idx < 0) {
    showToast("연동되지 않은 항목 목록에서 먼저 확인해주세요.");
    return;
  }
  closeCalendarEventModal();
  openAddUnmatchedModal(idx);
}

async function deleteCalendarEvent(eventId) {
  try {
    await apiDeleteEvent(selectedCalendarId, eventId);
    showToast("일정이 삭제되었습니다.");
    await fetchCalendarEvents();
  } catch (err) {
    handleApiError(err, "일정 삭제에 실패했습니다.");
  }
}

// ════════════════════════════
//  Unmatched Name Handling
// ════════════════════════════
function openAddUnmatchedModal(idx) {
  addingUnmatchedIdx = idx;
  const item = unmatchedItemsList[idx];
  document.getElementById("addUnmatchedName").textContent = item.name;
  document.getElementById("addUnmatchedCount").textContent = item.count + "회";
  document.getElementById("addUnmatchedPrice").value = "";
  addUnmatchedModalComp.open();
}

function closeAddUnmatchedModal() {
  addUnmatchedModalComp.close();
}

function saveAddUnmatched() {
  const item = unmatchedItemsList[addingUnmatchedIdx];
  if (!item) return;
  const price = parseInt(document.getElementById("addUnmatchedPrice").value);
  if (isNaN(price) || price < 0) {
    showToast("가격을 확인하세요.");
    return;
  }

  const newPerson = {
    id: generateId(),
    name: item.name,
    active: true,
    status: "ACTIVE",
    registeredAt: new Date().toISOString(),
    clientType: "PERSONAL",
    clientGroup: "PERSONAL",
    billingType: "DIRECT",
    currentPrice: price,
    price,
    memo: null,
    pausedPeriods: [],
    monthlyData: {},
  };
  db.data.push(newPerson);
  autosave();
  closeAddUnmatchedModal();
  showToast(`"${item.name}" DB에 추가되었습니다.`);
  processAndRenderEvents(rawCalendarEvents);
  renderDataTable();
  if (unmatchedItemsList.length > 0) {
    openUnmatchedModal();
  } else {
    closeUnmatchedModal();
  }
}

function openMatchModal(idx) {
  matchingUnmatchedIdx = idx;
  const item = unmatchedItemsList[idx];
  document.getElementById("matchCalName").textContent = item.name;

  const select = document.getElementById("matchDbSelect");
  const options = db.data
    .filter((p) => p.active !== false)
    .map(
      (p) =>
        `<option value="${p.id}">${escapeHtml(p.name)} (${(p.currentPrice ?? p.price ?? 0).toLocaleString()}원)</option>`,
    )
    .join("");

  if (!options) {
    showToast("DB에 활성화된 인원이 없습니다.");
    return;
  }
  select.innerHTML = options;
  matchModalComp.open();
}

function closeMatchModal() {
  matchModalComp.close();
}

async function saveMatch() {
  const item = unmatchedItemsList[matchingUnmatchedIdx];
  if (!item) return;
  const dbPerson = db.data.find(
    (p) => p.id === document.getElementById("matchDbSelect").value,
  );
  if (!dbPerson) return;

  try {
    await apiPatchEvents(selectedCalendarId, item.eventIds, {
      summary: dbPerson.name,
    });
    closeMatchModal();
    closeUnmatchedModal();
    showToast(`캘린더 이름이 "${dbPerson.name}"으로 변경되었습니다.`);
    await fetchCalendarEvents();
  } catch (err) {
    handleApiError(err, "이름 변경에 실패했습니다.");
  }
}

// ════════════════════════════
//  Unmatched Modal
// ════════════════════════════
function openUnmatchedModal() {
  renderUnmatchedModal();
  unmatchedListModalComp.open();
}

function closeUnmatchedModal() {
  unmatchedListModalComp.close();
}

// ════════════════════════════
//  Invalid Status Modal
// ════════════════════════════
function openInvalidStatusModal() {
  renderInvalidStatusModal();
  invalidStatusListModalComp.open();
}

function closeInvalidStatusModal() {
  invalidStatusListModalComp.close();
}

function openFixInvalidStatusModal(idx) {
  fixingInvalidStatusIdx = idx;
  const item = invalidStatusItemsList[idx];
  if (!item) return;
  document.getElementById("fixInvalidStatusName").textContent =
    item.baseName || "(이름 없음)";
  document.getElementById("fixInvalidStatusSelect").value = "";
  fixInvalidStatusModalComp.open();
}

function closeFixInvalidStatusModal() {
  fixInvalidStatusModalComp.close();
}

async function saveFixInvalidStatus() {
  const item = invalidStatusItemsList[fixingInvalidStatusIdx];
  if (!item) return;
  const status =
    document.getElementById("fixInvalidStatusSelect").value || null;
  const nextSummary = composeCalendarSummary(item.baseName, status);
  if (!nextSummary) {
    showToast("이름이 비어 있어 상태를 수정할 수 없습니다.");
    return;
  }
  const nextStatusLabel = status || "일반";
  const affectedCount = Array.isArray(item.eventIds) ? item.eventIds.length : 0;
  if (
    !confirm(
      `"${item.baseName}" 상태를 "${nextStatusLabel}"로 일괄 수정하시겠습니까?\n` +
        `${affectedCount}건의 일정 제목이 "${nextSummary}"로 변경됩니다.`,
    )
  ) {
    return;
  }

  try {
    await apiPatchEvents(selectedCalendarId, item.eventIds, {
      summary: nextSummary,
    });
    closeFixInvalidStatusModal();
    closeInvalidStatusModal();
    showToast(`"${item.baseName}" 상태가 수정되었습니다.`);
    await fetchCalendarEvents();
  } catch (err) {
    handleApiError(err, "상태 수정에 실패했습니다.");
  }
}

// ════════════════════════════
//  Payment History
// ════════════════════════════
function syncPaymentEntries(toPrint) {
  const existing = db.payments.find(
    (p) => p.year === monthViewYear && p.month === monthViewMonth,
  );
  const monthKey = getMonthKey(monthViewYear, monthViewMonth);
  const newEntries = toPrint.map((p) => {
    const billedCount = Number.isFinite(+p.count) ? +p.count : 0;
    const noShowCount = Number.isFinite(+p.noShowCount) ? +p.noShowCount : 0;
    const sameDayCancelCount = Number.isFinite(+p.sameDayCancelCount)
      ? +p.sameDayCancelCount
      : 0;
    const advanceCancelCount = Number.isFinite(+p.advanceCancelCount)
      ? +p.advanceCancelCount
      : 0;
    const pauseCount = Number.isFinite(+p.pauseCount) ? +p.pauseCount : 0;
    const visitCount = Math.max(
      0,
      billedCount - noShowCount - sameDayCancelCount,
    );

    return {
      personId: p.id,
      name: p.name,
      price: p.price,
      count: billedCount,
      billedCount,
      visitCount,
      noShowCount,
      sameDayCancelCount,
      advanceCancelCount,
      pauseCount,
      lastDate: p.lastDate instanceof Date ? p.lastDate.toISOString() : null,
      total: p.price * billedCount,
      paidAt:
        db.data.find((x) => x.id === p.id)?.monthlyData?.[monthKey]?.paidAt ||
        null,
    };
  });

  if (existing) {
    newEntries.forEach((ne) => {
      const entry = existing.entries.find((e) => e.personId === ne.personId);
      if (entry) {
        // 상담 데이터만 갱신, 납부일은 보존
        entry.count = ne.count;
        entry.billedCount = ne.billedCount;
        entry.visitCount = ne.visitCount;
        entry.noShowCount = ne.noShowCount;
        entry.sameDayCancelCount = ne.sameDayCancelCount;
        entry.advanceCancelCount = ne.advanceCancelCount;
        entry.pauseCount = ne.pauseCount;
        entry.lastDate = ne.lastDate;
        entry.price = ne.price;
        entry.total = ne.total;
      } else {
        existing.entries.push(ne);
      }
    });
  } else {
    db.payments.unshift({
      id: `pay_${monthViewYear}_${monthViewMonth}`,
      year: monthViewYear,
      month: monthViewMonth,
      entries: newEntries,
    });
  }
}

function savePaymentDate(year, month, personId, paidAt) {
  const record = db.payments.find((p) => p.year === year && p.month === month);
  if (!record) return;
  const entry = record.entries.find((e) => e.personId === personId);
  if (!entry) return;
  entry.paidAt = paidAt || null;

  const monthKey = getMonthKey(year, month);
  const person = db.data.find((p) => p.id === personId);
  if (person) {
    if (!person.monthlyData || typeof person.monthlyData !== "object") {
      person.monthlyData = {};
    }
    const basePrice = Number.isFinite(+person.currentPrice)
      ? +person.currentPrice
      : +person.price || 0;
    person.monthlyData[monthKey] = normalizeMonthlyEntry(
      person.monthlyData[monthKey],
      basePrice,
    );
    person.monthlyData[monthKey].paidAt = paidAt || null;
  }

  autosave();
  renderPaymentHistory(year, month);
}

function deletePaymentEntry(year, month, personId) {
  const record = db.payments.find((p) => p.year === year && p.month === month);
  if (!record) return;
  const entry = record.entries.find((e) => e.personId === personId);
  if (!entry) return;
  if (!confirm(`"${entry.name}" 입금 항목을 삭제하시겠습니까?`)) return;

  record.entries = record.entries.filter((e) => e.personId !== personId);
  if (record.entries.length === 0) {
    db.payments = db.payments.filter(
      (p) => !(p.year === year && p.month === month),
    );
  }

  autosave();
  renderPaymentHistory(year, month);
  showToast(`"${entry.name}" 항목이 삭제되었습니다.`);
}

function prevPaymentMonth() {
  if (paymentViewMonth === 1) {
    paymentViewYear--;
    paymentViewMonth = 12;
  } else {
    paymentViewMonth--;
  }
  renderPaymentHistory(paymentViewYear, paymentViewMonth);
}

function nextPaymentMonth() {
  if (paymentViewYear === YEAR && paymentViewMonth === MONTH) return;
  if (paymentViewMonth === 12) {
    paymentViewYear++;
    paymentViewMonth = 1;
  } else {
    paymentViewMonth++;
  }
  renderPaymentHistory(paymentViewYear, paymentViewMonth);
}

// ════════════════════════════
//  Person Detail Panel
// ════════════════════════════
function openPersonDetail(id) {
  const person = db.data.find((p) => p.id === id);
  if (!person) return;
  _detailPersonId = id;

  personDetailModalComp.setTitle(person.name);
  personDetailModalComp.setBody(buildPersonDetailHtml(person), { html: true });

  // Action buttons
  const deleteBtn = document.getElementById("btn-delete-from-detail");
  if (deleteBtn) deleteBtn.style.display = "";

  personDetailModalComp.open();
}

function closePersonDetail() {
  personDetailModalComp.close();
}

function startDetailMemoEdit() {
  if (!_detailPersonId) return;
  const person = db.data.find((p) => p.id === _detailPersonId);
  const section = document.getElementById("detailMemoSection");
  if (!person || !section) return;
  section.innerHTML = buildDetailMemoEditHtml(person);
  document.getElementById("detailMemoInput")?.focus();
}

function cancelDetailMemoEdit() {
  if (!_detailPersonId) return;
  const person = db.data.find((p) => p.id === _detailPersonId);
  const section = document.getElementById("detailMemoSection");
  if (!person || !section) return;
  section.outerHTML = buildDetailMemoViewHtml(person);
}

async function saveDetailMemo() {
  if (!_detailPersonId) return;
  const person = db.data.find((p) => p.id === _detailPersonId);
  const section = document.getElementById("detailMemoSection");
  const input = document.getElementById("detailMemoInput");
  if (!person || !section || !input) return;
  person.memo = input.value.trim() || null;
  await autosave();
  section.outerHTML = buildDetailMemoViewHtml(person);
  showToast("메모가 저장되었습니다.");
}

// ── Detail table component ──────────────────────────────────────────────────
// _detailTable(title, cols, rows, emptyMsg?)
//   cols: [{label, align?}]  (align: 'left'|'right'|'center', default 'left')
//   rows: string[][]         (cell content per column, HTML allowed)
function _detailTable(title, cols, rows, emptyMsg = "기록이 없습니다.") {
  const thCells = cols
    .map((c) => `<th style="text-align:${c.align || "left"}">${c.label}</th>`)
    .join("");
  if (rows.length === 0) {
    return `<div class="detail-section">
      <div class="detail-section-title">${title}</div>
      <p class="detail-empty">${emptyMsg}</p>
    </div>`;
  }
  const tbodyRows = rows
    .map((cells) => {
      const tds = cells
        .map(
          (v, i) =>
            `<td style="text-align:${cols[i]?.align || "left"}">${v}</td>`,
        )
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  return `<div class="detail-section">
    <div class="detail-section-title">${title}</div>
    <table class="detail-table">
      <thead><tr>${thCells}</tr></thead>
      <tbody>${tbodyRows}</tbody>
    </table>
  </div>`;
}

function _fmtMonthKey(key) {
  // "202401" → "2024년 1월"
  const y = key.slice(0, 4);
  const m = String(parseInt(key.slice(4), 10));
  return `${y}년 ${m}월`;
}

function _getPriceHistory(person) {
  // Returns [{monthKey, price}] sorted ascending, deduped by price change
  const entries = Object.entries(person.monthlyData || {})
    .filter(([, e]) => Number.isFinite(+e.price) && +e.price > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  const history = [];
  let lastPrice = null;
  for (const [key, entry] of entries) {
    const price = +entry.price;
    if (price !== lastPrice) {
      history.push({ monthKey: key, price });
      lastPrice = price;
    }
  }
  return history;
}

function _buildYearlyData(person) {
  // Returns [{year, visitCount, noShowCount, sameDayCancelCount, advanceCancelCount, pauseCount, totalPrice, months}]
  // sorted descending by year
  const byYear = {};
  for (const [key, entry] of Object.entries(person.monthlyData || {})) {
    const y = key.slice(0, 4);
    if (!byYear[y]) {
      byYear[y] = {
        year: y,
        visitCount: 0,
        noShowCount: 0,
        sameDayCancelCount: 0,
        advanceCancelCount: 0,
        pauseCount: 0,
        totalPrice: 0,
        months: [],
      };
    }
    const monthData = {
      monthKey: key,
      visitCount: +entry.visitCount || 0,
      noShowCount: +entry.noShowCount || 0,
      sameDayCancelCount: +entry.sameDayCancelCount || 0,
      advanceCancelCount: +entry.advanceCancelCount || 0,
      pauseCount: +entry.pauseCount || 0,
      totalPrice: +entry.totalPrice || 0,
    };
    byYear[y].visitCount += monthData.visitCount;
    byYear[y].noShowCount += monthData.noShowCount;
    byYear[y].sameDayCancelCount += monthData.sameDayCancelCount;
    byYear[y].advanceCancelCount += monthData.advanceCancelCount;
    byYear[y].pauseCount += monthData.pauseCount;
    byYear[y].totalPrice += monthData.totalPrice;
    byYear[y].months.push(monthData);
  }
  return Object.values(byYear)
    .map((yearData) => ({
      ...yearData,
      months: yearData.months.sort((a, b) =>
        b.monthKey.localeCompare(a.monthKey),
      ),
    }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

function _buildYearlyVisitHtml(person) {
  const yearlyData = _buildYearlyData(person);
  const chevron = `<svg class="detail-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  if (yearlyData.length === 0) {
    return `<div class="detail-section">
      <div class="detail-section-title">방문 현황</div>
      <p class="detail-empty">방문 기록이 없습니다.</p>
    </div>`;
  }

  const monthRows = (months) =>
    months
      .map((month) => `
          <tr>
            <td>${_fmtMonthKey(month.monthKey)}</td>
            <td style="text-align:right">${month.visitCount || "—"}</td>
            <td style="text-align:right">${month.noShowCount || "—"}</td>
            <td style="text-align:right">${month.advanceCancelCount || "—"}</td>
            <td style="text-align:right">${month.sameDayCancelCount || "—"}</td>
            <td style="text-align:right">${month.pauseCount || "—"}</td>
            <td style="text-align:right">${month.totalPrice ? formatCurrency(month.totalPrice) : "—"}</td>
          </tr>`)
      .join("");

  return `<div class="detail-section">
    <div class="detail-section-title">방문 현황</div>
    <div class="detail-year-list">
      ${yearlyData
        .map((yearData) => `
            <details class="detail-year-item">
              <summary>
                <span class="detail-year-summary-left">
                  ${chevron}<strong>${yearData.year}년</strong>
                </span>
                <span class="year-stat"><span class="year-stat-label">방문</span> ${yearData.visitCount}회</span>
                <span class="year-stat-sep">|</span>
                <span class="year-stat"><span class="year-stat-label">노쇼</span> ${yearData.noShowCount}회</span>
                <span class="year-stat-sep">|</span>
                <span class="year-stat"><span class="year-stat-label">사전취소</span> ${yearData.advanceCancelCount}회</span>
                <span class="year-stat-sep">|</span>
                <span class="year-stat"><span class="year-stat-label">당일취소</span> ${yearData.sameDayCancelCount}회</span>
                <span class="year-stat-sep">|</span>
                <span class="year-stat"><span class="year-stat-label">휴진</span> ${yearData.pauseCount}회</span>
              </summary>
              <table class="detail-table detail-month-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th style="text-align:right">방문</th>
                    <th style="text-align:right">노쇼</th>
                    <th style="text-align:right">사전취소</th>
                    <th style="text-align:right">당일취소</th>
                    <th style="text-align:right">휴진</th>
                    <th style="text-align:right">총청구횟수</th>
                  </tr>
                </thead>
                <tbody>${monthRows(yearData.months)}</tbody>
                <tfoot>
                  <tr class="detail-month-total">
                    <td>합계</td>
                    <td style="text-align:right">${yearData.visitCount || "—"}</td>
                    <td style="text-align:right">${yearData.noShowCount || "—"}</td>
                    <td style="text-align:right">${yearData.advanceCancelCount || "—"}</td>
                    <td style="text-align:right">${yearData.sameDayCancelCount || "—"}</td>
                    <td style="text-align:right">${yearData.pauseCount || "—"}</td>
                    <td style="text-align:right">${yearData.totalPrice ? formatCurrency(yearData.totalPrice) : "—"}</td>
                  </tr>
                </tfoot>
              </table>
            </details>`)
        .join("")}
    </div>
  </div>`;
}

function buildPersonDetailHtml(person) {
  const registeredAt = person.registeredAt
    ? new Date(person.registeredAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  // Status badge
  const statusBadge = person.deleted
    ? `<span class="badge badge-muted">삭제됨</span>`
    : person.status === "PAUSED"
      ? `<span class="badge badge-paused">휴진</span>`
      : person.active !== false
        ? `<span class="badge badge-active">활성</span>`
        : `<span class="badge badge-inactive">비활성</span>`;
  const groupLabel = CLIENT_GROUP_LABELS[person.clientGroup] || "개인";
  const priceLabel = isDirectBillingPerson(person)
    ? formatCurrency(person.currentPrice)
    : "직접 청구 아님";

  // Meta grid
  const metaHtml = `
    <div class="detail-meta">
      <div class="detail-meta-item">
        <span class="detail-label">상태</span>
        <span>${statusBadge}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-label">구분</span>
        <span>${escapeHtml(groupLabel)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-label">현재 상담료</span>
        <span>${priceLabel}</span>
      </div>
    </div>`;

  const registeredAtHtml = `
    <div class="detail-registered-at">
      <span class="detail-label">등록일</span>
      <span>${registeredAt}</span>
    </div>`;

  const memoHtml = buildDetailMemoViewHtml(person);

  const yearlyHtml = _buildYearlyVisitHtml(person);

  // Price history table
  const priceHistory = _getPriceHistory(person);
  const priceHtml = _detailTable(
    "상담료 변화내역",
    [{ label: "시작 월" }, { label: "상담료", align: "right" }],
    priceHistory.map((h) => [
      _fmtMonthKey(h.monthKey),
      formatCurrency(h.price),
    ]),
    "변화 내역이 없습니다.",
  );

  // No-show / cancel date tables
  const incidentHtml = _buildIncidentHtml(person);

  const pauseHtml = _buildPauseHistoryHtml(person);

  return `${metaHtml}${memoHtml}${yearlyHtml}${pauseHtml}${priceHtml}${incidentHtml}${registeredAtHtml}`;
}

function buildDetailMemoViewHtml(person) {
  return `<div class="detail-section detail-memo-section" id="detailMemoSection">
    <div class="detail-section-title detail-section-title-row">
      <span>메모</span>
      <button class="btn btn-outlined btn-primary btn-sm" data-memo-action="edit">수정</button>
    </div>
    <div class="detail-memo">${person.memo ? escapeHtml(person.memo).replaceAll("\n", "<br>") : "등록된 메모가 없습니다."}</div>
  </div>`;
}

function buildDetailMemoEditHtml(person) {
  return `<div class="detail-section-title detail-section-title-row">
      <span>메모</span>
      <div class="detail-memo-actions">
        <button class="btn btn-outlined btn-sm" data-memo-action="cancel">취소</button>
        <button class="btn btn-filled btn-primary btn-sm" data-memo-action="save">저장</button>
      </div>
    </div>
    <textarea class="form-input detail-memo-input" id="detailMemoInput" rows="5">${escapeHtml(person.memo || "")}</textarea>`;
}

function _buildPauseHistoryHtml(person) {
  const periods = (person.pausedPeriods || [])
    .filter((period) => !period.canceledAt)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  return _detailTable(
    "휴진 이력",
    [
      { label: "기간" },
      { label: "주수", align: "right" },
      { label: "사유" },
      { label: "", align: "right" },
    ],
    periods.map((period) => [
      `${period.startDate || "—"} ~ ${period.endDate || "—"}`,
      period.weeks ? `${period.weeks}주` : "—",
      escapeHtml(period.reason || "—"),
      `<button
        class="btn btn-outlined btn-error btn-sm"
        data-action="cancel-pause-period"
        data-person-id="${person.id}"
        data-period-id="${period.id}"
      >휴진 취소</button>`,
    ]),
    "휴진 이력이 없습니다.",
  );
}

function _buildIncidentHtml(person) {
  // Collect all dated incidents across all months
  const noShowDates = [];
  const cancelDates = [];
  const pauseDates = [];

  for (const entry of Object.values(person.monthlyData || {})) {
    if (Array.isArray(entry.noShowDates))
      noShowDates.push(...entry.noShowDates);
    if (Array.isArray(entry.sameDayCancelDates))
      cancelDates.push(
        ...entry.sameDayCancelDates.map((d) => ({ date: d, type: "당일취소" })),
      );
    if (Array.isArray(entry.advanceCancelDates))
      cancelDates.push(
        ...entry.advanceCancelDates.map((d) => ({ date: d, type: "사전취소" })),
      );
    if (Array.isArray(entry.pauseDates)) pauseDates.push(...entry.pauseDates);
  }

  noShowDates.sort((a, b) => b.localeCompare(a));
  cancelDates.sort((a, b) => b.date.localeCompare(a.date));
  pauseDates.sort((a, b) => b.localeCompare(a));

  if (
    noShowDates.length === 0 &&
    cancelDates.length === 0 &&
    pauseDates.length === 0
  )
    return "";

  const _fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return [
    // noShowDates.length > 0 &&
    //   _detailTable(
    //     `노쇼 이력 (${noShowDates.length}건)`,
    //     [{ label: "날짜" }],
    //     noShowDates.map((d) => [_fmtDate(d)]),
    //   ),
    // cancelDates.length > 0 &&
    //   _detailTable(
    //     `취소 이력 (${cancelDates.length}건)`,
    //     [{ label: "날짜" }, { label: "구분" }],
    //     cancelDates.map(({ date, type }) => [_fmtDate(date), type]),
    //   ),
    pauseDates.length > 0 &&
      _detailTable(
        `휴진 회기 (${pauseDates.length}건)`,
        [{ label: "날짜" }],
        pauseDates.map((d) => [_fmtDate(d)]),
      ),
  ]
    .filter(Boolean)
    .join("");
}
