# 상담 정산 사이트 기능 개선 작업 계획서

## 0. 문서 목적

본 문서는 상담 정산 사이트의 기존 로컬 데이터 구조를 유지하면서, 다음 기능을 안전하게 추가하기 위한 실행용 작업 문서이다.

- 기존 데이터 → 신규 데이터 구조 마이그레이션
- 내담자 그룹 추가
- 기관 내담자 처리
- 휴진 상태 및 휴진 이력 관리
- 휴진 회기 정산 제외
- 정산 제외 일정 관리
- 내담자 상세 메모 및 월별 방문정보 개선
- 기존 UI/사용성 수정사항 반영

본 프로젝트는 별도 서버 DB가 아니라 **사용자의 로컬 폴더에 데이터를 저장하는 구조**이므로, 업데이트 시 기존 데이터가 깨지지 않도록 마이그레이션과 백업 처리를 우선한다.

---

# 1. 핵심 설계 원칙

## 1-1. 기존 데이터 재등록 요구 금지

기존 내담자, 월별 정산, 방문 기록, 결제 기록은 사용자에게 중요한 데이터이다.

따라서 업데이트 후 사용자에게 기존 데이터를 다시 등록하도록 요구하지 않는다.  
대신 앱 실행 또는 데이터 로드 시점에 기존 데이터를 신규 구조로 자동 변환한다.

---

## 1-2. 데이터 로드 시점에 마이그레이션 수행

마이그레이션은 저장 시점이 아니라 **데이터를 불러오는 시점**에 수행한다.

### 권장 흐름

```text
1. 앱 실행
2. 로컬 데이터 파일 읽기
3. 데이터 버전 확인
4. 구버전 데이터인 경우 백업 파일 생성
5. 구버전 데이터를 신규 구조로 변환
6. 신규 구조 데이터를 저장
7. 앱 내부에서는 신규 구조만 사용
```

---

## 1-3. 데이터 버전 관리 추가

기존 데이터에는 구조 버전이 없으므로, 신규 구조부터는 최상위에 `dataVersion`을 추가한다.

### 신규 최상위 구조 예시

```ts
type AppData = {
  dataVersion: number;
  clients: Client[];
  settings: AppSettings;
};
```

### 예시

```json
{
  "dataVersion": 2,
  "clients": [],
  "settings": {
    "excludedEventKeywords": []
  }
}
```

---

## 1-4. 마이그레이션 전 백업 생성

구버전 데이터를 신버전으로 변환하기 전, 기존 파일을 백업한다.

### 예시

```text
data.json
data.backup.20260626-143000.json
```

### 백업 목적

- 변환 실패 시 복구 가능
- 기존 정산/방문 기록 유실 방지
- 사용자 데이터 신뢰성 확보

---

## 1-5. 데이터의 성격 분리

필드 추가 시 아래 기준으로 성격을 분리한다.

| 항목                  | 성격             | 저장 위치     |
| --------------------- | ---------------- | ------------- |
| 내담자 이름           | 기본 정보        | client        |
| 개인/기관 구분        | 분류             | client        |
| 직접 청구 여부        | 정산 정책        | client        |
| 현재 금액             | 현재 청구 기준   | client        |
| 휴진 기간             | 이력/기간 데이터 | pausedPeriods |
| 월별 방문 수          | 집계 결과        | monthlyData   |
| 휴진 n회              | 집계 결과        | monthlyData   |
| 정산 제외 일정 키워드 | 사용자 설정      | settings      |

---

# 2. 신규 데이터 구조

## 2-1. Client 구조

기존 구조를 크게 무너뜨리지 않되, 신규 기능에 필요한 필드를 추가한다.

