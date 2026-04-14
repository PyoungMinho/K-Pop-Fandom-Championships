# K-F-C 디자인 최종 리뷰 -- 디자인팀장 종합 판단

## 판단 기준

UX디자이너와 UI디자이너의 분석을 코드 수준에서 검증했다.
두 분석 모두 타당하나, 모든 것을 동시에 고칠 수는 없다.
"사용자가 5초 안에 핵심 행동(클릭/응원/투표)에 도달하는가?"를 최우선 기준으로 우선순위를 매겼다.

---

## PART 1. 즉시 개선 TOP 5 (코드 수정만으로 해결)

### 1-1. 하드코딩된 "LIVE - DAY 5" 제거

**파일**: `apps/web/src/components/Navigation.tsx:153`
**문제**: 모바일 메뉴 하단에 `LIVE - DAY 5`가 하드코딩되어 있다. 시즌이 바뀌어도 항상 DAY 5를 표시한다. 사용자에게 거짓 정보를 주는 가장 심각한 신뢰 훼손 버그다.

**수정 방안**: 이 컴포넌트는 시즌 데이터에 접근하지 않으므로, 정적 텍스트를 "LIVE"로만 축소하거나, 시즌 정보를 prop으로 받아 동적 렌더링한다. MVP에서는 하드코딩 텍스트를 제거하는 것이 최선이다.

```tsx
// Navigation.tsx:153 -- 현재
<span className="text-green-700 text-xs">LIVE - DAY 5</span>

// 수정안 (최소 변경)
<span className="text-green-700 text-xs">LIVE</span>
```

### 1-2. 모바일 이중 네비게이션 해소

**파일**: `apps/web/src/components/Navigation.tsx:78-98` (햄버거 버튼) + `160-185` (하단 탭바)
**문제**: 모바일에서 상단 햄버거 메뉴와 하단 탭바가 동시에 존재한다. 동일한 `NAV_ITEMS` 6개를 두 곳에서 렌더링한다. 사용자 입장에서 어디를 눌러야 하는지 혼란스럽고, 하단 탭바가 6개 항목을 넣어 각 탭의 터치 타겟이 너무 좁다.

**수정 방안**: 모바일에서 상단 햄버거 메뉴를 제거하고 하단 탭바만 남긴다. 6개 항목 중 핵심 4개(홈, 클릭대전, 응원, 스코어보드)만 하단 탭에 배치하고, 나머지 2개(릴레이, 투표)는 홈 화면의 종목 그리드에서만 접근하게 한다.

```tsx
// Navigation.tsx:78-98 -- 모바일 햄버거 버튼 블록
// 수정: md:hidden을 hidden으로 변경하여 완전히 숨기거나, 해당 블록 전체를 제거

// Navigation.tsx:161 -- 하단 탭바 항목 축소
const BOTTOM_TAB_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/game", label: "클릭 대전", icon: "🎯" },
  { href: "/cheer", label: "응원", icon: "📣" },
  { href: "/scoreboard", label: "순위", icon: "🏆" },
];
```

### 1-3. 빈 상태 메시지에서 "Admin" 언급 제거

**파일**: `apps/web/src/app/game/page.tsx:233-234`
**문제**: 활성 시즌이 없을 때 "Admin에서 시즌을 활성화하면 게임을 시작할 수 있어요."라고 표시된다. 일반 유저는 Admin이 무엇인지 모른다. relay, cheer 페이지에도 동일 패턴이 반복된다.

**영향 파일 목록**:
- `apps/web/src/app/game/page.tsx:236` -- "Admin에서 시즌을 활성화하면 게임을 시작할 수 있어요."
- `apps/web/src/app/relay/page.tsx:182` -- 동일 패턴
- `apps/web/src/app/cheer/page.tsx:263` -- 동일 패턴
- `apps/web/src/app/scoreboard/page.tsx:110` -- "Admin에서 시즌을 ACTIVE로 설정해주세요"

