# K-F-C UX 설계서

> 기준 문서: `docs/planning/project-direction.md` (확정일 2026-04-14)
> 작성자: @UX디자이너
> 작성일: 2026-04-14
> 적용 범위: Phase 1 (6일 스프린트) + Phase 2 IA 제안

---

## 1. 사용자 페르소나

### Primary — "응원 덕후" 이지은 (22세)

- 최애 아이돌 그룹의 특정 멤버가 속한 팀을 열렬히 응원한다
- 스마트폰을 주 디바이스로 사용하며, 하루 평균 SNS 체류 3시간
- 팬덤 내 경쟁 심리가 강하고, 순위가 바뀌면 즉각 알고 싶어 한다
- 현재 불만: "내가 얼마나 기여하는지 숫자로 보고 싶은데 안 보인다"
- 핵심 욕구: 내 팀이 이기고 있다는 실시간 확인 + 친구들에게 자랑

### Secondary — "라이트 팬" 김민준 (17세)

- SNS에서 링크 타고 처음 유입됨 (바통 릴레이 초대 경로)
- 게임보다 분위기 참여가 목적 — "재미있어 보이면 한 번 해보는" 타입
- 온보딩이 복잡하면 이탈한다. 3탭 내 참여 가능해야 한다
- 핵심 욕구: 빠른 진입 + 결과 공유로 존재감 표시

### Anti-Persona — 운영자/관리자

- Admin 관련 용어, 내부 운영 UI를 팬 화면에서 완전히 제거
- "Admin에서 시즌을 활성화하면" 같은 문구는 사용자에게 노출되면 안 된다

---

## 2. 사용자 플로우

### Flow A — 첫 방문 (신규 유입)

```
[랜딩 / 홈 페이지]
    |
    | Hero CTA "지금 참전하기" 탭
    v
[게임 페이지 — 팀 미선택 상태]
    |
    | 전체 팀 진행 현황 확인 후 팀 카드 탭
    v
[팀 선택 완료 — TAP 버튼 등장]
    |
    | TAP 버튼 연타
    v
[콤보 5 이상 — ComboIndicator 등장]
    |
    | combo 20+ 또는 박 터짐 조건 달성
    v
[BurstOverlay 표시 + Confetti]
    |
    | (Phase 2) "공유하기" CTA 등장
    v
[SNS 공유 또는 세션 종료]
```

전환 목표값 (Phase 1): 홈 진입 → 팀 선택까지 2탭, 팀 선택 → 첫 클릭까지 1탭.
총 3탭 이내 핵심 액션 달성.

### Flow B — 재방문 (시즌 진행 중)

```
[홈 페이지 — 시즌 진행 중 배지 확인]
    |
    | 실시간 순위 카드에서 팀 순위 변동 확인
    v
[스코어보드 또는 게임 페이지 직접 이동]
    |
    | 게임 페이지: 이미 선택한 팀 기억 없음 (세션 단위)
    | → 팀 재선택 필요
    v
[TAP 게임 재참여]
    |
    | score:update 수신 → onlineCount 배지 확인
    v
[실시간 참여자 카운터로 경쟁 심리 자극 → 체류 연장]
```

현행 코드베이스 제약: selectedTeamId는 로컬 state이며 localStorage 지속성 없음.
Phase 1에서는 세션 내 유지만 보장. 재방문 시 팀 재선택은 의도된 동선으로 처리.

### Flow C — 팀 변경 (Phase 2)

```
[게임 중 "팀 변경" 버튼 탭]
    |
    | (Phase 1 현행) → 즉시 팀 해제, 재선택 화면
    |
    | (Phase 2 예정) → 확인 다이얼로그 등장
    |   "팀을 변경하면 이 세션의 클릭 기록이 초기화됩니다.
    |    [취소] [변경하기]"
    v
[팀 재선택 화면]
```

Phase 2 다이얼로그 조건: 현재 세션 clickCount >= 10 일 때만 표시.
클릭이 없는 상태에서 팀 변경은 다이얼로그 없이 즉시 허용.

### Flow D — 바통 릴레이 초대 수락 (딥링크 진입)

