# K-F-C 프로젝트 방향서 (확정)

> 기획서 `fan-ux-strategy.md` 기반, 디자인/프론트/백엔드 팀장 검토 의견 종합
> 확정일: 2026-04-14 | 결정자: 기획팀장

---

## 1. 결론 요약

3개 팀장의 검토 결과, 기획서의 큰 방향은 유효하나 **기술 구현 수준에서 11개 항목의 수정이 필요**하다. 가장 심각한 이슈는 (1) 콤보 multiplier가 클라이언트 신뢰 기반이라 어뷰징에 취약한 점, (2) OnGatewayDisconnect 미구현으로 접속자 카운터가 불가능한 점, (3) Redis 인스턴스 중복 생성으로 리소스가 낭비되는 점이다. Phase 1 공수는 기획서 4.5일에서 **6일로 재산정**하며, 1주(5영업일) + 토요일 반일 버퍼로 수행한다.

---

## 2. 기획서 수정 판정

### 반영 확정 (11건)

| # | 원본 기획서 내용 | 수정 방향 | 제안 팀장 | 판단 근거 |
|---|---|---|---|---|
| M1 | CSS 변수를 `<html>`에 설정 | `<main>` 요소에 스코프 제한. Navigation은 중립 브랜드 컬러 유지 | 디자인 | Navigation이 팀 색에 물들면 앱 정체성 훼손. `<main>` 스코프가 표준적 접근 |
| M2 | Confetti COLORS를 팀 컬러로 교체 | `[teamColor, teamColor, teamColorLight, white, gold]` 5색 비율 배합 | 디자인 | 단일색 Confetti는 시각적으로 단조로움. 배합이 축제 분위기에 적합 |
| M3 | 탄막 동시 15개 + hardwareConcurrency 감지 | 상단 1/3 영역 제한 + FPS 모니터링 기반 자동 비활성화 + CSS animation 필수(Framer Motion 금지) | 디자인+프론트 | AdSense/TAP 영역 침범 방지는 수익/UX 직결. FPS 모니터링이 hardwareConcurrency보다 정확 |
| M4 | 콤보 배수를 프론트에서 click 이벤트에 multiplier 전송 | **서버사이드 전환**: 서버가 combo 상태 추적 + multiplier 결정 + click:ack로 반환 | 백엔드 | 클라이언트 multiplier 신뢰 불가 (DevTools로 조작 가능). 보안상 서버 결정 필수 |
| M5 | 접속자 카운터: Redis INCR/DECR | Redis SET(SADD/SREM) + heartbeat TTL 30초 | 백엔드 | INCR/DECR은 disconnect 누락 시 영구 틀어짐. SET 기반이면 TTL로 자동 보정 |
| M6 | OnGatewayDisconnect 미언급 | **즉시 구현** 필수. 접속자 카운터의 선행 조건 | 백엔드 | 현재 gateway가 OnGatewayConnection만 구현. disconnect 없이 접속자 관리 불가 |
| M7 | Rate Limiter: IP별 초당 20 CPS | Sliding Window Counter (Redis Sorted Set + MULTI/EXEC), 초당 15 CPS + 분당/시간당 누적 제한 | 백엔드 | 20 CPS는 매크로에 관대. 15 CPS 시작 + 다층 제한이 어뷰징 방지에 효과적 |
| M8 | XSS 방지: 정규식 `/<[^>]*>/g` | sanitize-html 라이브러리 교체 | 백엔드 | 정규식은 `<img onerror=...>`, 속성 기반 XSS 우회 가능. 라이브러리가 표준 |
| M9 | game/page.tsx 602줄 단일 컴포넌트 | TeamProgressBar, ClickButton, ComboIndicator 분리 | 프론트 | 602줄 단일 파일은 유지보수 불가. 팀 컬러 CSS 변수 적용 전에 분리 선행 필요 |
| M10 | score:update에 모든 정보 포함 | score:update에 onlineCount 추가, 개인 combo/multiplier는 click:ack로 분리 | 백엔드 | 이벤트 관심사 분리. score:update는 공개 브로드캐스트, click:ack는 개인 응답 |
| M11 | 게임 이벤트 상태 검증 없음 | handleClick에서 GameEvent ACTIVE 상태 검증 추가 | 백엔드 | 종료된 게임에 클릭 가능한 것은 치명적 버그 |

### 반영하되 Phase 2로 이동 (4건)

