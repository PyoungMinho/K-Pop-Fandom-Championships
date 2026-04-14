# K-F-C Phase 1 최종 디자인 스펙

> 작성자: @디자인팀장
> 확정일: 2026-04-14
> 기반: UX 설계서 (ux-spec.md) + UI 디자인 스펙 (ui-spec.md) + 프로젝트 방향서 (project-direction.md)
> 적용 범위: Phase 1 (6일 스프린트) F1~F9

---

## 0. UX/UI 산출물 간 충돌 검토 및 결정

### 0.1 해결된 불일치 (4건)

| # | 항목 | UX 설계서 | UI 스펙 | 디자인팀장 결정 | 근거 |
|---|------|----------|---------|---------------|------|
| C1 | 참여자 카운터 도트 색상 | "초록 pulse dot" (text-ink-muted 중립) | `var(--team-primary)` (팀색 적용) | **UI 스펙 채택: 팀색 적용** | 카운터가 TeamProgressBar 카드 내부에 있으므로 팀 컨텍스트 내 요소. 도트만 팀색이면 브랜드 침범 수준이 아님. 단, 폴백은 coral |
| C2 | 카운터 숫자 트랜지션 | "트랜지션 없음 (성능 우선)" | "CSS transition (opacity 0->1, 0.15s)" | **UX 설계서 채택: 트랜지션 없음** | 30초 간격 업데이트에 fade 효과는 오히려 "느려 보이는" 인상. 숫자 즉시 교체가 실시간 느낌에 적합 |
| C3 | 빈 상태 문구 (게임 이벤트 없음) | h2: "잠시 후 시작할게요!" / p: "지금은 잠깐 쉬는 시간이에요..." | h2: "잠깐! 박이 아직 준비 중이에요" / p: "감독님이 박을 달고 있는 중이에요..." | **UI 스펙 채택** | "박"이라는 게임 맥락 단어가 포함되어 세계관 몰입도 높음. "감독님이 달고 있는 중"이 운동회 컨셉과 정합 |
| C4 | 빈 상태 문구 (시즌 없음) 본문 | "곧 찾아올 운동회를 기대해 주세요." | "곧 새로운 시즌이 열릴 예정이에요. 알림을 켜두고 기다려 주세요!" | **UI 스펙 채택** | "알림을 켜두고"는 Phase 2 알림 기능의 사전 포석. 2줄 구조가 빈 화면 여백 밸런스에도 적합 |

### 0.2 양측 일치 항목 (확인 완료)

- CSS 변수 스코프: `<main>` 제한 (Navigation 중립)
- Confetti 5색 배합: teamColor x2, teamColorLight, white, gold
- ComboIndicator 단계: 5/20/50 기준, multiplier 2x/3x/4x
- FloatingScore 낙관적 업데이트 후 서버 ack 시점 교체
- BurstOverlay: Framer Motion spring 진입, 5초 후 자동 해제
- heartbeat: 30초 간격, visibilitychange 연동

### 0.3 :root 폴백값 결정

UX 설계서는 `--team-primary: #888888` (회색), UI 스펙은 `var(--color-coral)` (서비스 브랜드색)을 제안했다.

**결정: UI 스펙 채택 — `var(--color-coral)` 폴백**

근거: 팀 미선택 상태에서 회색 도트/뱃지는 "비활성" 느낌을 준다. coral 폴백이면 서비스 브랜드 톤과 자연스럽게 연결된다. 단, `color-mix()` 사용은 보류하고 hex 알파 폴백으로 통일한다 (구형 브라우저 안전망).

```css
@layer base {
  :root {
    --team-primary: #FF6B35;
    --team-secondary: #FF6B3533;
    --team-light: #FF6B3515;
  }
}
```

---

## 1. 화면 구조 (Information Architecture)

### 1.1 Phase 1 IA (현행 6개 항목 유지)

