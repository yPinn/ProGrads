# packages/shared — 共用型別與契約

Zod 為單一事實來源，前後端 + 內容 frontmatter 共用。純 TypeScript（編譯出 JS 供 node 端載入）。

- `src/enums.ts`：domain 列舉（對應 `prisma/schema.prisma` 的 enums），同時匯出 Zod schema 與 `z.infer` 型別。
- `src/api.ts`：統一回應/錯誤信封（`data` / `error`、`Meta`、`ErrorCode`）。
- `src/taxonomy.ts`、`src/schools.ts`、`src/exams.ts`：各模組 request/response 契約（驅動 DTO + Swagger）。
- `src/content.ts`：題目 frontmatter schema（content-sync 用；含 license 合規閘門）。

```bash
pnpm --filter @prograds/shared build     # tsc -> dist
pnpm --filter @prograds/shared lint      # ESLint（自帶 config，共用 base）
pnpm --filter @prograds/shared typecheck # tsc --noEmit
pnpm --filter @prograds/shared test      # Vitest（enums / 契約）
```

> 列舉同時存在於此（Zod）與 Prisma schema（DB enum），需保持同步；日後可考慮單一來源生成。
