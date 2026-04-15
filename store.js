// ════════════════════════════
//  State
// ════════════════════════════
let db = {
  data: [],
  printHistory: [],
  payments: [],
  people: [],
  history: [],
};
let fileHandle = null;
let selectedForPrint = new Set();
let pendingCSV = [];
let editingId = null;

// Calendar state
let selectedCalendarId   = null;
let rawCalendarEvents    = [];
let unmatchedItemsList   = [];
let invalidStatusItemsList = [];
let addingUnmatchedIdx   = -1;
let matchingUnmatchedIdx = -1;
let fixingInvalidStatusIdx = -1;
let _calendarList        = [];
let calendarDisplayItems = [];

// Payment view navigation
let paymentViewYear  = YEAR;
let paymentViewMonth = MONTH;

// Month tab view navigation
let monthViewYear = YEAR;
let monthViewMonth = MONTH;

// Print history tab view navigation
let historyViewYear = YEAR;
let historyViewMonth = MONTH;

// ════════════════════════════
//  Persistence
// ════════════════════════════
function normalizeMonthlyEntry(entry, fallbackPrice = 0) {
  const safe = entry && typeof entry === "object" ? entry : {};
  const visitCount = Number.isFinite(+safe.visitCount) ? +safe.visitCount : 0;
  const noShowCount = Number.isFinite(+safe.noShowCount) ? +safe.noShowCount : 0;
  const sameDayCancelCount = Number.isFinite(+safe.sameDayCancelCount)
    ? +safe.sameDayCancelCount
    : 0;
  const advanceCancelCount = Number.isFinite(+safe.advanceCancelCount)
    ? +safe.advanceCancelCount
    : 0;
  const price = Number.isFinite(+safe.price) ? +safe.price : fallbackPrice;
  const totalPrice = Number.isFinite(+safe.totalPrice)
    ? +safe.totalPrice
    : price * visitCount;
  const lastVisitDate = safe.lastVisitDate || null;
  const paidAt = safe.paidAt || null;
  const toDateList = (value) =>
    Array.isArray(value)
      ? value.filter((d) => typeof d === "string" && d.length > 0)
      : [];
  const noShowDates = toDateList(safe.noShowDates);
  const sameDayCancelDates = toDateList(safe.sameDayCancelDates);
  const advanceCancelDates = toDateList(safe.advanceCancelDates);

  return {
    visitCount,
    noShowCount,
    sameDayCancelCount,
    advanceCancelCount,
    price,
    totalPrice,
    lastVisitDate,
    paidAt,
    noShowDates,
    sameDayCancelDates,
    advanceCancelDates,
  };
}

function normalizePersonShape(person) {
  const p = person && typeof person === "object" ? person : {};
  const currentPrice = Number.isFinite(+p.currentPrice)
    ? +p.currentPrice
    : Number.isFinite(+p.price)
      ? +p.price
      : 0;

  const monthlyData = {};
  if (p.monthlyData && typeof p.monthlyData === "object") {
    Object.entries(p.monthlyData).forEach(([month, entry]) => {
      monthlyData[month] = normalizeMonthlyEntry(entry, currentPrice);
    });
  }

  return {
    id: p.id || generateId(),
    name: (p.name || "").trim(),
    active: p.active !== false,
    deleted: p.deleted === true,
    registeredAt: p.registeredAt || null,
    currentPrice,
    price: currentPrice, // legacy alias
    monthlyData,
  };
}

function normalizeDbSchema(rawDb) {
  const source = rawDb && typeof rawDb === "object" ? rawDb : {};
  const rawData = Array.isArray(source.data)
    ? source.data
    : Array.isArray(source.people)
      ? source.people
      : [];
  const rawPrintHistory = Array.isArray(source.printHistory)
    ? source.printHistory
    : Array.isArray(source.history)
      ? source.history
      : [];
  const rawPayments = Array.isArray(source.payments) ? source.payments : [];

  const normalized = {
    ...source,
    data: rawData.map(normalizePersonShape),
    printHistory: rawPrintHistory,
    payments: rawPayments,
  };

  // Legacy aliases (기존 코드 호환)
  normalized.people = normalized.data;
  normalized.history = normalized.printHistory;

  return normalized;
}

function getMonthKey(year, month) {
  return `${year}${String(month).padStart(2, "0")}`;
}

function getYearVisitCount(person, year) {
  if (!person || !person.monthlyData) return 0;
  const prefix = String(year);
  return Object.entries(person.monthlyData).reduce((sum, [month, entry]) => {
    if (!month.startsWith(prefix)) return sum;
    return sum + (Number.isFinite(+entry.visitCount) ? +entry.visitCount : 0);
  }, 0);
}

async function autosave() {
  db = normalizeDbSchema(db);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistableDb()));
  await silentSaveToFile();

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const label = document.getElementById("fileNameLabel");
  if (
    label &&
    (label.textContent.startsWith("자동 저장됨") ||
      label.textContent === "변경사항 없음")
  ) {
    label.textContent = `자동 저장됨 · ${hh}:${mm}`;
  }
}

function getPersistableDb() {
  const normalized = normalizeDbSchema(db);
  return {
    data: normalized.data,
    printHistory: normalized.printHistory,
    payments: normalized.payments,
  };
}

async function silentSaveToFile() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(getPersistableDb(), null, 2));
    await writable.close();
  } catch (e) {
    console.error('[silentSaveToFile]', '파일 저장 실패', e);
  }
}