```
K-F-C 가을 운동회
+-- / (홈)
|   +-- Hero 섹션 + CTA
|   +-- 실시간 순위 미리보기 (Top 3)
|   +-- 종목 참여 그리드 (4종목)
|   +-- 이벤트 배너 / 우승 영상 (조건부)
|   +-- 통계 행
|
+-- /game (클릭 대전) [핵심 페이지]
|   +-- AdSense 좌우 aside (xl 이상)
|   +-- <main style="--team-*"> [팀 컬러 스코프]
|       +-- 게임 헤더
|       +-- TeamProgressBar [F1 분리]
|       |   +-- OnlineCountBadge [F5]
|       +-- [팀 미선택] 팀 선택 그리드
|       +-- [팀 선택] 게임 플레이 영역
|           +-- 선택 팀 바 + 팀 변경 버튼
|           +-- 내 팀 대형 게이지 카드
|           +-- ComboIndicator [F1 분리, F4]
|           +-- ClickButton [F1 분리]
|           |   +-- Ripple 이펙트
|           |   +-- FloatingScore [F4 multiplier]
|           +-- BurstOverlay [F1 분리]
|               +-- Confetti [F3 팀컬러]
|
+-- /scoreboard
+-- /cheer
+-- /relay
+-- /nomination
```

### 1.2 Navigation 구조 (Phase 1 변경 없음)

데스크탑: 상단 고정 바 (6개 항목 + LIVE 배지)
모바일: 하단 탭바 (6개 항목) + 상단 햄버거 메뉴

LIVE 배지: F7에서 "LIVE - DAY {N}" 동적 표시로 변경.

---

## 2. 핵심 사용자 플로우

### Flow A: 신규 유입 -> 첫 클릭 (3탭 목표)

```
홈 Hero CTA [탭 1] -> /game 진입
  -> 팀 카드 탭 [탭 2] -> 팀 선택 완료
    -> TAP 버튼 탭 [탭 3] -> 첫 클릭 완료
      -> combo 5+ -> ComboIndicator 등장
        -> combo 20+ -> SUPER COMBO (multiplier 반영)
          -> 박 터짐 -> BurstOverlay + Confetti(팀색)
```

### Flow B: 재방문 (세션 내 팀 유지 안됨 -- Phase 1 의도)

```
/game 직접 진입 -> 팀 재선택 -> TAP 재참여
  -> score:update -> onlineCount 뱃지 확인
  -> 경쟁 심리 자극 -> 체류 연장
```

### Flow C: 콤보 multiplier 피드백 흐름 (F4)

```
사용자 탭
  [즉시] 로컬 combo++ -> ComboIndicator 업데이트
  [즉시] FloatingScore "+1" 낙관적 표시
  [즉시] teamProgress total +1 낙관적 반영
  |
  socket.emit("click", {...})
  |
  [서버 click:ack 수신]
  { total, combo, multiplier, isBurst }
  |
  - combo 불일치: 0.2s transition으로 서버값 동기화
  - multiplier >= 2: FloatingScore "+Nx" 교체 (yellow-300)
  - isBurst: BurstOverlay 트리거
```

---

## 3. 디자인 토큰

### 3.1 토큰 레이어 구조

```
Layer 0 -- @theme 브랜드 토큰 (globals.css, 불변)
  --color-coral / coral-light / coral-dark
  --color-mint / mint-light / mint-dark
  --color-sunny / sunny-light / sunny-dark
  --color-lavender / --color-rose / --color-sky
  --color-cream / cream-dark
  --color-ink / ink-light / ink-muted
  --font-display / --font-body (Pretendard)
  -> Tailwind 유틸리티로 사용 (text-coral, bg-cream 등)
  -> 절대 팀 컬러로 오염하지 않는다

Layer 1 -- 팀 컬러 CSS 변수 (runtime, <main> 스코프)
  --team-primary    : 팀 colorCode 원본
  --team-secondary  : colorCode + 알파 20% (hex 33)
  --team-light      : colorCode + 알파 8%  (hex 15)
  -> 팀 선택 시 <main> style로 주입
  -> CSS var()로 참조
  -> 팀 미선택 시 :root 폴백 (coral 계열)

Layer 2 -- 컴포넌트 inline style (기존 코드, 하이브리드 유지)
  colorCode 직접 참조 (selectedSt.colorCode)
  -> Phase 1 기간 동안 유지
  -> Phase 2 (P2-9)에서 Layer 1로 전면 전환
```

### 3.2 타이포그래피