| # | 항목 | 이유 |
|---|---|---|
| D1 | 하단 네비게이션 5개 이하 정리 | Navigation 구조 변경은 전체 라우팅 영향. Phase 1에서는 현행 6개 유지 |
| D2 | 팀 변경 확인 다이얼로그 | UX 개선이지만 Phase 1 핵심 경로 아님 |
| D3 | 다크모드 대응 토큰 구조 | Phase 1 팀 컬러 시스템을 `--team-on-primary` 등으로 확장하는 것은 Phase 2 |
| D4 | 숫자 포맷 축약 (8.5K / 10K) | 현재 `toLocaleString()`이 충분. 모바일 공간 부족 시 Phase 2에서 적용 |

### 보류 (2건)

| # | 항목 | 이유 |
|---|---|---|
| H1 | floating score CSS animation 전환 | 프론트팀장이 성능 병목 지적했으나, 현재 floatingScores는 최대 8개(slice(-8))로 제한되어 있어 실측 후 판단 |
| H2 | fingerprint.js 연동 | 추가 라이브러리 의존성 + GDPR 고려 필요. Phase 2 매크로 감지 시점에 재검토 |

---

## 3. Phase 1 확정 작업 목록 (총 6일)

### 3.1 백엔드 (3.5일)

| 순번 | 작업 | 파일 | 공수 | 상세 |
|-----|------|------|------|------|
| B1 | Redis 공유 프로바이더 | `apps/api/src/common/redis.provider.ts` (신규) + `game.module.ts` + `game.service.ts` + `cheer.service.ts` + `baton.service.ts` | 0.5일 | 현재 GameService, CheerService, BatonService 각각 독립 Redis 인스턴스 생성 (onModuleInit에서 new Redis()). 공유 프로바이더로 통합 |
| B2 | OnGatewayDisconnect 구현 | `apps/api/src/game/game.gateway.ts` L8: import에 OnGatewayDisconnect 추가, L16: implements에 추가, handleDisconnect 메서드 신규 | 0.25일 | SADD on connect, SREM on disconnect, 키: `online:{gameEventId}` |
| B3 | 실시간 접속자 카운터 (heartbeat) | `apps/api/src/game/game.gateway.ts` + `game.service.ts` | 0.5일 | heartbeat 이벤트 수신(30초 간격), Redis SET에 TTL 45초로 SADD. score:update에 onlineCount 포함. SCARD로 카운트 |
| B4 | 클릭 Rate Limiter | `apps/api/src/game/game.service.ts` addClick 메서드 내부 | 0.5일 | Sliding Window Counter: Redis Sorted Set `rl:click:{ipHash}`, ZADD+ZREMRANGEBYSCORE+ZCARD, MULTI/EXEC. 초당 15 CPS, 분당 500, 시간당 10000 |
| B5 | 게임 이벤트 ACTIVE 검증 | `apps/api/src/game/game.service.ts` addClick 메서드 상단 | 0.25일 | Redis 캐시: `event:status:{gameEventId}` TTL 60초. ACTIVE가 아니면 에러 반환 |
| B6 | 콤보 multiplier 서버사이드 | `apps/api/src/game/game.service.ts` (combo 상태 추적 Redis Hash) + `game.gateway.ts` handleClick (click:ack에 combo/multiplier 포함) | 0.75일 | Redis Hash `combo:{gameEventId}:{ipHash}` = {count, lastClickAt}. 1.5초 이내 연속 클릭 시 combo++. combo 5-19: 2x, 20-49: 3x, 50+: 4x(상한). INCRBY multiplier. click:ack에 {total, combo, multiplier} 반환 |
| B7 | Score 엔티티 multiplier 컬럼 | `apps/api/src/game/score.entity.ts` | 0.25일 | `@Column({ type: 'smallint', default: 1 }) multiplier!: number;` 추가. flushAllToDb에서 batch 기록 시 multiplier 포함 (어뷰징 사후 분석용) |
| B8 | XSS 방어 라이브러리 교체 | `apps/api/src/game/cheer.service.ts` L65-66 | 0.25일 | `npm install sanitize-html @types/sanitize-html`. 정규식 `replace(/<[^>]*>/g, "")` 제거, `sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })` 교체 |
| B9 | score:update 이벤트 분리 | `apps/api/src/game/game.gateway.ts` handleClick | 0.25일 | server.emit("score:update")에 onlineCount 추가. click:ack에 개인 combo/multiplier 포함. 프론트가 두 이벤트를 구분 처리 |

### 3.2 프론트엔드 (3.75일)