```
[외부 링크 /relay?code=XXXX 클릭]
    |
    | RelayPage 마운트 → URLSearchParams에서 code 추출
    | → baton:accept 이벤트 emit
    v
[baton:accepted 응답 → 팀 자동 선택]
    |
    | 초대 링크 카드 표시 (내 코드 생성 완료 상태)
    v
[바통 연결 완료 → "내 링크도 공유하기" 유도]
```

현행 코드에서 이미 구현된 플로우.
UX 보완점: 딥링크 진입 시 "N번째 팬이 바통을 이어받았습니다!" 토스트 메시지 추가 필요 (현재는 전역 overlay만 있음).

---

## 3. 정보 구조 (IA)

### 3.1 Phase 1 현행 구조 (6개 항목 유지)

```
K-F-C 가을 운동회
├── / (홈)
│   ├── Hero 섹션 (시즌 배지 + 타이틀 + CTA)
│   ├── 실시간 순위 미리보기 (Top 3)
│   ├── 종목 참여하기 그리드 (4종목 카드)
│   ├── 이벤트 배너 (설정값 기반 조건부)
│   ├── 우승 영상 임베드 (설정값 기반 조건부)
│   └── 통계 행 (팀 수 / 총 점수 / 시즌)
│
├── /game (클릭 대전) ← 핵심 페이지
│   ├── layout: AdSense 좌우 광고 (xl 이상 데스크탑)
│   ├── 게임 헤더 (클릭 대전 배지 + 타이틀)
│   ├── 전체 팀 진행 상황 카드 (TeamProgressBar 분리 예정)
│   │   └── [Phase 1 F5] 접속자 카운터 (카드 헤더 우측)
│   ├── [팀 미선택] 팀 선택 그리드
│   └── [팀 선택] 게임 플레이 영역
│       ├── 선택 팀 + 내 클릭수 + 팀 변경 버튼
│       ├── 내 팀 대형 진행 게이지 카드
│       ├── ComboIndicator (combo >= 5 시 등장)
│       ├── ClickButton (TAP 버튼, w-48/w-56)
│       │   ├── Ripple 이펙트 (최대 10개)
│       │   └── FloatingScore (+1 or +Nx, 최대 8개)
│       └── BurstOverlay (박 터짐 전체화면)
│
├── /scoreboard (스코어보드)
│   ├── 시상대 (Top 3 팀, 3개 팀 이상 시)
│   ├── 전체 순위 리스트
│   └── 점수 구성 카드 (종목별 비율)
│
├── /cheer (응원 게시판)
│   ├── 구역별 응원석 그리드 (팀별 CheerZone)
│   ├── 메시지 입력 영역 (팀 선택 시 등장)
│   └── 전체/팀별 메시지 타임라인
│
├── /relay (이어달리기)
│   ├── 팀별 바통 현황 (진행 게이지)
│   ├── 팀 선택 그리드
│   └── [팀 선택] 초대 링크 카드 + 바통 체인 시각화
│
└── /nomination (투표)
    ├── 팀 투표 카드 그리드 (1회 제한)
    └── [투표 완료] 투표 결과 현황
```

네비게이션 계층: 상단 고정 바(데스크탑) + 하단 탭바(모바일).
하단 탭바 6개 항목 현행 유지. 아이콘 + 10px 레이블 조합.

### 3.2 Phase 2 IA 제안 (5개로 정리, P2-7)

Navigation 6개 항목 중 통합 또는 제거 대상 분석:

```
현행 6개:
홈 / 클릭 대전 / 이어달리기 / 응원 게시판 / 스코어보드 / 투표

Phase 2 제안 5개:
홈 / 참여하기(클릭 대전+이어달리기 탭 전환) / 응원 / 순위 / 투표
```

통합 근거:
- "클릭 대전"과 "이어달리기"는 모두 팀 참여 종목. 상위 "참여하기" 탭 아래 세그먼트 컨트롤로 전환.
- "스코어보드"는 "순위"로 레이블 축약. 한글 4자 → 2자로 하단 탭바 공간 확보.
- 홈에서 이미 Top 3 순위를 보여주므로, 스코어보드 독립 항목 필요성 낮음 (단, 탭은 유지).

Phase 2 제안 구조:

```
하단 탭바 (Phase 2):
[홈] [참여하기] [응원] [순위] [투표]
  |       |
  |   클릭 대전 탭
  |   이어달리기 탭
  |   (세그먼트 컨트롤, 페이지 상단)
```