```
폰트: Pretendard Variable (CDN, 현행 유지)

사용 스케일 (Phase 1 범위):
  text-5xl ~ text-6xl, font-black : TAP 버튼 텍스트
  text-4xl ~ text-6xl, font-black : BurstOverlay 제목
  text-2xl, font-black            : ComboIndicator (4x 단계)
  text-xl, font-black             : ComboIndicator (3x), 빈 상태 제목
  text-lg, font-black             : ComboIndicator (2x), FloatingScore
  text-sm, font-semibold          : 뱃지, 카운터, 보조 텍스트
  text-xs, font-semibold          : OnlineCountBadge 텍스트
  text-[10px], font-semibold      : 하단 탭바 레이블
```

### 3.3 스페이싱 (핵심 컴포넌트)

```
페이지 패딩: px-4 sm:px-6, pt-20, pb-24 md:pb-8
카드 패딩: card-game = p-8 (2rem)
카드 간격: mb-6 (24px)
게이지 바 좌측 오프셋: ml-8 (순위 번호 + 로고 정렬)
ComboIndicator 하단 간격: mb-4
TAP 버튼: w-48 h-48 / sm:w-56 sm:h-56
```

---

## 4. Phase 1 작업별 최종 디자인 스펙

---

### F1: 컴포넌트 분리 후 레이아웃

**목적**: game/page.tsx 602줄 -> 오케스트레이션 전용 + 4개 하위 컴포넌트

**분리 대상 및 파일 경로**:

| 컴포넌트 | 경로 | 책임 |
|---------|------|------|
| TeamProgressBar | `components/game/TeamProgressBar.tsx` | 전체 팀 진행 현황 카드 + OnlineCountBadge |
| ClickButton | `components/game/ClickButton.tsx` | TAP 버튼 + Ripple + FloatingScore |
| ComboIndicator | `components/game/ComboIndicator.tsx` | 콤보 단계별 표시 |
| BurstOverlay | `components/game/BurstOverlay.tsx` | 박 터짐 전체화면 오버레이 |

**레이아웃 검증 기준**: 분리 전후 동일한 DOM 구조/클래스 유지. 시각적 차이 0.

**Props 인터페이스 (확정)**:

```ts
// TeamProgressBar
interface TeamProgressBarProps {
  teams: Array<SeasonTeamInfo & { total: number; isBurst: boolean }>;
  goal: number;
  selectedTeamId: string | null;
  onlineCount: number;
  gameEventId: string;
}

// ClickButton
interface ClickButtonProps {
  teamColor: string;
  combo: number;
  multiplier: number;       // 서버 응답 (1/2/3/4)
  isBurst: boolean;
  myTotal: number;
  ripples: Ripple[];
  floatingScores: FloatingScore[];
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// ComboIndicator
interface ComboIndicatorProps {
  combo: number;
  multiplier: number;       // var(--team-primary) 직접 참조
}

// BurstOverlay
interface BurstOverlayProps {
  burstTeamName: string | null;  // null이면 unmount
}
```

**game/page.tsx 잔여 책임**: 상태 관리 (useState), WebSocket 연결, handleClick, 레이아웃 조립.

---

### F2: 팀 컬러 CSS 변수 시스템

**변수 정의 (3개)**:

| 변수명 | 생성 규칙 | 용도 |
|--------|----------|------|
| `--team-primary` | `colorCode` 그대로 | 게이지 fill, 도트, 보더 |
| `--team-secondary` | `${colorCode}33` (20% 알파) | 리플 배경, 뱃지 보더, 그림자 |
| `--team-light` | `${colorCode}15` (8% 알파) | 뱃지 배경, 카드 하이라이트 |

**생성 규칙 (hex 알파 연결)**:
```ts
// 팀 선택 시 <main>에 주입
const teamVars = selectedSt ? {
  "--team-primary": selectedSt.colorCode,
  "--team-secondary": `${selectedSt.colorCode}33`,
  "--team-light": `${selectedSt.colorCode}15`,
} as React.CSSProperties : undefined;

// JSX
<main className="min-h-screen pb-24 md:pb-8 pt-20" style={teamVars}>
```

**적용 대상 (Phase 1)**:

| 요소 | CSS 변수 사용 방식 |
|------|-------------------|
| click-ripple 배경 | `background: var(--team-secondary, rgba(255,107,53,0.3))` |
| OnlineCountBadge 배경 | `background: var(--team-light, #FF6B3515)` |
| OnlineCountBadge 보더 | `border: 1px solid var(--team-secondary, #FF6B3533)` |
| OnlineCountBadge 도트 | `background: var(--team-primary, #FF6B35)` |
| 내 팀 카드 좌측 보더 (신규) | `border-left: 3px solid var(--team-primary)` |
| ComboIndicator 그림자 | `box-shadow: 0 4px 20px var(--team-secondary)` |

