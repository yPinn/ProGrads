# apps/api — 後端（NestJS）

NestJS 11（**Fastify adapter**、**ESM**），跑在自有 server，與 PostgreSQL 同機。
Feature-module-per-domain、Repository + 薄 controller。架構見
[docs/01-architecture.md](../../docs/01-architecture.md)，API 慣例見
[docs/05-api-conventions.md](../../docs/05-api-conventions.md)。

```bash
pnpm --filter @prograds/api build   # nest build (tsc, ESM)
pnpm --filter @prograds/api dev     # nest start --watch
pnpm --filter @prograds/api start   # node dist/main.js
```

- ESM + tsc（NodeNext）以正確發出 decorator metadata（DI 所需）；相對 import 帶 `.js`。
- 目前為最小骨架：`/health` 可用。規劃模組：`taxonomy / questions / explanations / schedules / stats / ai / users`。
- **下一步**：`@prograds/db` 出 JS build → PrismaModule（`@prisma/adapter-pg` + `pg`）→ Swagger / config / pino / 模組實作。