```ts
type ClientStatus = "ACTIVE" | "INACTIVE" | "PAUSED";

type ClientType = "PERSONAL" | "ORGANIZATION";

type BillingType = "DIRECT" | "EXTERNAL";

type ClientGroup = "PERSONAL" | "ORG_SIMSIM" | "ORG_SEJONGRO";

type Client = {
  id: string;
  name: string;

  /**
   * 기존 호환용 필드.
   * 신규 로직에서는 status를 기준으로 판단한다.
   */
  active: boolean;

  status: ClientStatus;
  deleted: boolean;
  registeredAt: string;

  /**
   * 내담자의 유형.
   * 개인 내담자인지 기관 연결 내담자인지 구분한다.
   */
  clientType: ClientType;

  /**
   * 실제 그룹/기관 구분.
   * 1차 구현에서는 하드코딩 enum으로 관리한다.
   */
  clientGroup: ClientGroup;

  /**
   * 청구 방식.
   * 정산 로직에서는 clientGroup이 아니라 billingType을 기준으로 직접 청구 여부를 판단한다.
   */
  billingType: BillingType;

  /**
   * 기관 내담자는 직접 청구 대상이 아니므로 null을 허용한다.
   */
  currentPrice: number | null;
  price: number | null;

  memo: string | null;

  /**
   * 휴진 이력.
   * 현재 상태뿐 아니라 과거 휴진 기록 보존을 위해 배열로 관리한다.
   */
  pausedPeriods: PausedPeriod[];

  monthlyData: Record<string, MonthlyData>;
};
```

---

## 2-2. PausedPeriod 구조

휴진은 단순 현재 상태가 아니라 기간과 이력을 가진 데이터로 관리한다.

```ts
type PausedPeriod = {
  id: string;

  /**
   * YYYY-MM-DD
   */
  startDate: string;

  /**
   * YYYY-MM-DD
   */
  endDate: string;

  /**
   * 4주, 6주, 8주 등 사전 선택값.
   * 자유 입력인 경우 null 또는 별도 값으로 처리 가능.
   */
  weeks: number | null;

  reason: string | null;

  /**
   * 구글 캘린더 이벤트명을 실제로 변경하는 경우,
   * 원복 가능성을 위해 영향받은 이벤트 정보를 보관한다.
   */
  affectedEvents: PausedCalendarEvent[];

  createdAt: string;
  updatedAt: string | null;

  /**
   * 휴진 취소 또는 잘못 등록된 휴진을 논리적으로 취소하기 위한 값.
   */
  canceledAt: string | null;
};
```

---

## 2-3. PausedCalendarEvent 구조

구글 캘린더 이벤트명을 `김말차` → `김말차(휴진)`으로 변경할 경우, 원래 제목을 보관해야 한다.

```ts
type PausedCalendarEvent = {
  eventId: string;
  originalTitle: string;
  pausedTitle: string;

  /**
   * YYYY-MM-DD
   */
  eventDate: string;
};
```

---

## 2-4. MonthlyData 구조

`monthlyData`는 원본 데이터가 아니라 월별 집계 결과로 본다.  
휴진 관련 집계값을 추가한다.

```ts
type MonthlyData = {
  visitCount: number;
  noShowCount: number;
  sameDayCancelCount: number;
  advanceCancelCount: number;

  /**
   * 휴진 회기 수.
   */
  pauseCount: number;

  /**
   * 해당 월 정산 기준 금액.
   * 기관 내담자는 null 가능.
   */
  price: number | null;

  totalPrice: number;

  lastVisitDate: string | null;
  paidAt: string | null;

  noShowDates: string[];
  sameDayCancelDates: string[];
  advanceCancelDates: string[];

  /**
   * 휴진 처리된 회기 날짜 목록.
   */
  pauseDates: string[];
};
```

---

## 2-5. AppSettings 구조

사용자 설정성 데이터를 별도 영역으로 둔다.

```ts
type AppSettings = {
  /**
   * 입력한 단어가 포함된 일정은 월별정산에서 제외한다.
   */
  excludedEventKeywords: string[];
};
```

---

# 3. 기존 데이터 → 신규 데이터 마이그레이션

## 3-1. 마이그레이션 기본 정책

기존 데이터에는 내담자 그룹, 휴진, 메모 정보가 없으므로 안전한 기본값을 넣는다.

| 신규 필드                      | 기본값                                   |
| ------------------------------ | ---------------------------------------- |
| status                         | active가 true면 ACTIVE, false면 INACTIVE |
| clientType                     | PERSONAL                                 |
| clientGroup                    | PERSONAL                                 |
| billingType                    | DIRECT                                   |
| memo                           | null                                     |
| pausedPeriods                  | []                                       |
| monthlyData.pauseCount         | 0                                        |
| monthlyData.pauseDates         | []                                       |
| settings.excludedEventKeywords | []                                       |

---

## 3-2. 기존 가격 필드 처리

기존 데이터의 `currentPrice`, `price`를 최대한 보존한다.

```ts
currentPrice: typeof legacy.currentPrice === "number"
  ? legacy.currentPrice
  : typeof legacy.price === "number"
    ? legacy.price
    : null;

price: typeof legacy.price === "number"
  ? legacy.price
  : typeof legacy.currentPrice === "number"
    ? legacy.currentPrice
    : null;
```

