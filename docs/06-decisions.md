# 06 — 決策紀錄（ADR）

精簡版架構決策紀錄。每條：決策 / 理由 / 取捨。

## D1. 純非營利、不放廣告

- **決策**：不收費、不放廣告。
- **理由**：廣告=營利性質，削弱合理使用主張；學習用定位。
- **取捨**：AI 成本靠離線預生成 + 快取 + BYOK + 捐贈支應。

## D2. 考題只收官方已公開者 + 附來源

- **決策**：不完整照搬未公開考題；以官方公開 + 連結為主。
- **理由**：附來源 ≠ 重製授權；大量完整照搬即使免費仍有著作權風險。
- **取捨**：價值放在 AI 解析（原創）。可逐校索取授權建白名單。

## D3. AI 雙層：Claude 離線防線 + Groq 線上擴充

- **決策**：標準解答由 Claude 離線生成（檔案），Groq 線上 grounded 擴充。
- **理由**：品質防線 + 成本可控；線上模型被 grounding 框住不得改結論。

## D4. 前端 Nuxt，部署 Cloudflare Pages

- **理由**：內容站 SEO 是命脈，需 SSR/prerender；Vue SPA SEO 致命。
- **取捨**：CF 邊緣碰不到 DB → 內容 prerender、動態走 server API。

## D5. 後端 NestJS（Fastify adapter）

- **決策**：NestJS + `@nestjs/platform-fastify`。
- **理由**：開源、預期多貢獻者 → 強制結構降低協作/review/上手成本。
- **取捨**：較重、樣板多；以紀律（DI 只接線、薄 controller、Repository）保留可攜與可替換效能。曾評估 Nitro/Fastify/Hono：Nitro=與 Nuxt 同源但 churn、Fastify=治理最穩、Hono=展望最佳但年輕；多貢獻者情境下 Nest 的結構紅利勝出。

## D6. ORM Prisma

- **決策**：Prisma（非 Drizzle）。
- **理由**：與 Nest 同一「為協作而選」邏輯——Nest 生態範例多、`schema.prisma` 直觀、migration 成熟，降低貢獻門檻。
- **取捨**：比 Drizzle 稍重。

## D7. 全棧 TypeScript（strict）

- **決策**：TS 全棧。
- **理由**：NestJS 實質強制；Prisma/Zod 型別紅利；型別=貢獻者活文件。
- **取捨**：近零成本（框架內建轉譯）。不用 TS = 放棄 Nest 與型別紅利，與前述決策矛盾。

## D8. Monorepo（pnpm + Turborepo）

- **決策**：monorepo，apps/web + apps/api + packages/shared + packages/db。
- **理由**：前後端仍各自獨立部署（分離），但能共用 Zod 契約達成型別一致。
- **取捨**：若改兩個獨立 repo，共用契約需發 npm 套件或 submodule，摩擦較大。

## D9. 提醒通路

- **決策**：先做 Email（Resend）；LINE 後期。
- **理由**：⚠️ LINE Notify 已於 2025-03-31 終止，改用 LINE Messaging API（官方帳號）成本較高，延後。
- **狀態**：待最終確認。

## D10. 版號：單一產品版號

- **決策**：整個 monorepo 一個 SemVer 產品版號，不做前後端兩條版號。由前後端任一 Conventional Commit 共同驅動（`feat`→minor、`fix`→patch）。MVP 前 `0.x`，公開上線升 `1.0.0`。
- **做法**：release-please（single 模式）自動 bump 根 `package.json` + 產 `CHANGELOG.md` + 打 `vX.Y.Z` tag；apps `package.json` 維持 `private` + `0.0.0`。
- **相容性分離**：後端對外相容走 `/api/v1` 路徑版號（見 [05-api-conventions.md](05-api-conventions.md)），與產品版號脫鉤、極少變動；前端無外部 consumer，不需版號。
- **取捨**：捨棄 per-app 獨立版號（過於細碎難維護），改以 scope（`web`/`api`）在 CHANGELOG 區分變更來源。