URL 구조 변경 없이 `/game` `/relay`는 유지하되, 참여하기 탭에서 양쪽으로 라우팅.

---

## 4. 와이어프레임 (텍스트 기반)

### WF-01: 게임 페이지 — 컴포넌트 분리 후 레이아웃 (F1)

```
┌─────────────────────────────────────┐
│ [Navigation — 중립 브랜드 컬러]       │ ← Navigation은 팀색 영향 없음
├─────────────────────────────────────┤
│ [xl 이상: 왼쪽 AdSense 160px aside] │
│                                     │
│  <main style="--team-primary: #XXX"> ← <main>에 CSS 변수 설정 (M1)
│                                     │
│  ┌──────── 게임 헤더 ────────────┐   │
│  │  [🎯 클릭 대전 배지]          │   │
│  │  박 터트리기 (gradient-text)  │   │
│  │  목표 N,000회 클릭!           │   │
│  └───────────────────────────────┘  │
│                                     │
│  ┌────── TeamProgressBar ─────────┐  │ ← F1 분리 컴포넌트
│  │ 박 터트리기 현황  [N명 참여 중] │  │ ← F5: 카드 헤더 우측
│  │                                │  │
│  │ 1위 [로고] 팀명 [MY] N/goal    │  │
│  │     [████████░░░░] N.N%        │  │
│  │ 2위 [로고] 팀명 N/goal         │  │
│  │     [██████░░░░░░] N.N%        │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                     │
│  [팀 미선택: 팀 선택 그리드]          │
│  or                                 │
│  [팀 선택: 게임 플레이 영역 ↓]       │
│                                     │
│  ┌────── 선택 팀 바 ──────────────┐  │
│  │ [팀 로고] 팀명                 │  │
│  │           내 클릭: N          │  │
│  │                    [팀 변경]  │  │
│  └────────────────────────────────┘  │
│                                     │
│  ┌────── 내 팀 대형 게이지 카드 ──┐  │
│  │ 우리 팀 박      N,NNN / N,NNN  │  │
│  │ [████████████████████░░░] h-6  │  │
│  │           N.N%                │  │
│  └────────────────────────────────┘  │
│                                     │
│  ┌────── 클릭 영역 ───────────────┐  │
│  │                               │  │
│  │  [ComboIndicator] ← F1 분리   │  │ ← combo >= 5 시 등장
│  │  ┌─ ClickButton ─────────┐    │  │ ← F1 분리 컴포넌트
│  │  │   [팀색 그라데이션]     │    │  │
│  │  │   Ripple 이펙트        │    │  │
│  │  │   FloatingScore 표시  │    │  │ ← F4: +1 or +2x
│  │  │                       │    │  │
│  │  │   TAP!                │    │  │
│  │  │   N,NNN               │    │  │
│  │  └───────────────────────┘    │  │
│  │  연타하여 박을 터트리세요!      │  │
│  └────────────────────────────────┘  │
│                                     │
│ [xl 이상: 오른쪽 AdSense 160px aside] │
└─────────────────────────────────────┘
│ [하단 탭바 — 모바일 전용]             │
└─────────────────────────────────────┘
```

### WF-02: 팀 컬러 CSS 변수 적용 영역 구분 (F2)

팀색 적용 영역 / 중립 영역을 명확히 분리한다.

```
[팀색 적용 영역] — <main>의 --team-primary 변수 사용
  - TeamProgressBar의 선택 팀 게이지 바 fill
  - 내 팀 대형 게이지 bar fill + box-shadow glow
  - ClickButton 배경 그라데이션
  - ComboIndicator 배경 그라데이션 + box-shadow
  - Confetti 컬러 배합 (teamColor x2, teamColorLight, white, gold)
  - 선택 팀 MY 배지 배경색
  - 80% 달성 시 게이지 glow 효과

[중립 영역] — 브랜드 컬러(coral, mint 등) 또는 회색 계열 유지
  - Navigation (상단 바 + 하단 탭바) ← M1 핵심 결정
  - 게임 헤더 배지 (bg-coral/10)
  - 타이틀 gradient-text (coral-mint 고정)
  - 카드 보더, 배경색
  - 페이지 배경 (min-h-screen 영역)
  - BurstOverlay 배경 (반투명 전체화면)

[다른 팀 색은 해당 팀 요소에만]
  - 타 팀의 게이지 바: 해당 팀 colorCode 직접 사용 (CSS 변수 아님)
  - 타 팀의 TeamLogo: colorCode prop 직접 전달
```