---

## 3-3. 마이그레이션 함수 예시

```ts
function migrateClientV1ToV2(client: LegacyClient): Client {
  const active = client.active ?? true;

  return {
    id: client.id,
    name: client.name,

    active,
    status: active ? "ACTIVE" : "INACTIVE",
    deleted: client.deleted ?? false,
    registeredAt: client.registeredAt ?? new Date().toISOString(),

    clientType: "PERSONAL",
    clientGroup: "PERSONAL",
    billingType: "DIRECT",

    currentPrice:
      typeof client.currentPrice === "number"
        ? client.currentPrice
        : typeof client.price === "number"
          ? client.price
          : null,

    price:
      typeof client.price === "number"
        ? client.price
        : typeof client.currentPrice === "number"
          ? client.currentPrice
          : null,

    memo: null,
    pausedPeriods: [],

    monthlyData: migrateMonthlyDataV1ToV2(client.monthlyData ?? {}),
  };
}
```

---

## 3-4. 월별 데이터 마이그레이션 예시

```ts
function migrateMonthlyDataV1ToV2(
  monthlyData: Record<string, LegacyMonthlyData>,
): Record<string, MonthlyData> {
  return Object.fromEntries(
    Object.entries(monthlyData).map(([monthKey, data]) => [
      monthKey,
      {
        visitCount: data.visitCount ?? 0,
        noShowCount: data.noShowCount ?? 0,
        sameDayCancelCount: data.sameDayCancelCount ?? 0,
        advanceCancelCount: data.advanceCancelCount ?? 0,

        pauseCount: 0,

        price: typeof data.price === "number" ? data.price : null,
        totalPrice: data.totalPrice ?? 0,
        lastVisitDate: data.lastVisitDate ?? null,
        paidAt: data.paidAt ?? null,

        noShowDates: data.noShowDates ?? [],
        sameDayCancelDates: data.sameDayCancelDates ?? [],
        advanceCancelDates: data.advanceCancelDates ?? [],

        pauseDates: [],
      },
    ]),
  );
}
```

---

## 3-5. 데이터 로드 함수 처리 방향

```ts
function normalizeAppData(raw: unknown): AppData {
  // 아주 구버전: clients 배열만 저장되어 있던 경우
  if (Array.isArray(raw)) {
    return {
      dataVersion: 2,
      clients: raw.map(migrateClientV1ToV2),
      settings: {
        excludedEventKeywords: [],
      },
    };
  }

  // dataVersion이 없는 객체형 구버전
  if (isObject(raw) && !("dataVersion" in raw)) {
    const maybeClients = Array.isArray((raw as any).clients)
      ? (raw as any).clients
      : [];

    return {
      dataVersion: 2,
      clients: maybeClients.map(migrateClientV1ToV2),
      settings: {
        excludedEventKeywords: [],
      },
    };
  }

  // 이미 버전이 있는 경우
  return migrateToLatest(raw as AppData);
}
```

---

## 3-6. 마이그레이션 안전성 조건

마이그레이션은 여러 번 실행되어도 데이터가 중복되거나 망가지지 않아야 한다.

주의할 것:

```ts
// 나쁜 예: 실행할 때마다 빈 휴진 데이터가 추가될 수 있음
client.pausedPeriods.push(createEmptyPausePeriod());
```

권장:

```ts
pausedPeriods: Array.isArray(client.pausedPeriods) ? client.pausedPeriods : [];
```

---

# 4. 내담자 그룹 설계

## 4-1. 1차 구현 방향

현재 그룹은 아래 정도로 제한되어 있다.

```text
개인
기관 - 심심
기관 - 세종로
```

따라서 1차 구현에서는 별도의 그룹 관리 기능을 만들지 않고, 하드코딩 enum으로 시작한다.

단, 하드코딩 문자열을 코드 곳곳에 직접 쓰지 않고, 옵션 상수 한 곳에서 관리한다.

---

## 4-2. 그룹 옵션 상수

```ts
export const CLIENT_GROUP_OPTIONS = [
  {
    value: "PERSONAL",
    label: "개인내담자",
    clientType: "PERSONAL",
    billingType: "DIRECT",
  },
  {
    value: "ORG_SIMSIM",
    label: "기관내담자 - 심심",
    clientType: "ORGANIZATION",
    billingType: "EXTERNAL",
  },
  {
    value: "ORG_SEJONGRO",
    label: "기관내담자 - 세종로",
    clientType: "ORGANIZATION",
    billingType: "EXTERNAL",
  },
] as const;
```