**수정안** (game/page.tsx:233-237 예시):
```tsx
// 현재
<h2 className="text-xl font-bold mb-2">활성 시즌이 없습니다</h2>
<p className="text-ink-muted text-sm">
  아직 시즌이 시작되지 않았어요.
  <br />
  Admin에서 시즌을 활성화하면 게임을 시작할 수 있어요.
</p>

// 수정안
<h2 className="text-xl font-bold mb-2">다음 시즌을 준비 중이에요</h2>
<p className="text-ink-muted text-sm">
  곧 새로운 시즌이 시작됩니다!
  <br />
  알림을 놓치지 않도록 자주 방문해주세요.
</p>
```

### 1-4. 시맨틱 디자인 토큰 추가 + prefers-reduced-motion 대응

**파일**: `apps/web/src/app/globals.css`
**문제 1**: success/error/warning 시맨틱 컬러가 없다. 현재 에러 표시에 `bg-red-50 border-red-200 text-red-700`(nomination/page.tsx:137) 같은 Tailwind 기본값을 직접 사용한다. 팀컬러와의 충돌 위험이 있고, 일관성이 없다.
**문제 2**: `prefers-reduced-motion` 미대응. 전정기관 민감 사용자에게 과도한 애니메이션이 불쾌감을 줄 수 있다. 접근성 관점에서 필수 대응 항목이다.

**수정안** (globals.css @theme 블록에 추가):
```css
@theme {
  /* 기존 토큰 유지... */

  /* 시맨틱 컬러 토큰 */
  --color-success: #22C55E;
  --color-success-light: #DCFCE7;
  --color-error: #EF4444;
  --color-error-light: #FEE2E2;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;

  /* 서피스 토큰 */
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;
  --color-surface-muted: #F9FAFB;

  /* 스페이싱 */
  --spacing-section: 2.5rem;
  --spacing-card: 1.5rem;

  /* 라운드 */
  --radius-sm: 0.75rem;
  --radius-md: 1.25rem;
  --radius-lg: 1.5rem;
  --radius-full: 9999px;
}
```

**globals.css 최하단에 추가**:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 1-5. 게이지 바 높이 통일

**문제**: 게이지 바가 3종류 높이로 파편화되어 있다.
- `apps/web/src/app/page.tsx:71` -- `h-2` (메인 페이지 실시간 순위)
- `apps/web/src/app/game/page.tsx:359` -- `h-3` (게임 페이지 팀별 현황)
- `apps/web/src/app/game/page.tsx:457` -- `h-6` (내 팀 대형 게이지)
- `apps/web/src/app/scoreboard/page.tsx:155` -- `h-3` (스코어보드 전체 순위)
- `apps/web/src/app/relay/page.tsx:295` -- `h-2` (릴레이 현황)
- `apps/web/src/app/nomination/page.tsx:268` -- `h-3` (투표 현황)

**수정 방안**: 용도별 2단계로 통일한다.
- 일반 게이지: `h-2.5` (10px) -- 순위, 현황 표시용
- 강조 게이지: `h-5` (20px) -- 내 팀 진행도처럼 핵심 피드백용

해당 높이값을 globals.css에 `.gauge` / `.gauge-lg` 컴포넌트 클래스로 정의한다.

```css
/* globals.css @layer components에 추가 */
.gauge {
  height: 0.625rem; /* 10px = h-2.5 */
  background: #F3F4F6;
  border-radius: 9999px;
  overflow: hidden;
}

.gauge-lg {
  height: 1.25rem; /* 20px = h-5 */
  background: #F3F4F6;
  border-radius: 9999px;
  overflow: hidden;
}
```

---

## PART 2. 중기 개선 TOP 5 (기획/설계가 필요)

### 2-1. 개인 기여 결과 화면 + SNS 공유 기능

**현상**: 박 터짐(burst) 이벤트 발생 후 전체 축하 오버레이만 뜨고(game/page.tsx:266-289), 개인이 몇 번 클릭했는지, 전체에서 몇 등인지 보여주지 않는다. 팬덤 문화에서 "내가 기여한 양"을 증명하고 공유하는 것이 핵심 동기인데 이 장치가 전혀 없다.

**필요한 작업**:
- 결과 카드 컴포넌트 신규 설계 (내 클릭 수, 팀 내 기여율, 순위)
- Open Graph 이미지 동적 생성 API (Next.js OG Image)
- 카카오/트위터/인스타 스토리 공유 버튼