| 순번 | 작업 | 파일 | 공수 | 상세 |
|-----|------|------|------|------|
| F1 | game/page.tsx 컴포넌트 분리 | `apps/web/src/app/game/page.tsx` (602줄) -> `components/game/TeamProgressBar.tsx`, `components/game/ClickButton.tsx`, `components/game/ComboIndicator.tsx`, `components/game/BurstOverlay.tsx` | 0.5일 | 모든 후속 작업의 선행 조건. 기존 로직 변경 없이 구조만 분리 |
| F2 | CSS 변수 팀 컬러 시스템 | `apps/web/src/app/game/page.tsx` (팀 선택 시 `<main>`에 style 적용) + `apps/web/src/app/globals.css` (CSS 변수 선언) | 0.75일 | 하이브리드 접근: 기존 inline style 유지 + 새 요소에만 CSS 변수. `--team-primary`, `--team-secondary`, `--team-light`. `<main>` 요소에 설정 (Navigation 중립 유지) |
| F3 | Confetti 팀 컬러 배합 | `apps/web/src/components/Confetti.tsx` L5 COLORS 배열 -> props 기반 | 0.25일 | `teamColor` prop 수신. COLORS = `[teamColor, teamColor, teamColorLight, '#FFFFFF', '#FFD700']`. teamColor 없으면 기존 배열 폴백 |
| F4 | 콤보 multiplier 프론트 반영 | `components/game/ComboIndicator.tsx` + `components/game/ClickButton.tsx` | 0.75일 | click:ack 이벤트에서 combo/multiplier 수신. 낙관적 업데이트: combo는 로컬 즉시 반영, multiplier는 서버 응답 대기. 플리커 방지: 서버 combo가 로컬보다 낮으면 서버값으로 부드럽게 전환 (transition 0.2s). floating score에 multiplier 표시 (+1 -> +2x) |
| F5 | 실시간 참여자 카운터 | `components/game/TeamProgressBar.tsx` (진행 상황 카드 내부에 배치) | 0.25일 | score:update의 onlineCount 표시. 위치: 게이지 바 위가 아닌 진행 상황 카드 헤더 우측 |
| F6 | 카피라이팅 팬덤 톤 전환 | `apps/web/src/app/layout.tsx` (metadata), `game/page.tsx` L232-238 (활성 시즌 없음 문구), `game/page.tsx` L249 (게임 이벤트 없음 문구) | 0.25일 | "활성 시즌이 없습니다" -> "다음 운동회를 준비 중이에요!", "Admin에서 시즌을 활성화하면" -> 해당 문구 삭제 |
| F7 | Navigation.tsx "LIVE - DAY 5" 하드코딩 수정 | `apps/web/src/components/Navigation.tsx` L153 | 0.25일 | 하드코딩 "DAY 5" -> 활성 시즌 API에서 dayNumber 조회하여 동적 표시. API 실패 시 "LIVE" 만 표시 |
| F8 | 소켓 이벤트 중앙화 훅 | `apps/web/src/lib/useSocketEvent.ts` (신규) | 0.5일 | 탄막(Phase 2) 선행 작업. 현재 game/page.tsx에서 socket.on/off를 직접 관리하는 패턴을 훅으로 추상화. `useSocketEvent<T>(eventName, handler)` 형태 |
| F9 | heartbeat 전송 | `apps/web/src/lib/socket.ts` 또는 `useSocketEvent.ts` | 0.25일 | 30초 간격으로 `heartbeat` 이벤트 emit. 페이지 비활성화(visibilitychange) 시 중단, 재활성화 시 재개 |

### 3.3 병렬 실행 계획

```
Day 1: [BE] B1 Redis 프로바이더 + B2 Disconnect | [FE] F1 컴포넌트 분리
Day 2: [BE] B4 Rate Limiter + B5 ACTIVE 검증  | [FE] F2 CSS 변수 + F3 Confetti
Day 3: [BE] B6 서버 콤보 + B7 Score 엔티티    | [FE] F8 소켓 훅 + F6 카피라이팅
Day 4: [BE] B3 접속자 카운터 + B8 XSS + B9    | [FE] F4 콤보 프론트 반영
Day 5: [BE] 통합 테스트 + 버그 수정            | [FE] F5 카운터 + F7 Nav + F9 heartbeat
Day 6: (버퍼) 양팀 통합 테스트 + 엣지 케이스
```

> Phase 1 프론트 총공수: 기획서 2.75일 -> **3.75일** (프론트팀장 재산정 수용)
> Phase 1 백엔드 총공수: 기획서 1일 -> **3.5일** (서버사이드 콤보, Redis 통합, 다층 Rate Limiter 추가)

---

## 4. Phase 2 확정 작업 목록 (2~3주)

### 순서 조정 (디자인팀장 의견 반영)

