// ════════════════════════════
//  Render
// ════════════════════════════
function renderAll() {
  renderPeopleList();
  renderDataTable();
}

/* ── 이번 달 ── */
function renderPeopleList() {
  const active = db.data.filter((p) => p.active !== false && !p.deleted);

  active.forEach((p) => {
    if (!selectedForPrint.has(p.id)) selectedForPrint.add(p.id);
  });
  const activeIds = new Set(active.map((p) => p.id));
  [...selectedForPrint].forEach((id) => {
    if (!activeIds.has(id)) selectedForPrint.delete(id);
  });

  const container = document.getElementById("peopleList");
  if (calendarDisplayItems && calendarDisplayItems.length > 0) return;

  if (active.length === 0) {
    container.classList.add("is-empty");
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg class="icon"><use href="icons.svg#icon-user"/></svg></div>
        등록된 활성 인원이 없습니다.<br>
        내담자 관리 탭에서 추가해주세요.
      </div>`;
    updateCount();
    return;
  }
  container.classList.remove("is-empty");

  container.innerHTML = active
    .map((p) => {
      const hasCount = p.count !== undefined && p.count !== null;
      const countDisplay = hasCount ? p.count : "?";
      const totalDisplay = hasCount ? formatCurrency(p.price * p.count) : "-";
      const checked = selectedForPrint.has(p.id);
      return `
      <div class="person-card ${checked ? "" : "excluded"}" id="card-${p.id}">
        <input type="checkbox" ${checked ? "checked" : ""}
          data-action="toggle-person" data-id="${p.id}">
        <div class="person-name">${escapeHtml(p.name)} 귀하</div>
        <div class="person-formula">${formatCurrency(p.price)} × ${countDisplay}회</div>
        <div class="person-total">${totalDisplay}</div>
      </div>`;
    })
    .join("");

  updateCount();
}

function updateCount() {
  setSelectedCountLabels(selectedForPrint.size);
  updatePrintButtonState();
}

function setSelectedCountLabels(count) {
  const normalized = Number.isFinite(+count) ? +count : 0;
  const main = document.getElementById("selectedCount");
  const header = document.getElementById("selectedCountHeader");
  if (main) main.textContent = String(normalized);
  if (header) header.textContent = String(normalized);
}

function updatePrintButtonState() {
  const printBtn = document.getElementById("btn-print-invoices");
  const warningEl = document.getElementById("printWarningMessage");
  if (!printBtn) return;

  const selectedCount = selectedForPrint?.size || 0;
  const hasInvalidStatus =
    Array.isArray(invalidStatusItemsList) && invalidStatusItemsList.length > 0;
  const isDisabled = selectedCount === 0 || hasInvalidStatus;

  printBtn.disabled = isDisabled;

  if (hasInvalidStatus) {
    printBtn.title = "상태 오류 항목을 먼저 수정해주세요.";
    if (warningEl) {
      warningEl.textContent = "상태 오류 항목을 먼저 수정해주세요";
      warningEl.classList.add("warning");
    }
  } else if (selectedCount === 0) {
    printBtn.title = "선택된 청구 대상이 없습니다.";
    if (warningEl) {
      warningEl.textContent = "선택된 청구 대상이 없습니다.";
      warningEl.classList.remove("warning");
    }
  } else {
    printBtn.title = "";
    if (warningEl) {
      warningEl.textContent = "";
      warningEl.classList.remove("warning");
    }
  }
}
/* ── 데이터 테이블 ── */
function renderDataTable() {
  const tbody = document.getElementById("dataTableBody");
  const keyword = (document.getElementById("personSearch")?.value || "")
    .trim()
    .toLowerCase();

  // 검색 시 삭제됨 포함, 평상시엔 삭제됨 제외
  const rows = db.data.filter((p) => {
    const nameMatch = keyword
      ? (p.name || "").toLowerCase().includes(keyword)
      : true;
    if (!nameMatch) return false;
    if (!keyword && p.deleted) return false;
    return true;
  });

  if (rows.length === 0) {
    if (keyword) {
      tbody.innerHTML = `
        <tr><td colspan="4" style="text-align:center;color:var(--on-surface-variant);padding:24px 32px 16px;">
          검색 결과가 없습니다.
          <br><br>
          <button class="btn btn-filled btn-primary btn-sm"
            data-action="add-searched-person" data-name="${escapeHtml(keyword)}">
            <svg class="icon"><use href="icons.svg#icon-add"/></svg> "${escapeHtml(keyword)}" 바로 등록
          </button>
        </td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--on-surface-variant);padding:32px;">등록된 인원이 없습니다</td></tr>`;
    }
    return;
  }

  tbody.innerHTML = rows
    .map((p) => {
      const isDeleted = p.deleted === true;
      const active = p.active !== false;
      const currentPrice = Number.isFinite(+p.currentPrice)
        ? +p.currentPrice
        : +p.price || 0;
      const yearlyVisits = getYearVisitCount(p, YEAR);
      const statusBadge = isDeleted
        ? `<span class="badge badge-muted">삭제됨</span>`
        : active
          ? `<span class="badge badge-active">활성</span>`
          : `<span class="badge badge-inactive">비활성</span>`;

      if (isDeleted) {
        return `
        <tr data-id="${p.id}" style="opacity:0.45;">
          <td><s>${escapeHtml(p.name)}</s> <span style="font-size:11px;color:var(--on-surface-hint);">(삭제됨)</span></td>
          <td>${formatCurrency(currentPrice)}</td>
          <td>${yearlyVisits}회</td>
          <td>${statusBadge}</td>
        </tr>`;
      }

      return `
      <tr data-id="${p.id}" style="cursor:pointer;">
        <td>
          <strong class="table-name-link">
            ${escapeHtml(p.name)}
            <svg class="icon table-name-indicator"><use href="icons.svg#icon-arrow-up-right"/></svg>
          </strong>
        </td>
        <td>${formatCurrency(currentPrice)}</td>
        <td>${yearlyVisits}회</td>
        <td>${statusBadge}</td>
      </tr>`;
    })
    .join("");
}

