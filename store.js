// ════════════════════════════
//  State
// ════════════════════════════
let db = {
  dataVersion: DATA_VERSION,
  data: [],
  clients: [],
  settings: {
    excludedEventKeywords: [],
  },
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

// Manual invoice tab state
let manualInvoiceRows = [];
let manualInvoiceRowSeq = 0;

// Client group filter ("" = 전체)
let clientGroupFilter = "";

// Billing panel group tab (defaults to first group = PERSONAL)
let billingGroupFilter = CLIENT_GROUP_OPTIONS[0].value;
let autosaveTimer = null;
let pendingAutosavePromise = null;

// ════════════════════════════
//  Persistence
// ════════════════════════════
function getClientGroupOption(value) {
  return (
    CLIENT_GROUP_OPTIONS.find((option) => option.value === value) ||
    CLIENT_GROUP_OPTIONS[0]
  );
}

function normalizePriceValue(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(+value)) {
      return +value;
    }
  }
  return null;
}

function normalizeDateList(value) {
  return Array.isArray(value)
    ? value.filter((d) => typeof d === "string" && d.length > 0)
    : [];
}

function normalizePausedCalendarEvent(event) {
  const source = event && typeof event === "object" ? event : {};
  return {
    eventId: source.eventId || "",
    originalTitle: source.originalTitle || "",
    pausedTitle: source.pausedTitle || "",
    eventDate: source.eventDate || null,
  };
}

function normalizePausedPeriod(period) {
  const source = period && typeof period === "object" ? period : {};
  return {
    id: source.id || generateId(),
    startDate: source.startDate || null,
    endDate: source.endDate || null,
    weeks: Number.isFinite(+source.weeks) ? +source.weeks : null,
    reason: source.reason || null,
    affectedEvents: Array.isArray(source.affectedEvents)
      ? source.affectedEvents.map(normalizePausedCalendarEvent)
      : [],
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || null,
    canceledAt: source.canceledAt || null,
  };
}

function normalizeSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    ...source,
    excludedEventKeywords: Array.isArray(source.excludedEventKeywords)
      ? source.excludedEventKeywords
          .map((keyword) => String(keyword || "").trim())
          .filter(Boolean)
      : [],
  };
}

function normalizeMonthlyEntry(entry, fallbackPrice = null) {
  const safe = entry && typeof entry === "object" ? entry : {};
  const visitCount = Number.isFinite(+safe.visitCount) ? +safe.visitCount : 0;
  const noShowCount = Number.isFinite(+safe.noShowCount) ? +safe.noShowCount : 0;
  const sameDayCancelCount = Number.isFinite(+safe.sameDayCancelCount)
    ? +safe.sameDayCancelCount
    : 0;
  const advanceCancelCount = Number.isFinite(+safe.advanceCancelCount)
    ? +safe.advanceCancelCount
    : 0;
  const pauseCount = Number.isFinite(+safe.pauseCount) ? +safe.pauseCount : 0;
  const price = normalizePriceValue(safe.price, fallbackPrice);
  const totalPrice = Number.isFinite(+safe.totalPrice)
    ? +safe.totalPrice
    : price == null
      ? 0
      : price * visitCount;
  const lastVisitDate = safe.lastVisitDate || null;
  const paidAt = safe.paidAt || null;
  const noShowDates = normalizeDateList(safe.noShowDates);
  const sameDayCancelDates = normalizeDateList(safe.sameDayCancelDates);
  const advanceCancelDates = normalizeDateList(safe.advanceCancelDates);
  const pauseDates = normalizeDateList(safe.pauseDates);

  return {
    visitCount,
    noShowCount,
    sameDayCancelCount,
    advanceCancelCount,
    pauseCount,
    price,
    totalPrice,
    lastVisitDate,
    paidAt,
    noShowDates,
    sameDayCancelDates,
    advanceCancelDates,
    pauseDates,
  };
}