기획서 원본 순서: SNS 공유 -> 탄막 -> Web Share -> Hero -> 매크로 감지 -> 순위 알림

**확정 순서:**

| 순번 | 작업 | 공수 | 순서 변경 이유 |
|-----|------|------|---------------|
| P2-1 | Hero 섹션 리뉴얼 | 1.5일 | 디자인팀장: "Hero가 서비스 첫인상. 탄막보다 먼저." 랜딩 전환율 직결 |
| P2-2 | SNS 공유 카드 (og:image) | 2일 | Hero CTA에서 공유로 연결되는 플로우. Hero 다음이 자연스러움 |
| P2-3 | Web Share API 연동 | 1일 | og:image 완성 후 공유 버튼 연동 |
| P2-4 | 탄막 오버레이 컴포넌트 | 2일 | Phase 1의 F8 소켓 훅이 선행되어야 함. **CSS animation 필수** (Framer Motion 금지). 상단 1/3 영역 제한. FPS 모니터링 + 자동 비활성화 |
| P2-5 | 매크로 감지 로직 | 2일 | Phase 1 Rate Limiter 데이터 축적 후 패턴 분석 가능 |
| P2-6 | 시즌 카운트다운 + 순위 변동 알림 | 1.5일 | 신규 WebSocket 이벤트 `rank:change` |
| P2-7 | 하단 네비게이션 정리 (5개 이하) | 0.5일 | 디자인팀장 D1 반영 |
| P2-8 | 팀 변경 확인 다이얼로그 | 0.25일 | 디자인팀장 D2 반영 |
| P2-9 | CSS 변수 inline style 전면 전환 | 1일 | 프론트팀장: Phase 1은 하이브리드, Phase 2에서 전면 전환 |
| P2-10 | 다크모드 토큰 구조 | 1일 | 디자인팀장 D3 반영 |

---

## 5. 기술 방침 (3개 팀 공유 원칙)

### 5.1 성능 원칙

```
1. 게임 페이지 내 애니메이션은 CSS animation/transition 우선. 
   Framer Motion은 진입/퇴장 전환(AnimatePresence)에만 허용.
2. 탄막, floating score 등 고빈도 DOM 조작은 Framer Motion 금지.
   Confetti.tsx의 CSS animation 패턴을 표준으로 삼는다.
3. 동시 렌더링 요소 상한: 탄막 15개, ripple 10개, floatingScore 8개 (현행 유지).
4. FPS 모니터링은 requestAnimationFrame 기반으로 구현.
   navigator.hardwareConcurrency는 보조 지표로만 사용.
```

### 5.2 보안 원칙

```
1. 점수에 영향을 주는 모든 계산은 서버에서 수행한다.
   - combo count: 서버 Redis Hash
   - multiplier 결정: 서버 로직
   - 클라이언트는 표시만 담당
2. Rate Limiting은 다층 구조: 초당(15) + 분당(500) + 시간당(10000).
3. XSS 방어는 sanitize-html 라이브러리 사용. 정규식 금지.
4. WebSocket handshake 시 Origin 검증 강화 (Phase 2에서 JWT/일회용 토큰 추가).
5. 게임 이벤트 ACTIVE 상태 검증: 모든 게임 관련 핸들러에서 수행.
```

### 5.3 아키텍처 원칙

```
1. Redis 인스턴스는 공유 프로바이더 1개로 통합한다.
   GameService, CheerService, BatonService 각각의 onModuleInit에서 
   new Redis()를 제거하고 DI로 주입받는다.
2. WebSocket 이벤트 관심사 분리:
   - score:update: 공개 브로드캐스트 (팀 점수 + onlineCount)
   - click:ack: 개인 응답 (total, combo, multiplier, isBurst)
3. 프론트 컴포넌트 단일 책임:
   - game/page.tsx는 오케스트레이션만 담당 (상태 관리 + 레이아웃)
   - 시각적 요소는 components/game/ 하위로 분리
4. CSS 변수 스코프: <main> 요소에만 적용. Navigation은 중립.
5. 소켓 이벤트는 useSocketEvent 훅으로 중앙 관리.
   직접 socket.on/off 호출 금지 (Phase 1 F8 완료 후).
```

### 5.4 코드 품질 원칙

```
1. 단일 파일 300줄 상한 (현재 game/page.tsx 602줄 -> 분리 필수).
2. TypeORM 엔티티 변경 시 마이그레이션 파일 생성 필수 (B7 Score multiplier 포함).
3. 새 npm 패키지 추가 시 팀장 합동 승인 필요 (sanitize-html은 본 방향서로 승인).
4. 모든 WebSocket 이벤트에 TypeScript 인터페이스 정의 (lib/types.ts에 공유 타입).
```

