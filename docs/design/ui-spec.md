# K-F-C UI 디자인 스펙 (Phase 1)

> 기반 문서: `docs/planning/project-direction.md`, `docs/planning/fan-ux-strategy.md`
> 작성일: 2026-04-14 | 작성자: UI디자이너
> 대상 작업: Phase 1 F2 ~ F6 (프론트 작업 기준)

---

## 0. 설계 원칙 (이 스펙 전체에 적용)

1. **팀 컬러가 서비스 브랜드를 침범하지 않는다** — `<main>` 스코프 제한, Navigation은 항상 중립
2. **CSS animation 우선, Framer Motion은 진입/퇴장 전환에만** — 고빈도 DOM 조작(ripple, floating score, combo)은 CSS 전용
3. **하이브리드 전략** — Phase 1에서는 기존 inline style 유지 + 새 요소에만 CSS 변수. 전면 전환은 Phase 2
4. **기존 @theme 토큰과 충돌 금지** — 팀 컬러 변수는 별도 네임스페이스(`--team-*`)로 분리

---

## 1. 현행 디자인 시스템 현황 분석

### 1.1 globals.css @theme 토큰 현황

현재 `globals.css`의 `@theme` 블록은 서비스 브랜드 컬러 팔레트를 정의한다.

```
브랜드 컬러 (변경 금지)
--color-coral: #FF6B35          (Primary CTA, 활성 상태, 링크)
--color-coral-light: #FF8C5A    (Hover 상태)
--color-coral-dark: #E55A2B     (Active/Pressed 상태)
--color-mint: #2EC4B6           (Secondary 액센트)
--color-mint-light: #5DD9CD
--color-mint-dark: #20A396
--color-sunny: #FFD166          (Warning, 하이라이트, selection)
--color-sunny-light: #FFDB85
--color-sunny-dark: #F0BC3E
--color-lavender: #A78BFA       (gradient-text 보조)
--color-rose: #FB7185           (gradient-text 보조)
--color-sky: #38BDF8            (정보성 색상)
--color-cream: #FFFBF5          (body 배경)
--color-cream-dark: #FFF5E9
--color-ink: #1E1B2E            (기본 텍스트)
--color-ink-light: #4A4458      (보조 텍스트)
--color-ink-muted: #8B83A0      (약화 텍스트)
```

**주요 컴포넌트 클래스 현황**

| 클래스 | 용도 | 팀 컬러 영향 여부 |
|--------|------|-----------------|
| `.btn-primary` | coral 그라디언트 CTA | 비영향 (서비스 브랜드 고정) |
| `.btn-secondary` | coral 보더/텍스트 | 비영향 |
| `.card` | 흰 배경 카드 | 비영향 |
| `.card-game` | 흰 배경 게임 카드, sunny hover | 비영향 (단, 카드 내부 요소는 팀 컬러 사용 가능) |
| `.score-bar` | 진행 게이지 | 팀 컬러 직접 적용 (현행 inline style) |
| `.click-ripple` | 클릭 리플 | 팀 컬러 변수 전환 대상 |
| `.floating-badge` | LIVE 뱃지 | 비영향 |

---

## 2. 팀 컬러 CSS 변수 시스템 (Phase 1 F2)

### 2.1 변수 정의 및 파생 규칙

팀의 `colorCode` (hex 6자리)를 기반으로 3개 변수를 파생한다.

```css
/* 팀 선택 시 <main> 요소에 인라인 style로 주입 */
--team-primary:    {colorCode}          /* 원본 hex 그대로 */
--team-secondary:  {colorCode}33        /* 원본 hex + 알파 20% (33 = 0x33 = 51 = 20%) */
--team-light:      {colorCode}15        /* 원본 hex + 알파 8%  (15 = 0x15 = 21 = ~8%) */
```

**파생 예시**

| colorCode | --team-primary | --team-secondary | --team-light |
|-----------|---------------|-----------------|--------------|
| `#FF6B6B` | `#FF6B6B`     | `#FF6B6B33`     | `#FF6B6B15` |
| `#2EC4B6` | `#2EC4B6`     | `#2EC4B633`     | `#2EC4B6015`|
| `#A78BFA` | `#A78BFA`     | `#A78BFA33`     | `#A78BFA15` |
| `#FFD166` | `#FFD166`     | `#FFD16633`     | `#FFD16615` |