---

## 4-3. 등록 시 처리

사용자가 그룹을 선택하면, 선택한 그룹 기준으로 `clientType`, `billingType`, `currentPrice`를 세팅한다.

```ts
const selectedGroup = CLIENT_GROUP_OPTIONS.find(
  (option) => option.value === form.clientGroup,
);

const clientType = selectedGroup.clientType;
const billingType = selectedGroup.billingType;

const currentPrice =
  selectedGroup.billingType === "DIRECT" ? Number(form.price) : null;
```

---

## 4-4. 정산 기준

정산 로직에서는 `clientGroup`이 아니라 `billingType`을 기준으로 판단한다.

```ts
if (client.billingType !== "DIRECT") {
  // 직접 청구 대상 아님
  return;
}
```

---

## 4-5. 향후 확장 조건

아래 조건 중 하나라도 생기면 별도 그룹 관리 기능을 검토한다.

```text
- 기관이 계속 추가됨
- 사용자가 직접 기관을 추가해야 함
- 기관별 담당자/연락처/계약정보가 필요함
- 기관별 정산 양식이 다름
- 기관별 회기 수 또는 기간 관리가 필요함
- 기관명 변경/삭제/비활성화가 필요함
```

향후 분리 시 구조 예시:

```ts
type ClientGroupEntity = {
  id: string;
  name: string;
  clientType: "PERSONAL" | "ORGANIZATION";
  billingType: "DIRECT" | "EXTERNAL";
  active: boolean;
};
```

---

# 5. 기관 내담자 가격 처리

## 5-1. 결론

기관 내담자의 가격은 `0`이 아니라 `null`로 저장한다.

## 5-2. 이유

`0`은 “0원 청구”로 해석될 수 있다.  
기관 내담자는 0원 청구가 아니라 “이 시스템에서 직접 청구하지 않음”에 가깝다.

따라서 의미상 `null`이 더 명확하다.

---

## 5-3. 정산 로직 주의

`currentPrice === null`만으로 정산 제외를 판단하지 않는다.  
정산 제외 여부는 `billingType`으로 판단한다.

```ts
if (client.billingType !== "DIRECT") {
  return;
}

if (client.currentPrice == null) {
  throw new Error("직접 청구 대상 내담자의 금액이 없습니다.");
}

const totalPrice = client.currentPrice * billableVisitCount;
```

---

# 6. 휴진 기능 설계

## 6-1. 휴진의 성격

휴진은 단순 상태가 아니라 아래 성격을 모두 가진다.

```text
- 내담자의 현재 상태
- 특정 기간을 가진 이력
- 월별정산 제외 기준
- 구글 캘린더 이벤트명 변경 트리거
- 휴진 종료 안내 대상
```

따라서 `status: "PAUSED"`만 추가하지 않고, `pausedPeriods` 배열을 별도로 둔다.

---

## 6-2. 휴진 등록 시 동작

```text
1. 내담자 선택
2. 휴진 기간 선택
   - 4주
   - 6주
   - 8주
   - 자유 입력
3. pausedPeriods에 휴진 이력 추가
4. 현재 날짜가 휴진 기간에 포함되면 내담자 status를 PAUSED로 변경
5. 휴진 기간 내 해당 내담자의 구글 캘린더 이벤트 조회
6. 이벤트명에 (휴진) 추가
7. 영향받은 이벤트 정보를 affectedEvents에 저장
8. 월별정산 재계산 또는 해당 월 monthlyData 갱신
```

---

## 6-3. 휴진 기간 판단 기준

정산 제외 기준은 `client.status === "PAUSED"`가 아니다.

반드시 아래 기준으로 판단한다.

```text
해당 이벤트 날짜가 내담자의 유효한 pausedPeriods 중 하나에 포함되는가?
```

이유:

- 한 달 중 일부만 휴진할 수 있음
- 휴진 전 일반 회기는 청구 대상이어야 함
- 휴진 종료 후 일반 회기는 청구 대상이어야 함

---

## 6-4. 휴진 이벤트명 변경

이벤트명이 이미 `(휴진)`을 포함한 경우 중복 추가하지 않는다.

```ts
function toPausedTitle(title: string) {
  return title.includes("(휴진)") ? title : `${title}(휴진)`;
}
```

