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

document.addEventListener("DOMContentLoaded", () => {
  const _weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(YEAR, MONTH - 1, DAY).getDay()];
  document.getElementById("headerDate").textContent =
    `${YEAR}년 ${MONTH}월 ${DAY}일 (${_weekday})`;
  updateMonthHeader();
  updateHistoryHeader();

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
  document
    .getElementById("btn-add-event")
    .addEventListener("click", () => {
      closeCalendarActionsMenu();
      openCalendarEventModal();
    });
  document
    .getElementById("btn-change-cal")
    .addEventListener("click", () => {
      closeCalendarActionsMenu();
      showCalendarSelector();
    });
  document
    .getElementById("btn-signout")
    .addEventListener("click", () => {
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
    .getElementById("btn-close-cal-event")
    .addEventListener("click", closeCalendarEventModal);
  document
    .getElementById("btn-save-cal-event")
    .addEventListener("click", saveCalendarEvent);
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
    .getElementById("btn-history-prev")
    .addEventListener("click", prevHistoryMonth);
  document
    .getElementById("btn-history-next")
    .addEventListener("click", nextHistoryMonth);
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
    .getElementById("btn-close-fix-invalid-status")
    .addEventListener("click", closeFixInvalidStatusModal);
  document
    .getElementById("btn-save-fix-invalid-status")
    .addEventListener("click", saveFixInvalidStatus);
  document
    .getElementById("btn-close-person-detail")
    .addEventListener("click", closePersonDetail);
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
  fixInvalidStatusModalComp = createModalComponent({ id: "fixInvalidStatusModal" });
  personDetailModalComp = createModalComponent({
    id: "personDetailModal",
    selectors: { title: ".detail-name", body: ".detail-body" },
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
    const el = e.target.closest('[data-action="delete-history"]');
    if (!el) return;
    deleteHistory(el.dataset.id);
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

  document.addEventListener("click", (e) => {
    const menu = document.getElementById("calendarActionsMenu");
    if (!menu) return;
    if (!menu.contains(e.target)) closeCalendarActionsMenu();
  });

  loadFromStorage();
});

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
    document.getElementById("noFileOverlay").style.display = "none";
    document.getElementById("fileNameLabel").textContent = "변경사항 없음";
    renderAll();
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
    db = normalizeDbSchema(JSON.parse(text));
    document.getElementById("noFileOverlay").style.display = "none";
    document.getElementById("fileNameLabel").textContent = file.name;
    autosave();
    renderAll();
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
  if (name === "history") renderHistory(historyViewYear, historyViewMonth);
  if (name === "payment")
    renderPaymentHistory(paymentViewYear, paymentViewMonth);
}

function isCurrentMonthView() {
  return monthViewYear === YEAR && monthViewMonth === MONTH;
}

function updateMonthHeader() {
  document.getElementById("monthTitle").textContent =
    `${monthViewYear}년 ${monthViewMonth}월`;
  const nextBtn = document.getElementById("btn-month-next");
  if (nextBtn) nextBtn.disabled = isCurrentMonthView();
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
  if (isCurrentMonthView()) return;
  monthViewMonth += 1;
  if (monthViewMonth > 12) {
    monthViewMonth = 1;
    monthViewYear += 1;
  }
  if (
    monthViewYear > YEAR ||
    (monthViewYear === YEAR && monthViewMonth > MONTH)
  ) {
    monthViewYear = YEAR;
    monthViewMonth = MONTH;
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
    calendarDisplayItems.forEach((p) => selectedForPrint.add(p.id));
    renderCalendarList(calendarDisplayItems, unmatchedItemsList);
  }
}

function deselectAllCalendar() {
  selectedForPrint.clear();
  if (calendarDisplayItems) {
    renderCalendarList(calendarDisplayItems, unmatchedItemsList);
  }
}

function snapshotCurrentMonthPrice(person, price) {
  if (!person || !Number.isFinite(+price)) return;
  if (!person.monthlyData || typeof person.monthlyData !== "object") {
    person.monthlyData = {};
  }

  const monthKey = getMonthKey(YEAR, MONTH);
  const entry = normalizeMonthlyEntry(person.monthlyData[monthKey], +price);
  entry.price = +price;
  entry.totalPrice = entry.price * (Number.isFinite(+entry.visitCount) ? +entry.visitCount : 0);
  person.monthlyData[monthKey] = entry;
}

function openAddPersonModal() {
  editingId = null;
  editModalComp.setTitle("내담자 등록");
  document.getElementById("btn-save-edit").textContent = "등록";
  document.getElementById("editName").value = "";
  document.getElementById("editPrice").value = "";
  document.getElementById("editActive").value = "true";
  editModalComp.open();
}

function openEditModal(id) {
  editingId = id;
  const isNew = !id;
  editModalComp.setTitle(isNew ? "내담자 등록" : "정보 수정");
  document.getElementById("btn-save-edit").textContent = isNew ? "등록" : "저장";

  if (!isNew) {
    const p = db.data.find((x) => x.id === id);
    if (!p) return;
    document.getElementById("editName").value = p.name;
    document.getElementById("editPrice").value = p.currentPrice ?? p.price ?? 0;
    document.getElementById("editActive").value = p.active !== false ? "true" : "false";
  } else {
    document.getElementById("editName").value = "";
    document.getElementById("editPrice").value = "";
    document.getElementById("editActive").value = "true";
  }
  editModalComp.open();
}

function closeEditModal() {
  editModalComp.close();
}

function saveEdit() {
  const isUpdate = !!editingId;
  const name = document.getElementById("editName").value.trim();
  const price = parseInt(document.getElementById("editPrice").value, 10);
  const isActive = document.getElementById("editActive").value === "true";

  if (!name) {
    showToast("이름을 입력하세요.");
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast("가격을 확인하세요.");
    return;
  }

  if (editingId) {
    const p = db.data.find((x) => x.id === editingId);
    if (!p) return;
    const prevName = p.name;
    const prevPrice = p.currentPrice ?? p.price ?? 0;
    p.name = name;
    p.currentPrice = price;
    p.price = price;
    p.active = isActive;
    snapshotCurrentMonthPrice(p, price);
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
      registeredAt: new Date().toISOString(),
      currentPrice: price,
      price,
      monthlyData: {},
    };
    snapshotCurrentMonthPrice(newPerson, price);
    db.data.push(newPerson);
  }

  const savedId = editingId;
  closeEditModal();
  autosave();
  renderAll();
  showToast(isUpdate ? "수정되었습니다." : "등록되었습니다.");
  if (isUpdate && savedId) openPersonDetail(savedId);
}

function toggleActive(id, active) {
  const p = db.data.find((x) => x.id === id);
  if (p) {
    p.active = active;
    autosave();
    renderPeopleList();
  }
}

function deletePerson(id) {
  const target = db.data.find((p) => p.id === id);
  if (!target) return;
  if (!confirm(`"${target.name}"을(를) 데이터베이스에서 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
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
  document.getElementById("editPrice").value = "";
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
              ${ex.price.toLocaleString()}
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
        registeredAt: new Date().toISOString(),
        currentPrice: row.price,
        price: row.price,
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
    const parsedSummary = parseCalendarSummary(event?.summary);
    const name = parsedSummary.baseName;
    if (!name || parsedSummary.isExcludedFromBilling) return;

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
  if (visitCount <= 1 || !end) {
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

function renderInvoices(entries) {
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
          <span class="invoice-recipient-name">${escapeHtml(p.name)}</span> 귀하
        </div>
        <div class="invoice-intro">${monthViewYear}년 ${monthViewMonth}월 상담료는 아래와 같습니다.</div>
        <table class="invoice-detail-table">
          <tr><td>${consultRange}</td></tr>
          <tr><td>${count}회기 X ${unitPrice.toLocaleString()}원</td></tr>
          <tr><td>${total.toLocaleString()}원</td></tr>
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

async function printInvoices() {
  let toPrint = [];

  if (calendarDisplayItems && calendarDisplayItems.length > 0) {
    toPrint = calendarDisplayItems.filter((p) => selectedForPrint.has(p.id));
  } else {
    toPrint = db.data.filter((p) => selectedForPrint.has(p.id));
  }

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

  const consultDateMap = buildConsultDateMap(rawCalendarEvents);
  const monthKey = getMonthKey(monthViewYear, monthViewMonth);
  const toPrintWithDates = toPrint.map((p) => {
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

  const printArea = document.getElementById("print-area");
  printArea.innerHTML = renderInvoices(toPrintWithDates);
  await waitForPrintImages(printArea);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const pendingHistEntry = {
    id: "hist_" + Date.now(),
    year: monthViewYear,
    month: monthViewMonth,
    printedAt: new Date().toISOString(),
    entries: toPrint.map((p) => ({
      name: p.name,
      price: p.price,
      count: p.count,
      total: p.price * p.count,
    })),
  };
  const printCount = toPrint.length;

  const handleAfterPrint = () => {
    window.removeEventListener("afterprint", handleAfterPrint);
    // 같은 월에 여러 번 인쇄해도 각각 누적 저장한다.
    db.printHistory.unshift(pendingHistEntry);
    autosave();
    showToast(`${printCount}명 인쇄 완료 · 이력 누적 저장됨`);
  };

  window.addEventListener("afterprint", handleAfterPrint);
  window.print();
}

// ════════════════════════════
//  History
// ════════════════════════════
function deleteHistory(id) {
  if (!confirm("이 인쇄 이력을 삭제하시겠습니까?")) return;
  const target = db.printHistory.find((h) => h.id === id);
  db.printHistory = db.printHistory.filter((h) => h.id !== id);
  autosave();
  renderHistory(historyViewYear, historyViewMonth);
  showToast("이력이 삭제되었습니다.");
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
        const savedIdx = _calendarList.findIndex((c) => c.id === savedCalendarId);
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
  if (hdr) hdr.style.display = rawCalendarEvents.length > 0 ? "" : "none";
  if (!events || events.length === 0) {
    const monthKey = getMonthKey(monthViewYear, monthViewMonth);
    db.data.forEach((person) => {
      const basePrice = Number.isFinite(+person.currentPrice)
        ? +person.currentPrice
        : +person.price || 0;
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
      person.monthlyData[monthKey].noShowDates = [];
      person.monthlyData[monthKey].sameDayCancelDates = [];
      person.monthlyData[monthKey].advanceCancelDates = [];
      person.monthlyData[monthKey].totalPrice = 0;
      person.monthlyData[monthKey].lastVisitDate = null;
    });

    document.getElementById("peopleList").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg class="icon"><use href="icons.svg#icon-calendar"/></svg></div>
        ${monthViewYear}년 ${monthViewMonth}월 구글 캘린더 일정이 없습니다.
      </div>`;
    setSelectedCountLabels(0);
    calendarDisplayItems = [];
    unmatchedItemsList = [];
    invalidStatusItemsList = [];
    renderCalendarGrid([]);
    document.getElementById("month-data-section").style.display = "block";
    updatePrintButtonState();
    return;
  }

  const grouped = {};
  const invalidGrouped = {};
  const monthKey = getMonthKey(monthViewYear, monthViewMonth);

  db.data.forEach((person) => {
    const basePrice = Number.isFinite(+person.currentPrice)
      ? +person.currentPrice
      : +person.price || 0;
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
    person.monthlyData[monthKey].noShowDates = [];
    person.monthlyData[monthKey].sameDayCancelDates = [];
    person.monthlyData[monthKey].advanceCancelDates = [];
    person.monthlyData[monthKey].totalPrice = 0;
    person.monthlyData[monthKey].lastVisitDate = null;
  });

  events.forEach((event) => {
    const parsed = parseCalendarSummary(event.summary);
    const name = parsed.baseName;
    if (!name) return;

    const startTimeStr = event.start.dateTime || event.start.date;
    const eventDate = new Date(startTimeStr);
    if (!grouped[name]) {
      grouped[name] = {
        count: 0,
        lastDate: null,
        eventIds: [],
        noShowCount: 0,
        sameDayCancelCount: 0,
        advanceCancelCount: 0,
        noShowDates: [],
        sameDayCancelDates: [],
        advanceCancelDates: [],
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

    const dateStr = event.start?.date
      ? event.start.date
      : String(event.start?.dateTime || "").slice(0, 10);
    if (parsed.suffix === "노쇼")    { grouped[name].noShowCount += 1;        grouped[name].noShowDates.push(dateStr); }
    if (parsed.suffix === "당일취소") { grouped[name].sameDayCancelCount += 1; grouped[name].sameDayCancelDates.push(dateStr); }
    if (parsed.suffix === "사전취소") { grouped[name].advanceCancelCount += 1; grouped[name].advanceCancelDates.push(dateStr); }

    if (!parsed.isExcludedFromBilling) {
      grouped[name].count += 1;
    }

    if (!parsed.isExcludedFromLastDate) {
      if (!grouped[name].lastDate || eventDate > grouped[name].lastDate) {
        grouped[name].lastDate = eventDate;
      }
    }
  });

  const displayItems = [];
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
        noShowDates: data.noShowDates,
        sameDayCancelDates: data.sameDayCancelDates,
        advanceCancelDates: data.advanceCancelDates,
        price: personPrice,
        totalPrice: personPrice * data.count,
        lastVisitDate:
          data.lastDate instanceof Date ? data.lastDate.toISOString() : null,
        paidAt: prevMonthEntry.paidAt || null,
      };
      displayItems.push({
        id: dbPerson.id,
        name,
        count: data.count,
        price: personPrice,
        lastDate: data.lastDate,
        noShowCount: data.noShowCount,
        sameDayCancelCount: data.sameDayCancelCount,
        advanceCancelCount: data.advanceCancelCount,
      });
      selectedForPrint.add(dbPerson.id);
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
  renderCalendarList(displayItems, newUnmatched);
  document.getElementById("month-data-section").style.display = "block";
  syncPaymentEntries(displayItems);
  autosave();
}

// ════════════════════════════
//  Calendar CRUD
// ════════════════════════════
function openCalendarEventModal(payload = null) {
  const titleEl = calendarEventModalComp.getTitleEl();
  const saveBtn = document.getElementById("btn-save-cal-event");

  if (payload && payload.eventId) {
    editingCalendarEventId = payload.eventId;
    document.getElementById("calEventName").value = payload.baseName || "";
    document.getElementById("calEventStatus").value = payload.eventStatus || "";
    document.getElementById("calEventDate").value =
      payload.date ||
      `${YEAR}-${String(MONTH).padStart(2, "0")}-${String(DAY).padStart(2, "0")}`;
    document.getElementById("calEventTime").value = payload.time || "10:00";
    if (titleEl)
      titleEl.innerHTML =
        '<svg class="icon"><use href="icons.svg#icon-calendar" /></svg> 캘린더 일정 변경';
    if (saveBtn) saveBtn.textContent = "변경 저장";
  } else {
    editingCalendarEventId = null;
    document.getElementById("calEventName").value = "";
    document.getElementById("calEventStatus").value = "";
    const lastDateInViewMonth = new Date(
      monthViewYear,
      monthViewMonth,
      0,
    ).getDate();
    const safeDay = Math.min(DAY, lastDateInViewMonth);
    document.getElementById("calEventDate").value =
      `${monthViewYear}-${String(monthViewMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    document.getElementById("calEventTime").value = "10:00";
    if (titleEl)
      titleEl.innerHTML =
        '<svg class="icon"><use href="icons.svg#icon-calendar" /></svg> 캘린더 일정 추가';
    if (saveBtn) saveBtn.textContent = "추가";
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
    showToast("이름을 입력하세요.");
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
    registeredAt: new Date().toISOString(),
    currentPrice: price,
    price,
    monthlyData: {},
  };
  db.data.push(newPerson);
  autosave();
  closeAddUnmatchedModal();
  closeUnmatchedModal();
  showToast(`"${item.name}" DB에 추가되었습니다.`);
  processAndRenderEvents(rawCalendarEvents);
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
  const status = document.getElementById("fixInvalidStatusSelect").value || null;
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
    const visitCount = Math.max(0, billedCount - noShowCount - sameDayCancelCount);

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
    db.payments = db.payments.filter((p) => !(p.year === year && p.month === month));
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

function isCurrentHistoryMonthView() {
  return historyViewYear === YEAR && historyViewMonth === MONTH;
}

function updateHistoryHeader() {
  const label = document.getElementById("historyMonthLabel");
  if (label) label.textContent = `${historyViewYear}년 ${historyViewMonth}월`;
  const nextBtn = document.getElementById("btn-history-next");
  if (nextBtn) nextBtn.disabled = isCurrentHistoryMonthView();
}

function prevHistoryMonth() {
  if (historyViewMonth === 1) {
    historyViewYear--;
    historyViewMonth = 12;
  } else {
    historyViewMonth--;
  }
  updateHistoryHeader();
  renderHistory(historyViewYear, historyViewMonth);
}

function nextHistoryMonth() {
  if (isCurrentHistoryMonthView()) return;
  if (historyViewMonth === 12) {
    historyViewYear++;
    historyViewMonth = 1;
  } else {
    historyViewMonth++;
  }
  if (
    historyViewYear > YEAR ||
    (historyViewYear === YEAR && historyViewMonth > MONTH)
  ) {
    historyViewYear = YEAR;
    historyViewMonth = MONTH;
  }
  updateHistoryHeader();
  renderHistory(historyViewYear, historyViewMonth);
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
  const deleteBtn  = document.getElementById("btn-delete-from-detail");
  if (deleteBtn)  deleteBtn.style.display  = "";

  personDetailModalComp.open();
}

function closePersonDetail() {
  personDetailModalComp.close();
}

// ── Detail table component ──────────────────────────────────────────────────
// _detailTable(title, cols, rows, emptyMsg?)
//   cols: [{label, align?}]  (align: 'left'|'right'|'center', default 'left')
//   rows: string[][]         (cell content per column, HTML allowed)
function _detailTable(title, cols, rows, emptyMsg = "기록이 없습니다.") {
  const thCells = cols
    .map(c => `<th style="text-align:${c.align || "left"}">${c.label}</th>`)
    .join("");
  if (rows.length === 0) {
    return `<div class="detail-section">
      <div class="detail-section-title">${title}</div>
      <p class="detail-empty">${emptyMsg}</p>
    </div>`;
  }
  const tbodyRows = rows
    .map(cells => {
      const tds = cells
        .map((v, i) => `<td style="text-align:${cols[i]?.align || "left"}">${v}</td>`)
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
  // Returns [{year, visitCount, noShowCount, sameDayCancelCount, advanceCancelCount, totalPrice}]
  // sorted descending by year
  const byYear = {};
  for (const [key, entry] of Object.entries(person.monthlyData || {})) {
    const y = key.slice(0, 4);
    if (!byYear[y]) {
      byYear[y] = { year: y, visitCount: 0, noShowCount: 0, sameDayCancelCount: 0, advanceCancelCount: 0, totalPrice: 0 };
    }
    byYear[y].visitCount        += +entry.visitCount        || 0;
    byYear[y].noShowCount       += +entry.noShowCount       || 0;
    byYear[y].sameDayCancelCount+= +entry.sameDayCancelCount|| 0;
    byYear[y].advanceCancelCount+= +entry.advanceCancelCount|| 0;
    byYear[y].totalPrice        += +entry.totalPrice        || 0;
  }
  return Object.values(byYear).sort((a, b) => b.year.localeCompare(a.year));
}

function buildPersonDetailHtml(person) {
  const registeredAt = person.registeredAt
    ? new Date(person.registeredAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  // Status badge
  const statusBadge = person.deleted
    ? `<span class="badge badge-muted">삭제됨</span>`
    : person.active !== false
    ? `<span class="badge badge-active">활성</span>`
    : `<span class="badge badge-inactive">비활성</span>`;

  // Meta grid
  const metaHtml = `
    <div class="detail-meta">
      <div class="detail-meta-item">
        <span class="detail-label">등록일</span>
        <span>${registeredAt}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-label">상태</span>
        <span>${statusBadge}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-label">현재 상담료</span>
        <span>${formatCurrency(person.currentPrice)}</span>
      </div>
    </div>`;

  // Yearly summary table
  const yearlyData = _buildYearlyData(person);
  const yearlyHtml = _detailTable(
    "연도별 방문 현황",
    [
      { label: "연도" },
      { label: "방문", align: "right" },
      { label: "노쇼", align: "right" },
      { label: "취소", align: "right" },
      { label: "합계금액", align: "right" },
    ],
    yearlyData.map(d => [
      `${d.year}년`,
      `${d.visitCount}회`,
      d.noShowCount > 0 ? `<span class="text-danger">${d.noShowCount}회</span>` : "—",
      (d.sameDayCancelCount + d.advanceCancelCount) > 0 ? `${d.sameDayCancelCount + d.advanceCancelCount}회` : "—",
      d.totalPrice > 0 ? formatCurrency(d.totalPrice) : "—",
    ]),
    "방문 기록이 없습니다."
  );

  // Price history table
  const priceHistory = _getPriceHistory(person);
  const priceHtml = _detailTable(
    "상담료 변화내역",
    [{ label: "시작 월" }, { label: "상담료", align: "right" }],
    priceHistory.map(h => [_fmtMonthKey(h.monthKey), formatCurrency(h.price)]),
    "변화 내역이 없습니다."
  );

  // No-show / cancel date tables
  const incidentHtml = _buildIncidentHtml(person);

  return `${metaHtml}${yearlyHtml}${priceHtml}${incidentHtml}`;
}

function _buildIncidentHtml(person) {
  // Collect all dated incidents across all months
  const noShowDates = [];
  const cancelDates = [];

  for (const entry of Object.values(person.monthlyData || {})) {
    if (Array.isArray(entry.noShowDates))
      noShowDates.push(...entry.noShowDates);
    if (Array.isArray(entry.sameDayCancelDates))
      cancelDates.push(...entry.sameDayCancelDates.map(d => ({ date: d, type: "당일취소" })));
    if (Array.isArray(entry.advanceCancelDates))
      cancelDates.push(...entry.advanceCancelDates.map(d => ({ date: d, type: "사전취소" })));
  }

  noShowDates.sort((a, b) => b.localeCompare(a));
  cancelDates.sort((a, b) => b.date.localeCompare(a.date));

  if (noShowDates.length === 0 && cancelDates.length === 0) return "";

  const _fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return [
    noShowDates.length > 0 && _detailTable(
      `노쇼 이력 (${noShowDates.length}건)`,
      [{ label: "날짜" }],
      noShowDates.map(d => [_fmtDate(d)])
    ),
    cancelDates.length > 0 && _detailTable(
      `취소 이력 (${cancelDates.length}건)`,
      [{ label: "날짜" }, { label: "구분" }],
      cancelDates.map(({ date, type }) => [_fmtDate(date), type])
    ),
  ].filter(Boolean).join("");
}
