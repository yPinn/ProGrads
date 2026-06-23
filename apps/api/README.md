# apps/api — 後端（NestJS）

NestJS 11（**Fastify adapter**、**ESM**），跑在自有 server，與 PostgreSQL 同機。
Feature-module-per-domain、Repository + 薄 controller。架構見
[docs/01-architecture.md](../../docs/01-architecture.md)，API 慣例見
[docs/05-api-conventions.md](../../docs/05-api-conventions.md)。

```bash
pnpm --filter @prograds/api build     # nest build (tsc, ESM)
pnpm --filter @prograds/api dev       # nest start --watch
pnpm --filter @prograds/api start     # node dist/main.js
pnpm --filter @prograds/api lint      # ESLint（自帶 config：共用 base + Nest 覆寫）
pnpm --filter @prograds/api typecheck # tsc --noEmit
pnpm --filter @prograds/api test      # Vitest
```

> 工具鏈一律可從 root 單一入口跑（`pnpm lint` / `typecheck` / `test`，turbo fan-out）；上面 filter 形式僅供針對性除錯。

- ESM + tsc（NodeNext）以正確發出 decorator metadata（DI 所需）；相對 import 帶 `.js`。
- 預設埠 **8088**（`PORT`）；全域 prefix **`/api/v1`**（D10 API 版本）；`GET /api/v1/health`；Swagger UI 於 **`/api/v1/docs`**。
- 必填 runtime env：`DATABASE_URL`、`WEB_BASE_URL`；選填含預設：`PORT`、`HOST`、`NODE_ENV`。CORS 只允許 `WEB_BASE_URL`。
- 已接：PrismaModule（`@prisma/adapter-pg`）、env 驗證（Zod，啟動即驗）、pino 結構化日誌、`@fastify/helmet`、CORS（`WEB_BASE_URL` 來源）、全域 `ZodValidationPipe`（nestjs-zod）、全域 `HttpExceptionFilter`（統一錯誤信封）。
- 已實作模組：`taxonomy`（categories/tracks/subjects）、`schools`（schools/departments）、`exams`（含合科卷）、`questions`（含 choices）、`admissions`（admissions/schedules）。DTO 由 `@prograds/shared` 的 Zod 契約生成。
- 規劃中模組：`explanations / stats / ai / users`。