---

## 6-5. 이벤트명 원복 가능성

휴진 취소 또는 기간 변경이 있을 수 있으므로, 이벤트명을 변경할 때 원래 제목을 저장한다.

```ts
affectedEvents: [
  {
    eventId: "google_event_001",
    originalTitle: "김말차",
    pausedTitle: "김말차(휴진)",
    eventDate: "2026-06-28",
  },
];
```

---

## 6-6. 휴진 취소/변경 정책

1차 구현에서 반드시 결정해야 할 사항:

```text
- 휴진 기간을 잘못 설정했을 때 수정 가능한가?
- 휴진을 취소하면 캘린더 이벤트명을 원복하는가?
- 휴진 기간 변경 시 기존 affectedEvents를 어떻게 처리하는가?
- 휴진 종료 후 status를 자동으로 ACTIVE로 돌릴 것인가?
```

권장 1차 정책:

```text
- 휴진 기간 변경은 기존 휴진을 canceledAt 처리한 뒤 새 휴진을 생성한다.
- 휴진 취소 시 affectedEvents의 originalTitle로 캘린더 이벤트명을 원복한다.
- status는 화면 표시용으로 사용하고, 정산 계산은 pausedPeriods 기준으로 한다.
```

---

# 7. 월별정산에서 휴진 처리

## 7-1. 휴진 회기 정산 제외

`(휴진)`이 붙은 회기 또는 이벤트 날짜가 휴진 기간에 포함된 회기는 청구 대상이 아니다.

## 7-2. 일반 회기 + 휴진 회기가 함께 있는 경우

해당 월에 일반 회기와 휴진 회기가 함께 있으면 일반 회기만 청구한다.

예시:

```text
일반 회기 2회
휴진 1회
```

처리:

```text
청구 대상: 일반 회기 2회
표기: 휴진 1회
```

---

## 7-3. 휴진 회기만 있는 경우

해당 월에 휴진 회기만 있고 일반 청구 대상 회기가 없다면, 해당 내담자는 청구 리스트에서 제외한다.

예시:

```text
김말차: 휴진 4회, 일반 회기 0회
```

처리:

```text
월별 청구 리스트에 김말차 표시하지 않음
```

---

## 7-4. monthlyData 반영

휴진 회기는 아래 필드에 기록한다.

```ts
pauseCount: number;
pauseDates: string[];
```

예시:

```json
{
  "visitCount": 2,
  "pauseCount": 1,
  "totalPrice": 60000,
  "pauseDates": ["2026-06-26"]
}
```

---

# 8. 휴진 종료 예정 안내 모달

## 8-1. 노출 조건

월별정산 페이지 진입 시 아래 조건을 확인한다.

```text
- 유효한 pausedPeriods 중 endDate가 오늘 기준 5일 이내
- endDate가 아직 지나지 않음
- 사용자가 해당 안내를 다시 보지 않기 처리하지 않음
```

---

## 8-2. 모달 문구

```text
{내담자명} 내담자의 휴진이 n일 뒤에 종료됩니다.

휴진기간: n주 (YYYY-MM-DD ~ YYYY-MM-DD)
```

---

## 8-3. 동일 종료일 처리

동일 날짜에 휴진이 종료되는 내담자가 2명 이상이면 하나의 모달에 묶어서 표기한다.

예시:

```text
다음 내담자의 휴진이 3일 뒤에 종료됩니다.

- 김말차: 4주 (2026-06-26 ~ 2026-07-24)
- 이녹차: 4주 (2026-06-26 ~ 2026-07-24)
```

---

## 8-4. 다른 종료일 처리

5일 이내 종료 대상이 여러 명이더라도 종료일이 다르면 별도 모달로 노출한다.

---

## 8-5. 다시 보지 않기 처리

`localStorage`를 사용한다.

### 캐시 키 제안

```text
pauseNotice:{clientId}:{pauseEndDate}
```

예시:

```text
pauseNotice:p_1779623777591_y7z0s62i2mq:2026-07-24
```

동일 종료일 모달에 여러 내담자가 묶이는 경우, 각 내담자 기준으로 캐시를 기록한다.

---

## 8-6. 캐시 정리

휴진 종료일이 지난 캐시는 삭제한다.

---

# 9. 정산 제외 일정 관리

## 9-1. 명칭

기능명은 “뮤트 이벤트 그룹”보다 아래 명칭을 사용한다.

