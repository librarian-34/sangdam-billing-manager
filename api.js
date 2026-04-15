// ════════════════════════════
//  Google API Loading
// ════════════════════════════
let tokenClient;
let gapiInited = false;
let gisInited  = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  try {
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    gapiInited = true;
    maybeEnableAuthButton();
  } catch (err) {
    console.error('[initializeGapiClient]', 'Google API 초기화 실패', err);
    showToast('구글 연동 초기화 실패(콘솔 확인)');
  }
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '',
  });
  gisInited = true;
  maybeEnableAuthButton();
}

function maybeEnableAuthButton() {
  if (gapiInited && gisInited) {
    document.getElementById('btn-auth').style.display = 'inline-flex';
  }
}

// ════════════════════════════
//  Pure API Wrappers
// ════════════════════════════
async function apiListCalendars() {
  const response = await gapi.client.calendar.calendarList.list();
  return response.result.items || [];
}

async function apiListEvents(calendarId, year = YEAR, month = MONTH) {
  const timeMin = new Date(year, month - 1, 1).toISOString();
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();
  const response = await gapi.client.calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    showDeleted: false,
    singleEvents: true,
    maxResults: 250,
    orderBy: 'startTime',
  });
  const items = response.result.items || [];
  if (response.result.nextPageToken) {
    showToast('⚠️ 이번 달 일정이 250건을 초과합니다. 일부 일정이 표시되지 않을 수 있습니다.');
  }
  return items;
}

async function apiInsertEvent(calendarId, resource) {
  const result = await gapi.client.calendar.events.insert({ calendarId, resource });
  return result.result;
}

async function apiDeleteEvent(calendarId, eventId) {
  await gapi.client.calendar.events.delete({ calendarId, eventId });
}

async function apiUpdateEvent(calendarId, eventId, resource) {
  const result = await gapi.client.calendar.events.patch({
    calendarId,
    eventId,
    resource,
  });
  return result.result;
}

async function apiPatchEvents(calendarId, eventIds, resource) {
  await Promise.all(
    eventIds.map(eventId =>
      gapi.client.calendar.events.patch({ calendarId, eventId, resource })
    )
  );
}