---

## 6. 하지 않을 것 (기획서 유지 + 추가)

기획서의 "하지 않을 것" 4건 모두 유지:
- 배지/미션/스트릭 도입 금지
- 커뮤니티 기능 MVP 포함 금지
- 아바타/캐릭터 시스템 금지
- 스포츠/에너지 비주얼 과도 적용 금지

**추가:**
- Phase 1에서 Framer Motion 기반 탄막/고빈도 애니메이션 금지
- Phase 1에서 Navigation 구조 변경 금지 (6개 항목 현행 유지)
- 클라이언트 사이드 점수 계산 금지 (모든 점수 로직은 서버)

---

## 7. 리스크 업데이트

| 리스크 | 기획서 심각도 | 수정 심각도 | 변경 사유 |
|--------|------------|-----------|----------|
| 어뷰징 | 상 | **최상** (격상) | 백엔드팀장: multiplier 클라이언트 신뢰 + ACTIVE 미검증 + Rate Limit 부재 3중 취약점 |
| 모바일 성능 | 중 | 중 (유지) | 프론트팀장: CSS animation 전환으로 완화 가능하나, 탄막은 Phase 2로 이동하여 리스크 분산 |
| 재방문 이탈 | 중 | 중 (유지) | Hero 리뉴얼을 Phase 2 최우선으로 올려 첫인상 개선 |
| 기술 제약 | 하 | **중** (격상) | 백엔드팀장: Redis 인스턴스 3개 동시 운영 + 공유 프로바이더 없음. B1에서 즉시 해결 |
| 콤보 플리커 (신규) | - | **중** | 프론트팀장: 낙관적 업데이트 + 서버 응답 차이로 UI 깜빡임. F4에서 0.75일 투입 |

---

## 8. 성공 지표 (기획서 유지, 측정 방법 보강)

기획서 KPI 테이블 유지. 추가 측정 포인트:

| 지표 | 측정 방법 (Phase 1 추가) |
|------|------------------------|
| Rate Limit 적중률 | Redis Sorted Set 기반 차단 로그 (B4에서 로깅 포함) |
| 서버 combo 정확도 | click:ack의 combo vs 클라이언트 로컬 combo 차이 비율 |
| Redis 메모리 사용량 | 공유 프로바이더 INFO memory 주기적 로깅 |
| 동시 접속자 정확도 | heartbeat TTL 만료율 (SREM 대비 TTL 자동 제거 비율) |

---

## 9. 보류/추가 검토 사항

기획서 5건 유지 + 추가 2건:

1. **floating score CSS animation 전환 (H1)**: Phase 1 완료 후 실측 FPS로 판단. 현재 최대 8개 제한이면 Framer Motion도 수용 가능할 수 있음
2. **fingerprint.js 도입 (H2)**: Phase 2 매크로 감지 시점에 GDPR/개인정보 검토와 함께 재논의
3. 기획서 원본: PWA 도입 시점, 개인 랭킹/통계, 운동회 포스터 배경, 알림 시스템, 유료화 요소 -- 모두 보류 유지

---

## 10. 팀장 판단 근거 요약

| 판단 | 근거 |
|------|------|
| Phase 1 공수 6일 확정 | 프론트 3.75일 + 백엔드 3.5일이지만 병렬 실행으로 6일. 1주+반일 버퍼 |
| 콤보 서버사이드 전환 최우선 | 어뷰징 3중 취약점 중 가장 파급력 큰 항목. 클라이언트 multiplier는 보안 결함 |
| Redis 프로바이더 통합 Day 1 | 모든 백엔드 작업(B2~B9)의 선행 조건. 3개 독립 인스턴스는 커넥션 낭비 |
| game/page.tsx 분리 Day 1 | 모든 프론트 작업(F2~F5)의 선행 조건. 602줄에 기능 추가하면 유지보수 붕괴 |
| Hero 리뉴얼 Phase 2 최우선 | 디자인팀장 의견 수용. 첫인상 개선이 탄막보다 전환율에 직결 |
| Navigation 6개 현행 유지 | Phase 1에서 네비게이션 변경은 범위 초과. Phase 2-7에서 처리 |
| floating score 보류 | 실측 데이터 없이 최적화하면 오버엔지니어링. Phase 1 후 판단 |
| 디자인팀장 Phase 1 일정 6~7일 권고 반영 | 기획서 5일 -> 6일로 조정. 7일까지는 불필요 (병렬 실행 효율) |