### 2-2. 메인 페이지 CTA 단일화 + 팀 선택 통합

**현상**: 메인(page.tsx) → 게임(game/page.tsx) → 팀 선택 → 클릭 시작까지 3단계다. 메인 페이지에 "지금 참전하기"(198행)와 "순위 보기"(201행)가 있고, 그 아래 종목 그리드(269-292행)에도 동일 목적지 링크가 있어 CTA가 분산된다.

**필요한 작업**:
- 메인 Hero에서 팀 선택을 바로 할 수 있는 "빠른 참여" 플로우 설계
- "지금 참전하기" 클릭 시 팀 선택 바텀시트 → 선택 즉시 게임 페이지 이동
- 종목 그리드는 "더 보기" 성격으로 시각적 위계를 낮춤

### 2-3. 게임 페이지 팀 선택 전 현황 노출 문제 해결

**현상**: game/page.tsx:311-388에서 팀 선택 전에 전체 팀 진행 상황이 점수 순으로 정렬되어 보인다. 뒤처진 팀의 팬이 이 화면을 보면 "이미 졌다"는 인상을 받고 이탈할 가능성이 높다.

**필요한 작업**:
- 팀 선택 전에는 상세 점수 대신 "뜨거운 경쟁 중!" 같은 감정 메시지 + 간략한 시각화만 제공
- 팀 선택 후에만 상세 현황을 공개
- 또는 점수 차이가 아닌 "최근 5분간 상승률"로 표시하여 뒤처진 팀도 희망이 보이게 설계

### 2-4. 재방문 동기 시스템 (일일 미션 / 출석 체크)

**현상**: 현재 재방문할 이유가 없다. 한 번 와서 클릭하고 나가면 끝이다. 7일 시즌제인데 매일 올 동기가 없다.

**필요한 작업**:
- 일일 미션 시스템 (클릭 100회, 응원 3개, 릴레이 1회 등)
- 출석 체크 UI (DayCounter 컴포넌트 page.tsx:21-39를 기반으로 확장)
- 일일 보너스 점수 시스템 백엔드 설계
- 스트릭(연속 출석) 배지

### 2-5. Hero 섹션 운동회 아이덴티티 강화

**현상**: page.tsx:132-236의 Hero 섹션이 그래디언트 배경에 텍스트만 있는 범용적인 랜딩이다. "아이돌 가을 운동회"라는 콘셉트를 전달하는 비주얼 요소가 전혀 없다. 경쟁, 팀워크, 축제 분위기를 시각적으로 전달해야 한다.

**필요한 작업**:
- 운동장/트랙/깃발 등 운동회 모티프 일러스트 또는 로띠 애니메이션
- 팀 로고가 경쟁적으로 달리는 모션 비주얼
- display 타이포그래피 (굵은 한글 디스플레이 폰트 적용)
- 배경의 blur blob을 팀컬러 기반으로 동적 생성

---

## PART 3. 디자인 시스템 우선순위 TOP 3

### 우선순위 1: 시맨틱 컬러 토큰 체계

**이유**: 현재 코드 전체에서 직접 색상값과 Tailwind 기본 팔레트가 혼용된다. 팀컬러(`colorCode`)는 동적이라 토큰화할 수 없지만, UI 시맨틱 컬러(success/error/warning/info)와 서피스(surface/elevated/muted)는 반드시 토큰으로 관리해야 한다. 다크모드 확장의 전제 조건이기도 하다.

**정립할 토큰**:
```
브랜드:    coral, mint, sunny, lavender, rose, sky (이미 존재)
시맨틱:    success, error, warning, info (신규)
서피스:    surface, surface-elevated, surface-muted (신규)
텍스트:    ink, ink-light, ink-muted (이미 존재) + ink-on-color (신규)
```

### 우선순위 2: 게이지 바 / 프로그레스 컴포넌트 통합

**이유**: 현재 게이지 바가 6곳에서 각각 다른 높이, 다른 라운드, 다른 애니메이션으로 구현된다. `.score-bar` 클래스(globals.css:145-159)가 정의만 되어 있고 실제로 사용되지 않는다. 가장 많이 반복되는 UI 패턴이므로 통합 효과가 크다.

