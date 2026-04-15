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
const BILLING_EXCLUDE_SUFFIXES = ['사전취소'];
const LAST_DATE_EXCLUDE_SUFFIXES = [...CALENDAR_EVENT_STATUSES];

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
      isExcludedFromBilling: false,
      isExcludedFromLastDate: false,
    };
  }

  const validMatch = raw.match(/^(.*?)\s*\((노쇼|당일취소|사전취소)\)\s*$/);
  if (validMatch) {
    const baseName = (validMatch[1] || '').trim();
    const suffix = validMatch[2];
    return {
      rawName: raw,
      baseName: baseName || raw,
      suffix,
      eventStatus: suffix,
      invalidStatusRaw: null,
      hasStatusIssue: false,
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
    isExcludedFromBilling: false,
    isExcludedFromLastDate: false,
  };
}