/* ── 캘린더 선택 ── */
function renderCalendarSelector(calendars) {
  const container = document.getElementById("calendar-selector");
  const roleLabel = {
    owner: "소유자",
    writer: "편집 가능",
    reader: "읽기 전용",
    freeBusyReader: "바쁨/한가함만",
  };

  if (calendars.length === 0) {
    container.innerHTML = `<div class="info-box">접근 가능한 캘린더가 없습니다.</div>`;
    container.style.display = "block";
    return;
  }

  container.innerHTML = `
    <div class="cal-selector-title">사용할 캘린더를 선택하세요</div>
    <div class="cal-selector-list">
      ${calendars
        .map(
          (cal, idx) => `
        <div class="cal-selector-item" data-action="select-calendar" data-idx="${idx}">
          <div class="cal-color-dot" style="background:${escapeHtml(cal.backgroundColor || '#4285F4')};"></div>
          <div class="cal-item-info">
            <div class="cal-item-name">${escapeHtml(cal.summary)}</div>
            <div class="cal-item-role">${escapeHtml(roleLabel[cal.accessRole] || cal.accessRole)}</div>
          </div>
          <button class="btn btn-filled btn-primary btn-sm">선택</button>
        </div>`,
        )
        .join("")}
    </div>`;
  container.style.display = "block";
}