**왜 hex 알파인가**: CSS 4자리/8자리 hex는 모든 모던 브라우저에서 지원된다. `rgba()` 함수를 사용하면 런타임에 hex 파싱 후 RGB 분해가 필요하지만, hex 알파 직접 주입은 단순 문자열 연결로 처리 가능하다.

### 2.2 주입 위치 — `<main>` 요소 스코프

```tsx
// game/page.tsx (팀 선택 후 렌더되는 <main>)
<main
  className="min-h-screen pb-24 md:pb-8 pt-20"
  style={selectedSt ? {
    "--team-primary": selectedSt.colorCode,
    "--team-secondary": `${selectedSt.colorCode}33`,
    "--team-light": `${selectedSt.colorCode}15`,
  } as React.CSSProperties : undefined}
>
```

팀 미선택 상태(`selectedSt === null`)에서는 `style` 속성 자체를 제거한다. CSS 변수 fallback이 없으면 해당 속성이 렌더되지 않으므로 안전하다.

### 2.3 CSS 변수 적용 대상 vs 미적용 대상

**적용 대상 (새 요소 또는 교체 대상)**

| 요소 | 현행 방식 | Phase 1 전환 방식 |
|------|----------|-----------------|
| 내 팀 진행 카드 헤더 하이라이트 | 없음 | `border-left: 3px solid var(--team-primary)` |
| 콤보 인디케이터 배경 | `background: linear-gradient(135deg, colorCode, colorCodeCC)` inline | CSS 변수 유지 (기존 inline 방식 유지, ComboIndicator 분리 시 props로 전달) |
| floating score 텍스트 | `color: white` 고정 | 변경 없음 (버튼 배경 위에 white가 적합) |
| 참여자 카운터 뱃지 도트 | 신규 요소 | `background: var(--team-primary)` |
| click-ripple 배경 | `background: rgba(255,107,53,0.3)` 하드코딩 | `background: var(--team-secondary)` |
| 내 팀 퍼센트 텍스트 | `color: selectedSt.colorCode` inline | 유지 (기존 inline style 유지) |

**미적용 대상 (Phase 1 범위 아님)**

| 요소 | 미적용 이유 |
|------|-----------|
| Navigation (헤더 + 모바일 탭바) | 중립 브랜드 유지. 팀 색에 물들면 서비스 정체성 훼손 |
| `.btn-primary` / `.btn-secondary` | 서비스 CTA는 coral 고정. 팀 컬러로 교체하면 접근성 검증 미보장 |
| 메인 페이지 Hero 섹션 | Phase 2 Hero 리뉴얼 시 함께 처리 |
| 스코어보드, 응원 게시판, 투표 | 여러 팀이 공존하는 페이지 — 단일 팀 컬러 적용 부적합 |
| `<html>`, `<body>` | 스코프를 `<main>`으로 제한하는 방향서 결정 준수 |

### 2.4 하이브리드 전략 명세

Phase 1에서는 기존 inline style을 **제거하지 않는다**. 새 컴포넌트(ComboIndicator, TeamProgressBar, 참여자 카운터)에서만 CSS 변수를 사용한다.

```
기존 inline style 유지 대상:
- ClickButton: background gradient (colorCode → colorCodeDD)
- ClickButton: boxShadow (colorCode 기반)
- TeamProgressBar 게이지 바: backgroundColor (colorCode)
- 내 팀 퍼센트 텍스트: color (colorCode)

CSS 변수 전환 대상:
- click-ripple 배경색 (.click-ripple 클래스 수정)
- ComboIndicator (신규 컴포넌트, CSS 변수로 작성)
- 참여자 카운터 뱃지 (신규 요소, CSS 변수로 작성)
- 내 팀 진행 카드 좌측 보더 강조 (신규 디테일)
```

**Phase 2에서 전면 전환**: `P2-9 CSS 변수 inline style 전면 전환`에서 기존 inline style을 모두 CSS 변수로 교체한다.