```text
정산 제외 일정
```

또는:

```text
정산에서 제외할 일정
```

---

## 9-2. 기능

사용자가 등록한 키워드가 포함된 캘린더 일정은 월별정산에서 제외한다.

예시:

```text
등록 키워드: 점심
캘린더 이벤트명: 점심 약속
처리: 월별정산에서 제외
```

---

## 9-3. 저장 위치

```ts
settings.excludedEventKeywords: string[];
```

---

## 9-4. 매칭 방식

1차 구현에서는 일부 포함 방식으로 처리한다.

```ts
function isExcludedEvent(title: string, keywords: string[]) {
  return keywords.some((keyword) => title.includes(keyword));
}
```

---

## 9-5. 사용자 안내 문구

```text
입력한 단어가 포함된 일정은 월별정산에서 제외됩니다.
```

---

# 10. 내담자 상세 기능 추가

## 10-1. 메모 기능

내담자별 메모를 저장할 수 있도록 한다.

### 데이터

```ts
memo: string | null;
```

### 화면

내담자 상세 화면에서 메모를 확인 및 수정할 수 있어야 한다.

---

## 10-2. 방문정보 월별 표기

현재 연별로 보이는 방문정보를 유지하되, 연도 행을 펼치면 월별 데이터를 볼 수 있도록 한다.

### UI 구조

```text
2026년 | 총 n회 | 청구 n회 | 취소 n회 | 휴진 n회
  - 1월 | 총 n회 | 청구 n회 | 취소 n회 | 휴진 n회
  - 2월 | 총 n회 | 청구 n회 | 취소 n회 | 휴진 n회
```

### 구현 방식

`monthlyData`를 기준으로 연별 합계를 계산하고, 월별 상세는 dropdown 또는 accordion으로 노출한다.

---

# 11. UI/사용성 수정사항

## 11-1. 월별정산 > 내담자 등록 모달

### 수정사항

- 금액 입력 TextField에서 Enter 입력 시 등록 버튼 onClick 실행
- placeholder 변경

### 변경 전

```text
50000
```

### 변경 후

```text
금액을 입력해주세요
```

---

## 11-2. 월별정산 > 연동되지 않은 항목 가시성 개선

### 문제

‘연동되지 않은 항목’의 가시성이 낮음.

### 처리 방향

색상 또는 배지 형태로 명확하게 노출한다.

권장 방향:

```text
연동되지 않은 항목
```

을 텍스트와 배지 형태로 표시하고, 색상만으로 의미를 전달하지 않는다.

---

## 11-3. 내담자관리 > 내담자 상세 수정 버튼 변경

### 현재

연필 아이콘 `IconButton`

### 변경

텍스트가 있는 `OutlinedButton`

예시:

```text
[수정]
```

또는:

```text
[수정하기]
```

이유:

주요 사용자는 웹사이트 사용에 익숙하지 않으므로, 아이콘만으로 기능을 추측하게 하지 않는다.

---

## 11-4. 신규 내담자 등록 후 목록 미갱신 오류

### 현재 문제

월별정산 화면의 내담자 등록 모달에서 신규 내담자를 등록한 후, 내담자관리 탭으로 이동하면 신규 내담자가 즉시 보이지 않는다.

새로고침하면 반영되지만, 새로고침 시 구글 로그인을 다시 해야 하는 문제가 있다.

### 기대 동작

```text
1. 월별정산에서 신규 내담자 등록
2. 내담자관리 탭으로 이동
3. 방금 등록한 내담자가 목록에 즉시 노출
4. 브라우저 새로고침 필요 없음
```

### 확인할 것

- 등록 후 클라이언트 상태 갱신 여부
- 로컬 파일 저장 후 메모리 상태 동기화 여부
- 탭 이동 시 데이터 재조회 여부
- 캐시된 목록을 사용하고 있는지 여부

---

## 11-5. 월별정산 다음달 이동 허용

### 현재 문제

다음달로 이동이 제한되어 있는 것으로 보임.

### 변경

다음달 정산 정보도 미리 확인할 수 있도록 다음달 이동을 허용한다.

---

## 11-6. 월별정산 이벤트 등록 시 기본값 제거

### 변경

- 기본 선택값을 비워둔다.
- 사용자가 선택하지 않으면 등록을 막는다.
- 토스트를 노출한다.

### 토스트 예시

```text
항목을 선택해주세요.
```

---

# 12. 구현 순서 제안