function normalizePersonShape(person) {
  const p = person && typeof person === "object" ? person : {};
  const active = p.active !== false;
  const group = getClientGroupOption(p.clientGroup);
  const clientType = p.clientType || group.clientType;
  const billingType = p.billingType || group.billingType;
  const priceSource = normalizePriceValue(p.currentPrice, p.price);
  const currentPrice = billingType === "DIRECT" ? priceSource : null;
  const price = billingType === "DIRECT" ? normalizePriceValue(p.price, currentPrice) : null;
  const status = ["ACTIVE", "INACTIVE", "PAUSED"].includes(p.status)
    ? p.status
    : active
      ? "ACTIVE"
      : "INACTIVE";

  const monthlyData = {};
  if (p.monthlyData && typeof p.monthlyData === "object") {
    Object.entries(p.monthlyData).forEach(([month, entry]) => {
      monthlyData[month] = normalizeMonthlyEntry(entry, currentPrice);
    });
  }

  return {
    id: p.id || generateId(),
    name: (p.name || "").trim(),
    active: status !== "INACTIVE" && p.active !== false,
    status,
    deleted: p.deleted === true,
    registeredAt: p.registeredAt || new Date().toISOString(),
    clientType,
    clientGroup: group.value,
    billingType,
    currentPrice,
    price,
    memo: p.memo ?? null,
    pausedPeriods: Array.isArray(p.pausedPeriods)
      ? p.pausedPeriods.map(normalizePausedPeriod)
      : [],
    monthlyData,
  };
}

function normalizeDbSchema(rawDb) {
  const source = rawDb && typeof rawDb === "object" ? rawDb : {};
  const rawData = Array.isArray(source.data)
    ? source.data
    : Array.isArray(source.clients)
      ? source.clients
    : Array.isArray(source.people)
      ? source.people
      : [];
  const rawPrintHistory = Array.isArray(source.printHistory)
    ? source.printHistory
    : Array.isArray(source.history)
      ? source.history
      : [];
  const rawPayments = Array.isArray(source.payments) ? source.payments : [];
  const settings = normalizeSettings(source.settings);

  const normalized = {
    ...source,
    dataVersion: DATA_VERSION,
    data: rawData.map(normalizePersonShape),
    settings,
    printHistory: rawPrintHistory,
    payments: rawPayments,
  };

  // Legacy aliases (기존 코드 호환)
  normalized.clients = normalized.data;
  normalized.people = normalized.data;
  normalized.history = normalized.printHistory;

  return normalized;
}

function needsMigrationBackup(rawDb) {
  if (!rawDb || typeof rawDb !== "object") return false;
  return rawDb.dataVersion !== DATA_VERSION;
}

function backupLegacyData(rawDb, sourceLabel = "localStorage") {
  if (!needsMigrationBackup(rawDb)) return;
  try {
    const list = JSON.parse(
      localStorage.getItem(MIGRATION_BACKUP_STORAGE_KEY) || "[]",
    );
    list.unshift({
      backedUpAt: new Date().toISOString(),
      sourceLabel,
      data: rawDb,
    });
    localStorage.setItem(
      MIGRATION_BACKUP_STORAGE_KEY,
      JSON.stringify(list.slice(0, 5)),
    );
  } catch (e) {
    console.error("[backupLegacyData]", "마이그레이션 백업 저장 실패", e);
  }
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

function isDirectBillingPerson(person) {
  return (person?.billingType || "DIRECT") === "DIRECT";
}

async function autosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
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

function scheduleAutosave(delay = 600) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    pendingAutosavePromise = autosave().finally(() => {
      pendingAutosavePromise = null;
    });
  }, delay);
}

async function flushScheduledAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    await autosave();
    return;
  }
  if (pendingAutosavePromise) await pendingAutosavePromise;
}

function getPersistableDb() {
  const normalized = normalizeDbSchema(db);
  return {
    dataVersion: DATA_VERSION,
    clients: normalized.data,
    data: normalized.data,
    settings: normalized.settings,
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