CSS 변수 선언 구조:

```css
/* globals.css — 기본값 (팀 미선택 상태) */
:root {
  --team-primary: #888888;
  --team-secondary: #888888CC;
  --team-light: #88888820;
}

/* game/page.tsx — 팀 선택 시 <main>에 inline style로 설정 */
/* <main style={{ '--team-primary': selectedSt.colorCode, ... }}> */
```

### WF-03: 실시간 참여자 카운터 (F5)

배치 위치: TeamProgressBar 컴포넌트의 카드 헤더 우측.

```
┌────────────────────────────────────────┐
│ 박 터트리기 현황           [N명 참여 중] │
│                                        │
│ 1위 [로고] 팀명 ...                     │
```

"N명 참여 중" 요소 스펙:
- 크기: text-xs font-semibold
- 색상: text-ink-muted (중립 — 팀색 미적용)
- 아이콘: 앞에 점 인디케이터 (초록 pulse dot, h-1.5 w-1.5)
- 업데이트 주기: score:update 이벤트 수신 시마다 갱신 (서버 30초 heartbeat 기반)
- 빈 상태 (onlineCount = 0 또는 null): 컴포넌트 숨김 (자리 차지하지 않음)
- 숫자 변경 시 트랜지션: 없음 (숫자만 교체, 애니메이션 불필요 — 성능 우선)

### WF-04: 콤보 Multiplier UI — ComboIndicator (F4)

ComboIndicator 컴포넌트 스펙:

```
[combo < 5]: 컴포넌트 숨김 (AnimatePresence exit)

[combo 5~19]: ✨ COMBO! x{combo}
  - 배경: --team-primary 그라데이션
  - multiplier 표시: 서버 응답 대기 중에는 로컬 combo 기반
    → click:ack 응답 후 서버 multiplier로 전환

[combo 20~49]: ⚡ SUPER COMBO! x{combo}  [2x]
  - multiplier 배지를 콤보 텍스트 우측에 별도 표시
  - "+2x" — text-white bg-white/20 rounded px-1 text-sm

[combo 50+]: 🔥 ULTRA COMBO! x{combo}  [3x]
  - "+3x" 배지

[서버 콤보와 로컬 콤보 불일치 시]
  - 서버 응답(click:ack)의 combo가 로컬보다 낮으면:
    → ComboIndicator의 combo 수치를 0.2s transition으로 서버값으로 교체
    → multiplier는 즉시 서버값 반영
  - 서버 응답이 로컬보다 높은 경우: 서버값 우선
```

FloatingScore 변경 스펙 (F4):

```
[현행]: floating score에 "+1" 고정 텍스트
[변경]: click:ack 수신 후 multiplier 반영

  click:ack 응답 전 (낙관적): "+1" 표시
  click:ack 응답 후:
    - multiplier = 1: "+1" 유지
    - multiplier = 2: "+2x" 표시 (coral 또는 팀색)
    - multiplier = 3: "+3x" 표시
    - multiplier = 4: "+4x" 표시 (방향서 M4: 상한 4x)

  FloatingScore 텍스트 색상:
    - multiplier = 1: text-white (현행 유지)
    - multiplier >= 2: text-yellow-300 font-black (구분 강조)
```

### WF-05: 빈 상태 / 오류 / 로딩 화면 (카피라이팅 변경, F6)

현행 vs 변경 대조:

```
[로딩 상태 — game/page.tsx]
현행: "게임 데이터를 불러오는 중..."
변경: "운동회 준비 중..." (동일 유지 가능, 큰 문제 없음)

[활성 시즌 없음 — game/page.tsx L232~238]
현행 h2: "활성 시즌이 없습니다"
현행 p: "아직 시즌이 시작되지 않았어요.\nAdmin에서 시즌을 활성화하면 게임을 시작할 수 있어요."
변경 h2: "다음 운동회를 준비 중이에요!"
변경 p: "곧 찾아올 운동회를 기대해 주세요."
  → Admin 문구 완전 제거, 팬 친화적 표현으로 전환

[게임 이벤트 없음 — game/page.tsx L249]
현행 h2: "게임 이벤트 준비 중"
현행 p: "현재 진행 중인 게임 이벤트가 없어요.\n곧 시작될 예정이니 조금만 기다려 주세요!"
변경 h2: "잠시 후 시작할게요!"
변경 p: "지금은 잠깐 쉬는 시간이에요. 곧 다시 달려볼게요!"

[응원 게시판 — 활성 시즌 없음 — cheer/page.tsx L262~264]
현행 h2: "활성 시즌이 없습니다"
현행 p: "Admin에서 시즌을 활성화하면 응원을 시작할 수 있어요."
변경 h2: "응원 준비 중이에요!"
변경 p: "시즌이 시작되면 팀 구역별 응원을 보낼 수 있어요."

[바통 릴레이 — 활성 시즌 없음 — relay/page.tsx L178~182]
현행: "Admin에서 시즌을 활성화하면 이어달리기를 시작할 수 있어요."
변경: "이어달리기 시즌이 시작되면 바통을 이어받을 수 있어요."

[스코어보드 — 시즌 없음 — scoreboard/page.tsx L109~111]
현행: "Admin에서 시즌을 ACTIVE로 설정해주세요"
변경: 해당 줄 제거 또는 "곧 시작될 시즌을 기대해 주세요!" 로 교체

[응원 게시판 — 빈 메시지]
현행: "아직 응원이 없어요" / "첫 번째 응원을 남겨보세요!"
변경: 유지 (팬 친화적 표현이므로 수정 불필요)

[응원 게시판 — 선택 안내]
현행: "위 응원석을 클릭하면 메시지를 작성할 수 있어요"
변경: 유지
```

### WF-06: Navigation LIVE 배지 — 동적 DAY 표시 (F7)

현행 (Navigation.tsx L153): `"LIVE - DAY 5"` 하드코딩

변경 스펙:
```
[시즌 API 성공]: "LIVE - DAY {currentDay}"
[시즌 API 실패]: "LIVE"
[시즌 없음]: 배지 숨김 또는 "시즌 준비 중" (비활성 스타일)
```

배지 위치: 데스크탑 상단 바 우측 (현행 유지), 모바일 메뉴 드로어 하단 (현행 유지).
API 호출: Navigation 컴포넌트 내부에서 `publicApi.getActiveSeason()` 호출 또는
게임 페이지에서 props 전달 방식 중 선택 — 독립 호출 방식 권장 (Navigation은 모든 페이지에 표시).

---

## 5. 인터랙션 패턴

### 5.1 콤보 Multiplier 피드백 흐름 (F4 핵심)

```
사용자 탭 →
  [즉시] 로컬 combo++ → ComboIndicator 로컬 콤보 표시
  [즉시] FloatingScore "+1" 낙관적 표시
  [즉시] 팀 진행 total +1 낙관적 업데이트
  |
  | socket.emit("click", {...})
  |
  [서버 응답: click:ack]
  {
    total: number,       // 실제 누적 점수
    combo: number,       // 서버 combo count
    multiplier: number,  // 1 | 2 | 3 | 4
    isBurst: boolean
  }
  |
  [응답 처리]
  - 서버 combo != 로컬 combo → 0.2s transition으로 서버값 동기화
  - multiplier >= 2 → FloatingScore 표시 교체 (+Nx, yellow-300)
  - isBurst = true → BurstOverlay 트리거
```

플리커 방지 원칙:
- 서버 combo가 로컬보다 낮을 때만 즉시 하강 (Rate Limiter 적중 상황)
- 서버 combo가 로컬보다 높은 경우: 있을 수 없음 (서버가 권위)
- FloatingScore는 emit 시 낙관적으로 생성, ack 수신 후 multiplier만 교체 (재생성 X)

### 5.2 heartbeat + 접속자 카운터 업데이트 주기

