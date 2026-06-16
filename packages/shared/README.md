# packages/shared — 共用型別與契約

Zod 為單一事實來源，前後端 + 內容 frontmatter 共用。純 TypeScript（編譯出 JS 供 node 端載入）。

- `src/enums.ts`：domain 列舉（對應 `prisma/schema.prisma` 的 enums），同時匯出 Zod schema 與 `z.infer` 型別。
- 之後加：API request/response schema、frontmatter schema（隨各模組逐步補）。

```bash
pnpm --filter @prograds/shared build   # tsc -> dist
```

> 列舉同時存在於此（Zod）與 Prisma schema（DB enum），需保持同步；日後可考慮單一來源生成。
