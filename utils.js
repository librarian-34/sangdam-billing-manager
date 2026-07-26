// ════════════════════════════
//  Utils
// ════════════════════════════
let _toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function generateId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

function formatCurrency(amount) {
  const n = Number(amount);
  return (Number.isFinite(n) ? n : 0).toLocaleString() + '원';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CALENDAR_EVENT_STATUSES = ['노쇼', '당일취소', '사전취소'];
const PAUSE_EVENT_SUFFIX = '휴진';
const BILLING_EXCLUDE_SUFFIXES = ['사전취소', PAUSE_EVENT_SUFFIX];
const LAST_DATE_EXCLUDE_SUFFIXES = [...CALENDAR_EVENT_STATUSES, PAUSE_EVENT_SUFFIX];

function composeCalendarSummary(baseName, eventStatus = null) {
  const name = (baseName || '').trim();
  if (!name) return '';
  if (!eventStatus || !CALENDAR_EVENT_STATUSES.includes(eventStatus)) return name;
  return `${name}(${eventStatus})`;
}

function parseCalendarSummary(summary) {
  const raw = (summary || '').trim();
  if (!raw) {
    return {
      rawName: '',
      baseName: '',
      suffix: null,
      eventStatus: null,
      invalidStatusRaw: null,
      hasStatusIssue: false,
      isPause: false,
      isExcludedFromBilling: false,
      isExcludedFromLastDate: false,
    };
  }

  const validMatch = raw.match(/^(.*?)\s*\((노쇼|당일취소|사전취소|휴진)\)\s*$/);
  if (validMatch) {
    const baseName = (validMatch[1] || '').trim();
    const suffix = validMatch[2];
    return {
      rawName: raw,
      baseName: baseName || raw,
      suffix,
      eventStatus: suffix === PAUSE_EVENT_SUFFIX ? null : suffix,
      invalidStatusRaw: null,
      hasStatusIssue: false,
      isPause: suffix === PAUSE_EVENT_SUFFIX,
      isExcludedFromBilling: BILLING_EXCLUDE_SUFFIXES.includes(suffix),
      isExcludedFromLastDate: LAST_DATE_EXCLUDE_SUFFIXES.includes(suffix),
    };
  }

  const hasParen = raw.includes('(') || raw.includes(')');
  let baseName = raw;
  let invalidStatusRaw = null;
  let hasStatusIssue = false;

  if (raw.includes('(')) {
    const openIdx = raw.indexOf('(');
    baseName = (raw.slice(0, openIdx) || '').trim() || raw;
    const closeIdx = raw.indexOf(')', openIdx + 1);
    invalidStatusRaw = (
      closeIdx >= 0
        ? raw.slice(openIdx + 1, closeIdx)
        : raw.slice(openIdx + 1)
    ).trim();
    hasStatusIssue = hasParen;
  } else if (raw.includes(')')) {
    hasStatusIssue = true;
    invalidStatusRaw = '';
  }

  return {
    rawName: raw,
    baseName,
    suffix: null,
    eventStatus: null,
    invalidStatusRaw,
    hasStatusIssue,
    isPause: false,
    isExcludedFromBilling: false,
    isExcludedFromLastDate: false,
  };
}

function isExcludedEvent(title, keywords) {
  const value = String(title || '');
  return (keywords || []).some((keyword) => value.includes(keyword));
}

function getEventDateString(event) {
  return event?.start?.date
    ? event.start.date
    : String(event?.start?.dateTime || '').slice(0, 10);
}

function isDateWithinRange(dateStr, startDate, endDate) {
  if (!dateStr || !startDate || !endDate) return false;
  return dateStr >= startDate && dateStr <= endDate;
}

function isDateInPausedPeriods(dateStr, pausedPeriods) {
  return (pausedPeriods || []).some((period) => {
    if (!period || period.canceledAt) return false;
    return isDateWithinRange(dateStr, period.startDate, period.endDate);
  });
}

function toPausedTitle(title) {
  const value = String(title || '').trim();
  if (!value) return '';
  return value.includes('(휴진)') ? value : `${value}(휴진)`;
}

function addDaysToDate(dateStr, days) {
  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';
  base.setDate(base.getDate() + days);
  return [
    base.getFullYear(),
    String(base.getMonth() + 1).padStart(2, '0'),
    String(base.getDate()).padStart(2, '0'),
  ].join('-');
}