## 1단계. 데이터 구조 및 마이그레이션

- [ ] 신규 `AppData` 구조 정의
- [ ] `dataVersion` 추가
- [ ] 기존 배열 데이터 또는 무버전 객체 데이터 감지
- [ ] 마이그레이션 함수 작성
- [ ] 마이그레이션 전 백업 파일 생성
- [ ] 로드 시점에 normalize 처리
- [ ] 앱 내부에서는 신버전 데이터만 사용하도록 정리

---

## 2단계. 내담자 기본 구조 확장

- [ ] `status` 추가
- [ ] `clientType` 추가
- [ ] `clientGroup` 추가
- [ ] `billingType` 추가
- [ ] `currentPrice`, `price`를 `number | null` 허용
- [ ] `memo` 추가
- [ ] 기존 `active`는 호환용으로 유지
- [ ] 정산 로직에서 `billingType` 기준으로 직접 청구 여부 판단

---

## 3단계. 기관 내담자 처리

- [ ] `CLIENT_GROUP_OPTIONS` 상수 정의
- [ ] 내담자 등록 모달에 group Selectbox 추가
- [ ] 개인 선택 시 금액 입력 노출
- [ ] 기관 선택 시 금액 입력 미노출
- [ ] 기관 내담자는 `currentPrice: null`, `billingType: "EXTERNAL"` 저장
- [ ] 내담자 상세에 개인/기관 여부 표기
- [ ] 월별정산 우측 리스트에서 개인/기관 탭 또는 필터 제공

---

## 4단계. 휴진 기능

- [ ] `pausedPeriods` 구조 추가
- [ ] 휴진 등록 UI 추가
- [ ] 4주/6주/8주/자유입력 기간 선택 지원
- [ ] 휴진 기간 저장
- [ ] 휴진 기간 내 구글 캘린더 이벤트 조회
- [ ] 이벤트명에 `(휴진)` 추가
- [ ] `affectedEvents`에 원래 제목과 변경 제목 저장
- [ ] 휴진 기간 기준으로 정산 제외 처리
- [ ] `monthlyData.pauseCount`, `monthlyData.pauseDates` 반영
- [ ] 휴진 취소/변경 정책 구현 또는 최소 정책 확정

---

## 5단계. 휴진 종료 안내

- [ ] 월별정산 페이지 진입 시 휴진 종료 5일 이내 대상 조회
- [ ] 동일 종료일 대상은 하나의 모달로 묶기
- [ ] 종료일이 다르면 별도 모달로 표시
- [ ] `localStorage` 기반 다시 보지 않기 처리
- [ ] 종료일 지난 localStorage 캐시 삭제

---

## 6단계. 정산 제외 일정

- [ ] `settings.excludedEventKeywords` 추가
- [ ] 정산 제외 일정 관리 UI 추가
- [ ] 키워드 추가/삭제 기능 구현
- [ ] 월별정산 이벤트 조회 시 제외 키워드 포함 일정 필터링
- [ ] 사용자 안내 문구 추가

---

## 7단계. 내담자 상세 개선

- [ ] 메모 조회/수정 기능 추가
- [ ] 방문정보 연별 합계 유지
- [ ] 연도별 행 펼침 시 월별 데이터 표시
- [ ] 월별 데이터에 휴진 회기 반영

---

## 8단계. 기존 UI 수정사항 반영

- [ ] 금액 TextField Enter 등록 처리
- [ ] placeholder 변경
- [ ] 연동되지 않은 항목 가시성 개선
- [ ] 수정 버튼을 OutlinedButton으로 변경
- [ ] 신규 등록 후 목록 갱신 오류 수정
- [ ] 다음달 이동 허용
- [ ] 이벤트 등록 기본값 제거 및 토스트 처리

---

# 13. 테스트 체크리스트

## 13-1. 마이그레이션

- [ ] 기존 데이터 파일을 읽어도 앱이 터지지 않는가
- [ ] 백업 파일이 생성되는가
- [ ] 기존 내담자가 모두 유지되는가
- [ ] 기존 monthlyData가 유지되는가
- [ ] 신규 필드가 기본값으로 들어가는가
- [ ] 마이그레이션을 여러 번 실행해도 데이터가 중복되지 않는가

---

## 13-2. 기관 내담자