```
[페이지 마운트]
  → heartbeat 전송 시작 (30초 간격 setInterval)
  → visibilitychange 리스너 등록

[페이지 비활성화 (탭 전환, 앱 백그라운드)]
  → setInterval clearInterval
  → heartbeat 중단

[페이지 재활성화]
  → heartbeat 즉시 전송
  → setInterval 재시작

[접속자 카운터 표시 업데이트]
  → score:update 이벤트의 onlineCount 수신 시마다 갱신
  → 별도 폴링 없음 (이벤트 드리븐)
  → onlineCount 변경 시 숫자 즉시 교체 (트랜지션 없음)
```

### 5.3 박 터짐 (BurstOverlay) 인터랙션

BurstOverlay 분리 컴포넌트 스펙 (F1):

```
Props: {
  teamName: string,
  active: boolean,
  onComplete?: () => void
}

진입: scale 0 → 1 (spring, damping 12, stiffness 200)
퇴장: scale 0 + opacity 0 (5초 후 자동 해제)
레이어: z-50, fixed, pointer-events-none
배경: 반투명 없음 (오버레이 배경 제거 — Confetti가 배경 역할)
```

Confetti 팀색 배합 (F3, M2):

```
COLORS 배열:
  [teamColor, teamColor, teamColorLight, '#FFFFFF', '#FFD700']

비율 의도:
  - teamColor x2: 팀 정체성 강조
  - teamColorLight: 시각적 깊이
  - white: 밝기 리듬
  - gold: 축제감 강조

teamColor 없음 (팀 미선택 burst): 기존 하드코딩 배열 폴백
```

### 5.4 게임 페이지 AdSense 영역 보호

탄막 오버레이 (Phase 2 P2-4) 설계 시 준수 사항:
- 탄막 이동 영역: 화면 상단 1/3 이내로 제한
- AdSense aside는 `position: static` — 탄막 z-index로 침범 불가
- 게임 콘텐츠 영역 (`max-w-2xl flex-1`) 내부에서만 탄막 렌더링
- FPS 30 이하 감지 시 탄막 자동 비활성화 (CSS animation 사용, Framer Motion 금지)

### 5.5 팀 선택 그리드 인터랙션 (현행 유지)

```
팀 카드 그리드: grid-cols-2 sm:grid-cols-3
호버: scale 1.03 (whileHover)
탭: scale 0.97 (whileTap)
진입 애니메이션: staggered delay (0.1 + i * 0.06)
```

팀 선택 후 게임 영역 전환: AnimatePresence 없이 조건부 렌더링 (현행 유지).
Phase 2에서 AnimatePresence로 교체 검토 가능 (현재는 성능 우선).

---

## 6. 접근성 (WCAG 2.1 AA)

### 6.1 터치 타겟 크기

```
TAP 버튼: w-48 h-48 (192px) 모바일, w-56 h-56 (224px) sm 이상 — 충분
팀 선택 카드: 최소 h-24 이상 (py-6 + 내용) — 충분
하단 탭바 아이템: h-16 / 6개 = 약 56px 너비 — WCAG 44px 기준 충족
"팀 변경" 버튼: text-sm 링크 수준 — 터치 패딩 확인 필요 (py-2 px-4 이상 권장)
```

### 6.2 색상 대비

```
Navigation 텍스트 (text-ink-muted on white): 확인 필요
  → ink-muted가 #888888이면 4.48:1 — AA 통과 (text-sm)
  → 작은 텍스트(14px 미만) AA 기준 4.5:1 필요

ComboIndicator (white text on team color):
  → 팀 컬러가 밝은 경우(예: 노란색) 대비 미달 가능
  → 해결: text-shadow 또는 white 대신 dark 텍스트 조건부 적용
  → 구현: 팀 컬러의 luminance 계산 후 0.5 기준으로 text-white / text-gray-900 전환

FloatingScore (white on team color gradient):
  → ComboIndicator와 동일 이슈. multiplier >= 2 시 yellow-300 사용 — 대비 주의
  → yellow-300 (#FCD34D) on team color: 밝은 팀색에서 미달 가능
  → 해결: multiplier 배지는 white 배경 + 팀색 텍스트로 반전 처리 권장
```

### 6.3 키보드 접근성

```
TAP 버튼: <button> 태그 — 기본 포커스 지원
팀 선택 카드: <motion.button> — 기본 포커스 지원
"팀 변경": <button> — 기본 포커스 지원
Navigation: <Link> — 기본 포커스 지원
모바일 메뉴 버튼: aria-label="메뉴" 이미 적용 (현행 확인)
```

