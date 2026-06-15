# apps/api — 後端（NestJS）

NestJS（Fastify adapter），跑在自有 server，與 PostgreSQL 同機。
Feature-module-per-domain、Repository + 薄 controller。架構見
[docs/01-architecture.md](../../docs/01-architecture.md)，API 慣例見
[docs/05-api-conventions.md](../../docs/05-api-conventions.md)。

尚未 scaffold：

```bash
pnpm dlx @nestjs/cli new apps/api --skip-git --package-manager pnpm
```