- [ ] 개인 내담자는 금액 입력이 노출되는가
- [ ] 기관 내담자는 금액 입력이 숨겨지는가
- [ ] 기관 내담자의 `currentPrice`가 null로 저장되는가
- [ ] 기관 내담자가 직접 청구 리스트에서 제외되는가
- [ ] 기관 내담자의 회차 정보는 확인 가능한가
- [ ] 개인 ↔ 기관 변경 시 데이터가 정상 반영되는가

---

## 13-3. 휴진

- [ ] 휴진 등록 시 pausedPeriods에 기록되는가
- [ ] 휴진 기간 내 이벤트에 `(휴진)`이 붙는가
- [ ] 이미 `(휴진)`이 있는 이벤트에 중복으로 붙지 않는가
- [ ] 휴진 회기가 청구 대상에서 제외되는가
- [ ] 일반 회기와 휴진 회기가 섞인 월에서 일반 회기만 청구되는가
- [ ] 휴진 회기만 있는 월에서는 내담자가 청구 리스트에서 제외되는가
- [ ] pauseCount, pauseDates가 정상 반영되는가

---

## 13-4. 휴진 종료 안내

- [ ] 종료 5일 이내 휴진 내담자가 있을 때 모달이 뜨는가
- [ ] 동일 종료일 내담자가 하나의 모달에 묶이는가
- [ ] 서로 다른 종료일은 별도 모달로 뜨는가
- [ ] 다시 보지 않기 후 다시 뜨지 않는가
- [ ] 종료일이 지난 캐시가 삭제되는가

---

## 13-5. 정산 제외 일정

- [ ] 키워드 추가/삭제가 되는가
- [ ] 키워드가 포함된 캘린더 일정이 월별정산에서 제외되는가
- [ ] 제외 키워드가 없는 일정은 정상 노출되는가
- [ ] 사용자가 이해할 수 있는 안내 문구가 표시되는가

---

## 13-6. UI 수정사항

- [ ] Enter 입력으로 내담자 등록이 되는가
- [ ] placeholder가 변경되었는가
- [ ] 수정 버튼이 텍스트 버튼으로 보이는가
- [ ] 신규 등록 후 내담자관리 탭에서 즉시 보이는가
- [ ] 다음달 이동이 가능한가
- [ ] 이벤트 항목 미선택 시 등록되지 않고 토스트가 뜨는가

---

# 14. 주의할 점

## 14-1. monthlyData를 원본으로 보지 말 것

`monthlyData`는 월별 계산 결과 또는 집계 데이터로 보고, 휴진의 원본 기준은 `pausedPeriods`로 둔다.

---

## 14-2. status만으로 정산 제외하지 말 것

휴진 상태인 내담자라도 해당 월 일부 회기는 청구 대상일 수 있다.  
정산 제외 여부는 이벤트 날짜가 휴진 기간에 포함되는지로 판단한다.

---

## 14-3. group만으로 청구 여부를 판단하지 말 것

정산 여부는 `clientGroup`이 아니라 `billingType`으로 판단한다.

---

## 14-4. null 가격 계산 주의

`null * number` 같은 암묵적 계산이 발생하지 않도록 직접 청구 대상 여부와 가격 존재 여부를 먼저 검사한다.

---

## 14-5. 하드코딩 문자열 분산 금지

`PERSONAL`, `ORG_SIMSIM`, `ORG_SEJONGRO` 등은 한 파일의 상수 또는 타입으로 관리한다.

---

# 15. 1차 구현에서 보류 가능한 항목

다음 항목은 1차 구현에서 범위가 크면 보류 가능하다.

```text
- 기관 그룹 직접 추가/수정/삭제 관리 화면
- 휴진 기간 수정 시 복잡한 자동 재계산
- 휴진 취소 시 모든 구글 이벤트 자동 원복
- 과거 월 정산 재계산 기능
- 기관별 별도 정산 양식
```

다만 보류하더라도 데이터 구조는 나중에 확장 가능하도록 설계한다.

---

# 16. 1차 구현 최소 목표

최소 구현 목표는 아래와 같다.

```text
1. 기존 데이터가 깨지지 않고 신규 구조로 변환된다.
2. 개인/기관 내담자를 구분할 수 있다.
3. 기관 내담자는 직접 청구 대상에서 제외된다.
4. 휴진 기간을 기록할 수 있다.
5. 휴진 기간 내 회기는 청구 대상에서 제외된다.
6. 월별정산에서 일반 회기와 휴진 회기가 구분된다.
7. 사용자가 주요 기능을 아이콘 추측 없이 명확하게 사용할 수 있다.
```