/* ── 캘린더 그리드 ── */
function renderCalendarGrid(events) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = new Date(monthViewYear, monthViewMonth - 1, 1).getDay();
  const lastDate = new Date(monthViewYear, monthViewMonth, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day empty";
    grid.appendChild(cell);
  }

  const dayCells = [];
  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    const label = document.createElement("div");
    label.className = "calendar-date";
    label.textContent = d;
    cell.appendChild(label);
    dayCells.push(cell);
    grid.appendChild(cell);
  }

  events.forEach((event) => {
    const summary = event.summary ? event.summary.trim() : "";
    if (!summary) return;
    const startTimeStr = event.start.dateTime || event.start.date;
    const eventDate = new Date(startTimeStr);
    if (
      eventDate.getMonth() + 1 !== monthViewMonth ||
      eventDate.getFullYear() !== monthViewYear
    )
      return;

    const day = eventDate.getDate();
    const parsed = parseCalendarSummary(summary);
    const dbPerson = db.data.find((p) => p.name === parsed.baseName);
    const isMatched = dbPerson && dbPerson.active !== false;

    const evtEl = document.createElement("div");
    evtEl.className = isMatched
      ? "calendar-event"
      : "calendar-event unmatched-event";
    const nameSpan = document.createElement("span");
    nameSpan.className = "calendar-event-name";
    nameSpan.textContent = parsed.baseName;
    evtEl.appendChild(nameSpan);
    if (parsed.suffix) {
      const badge = document.createElement("span");
      const statusClass =
        parsed.suffix === "노쇼"
          ? "no-show"
          : parsed.suffix === "당일취소"
            ? "same-day-cancel"
            : "advance-cancel";
      badge.className = `calendar-event-badge ${statusClass}`;
      badge.textContent = parsed.suffix;
      evtEl.appendChild(badge);
    } else if (parsed.hasStatusIssue) {
      const badge = document.createElement("span");
      badge.className = "calendar-event-badge invalid-status";
      badge.textContent = "상태오류";
      evtEl.appendChild(badge);
    }
    evtEl.title = isMatched
      ? `${summary} (클릭하여 일정 변경)`
      : `${summary} — DB 미등록 (클릭하여 일정 변경)`;
    evtEl.style.cursor = "pointer";
    evtEl.dataset.action = "edit-cal-event";
    evtEl.dataset.eventId = event.id;
    evtEl.dataset.baseName = parsed.baseName;
    evtEl.dataset.eventStatus = parsed.suffix || "";
    evtEl.dataset.dateStr = `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;
    evtEl.dataset.date = event.start.date
      ? event.start.date
      : event.start.dateTime.slice(0, 10);
    evtEl.dataset.time = event.start.dateTime
      ? event.start.dateTime.slice(11, 16)
      : "10:00";

    dayCells[day - 1].appendChild(evtEl);
  });

  const totalCells = firstDay + lastDate;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailing; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day empty";
    grid.appendChild(cell);
  }
}

/* ── 캘린더 목록 (청구 대상) ── */
function renderCalendarList(displayItems, unmatched) {
  const container = document.getElementById("peopleList");
  calendarDisplayItems = displayItems;

  // 매칭 건수 & 미매칭 버튼 업데이트
  document.getElementById("matchedCount").textContent = displayItems.length;
  const unmatchedBtn = document.getElementById("btn-unmatched-summary");
  const invalidStatusBtn = document.getElementById(
    "btn-invalid-status-summary",
  );
  if (unmatched && unmatched.length > 0) {
    document.getElementById("unmatchedCount").textContent = unmatched.length;
    unmatchedBtn.style.display = "inline-flex";
  } else {
    unmatchedBtn.style.display = "none";
  }
  if (invalidStatusItemsList && invalidStatusItemsList.length > 0) {
    document.getElementById("invalidStatusCount").textContent =
      invalidStatusItemsList.length;
    invalidStatusBtn.style.display = "inline-flex";
  } else {
    invalidStatusBtn.style.display = "none";
  }

  if (displayItems.length === 0) {
    container.classList.add("is-empty");
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg class="icon"><use href="icons.svg#icon-user"/></svg></div>
        캘린더와 DB에 매치되는 활성 인원이 없습니다.<br>
        이름이 동일한지 확인해주세요.
      </div>`;
    setSelectedCountLabels(0);
    updatePrintButtonState();
    return;
  }

  container.classList.remove("is-empty");

  container.innerHTML = displayItems
    .map((p) => {
      const total = formatCurrency(p.price * p.count);
      const checked = selectedForPrint.has(p.id);
      const lastDateStr = p.lastDate
        ? `${p.lastDate.getMonth() + 1}/${p.lastDate.getDate()}`
        : "이번 달 내담 없음";
      const statusBits = [];
      if (p.noShowCount > 0) statusBits.push(`노쇼 ${p.noShowCount}회`);
      if (p.sameDayCancelCount > 0)
        statusBits.push(`당일취소 ${p.sameDayCancelCount}회`);
      if (p.advanceCancelCount > 0)
        statusBits.push(`사전취소 ${p.advanceCancelCount}회`);
      const statusHtml =
        statusBits.length > 0
          ? `<div class="person-status">${statusBits.join(" · ")}</div>`
          : "";
      return `
      <div class="person-card ${checked ? "" : "excluded"}" id="card-${p.id}">
        <input type="checkbox" ${checked ? "checked" : ""}
          data-action="toggle-calendar-person" data-id="${p.id}">
        <div class="person-name">
          ${escapeHtml(p.name)} 귀하
          <div class="person-last-date">
            마지막 내담일: ${escapeHtml(lastDateStr)}
          </div>
          ${statusHtml}
        </div>
        <div class="person-formula">${formatCurrency(p.price)} × ${p.count}회</div>
        <div class="person-total">${total}</div>
      </div>`;
    })
    .join("");

  setSelectedCountLabels(selectedForPrint.size);
  updatePrintButtonState();
}