**미적용 대상 (기존 inline style 유지)**:

| 요소 | 유지 이유 |
|------|----------|
| ClickButton background gradient | colorCode 직접 참조. Phase 2에서 전환 |
| ClickButton boxShadow | colorCode 직접 참조 |
| 게이지 바 backgroundColor | colorCode 직접 참조 |
| 내 팀 퍼센트 텍스트 color | colorCode 직접 참조 |

**globals.css 변경사항**:

```css
/* 1. :root 폴백 추가 (@layer base 내부) */
@layer base {
  :root {
    --team-primary: #FF6B35;
    --team-secondary: #FF6B3533;
    --team-light: #FF6B3515;
  }
}

/* 2. click-ripple 팀 컬러 전환 */
.click-ripple {
  /* 기존: background: rgba(255, 107, 53, 0.3); */
  background: var(--team-secondary, rgba(255, 107, 53, 0.3));
  /* 나머지 속성 유지 */
}

/* 3. @keyframes pulse 추가 (참여자 카운터 도트용) */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
```

---

### F3: Confetti 팀 컬러 배합

**인터페이스 변경**:

```ts
// 변경 전
interface ConfettiProps { active: boolean }

// 변경 후
interface ConfettiProps {
  active: boolean;
  teamColor?: string;  // hex 6자리. 없으면 기존 6색 랜덤 폴백
}
```

**5색 배합 공식**:

```ts
const buildTeamColors = (teamColor: string): string[] => {
  const isLight = isLightColor(teamColor);
  return [
    teamColor,              // 40% 비중 (2슬롯)
    teamColor,
    `${teamColor}99`,       // 60% 알파 (시각적 깊이)
    "#FFFFFF",              // 밝기 리듬
    isLight ? "#FF6B35" : "#FFD700",  // 밝은 팀색이면 coral, 아니면 gold
  ];
};
```

**밝기 판단 함수**:

```ts
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.8;
};
```

**호출 변경 (game/page.tsx)**:

```tsx
// 변경 전
<Confetti active={showConfetti} />

// 변경 후
<Confetti active={showConfetti} teamColor={selectedSt?.colorCode} />
```

---

### F4: 콤보 Multiplier UI

**콤보 단계 정의 (서버 결정, 방향서 M4/B6)**:

| combo count | multiplier | 레이블 | 크기 | 배경 | 특수 효과 |
|------------|------------|--------|------|------|----------|
| 0~4 | 1x | 미표시 (컴포넌트 unmount) | - | - | - |
| 5~19 | 2x | `COMBO! x{n}` | px-4 py-2, text-lg | team-primary gradient | 없음 |
| 20~49 | 3x | `SUPER COMBO! x{n}` | px-5 py-2.5, text-xl | team-primary gradient | pulse-glow |
| 50+ | 4x | `ULTRA COMBO! x{n}` | px-6 py-3, text-2xl | team-primary gradient | burst-shake |

**ComboIndicator 상세 스펙**:

```
구조: [이모지] [LABEL! x{combo}]

이모지:
  2x: (없음 또는 생략)
  3x: (없음 또는 생략)
  4x: (없음 또는 생략)

배경:
  background: linear-gradient(135deg, var(--team-primary), {colorCode}CC)
  -> var(--team-primary)에 알파를 붙이는 건 CSS 변수로 불가능하므로
     inline style에서 colorCode prop 직접 사용하여 gradient 구성

그림자:
  box-shadow: 0 4px 20px var(--team-secondary)

텍스트: color: white, font-black
border-radius: 9999px (pill)

진입: Framer Motion AnimatePresence (scale 0.5->1, opacity 0->1)
퇴장: scale 0.5 + opacity 0
단계 전환: CSS transition (padding, font-size) 0.15s ease

3x 단계 추가: animation: pulse-glow 1s infinite (기존 keyframe)
4x 단계 추가: animation: burst-shake 0.5s (기존 keyframe)
```

**FloatingScore multiplier 반영**:

```
click:ack 수신 전 (낙관적): "+1" (text-white)
click:ack 수신 후:
  multiplier = 1: "+1" (text-white, 변경 없음)
  multiplier = 2: "+2x" (text-yellow-300, font-black)
  multiplier = 3: "+3x" (text-yellow-300, font-black)
  multiplier = 4: "+4x" (text-yellow-300, font-black, scale 1.2)
```

**플리커 방지 규칙**:
- FloatingScore는 emit 시 생성, ack 수신 시 텍스트만 교체 (재생성하지 않음)
- 서버 combo < 로컬 combo: 0.2s transition으로 하강
- ack 지연 100ms 이내 가정, 그 동안은 "+1" 고정

**FloatingScore 타입 변경**:

```ts
// 변경 전
interface FloatingScore { id: number; x: number; y: number; }

// 변경 후
interface FloatingScoreWithMultiplier {
  id: number;
  x: number;
  y: number;
  multiplier: number;  // 초기 1, ack 수신 시 서버값으로 업데이트
}
```

---

### F5: 실시간 참여자 카운터 뱃지

**위치**: TeamProgressBar 카드 헤더 우측 (h3 flex justify-between)

```
[박 터트리기 현황]              [N명 참여 중]
```

**OnlineCountBadge 컴포넌트 스펙**:

```ts
interface OnlineCountBadgeProps {
  count: number;
}
```

**렌더링 조건**: `count > 0`일 때만 렌더. 0 또는 undefined이면 null 반환.

**스타일 스펙**:

```
컨테이너:
  display: inline-flex
  align-items: center
  gap: 6px (gap-1.5)
  padding: 4px 10px (px-2.5 py-1)
  background: var(--team-light, #FF6B3515)
  border-radius: 9999px (rounded-full)
  border: 1px solid var(--team-secondary, #FF6B3533)

도트 (pulse 애니메이션):
  width: 6px, height: 6px (w-1.5 h-1.5)
  border-radius: 50% (rounded-full)
  background: var(--team-primary, #FF6B35)
  animation: pulse 2s infinite

텍스트:
  font-size: 12px (text-xs)
  font-weight: 600 (font-semibold)
  color: var(--color-ink-light) (#4A4458)
  포맷: "{count}명 참여 중"

숫자 변경: 즉시 교체 (트랜지션 없음)
```

**접근성**: `aria-label="현재 {count}명 참여 중"`

**헤더 JSX 구조 (TeamProgressBar 내부)**:

```tsx
<h3 className="font-bold mb-4 flex items-center justify-between gap-2">
  <span className="flex items-center gap-2">
    <span>🏆</span> 박 터트리기 현황
  </span>
  {onlineCount > 0 && <OnlineCountBadge count={onlineCount} />}
</h3>
```

---

### F6: 카피라이팅 변경 목록

#### 6.1 game/page.tsx 변경

| 위치 | 현재 문구 | 새 문구 |
|------|----------|---------|
| L232 (h2) | `활성 시즌이 없습니다` | `다음 운동회를 준비 중이에요!` |
| L233-236 (p) | `아직 시즌이 시작되지 않았어요.` + `Admin에서 시즌을 활성화하면 게임을 시작할 수 있어요.` | `곧 새로운 시즌이 열릴 예정이에요.` + `알림을 켜두고 기다려 주세요!` |
| L249 (h2) | `게임 이벤트 준비 중` | `잠깐! 박이 아직 준비 중이에요` |
| L250-252 (p) | `현재 진행 중인 게임 이벤트가 없어요.` + `곧 시작될 예정이니 조금만 기다려 주세요!` | `감독님이 박을 달고 있는 중이에요.` + `조금만 기다리면 터트릴 수 있어요!` |

#### 6.2 layout.tsx 변경 (metadata)

```ts
// 변경 전
export const metadata: Metadata = {
  title: "아이돌 팬덤 대회",
  description: "팬덤의 화력을 건강하게 증명하는 7일간의 축제",
  openGraph: {
    title: "아이돌 팬덤 대회",
    description: "팬덤의 화력을 건강하게 증명하는 7일간의 축제",
  },
};

// 변경 후
export const metadata: Metadata = {
  title: {
    default: "아이돌 가을 운동회",
    template: "%s | 아이돌 가을 운동회",
  },
  description: "내 팀의 박을 터트려라! 팬덤이 직접 만드는 7일간의 아이돌 운동회",
  openGraph: {
    title: "아이돌 가을 운동회",
    description: "내 팀의 박을 터트려라! 팬덤이 직접 만드는 7일간의 아이돌 운동회",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "아이돌 가을 운동회",
    description: "내 팀의 박을 터트려라! 7일간의 팬덤 대전",
  },
};
```