---

## 3. Confetti 팀 컬러 배합 (Phase 1 F3)

### 3.1 5색 배합 공식

```ts
// Confetti.tsx — teamColor prop 수신 시
const buildColors = (teamColor: string): string[] => [
  teamColor,        // 40% 비중 (index 0,1 — 2개)
  teamColor,
  `${teamColor}99`, // 60% 알파 (lightened 표현)
  "#FFFFFF",        // 흰색 (축제 느낌, 공백감)
  "#FFD700",        // 골드 (승리/축제 공통 감성)
];
```

**비중 설명**: 5개 슬롯 중 팀 컬러 2개 = 40%, light 1개 = 20%, white 1개 = 20%, gold 1개 = 20%
실제 렌더링 시 `COLORS[Math.floor(Math.random() * COLORS.length)]`로 균등 샘플링되므로 팀 컬러가 가장 많이 등장한다.

### 3.2 어두운 팀 컬러 vs 밝은 팀 컬러 대비 규칙

배경이 흰색(기본 body `--color-cream: #FFFBF5`)이므로:

| 팀 컬러 밝기 | 조정 |
|------------|------|
| 어두운 컬러 (L < 40, 예: #1A1A5E) | 배합 그대로 사용. 어두운 컬러가 크림 배경에서 잘 보임 |
| 밝은 컬러 (L > 80, 예: #FFE4B5, #FFFACD) | `"#FFD700"` 대신 `"#FF6B35"` (coral)으로 교체하여 대비 확보 |

**밝기 판단 기준 (런타임)**:
```ts
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // 상대 휘도 근사값
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.8;
};
```

### 3.3 Confetti 컴포넌트 인터페이스 변경

```ts
// 변경 전
interface ConfettiProps { active: boolean }

// 변경 후
interface ConfettiProps {
  active: boolean;
  teamColor?: string; // 없으면 기존 6색 랜덤 폴백
}
```

팀 미선택 상태(팀 외 요소가 burst trigger한 경우 등)에서는 기존 `COLORS` 배열 폴백을 유지한다.

---

## 4. 콤보 Multiplier 비주얼 (Phase 1 F4)

### 4.1 콤보 단계 정의

서버사이드 결정(방향서 M4, B6)에 따른 단계:

| combo count | multiplier | 표시 레이블 | 색상 처리 |
|------------|------------|-----------|---------|
| 0 ~ 4      | 1x         | 미표시      | -       |
| 5 ~ 19     | 2x         | COMBO! x{n} | `--team-primary` 기반 |
| 20 ~ 49    | 3x         | SUPER COMBO! x{n} | `--team-primary` + 펄스 글로우 |
| 50+        | 4x         | ULTRA COMBO! x{n} | `--team-primary` + 쉐이크 애니 |

### 4.2 콤보 인디케이터 시각 스펙 (ComboIndicator 컴포넌트)

```
구조:
  [multiplier 뱃지] [COMBO 텍스트] [콤보 카운터]

크기 변화 (단계별):
  2x: px-4 py-2, text-lg, font-black
  3x: px-5 py-2.5, text-xl, font-black + 펄스 글로우
  4x: px-6 py-3, text-2xl, font-black + burst-shake 애니메이션

배경:
  background: linear-gradient(135deg, var(--team-primary), var(--team-primary)CC)
  (inline style로 작성 — CSS 변수 값에 CC 알파 직접 연산 불가이므로)

그림자:
  box-shadow: 0 4px 20px var(--team-secondary)

텍스트:
  color: white (팀 컬러 위에 항상 white)

애니메이션:
  진입: Framer Motion (AnimatePresence) — scale 0.5→1, opacity 0→1
  단계 전환: CSS transition (scale, box-shadow) 0.15s ease
  3x 글로우: @keyframes pulse-glow (기존 globals.css 키프레임 재활용)
  4x 쉐이크: @keyframes burst-shake (기존 globals.css 키프레임 재활용)
```

### 4.3 floating score 표시 (multiplier 반영)

```
click:ack 수신 전 (낙관적): "+1" (흰색, 기존 방식)
click:ack 수신 후 multiplier 2x: "+2x" (흰색 + 살짝 큰 scale)
click:ack 수신 후 multiplier 3x: "+3x" (흰색 + font-black)
click:ack 수신 후 multiplier 4x: "+4x" (흰색 + font-black + #FFD700 텍스트)
```

**플리커 방지 규칙** (방향서 F4): 서버 combo가 로컬 combo보다 낮으면 서버값으로 전환 시 `transition: all 0.2s ease` 적용. floating score는 서버 ack 시점에 업데이트하되, ack 지연(100ms 이내 가정) 동안은 "+1" 고정으로 표시한다.

### 4.4 ClickButton 콤보 연동 비주얼

combo 10 이상 시 버튼 glow 강도 증가 (기존 코드 유지):
```
boxShadow: `0 0 ${20 + combo}px var(--team-primary)80, 0 8px 32px var(--team-primary)40`
```
단, CSS 변수를 box-shadow에 직접 사용하려면 inline style 필요. 현행 colorCode 직접 참조 방식 유지.

---

## 5. 실시간 참여자 카운터 뱃지 (Phase 1 F5)

### 5.1 배치 위치

진행 상황 카드(`card-game` — "박 터트리기 현황" 섹션) 헤더 우측.

```
[🏆 박 터트리기 현황]           [● N명 참여 중]
```

헤더 flex 구조:
```tsx
<h3 className="font-bold flex items-center justify-between gap-2">
  <span className="flex items-center gap-2">
    <span>🏆</span> 박 터트리기 현황
  </span>
  <OnlineCountBadge count={onlineCount} />
</h3>
```

### 5.2 뱃지 디자인 스펙

```
컨테이너:
  display: inline-flex
  align-items: center
  gap: 0.375rem (6px)
  padding: 0.25rem 0.625rem (4px 10px)
  background: var(--team-light, #FF6B3515)  /* 팀 컬러 8% 알파, 폴백은 coral 8% */
  border-radius: 9999px (pill)
  border: 1px solid var(--team-secondary, #FF6B3533)

도트 (펄스 애니메이션):
  width: 6px, height: 6px
  border-radius: 50%
  background: var(--team-primary, #FF6B35)
  animation: pulse 2s infinite  (CSS — Framer Motion 금지)

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

텍스트:
  font-size: 0.75rem (12px)
  font-weight: 600
  color: var(--color-ink-light)
  내용: "{count}명 참여 중"

숫자 전환:
  count 변화 시 CSS transition (opacity 0→1, 0.15s) — 숫자만 fade

팀 미선택 상태:
  뱃지 배경: #FF6B3515 (coral 폴백)
  도트: #FF6B35
  (CSS 변수 폴백값으로 처리)
```

### 5.3 onlineCount 0 처리

`onlineCount`가 0이거나 undefined인 경우 뱃지를 숨긴다 (`count > 0`일 때만 렌더).
서버 연결 전 초기 상태에서 "0명 참여 중"이 표시되면 신뢰성 저하.

---

## 6. 카피라이팅 톤 전환 (Phase 1 F6)

### 6.1 빈 상태 화면 문구 교체

**활성 시즌 없음 (game/page.tsx L232-238)**

```
변경 전:
  제목: "활성 시즌이 없습니다"
  본문: "아직 시즌이 시작되지 않았어요."
        "Admin에서 시즌을 활성화하면 게임을 시작할 수 있어요."

변경 후:
  이모지: 🏕️ (유지)
  제목: "다음 운동회를 준비 중이에요!"
  본문: "곧 새로운 시즌이 열릴 예정이에요."
        "알림을 켜두고 기다려 주세요!"
  (Admin 언급 완전 삭제)
```

**게임 이벤트 없음 (game/page.tsx L249)**

```
변경 전:
  제목: "게임 이벤트 준비 중"
  본문: "현재 진행 중인 게임 이벤트가 없어요."
        "곧 시작될 예정이니 조금만 기다려 주세요!"

변경 후:
  이모지: ⏳ (유지)
  제목: "잠깐! 박이 아직 준비 중이에요"
  본문: "감독님이 박을 달고 있는 중이에요."
        "조금만 기다리면 터트릴 수 있어요!"
```

### 6.2 비주얼 톤 추가 지침 (빈 상태 카드)

빈 상태 카드(`.card-game`)에 배경 그라데이션 서브 레이어 추가:

```tsx
<div className="text-center card-game max-w-sm mx-4 relative overflow-hidden">
  {/* 배경 장식 — 축제/파티 분위기 */}
  <div className="absolute inset-0 opacity-5"
       style={{ background: "linear-gradient(135deg, #FFD166, #FB7185)" }} />
  <div className="relative"> {/* 콘텐츠 */}
    ...
  </div>
</div>
```

이모지 크기: `text-5xl` (현행 유지)
제목: `text-xl font-bold` (현행 유지)
본문: `text-ink-muted text-sm leading-relaxed`

### 6.3 metadata 타이틀/description 교체 (layout.tsx)

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

**타이틀 template 활용 예시**:
- 게임 페이지: `"클릭 대전 | 아이돌 가을 운동회"`
- 스코어보드: `"실시간 순위 | 아이돌 가을 운동회"`
- 응원 게시판: `"응원 게시판 | 아이돌 가을 운동회"`

---

## 7. 디자인 토큰 정리 및 관계도

### 7.1 토큰 레이어 구조

```
Layer 0 — @theme 브랜드 토큰 (globals.css, 불변)
  --color-coral, --color-mint, --color-sunny, --color-cream, --color-ink ...
  → Tailwind 유틸리티 클래스로 사용 (text-coral, bg-cream 등)
  → 서비스 정체성 색상. 팀 컬러로 오염되지 않아야 함

Layer 1 — 팀 컬러 CSS 변수 (runtime, <main> 스코프)
  --team-primary, --team-secondary, --team-light
  → 팀 선택 시 game/page.tsx에서 <main> style로 주입
  → CSS 클래스 및 새 컴포넌트 내 var() 참조
  → 팀 미선택 시 변수 없음 (요소 자체 폴백값 필요)

Layer 2 — 컴포넌트 inline style (기존, 하이브리드)
  colorCode 직접 참조 (selectedSt.colorCode)
  → Phase 1 기간 동안 유지
  → Phase 2에서 Layer 1로 전환
```

### 7.2 Phase 1에서 추가해야 할 globals.css 항목

**신규 keyframe — pulse (참여자 카운터 도트)**

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
```

기존 `pulse-glow`는 box-shadow 기반이므로 별도 정의 필요.

**신규 CSS 변수 선언 (폴백용, @layer base)**

```css
@layer base {
  :root {
    /* 팀 컬러 폴백 — 팀 미선택 시 서비스 브랜드 coral 사용 */
    --team-primary: var(--color-coral);
    --team-secondary: color-mix(in srgb, var(--color-coral) 20%, transparent);
    --team-light: color-mix(in srgb, var(--color-coral) 8%, transparent);
  }
}
```

단, `color-mix()`는 Chrome 111+, Safari 16.2+, Firefox 113+에서 지원된다. 지원 범위가 충분하므로 사용 가능하나, 구형 브라우저 대응이 필요하면 hex 알파 폴백으로 교체한다.

**click-ripple 색상 팀 컬러 전환**

```css
/* 기존 */
.click-ripple {
  background: rgba(255, 107, 53, 0.3);
  ...
}

/* 변경 후 */
.click-ripple {
  background: var(--team-secondary, rgba(255, 107, 53, 0.3));
  ...
}
```

### 7.3 Phase 2로 이관되는 토큰

방향서 D3에 따라 다크모드 토큰은 Phase 2에서 추가한다.

```
Phase 2 추가 예정:
  --team-on-primary: white 또는 black (팀 컬러 위 텍스트 가독성)
  --team-surface: 팀 컬러 기반 배경 (다크모드 적응형)
  prefers-color-scheme: dark 대응 @theme 확장
```

---

## 8. 컴포넌트 분리 후 인터페이스 스펙 (F1 분리 작업 참고)

방향서 F1(game/page.tsx 컴포넌트 분리)은 디자인 선행 작업의 기반이다. 각 컴포넌트의 props 인터페이스를 디자인 관점에서 정의한다.

### TeamProgressBar

```ts
interface TeamProgressBarProps {
  teams: TeamWithProgress[];     // 정렬된 팀 목록
  goal: number;
  selectedTeamId: string | null;
  onlineCount: number;           // F5 참여자 카운터
  gameEventId: string;
}
// 내부에 OnlineCountBadge 포함
```

### ClickButton

```ts
interface ClickButtonProps {
  teamColor: string;              // colorCode (inline style용)
  combo: number;                  // 현재 로컬 combo
  multiplier: number;             // 서버 응답 multiplier (1/2/3/4)
  isBurst: boolean;
  myTotal: number;
  ripples: Ripple[];
  floatingScores: FloatingScoreWithMultiplier[];
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
```

### ComboIndicator

```ts
interface ComboIndicatorProps {
  combo: number;     // 표시 카운터
  multiplier: number; // 1/2/3/4 — 단계 결정
  // CSS 변수 --team-primary를 var()로 직접 참조
}
```

### BurstOverlay

```ts
interface BurstOverlayProps {
  burstTeamName: string | null; // null이면 unmount
}
// 내부에 Confetti 포함 여부 결정
```

---

## 9. 구현 우선순위 및 검토 체크리스트

### F2 CSS 변수 시스템

- [ ] `globals.css` — `:root` 폴백 변수 추가
- [ ] `globals.css` — `.click-ripple` 팀 컬러 전환
- [ ] `globals.css` — `@keyframes pulse` 추가
- [ ] `game/page.tsx` — `<main>` style 주입 로직 추가 (팀 선택 시)

### F3 Confetti

- [ ] `Confetti.tsx` — `teamColor?: string` prop 추가
- [ ] `Confetti.tsx` — `buildColors()` 함수 구현
- [ ] `Confetti.tsx` — `isLightColor()` 체크 및 gold → coral 교체 로직
- [ ] `game/page.tsx` — `<Confetti teamColor={selectedSt?.colorCode} />` 전달

### F4 콤보 multiplier

- [ ] `ComboIndicator.tsx` — multiplier props 수신 및 단계별 스타일 분기
- [ ] `ClickButton.tsx` (또는 game/page.tsx 내 floating score) — multiplier 텍스트 표시
- [ ] `click:ack` 이벤트 핸들러 — 서버 combo/multiplier 수신 후 상태 반영
- [ ] 낙관적 업데이트 플리커 방지 — transition 0.2s 적용 확인

### F5 참여자 카운터

- [ ] `TeamProgressBar.tsx` — 헤더 flex 구조 변경 + `OnlineCountBadge` 통합
- [ ] `OnlineCountBadge` — CSS 변수 기반 스타일, pulse 애니메이션
- [ ] `score:update` 이벤트 핸들러 — `onlineCount` 수신 및 상태 반영

### F6 카피라이팅

- [ ] `layout.tsx` — metadata 교체 (template 방식)
- [ ] `game/page.tsx` L232-238 — 활성 시즌 없음 문구 교체
- [ ] `game/page.tsx` L249 — 게임 이벤트 없음 문구 교체
- [ ] 빈 상태 카드 배경 그라데이션 레이어 추가

---

## 10. 접근성 및 성능 원칙 (이 스펙 범위)

### 접근성

- 참여자 카운터 뱃지: `aria-live="polite"` 속성으로 스크린 리더 지원
- 콤보 인디케이터: `aria-label="콤보 {n}회, {m}배 보너스"` 추가
- 색상만으로 상태를 전달하지 않음 — 텍스트 레이블 병행 필수

### 성능

- 펄스 애니메이션: `transform`과 `opacity`만 사용 — reflow 없음
- 콤보 인디케이터 크기 변화: CSS transition으로 처리 (`width`, `padding` transition)
- floating score: 기존 Framer Motion 방식 유지 (최대 8개, Phase 1 보류 H1)
- CSS 변수 주입: React style prop으로 단일 DOM 업데이트. 전체 트리 리렌더 없음