/* ── 미매칭 모달 내용 ── */
function renderUnmatchedModal() {
  const container = document.getElementById("unmatchedModalList");
  if (!unmatchedItemsList || unmatchedItemsList.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:16px 0">미매칭 항목이 없습니다.</div>`;
    return;
  }
  container.innerHTML = unmatchedItemsList
    .map(
      (item, idx) => `
    <div class="unmatched-card">
      <div class="unmatched-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="unmatched-count">${item.count}회</span>
      </div>
      <div class="unmatched-actions">
        <button class="btn btn-outlined btn-primary btn-sm" data-action="add-unmatched" data-idx="${idx}">신규 등록</button>
        <button class="btn btn-filled btn-primary btn-sm" data-action="open-match" data-idx="${idx}">기존과 매칭</button>
      </div>
    </div>`,
    )
    .join("");
}

/* ── 상태 형식 오류 모달 내용 ── */
function renderInvalidStatusModal() {
  const container = document.getElementById("invalidStatusModalList");
  if (!invalidStatusItemsList || invalidStatusItemsList.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:16px 0">상태 형식 오류 항목이 없습니다.</div>`;
    return;
  }

  container.innerHTML = invalidStatusItemsList
    .map(
      (item, idx) => `
    <div class="unmatched-card">
      <div class="unmatched-info">
        <strong>${escapeHtml(item.baseName)}</strong>
        <div class="invalid-status-raw">현재 상태: (${escapeHtml(item.invalidStatusRaw || "비어있음")})</div>
        <span class="unmatched-count">${item.count}회</span>
      </div>
      <div class="unmatched-actions">
        <button class="btn btn-filled btn-primary btn-sm" data-action="fix-invalid-status" data-idx="${idx}">일괄 수정</button>
      </div>
    </div>`,
    )
    .join("");
}

