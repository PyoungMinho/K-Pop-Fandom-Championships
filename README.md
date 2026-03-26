K-F-C/
├── apps/
│   ├── web/          # Next.js 15 (React 19, Tailwind v4, TypeScript)
│   │   └── src/app/  # App Router
│   └── api/          # NestJS 11 (TypeScript)
│       └── src/
│           ├── game/        # WebSocket 게임 로직 (박 터트리기, 핫타임 등)
│           ├── season/      # 시즌 관리 (7일 사이클)
│           ├── scoreboard/  # 실시간 스코어보드
│           └── common/      # 공통 유틸, Guard 등
├── packages/         # 공유 패키지 (타입, 상수 등)
├── docker-compose.yml  # PostgreSQL 16 + Redis 7
└── package.json      # npm workspaces 모노레포