**컴포넌트 스펙**:
```
<ProgressGauge
  value={number}        // 현재값
  max={number}          // 최대값
  color={string}        // 팀컬러 등
  size="sm" | "md" | "lg"  // sm=8px, md=12px, lg=20px
  shimmer={boolean}     // 쉬머 효과 on/off
  label?: string        // 우측 퍼센트 텍스트
/>
```

### 우선순위 3: 배지 컴포넌트 통합

**이유**: 현재 배지가 5가지 형태로 파편화되어 있다.
- `.floating-badge` (globals.css:134-143) -- Navigation의 LIVE 배지
- `bg-coral/10 text-coral px-1.5 py-0.5 rounded-full` (game/page.tsx:344) -- MY 배지
- `bg-sunny/20 text-sunny-dark px-1.5 py-0.5 rounded-full` (game/page.tsx:349) -- 터짐 배지
- `bg-mint/20 text-mint-dark px-1.5 py-0.5 rounded-full` (relay/page.tsx:286) -- MY 배지 (릴레이)
- `bg-gray-100 text-gray-500 px-2 py-1 rounded-full` (page.tsx:332) -- 자동재생 배지

패딩, 폰트 사이즈, 라운드가 제각각이다.

**컴포넌트 스펙**:
```
<Badge
  variant="live" | "my" | "status" | "info"
  color?: string       // 동적 팀컬러 지원
  size="sm" | "md"
>
  {children}
</Badge>
```

---

## 종합 실행 로드맵

| 순서 | 항목 | 소요 | 담당 |
|------|------|------|------|
| Week 1 | 즉시개선 1~5 전부 (코드 수정) | 1~2일 | 프론트엔드팀 |
| Week 1 | 시맨틱 토큰 정립 (PART3 #1) | 0.5일 | UI디자이너 + 프론트 |
| Week 2 | 게이지 컴포넌트 통합 (PART3 #2) | 1일 | 컴포넌트개발자 |
| Week 2 | 배지 컴포넌트 통합 (PART3 #3) | 0.5일 | 컴포넌트개발자 |
| Week 2 | 메인 CTA 단일화 (PART2 #2) | 1일 | UX디자이너 + 페이지개발자 |
| Week 3 | 개인 기여 결과 + SNS 공유 (PART2 #1) | 3일 | 기획 + 프론트 + 백엔드 |
| Week 3 | 팀 선택 전 현황 재설계 (PART2 #3) | 1일 | UX디자이너 + 페이지개발자 |
| Week 4 | 재방문 동기 시스템 (PART2 #4) | 5일 | 기획팀 회의 필요 |
| Week 4+ | Hero 비주얼 강화 (PART2 #5) | 3일 | UI디자이너 |

---

## 디자인팀장 최종 판단

UX디자이너가 지적한 이탈 지점 4곳 중 3곳(CTA 분산, 팀 선택 전 현황 노출, 응원 입력창 미노출)은 기획 재설계가 필요하다. 하지만 "하드코딩 DAY 5"와 "Admin 언급"은 지금 당장 고칠 수 있고, 고치지 않으면 사용자 신뢰를 훼손한다. 이것부터 처리한다.

UI디자이너가 지적한 토큰 부재는 근본적으로 맞다. 그러나 토큰을 전부 정립한 후 리팩토링하면 일정이 밀린다. 시맨틱 컬러와 게이지 컴포넌트 2가지만 먼저 정립하고, 나머지는 새 컴포넌트를 만들 때 점진적으로 적용한다.

모션 과다(stagger delay 최대 1.5초) 문제는, `prefers-reduced-motion` 대응을 먼저 넣고, 개별 딜레이 축소는 각 페이지 작업 시 함께 진행한다. 스코어보드의 `delay: 0.8 + i * 0.1`(scoreboard/page.tsx:160)은 팀이 10개면 1.8초 지연인데, `delay: 0.3 + i * 0.05`로 축소해야 한다.

**한 줄 요약**: 거짓 정보(DAY 5)와 내부 용어(Admin) 노출을 오늘 고치고, 이번 주 안에 토큰 + 게이지 통합을 완료하라. 나머지는 기획 회의를 거쳐 순차 진행한다.