/* ── 입금 이력 ── */
function renderPaymentHistory(year, month) {
  document.getElementById("paymentMonthLabel").textContent =
    `${year}년 ${month}월`;

  const isCurrentMonth = year === YEAR && month === MONTH;
  document.getElementById("btn-payment-next").disabled = isCurrentMonth;

  const container = document.getElementById("paymentContent");
  const record = db.payments.find((p) => p.year === year && p.month === month);

  if (!record || record.entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        ${year}년 ${month}월 입금 기록이 없습니다.<br>
        인쇄를 먼저 진행하면 자동으로 항목이 생성됩니다.
      </div>`;
    return;
  }

  const totalAmount = record.entries.reduce((s, e) => s + (e.total || 0), 0);
  const paidAmount = record.entries.reduce(
    (s, e) => s + (e.paidAt ? e.total || 0 : 0),
    0,
  );
  const unpaidAmount = totalAmount - paidAmount;

  container.innerHTML = `
    <div class="payment-summary">
      <span class="payment-summary-total">총 ${record.entries.length}명</span>
      <span class="payment-amount payment-amount-total">총금액 ${totalAmount.toLocaleString()}원</span>
      <span class="payment-amount payment-amount-paid">납부금액 ${paidAmount.toLocaleString()}원</span>
      <span class="payment-amount payment-amount-unpaid">미납금액 ${unpaidAmount.toLocaleString()}원</span>
    </div>
    <table class="data-table payment-table">
      <thead>
        <tr>
          <th>이름</th>
          <th>횟수 (총청구 | 방문/노쇼/사전취소/당일취소)</th>
          <th>마지막 상담일</th>
          <th>청구액</th>
          <th>납부일</th>
          <th>상태</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${record.entries
          .map((e) => {
            const billedCount = Number.isFinite(+e.billedCount)
              ? +e.billedCount
              : Number.isFinite(+e.count)
              ? +e.count
              : 0;
            const noShowCount = Number.isFinite(+e.noShowCount) ? +e.noShowCount : 0;
            const sameDayCancelCount = Number.isFinite(+e.sameDayCancelCount)
              ? +e.sameDayCancelCount
              : 0;
            const advanceCancelCount = Number.isFinite(+e.advanceCancelCount)
              ? +e.advanceCancelCount
              : 0;
            const visitCount = Number.isFinite(+e.visitCount)
              ? +e.visitCount
              : Math.max(0, billedCount - noShowCount - sameDayCancelCount);
            const lastDateStr = e.lastDate
              ? (() => {
                  const d = new Date(e.lastDate);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                })()
              : "-";
            const isPaid = !!e.paidAt;
            return `
            <tr class="${isPaid ? "payment-row-paid" : ""}">
              <td><strong>${escapeHtml(e.name)}</strong></td>
              <td>
                <div class="payment-count-breakdown">
                  <strong>${billedCount}회</strong>
                  <span class="payment-count-sep">|</span>
                  ${visitCount}회 / ${noShowCount}회 / ${advanceCancelCount}회 / ${sameDayCancelCount}회
                </div>
              </td>
              <td>${lastDateStr}</td>
              <td>${(e.total || 0).toLocaleString()}원</td>
              <td>
                <input type="date" class="form-input payment-date-input"
                  value="${e.paidAt || ""}"
                  data-action="set-paid-at"
                  data-person-id="${e.personId}"
                  data-year="${year}"
                  data-month="${month}">
              </td>
              <td>
                ${
                  isPaid
                    ? `<span class="badge badge-paid">납부</span>`
                    : `<span class="badge badge-unpaid">미납</span>`
                }
              </td>
              <td>
                <button class="btn btn-outlined btn-error btn-sm"
                  data-action="delete-payment-entry"
                  data-person-id="${e.personId}"
                  data-year="${year}"
                  data-month="${month}">삭제</button>
              </td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;
}

/* ── 인쇄 이력 ── */
function renderHistory(year = historyViewYear, month = historyViewMonth) {
  const monthLabel = document.getElementById("historyMonthLabel");
  if (monthLabel) monthLabel.textContent = `${year}년 ${month}월`;
  const nextBtn = document.getElementById("btn-history-next");
  if (nextBtn) nextBtn.disabled = year === YEAR && month === MONTH;

  const container = document.getElementById("historyContent");
  const records = db.printHistory
    .filter((h) => h.year === year && h.month === month)
    .sort((a, b) => new Date(b.printedAt) - new Date(a.printedAt));

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg class="icon"><use href="icons.svg#icon-calendar"/></svg></div>
        ${year}년 ${month}월 인쇄 이력이 없습니다.
      </div>`;
    return;
  }

  container.innerHTML = records
    .map((h) => {
      const total = h.entries.reduce((s, e) => s + (e.total || 0), 0);
      const printedAt = new Date(h.printedAt);
      const printedDate = printedAt.toLocaleDateString("ko-KR");
      const printedWeekday = printedAt.toLocaleDateString("ko-KR", {
        weekday: "short",
      });
      const printedTime = printedAt.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
      <div class="history-block">
        <div class="history-month-header">
          <div class="history-printed-at">${printedDate} (${printedWeekday})</div>
          <span class="history-meta">
            ${printedTime} 출력 &nbsp;·&nbsp; ${h.entries.length}명 &nbsp;·&nbsp; 합계 ${total.toLocaleString()}원
          </span>
          <button class="btn btn-outlined btn-error btn-sm" style="margin-left:auto;"
            data-action="delete-history" data-id="${h.id}"><svg class="icon"><use href="icons.svg#icon-delete"/></svg> 삭제</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>가격</th>
              <th>횟수</th>
              <th>청구액</th>
            </tr>
          </thead>
          <tbody>
            ${h.entries
              .map(
                (e) => `
              <tr>
                <td>${escapeHtml(e.name)}</td>
                <td>${(e.price || 0).toLocaleString()}원</td>
                <td>${e.count !== undefined ? e.count + "회" : "-"}</td>
                <td><strong>${(e.total || 0).toLocaleString()}원</strong></td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    })
    .join("");
}