#### 6.3 기타 페이지 Admin 문구 제거

| 파일 | 현재 문구 | 새 문구 |
|------|----------|---------|
| `cheer/page.tsx` L262-264 | "활성 시즌이 없습니다" + "Admin에서 시즌을 활성화하면 응원을 시작할 수 있어요." | "응원 준비 중이에요!" + "시즌이 시작되면 팀 구역별 응원을 보낼 수 있어요." |
| `relay/page.tsx` L178-182 | "Admin에서 시즌을 활성화하면 이어달리기를 시작할 수 있어요." | "이어달리기 시즌이 시작되면 바통을 이어받을 수 있어요." |
| `scoreboard/page.tsx` L109-111 | "Admin에서 시즌을 ACTIVE로 설정해주세요" | "곧 시작될 시즌을 기대해 주세요!" |

#### 6.4 빈 상태 카드 배경 장식 추가

```tsx
// 빈 상태 카드에 배경 그라데이션 레이어 추가
<div className="text-center card-game max-w-sm mx-4 relative overflow-hidden">
  <div className="absolute inset-0 opacity-5"
       style={{ background: "linear-gradient(135deg, #FFD166, #FB7185)" }} />
  <div className="relative">
    {/* 기존 콘텐츠: 이모지 + h2 + p */}
  </div>
</div>
```

---

### F7: Navigation "LIVE - DAY N" 동적 표시

**현재 코드** (Navigation.tsx L152):
```tsx
<span className="text-green-700 text-xs">LIVE - DAY 5</span>
```

**변경 스펙**:

| 상태 | 표시 텍스트 | 스타일 |
|------|-----------|--------|
| 시즌 활성 + API 성공 | `LIVE - DAY {currentDay}` | text-green-700 (현행) |
| 시즌 활성 + API 실패 | `LIVE` | text-green-700 (현행) |
| 시즌 없음 | 배지 숨김 또는 `시즌 준비 중` | text-ink-muted, dot 회색 |

**데이터 소스**: Navigation 내부에서 `publicApi.getActiveSeason()` 독립 호출.
Navigation은 모든 페이지에 표시되므로 props 전달보다 독립 호출이 적합하다.

**currentDay 계산**:
```ts
// season.startDate 기준 경과일
const currentDay = Math.floor(
  (Date.now() - new Date(season.startDate).getTime()) / (1000 * 60 * 60 * 24)
) + 1;
```

**데스크탑 LIVE 배지도 동일 변경 적용** (Navigation.tsx L69-76):
현재 데스크탑 LIVE 배지에는 "DAY" 텍스트가 없으므로 추가해야 한다.

---

### F8/F9: 소켓 훅 / Heartbeat (디자인 관여 없음)

디자인 관점에서 확인 완료:
- F8 (useSocketEvent 훅): 순수 기술 리팩토링. UI 변경 없음.
- F9 (heartbeat 전송): UI 변경 없음. visibilitychange 연동은 F5 참여자 카운터의 데이터 소스 정확성에 영향.
- F9 완성이 F5 OnlineCountBadge의 정확한 데이터를 보장하므로 F9 -> F5 순서 의존성 존재.

---

## 5. 컴포넌트 목록 (재사용 컴포넌트)

| 컴포넌트 | 경로 | 신규/수정 | 재사용 범위 |
|---------|------|---------|-----------|
| TeamProgressBar | `components/game/TeamProgressBar.tsx` | 신규 (분리) | game 페이지 전용 |
| ClickButton | `components/game/ClickButton.tsx` | 신규 (분리) | game 페이지 전용 |
| ComboIndicator | `components/game/ComboIndicator.tsx` | 신규 (분리) | game 페이지 전용 |
| BurstOverlay | `components/game/BurstOverlay.tsx` | 신규 (분리) | game 페이지 전용 |
| OnlineCountBadge | `components/game/OnlineCountBadge.tsx` | 신규 | TeamProgressBar 내부 사용 |
| Confetti | `components/Confetti.tsx` | 수정 (teamColor prop 추가) | BurstOverlay, 기타 |
| Navigation | `components/Navigation.tsx` | 수정 (LIVE DAY 동적화) | 전역 |
| TeamLogo | `components/TeamLogo.tsx` | 변경 없음 | 전역 |