### 6.4 스크린 리더

```
FloatingScore: aria-live="off" 또는 aria-hidden="true"
  → 화면 상 시각 피드백 전용, 스크린 리더에 불필요한 노이즈 방지

onlineCount 배지: aria-label="현재 N명 참여 중"
  → 숫자 단독 표시보다 맥락 있는 레이블 제공

BurstOverlay: role="alert" aria-live="assertive"
  → 박 터짐은 중요 이벤트로 스크린 리더에 고지 필요
```

---

## 7. Phase 1 UX 작업 체크리스트

| 코드 | UX 관점 검증 기준 | 담당 파일 |
|-----|----------------|---------|
| F1 | TeamProgressBar, ClickButton, ComboIndicator, BurstOverlay 분리 후 레이아웃 동일성 확인 | components/game/ |
| F2 | Navigation이 팀색에 물들지 않는지 확인. `<main>` 스코프만 변경되는지 검증 | game/page.tsx + globals.css |
| F3 | Confetti 팀색 배합 5색 적용 확인. 팀 미선택 시 폴백 정상 작동 | components/Confetti.tsx |
| F4 | click:ack 응답 전후 FloatingScore 표시 변화 확인. 플리커 없는지 검증 | ComboIndicator + ClickButton |
| F5 | 접속자 카운터 위치: 진행 상황 카드 헤더 우측. 숫자 0 시 숨김 처리 | TeamProgressBar |
| F6 | Admin 노출 문구 전수 제거 확인. 5개 페이지의 빈 상태 문구 검토 | 각 page.tsx |
| F7 | DAY 하드코딩 제거. API 실패 시 "LIVE" 만 표시되는지 확인 | Navigation.tsx |
| F8 | useSocketEvent 훅 추상화 — 직접 socket.on/off 사용 제거 | lib/useSocketEvent.ts |
| F9 | heartbeat 30초 주기. 탭 비활성화 시 중단, 재활성화 시 즉시 전송 | lib/socket.ts |

---

## 8. Phase 2 UX 선행 설계 메모

### P2-1: Hero 섹션 리뉴얼

홈 페이지 현황: Hero 섹션은 구조상 양호하나 1위 팀 실시간 표시 부재.

변경 방향:
```
[현행 Hero CTA 버튼 아래]
"지금 참전하기" / "순위 보기"

[Phase 2 추가]
"현재 1위: [팀 로고] 팀명 N,NNN pts"
→ score:update 또는 getActiveSeason API 기반
→ 1위 팀색으로 팀명 표시 (팀색 감성 첫 노출)
```

### P2-2: SNS 공유 카드

공유 트리거 조건:
- 박 터짐(burst) 달성 직후 BurstOverlay 하단에 "공유하기" CTA 등장
- 클릭수가 일정 수준(예: 100회) 달성 시에도 소프트 프롬프트

공유 콘텐츠:
```
og:image 동적 생성 정보:
  - 팀 로고 + 팀색 배경
  - 현재 팀 점수 + 진행률
  - "나는 [팀명] 팬입니다" 문구
  - K-F-C 로고
```

### P2-7: 하단 탭바 5개 정리 시 전환 주의사항

- `/relay` URL은 유지 (딥링크 호환성)
- "참여하기" 탭의 기본 라우팅 대상: `/game`
- 이어달리기 세그먼트 탭: URL `/relay`로 push
- 탭 전환 애니메이션: slide (게임↔릴레이 좌우 슬라이드)
- 현행 하단 탭바 `tab-active` layoutId는 새 5개 항목으로 재설정 필요

### P2-8: 팀 변경 확인 다이얼로그

트리거 조건: clickCount >= 10 일 때만 다이얼로그 표시
다이얼로그 구조:
```
┌─────────────────────────────┐
│ 팀을 변경할까요?             │
│                             │
│ 이 세션의 클릭 기록은        │
│ 팀 기여로 이미 반영됐어요.   │
│ 팀을 바꿔도 기록은 유지됩니다 │
│                             │
│ [취소]        [변경하기]     │
└─────────────────────────────┘
```

카피라이팅 의도: "기록이 사라진다"는 불안을 주지 않되, 팀 변경이 의미 있는 액션임을 인지시킨다.
