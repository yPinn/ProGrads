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
- 全域 prefix **`/api/v1`**（D10 API 版本）；`GET /api/v1/health`；Swagger UI 於 **`/api/v1/docs`**。
- 已接：PrismaModule（`@prisma/adapter-pg`）、env 驗證（Zod，啟動即驗）、pino 結構化日誌、`@fastify/helmet`、全域 `ZodValidationPipe`（nestjs-zod）。
- 規劃模組：`taxonomy / questions / explanations / schedules / stats / ai / users`（DTO 用 `@prograds/shared` 的 Zod 契約）。
- **下一步**：實作 feature 模組（CRUD + Repository）。