---

## 6. 프론트엔드 전달 사항

### 6.1 구현 시 주의할 인터랙션

**ComboIndicator 진입/퇴장**:
- AnimatePresence 필수 (combo 0 <-> 5 전환 시 부드러운 mount/unmount)
- 진입: scale 0.5 -> 1, opacity 0 -> 1
- 퇴장: scale 0.5, opacity 0
- Framer Motion은 이 진입/퇴장 전환에만 허용

**ComboIndicator 단계 전환 (5->20, 20->50)**:
- CSS transition으로 처리 (padding, font-size 0.15s ease)
- Framer Motion 재렌더 금지 (key 변경으로 재마운트하지 않을 것)
- 3x pulse-glow, 4x burst-shake는 CSS animation (기존 keyframe 재활용)

**FloatingScore multiplier 교체**:
- 이미 DOM에 존재하는 FloatingScore의 텍스트를 ack 시점에 교체
- 새 FloatingScore를 추가로 생성하지 않음 (이중 표시 방지)
- FloatingScoreWithMultiplier 타입의 multiplier 필드를 state 업데이트

**click-ripple 색상**:
- 현재 game/page.tsx L556에서 `background: "rgba(255,255,255,0.3)"` 하드코딩
- 이것은 click-ripple CSS 클래스의 background를 inline으로 덮어쓰고 있음
- F2 적용 시: inline style 제거하고 CSS 클래스의 var(--team-secondary) 사용으로 전환

### 6.2 애니메이션 규칙

```
[CSS animation/transition 사용 -- 고빈도]
  - click-ripple: @keyframes ripple (기존)
  - FloatingScore y 이동: Framer Motion 허용 (최대 8개, H1 보류)
  - pulse 도트: @keyframes pulse (신규)
  - ComboIndicator 크기 전환: CSS transition
  - pulse-glow: @keyframes pulse-glow (기존)
  - burst-shake: @keyframes burst-shake (기존)
  - shimmer: @keyframes shimmer (기존)

[Framer Motion 사용 -- 진입/퇴장만]
  - ComboIndicator mount/unmount: AnimatePresence
  - BurstOverlay mount/unmount: AnimatePresence
  - 팀 선택 카드 stagger: initial/animate (기존)
  - 게임 헤더/카드 진입: initial/animate (기존)
```

### 6.3 반응형 기준

```
모바일 (< 768px, md 미만):
  - 하단 탭바 표시 (h-16, pb-24)
  - TAP 버튼: w-48 h-48
  - 팀 선택 그리드: grid-cols-2
  - AdSense aside 숨김

태블릿/데스크탑 (>= 768px, md 이상):
  - 하단 탭바 숨김 (pb-8)
  - 상단 네비게이션 전체 표시

대형 데스크탑 (>= 1280px, xl 이상):
  - AdSense 좌우 aside 160px 표시
  - TAP 버튼: sm:w-56 sm:h-56
  - 팀 선택 그리드: sm:grid-cols-3
```

### 6.4 접근성 체크리스트

| 요소 | 필수 속성 |
|------|----------|
| OnlineCountBadge | `aria-label="현재 N명 참여 중"` |
| ComboIndicator | `aria-label="콤보 {n}회, {m}배 보너스"` |
| FloatingScore | `aria-hidden="true"` (시각 피드백 전용) |
| BurstOverlay | `role="alert" aria-live="assertive"` |
| TAP 버튼 (disabled) | `disabled` 속성 + `aria-disabled="true"` |
| 모바일 메뉴 버튼 | `aria-label="메뉴"` (기존 확인 완료) |

### 6.5 성능 가이드라인

- 동시 렌더링 상한: ripple 10개 (slice(-10)), floatingScore 8개 (slice(-8))
- CSS 변수 주입: React style prop 단일 DOM 업데이트 (전체 트리 리렌더 없음)
- pulse 애니메이션: transform + opacity만 사용 (reflow 없음)
- Confetti: CSS animation 전용, 최대 30개 파티클 (기존 유지)

---

## 7. 개발팀 핸드오프 체크리스트

### 7.1 구현 전 확인

- [ ] F1 컴포넌트 분리가 모든 후속 작업(F2~F5)의 선행 조건임을 인지
- [ ] globals.css @theme 블록은 절대 수정하지 않음 (Layer 0 불변)
- [ ] 팀 컬러 CSS 변수는 `<main>` 스코프에만 적용 (Navigation 중립)
- [ ] Phase 1 하이브리드 전략: 기존 inline style 제거하지 않음

### 7.2 F2 CSS 변수 구현 시

- [ ] `:root` 폴백 변수 3개 추가 (coral 계열)
- [ ] `.click-ripple` background를 `var(--team-secondary)` 폴백으로 변경
- [ ] `@keyframes pulse` 추가 (기존 pulse-glow와 별개)
- [ ] `<main>` style 주입 로직: 팀 미선택 시 style 속성 자체 제거 (undefined)
- [ ] game/page.tsx L556 ripple inline style `background: "rgba(255,255,255,0.3)"` 제거 확인

### 7.3 F3 Confetti 구현 시

- [ ] `teamColor` prop optional (기존 호출부 깨지지 않음)
- [ ] `isLightColor()` 함수 luminance 0.8 기준 검증 (밝은색 테스트: #FFE4B5, #FFFACD)
- [ ] 팀 미선택 burst (이론적 경우): 기존 6색 COLORS 배열 폴백

### 7.4 F4 콤보 구현 시

- [ ] `click:ack` 이벤트 핸들러에서 combo, multiplier 수신
- [ ] FloatingScore id 기반으로 기존 항목의 multiplier만 업데이트 (재생성 금지)
- [ ] 서버 combo < 로컬 combo 시 transition 0.2s 적용 확인
- [ ] ComboIndicator key prop에 combo 값을 넣지 않을 것 (재마운트 방지)

### 7.5 F5 참여자 카운터 구현 시

- [ ] `score:update` 이벤트에 `onlineCount` 필드 추가 (백엔드 B9 의존)
- [ ] onlineCount 0/undefined 시 뱃지 숨김 (렌더 자체 안 함)
- [ ] `aria-label` 동적 업데이트

### 7.6 F6 카피라이팅 구현 시

- [ ] "Admin" 문구가 포함된 모든 사용자 노출 텍스트 검색하여 전수 교체
- [ ] metadata template 적용 후 각 페이지별 title export 추가 여부 확인
- [ ] 빈 상태 카드 배경 장식 레이어 추가 시 `relative overflow-hidden` 필수

### 7.7 F7 Navigation 구현 시

- [ ] Navigation 내부 API 호출 시 에러 핸들링 (catch -> "LIVE" 만 표시)
- [ ] 데스크탑 LIVE 배지(L69-76)와 모바일 드로어 LIVE 배지(L152) 양쪽 모두 변경
- [ ] currentDay 계산 시 timezone 고려 (서버 startDate가 UTC인지 KST인지 확인)

### 7.8 통합 검증

- [ ] 팀 선택 -> 해제 -> 재선택 시 CSS 변수 정상 전환 확인
- [ ] 5개 이상 팀이 존재할 때 TeamProgressBar 스크롤/레이아웃 확인
- [ ] 모바일에서 ComboIndicator + ClickButton 동시 표시 시 화면 넘침 확인
- [ ] 빠른 연타 시 FloatingScore 8개 상한 + multiplier 교체 정상 동작
- [ ] Burst 후 Confetti 팀색 적용 + 5초 후 자동 해제 확인

---

## 8. Phase 2 디자인 선행 메모

Phase 1 완료 후 우선적으로 착수할 디자인 항목:

1. **P2-1 Hero 리뉴얼**: 1위 팀 실시간 표시 + 팀색 첫 노출 포인트
2. **P2-4 탄막 오버레이**: 상단 1/3 제한, CSS animation 전용, FPS 모니터링
3. **P2-9 CSS 변수 전면 전환**: Layer 2 inline style -> Layer 1 var() 완전 이관
4. **P2-10 다크모드 토큰**: `--team-on-primary` (텍스트 가독성), `--team-surface`
