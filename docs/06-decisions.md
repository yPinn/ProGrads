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
- **現況**：離線層為人在環路（人工依 prompt 生成，長期不接 API，見 D19）；線上 Groq 層尚未實作。
  詳見 [04-ai-pipeline.md](04-ai-pipeline.md)。

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
- **理由**：LINE Notify 已於 2025-03-31 終止，改用 LINE Messaging API（官方帳號）成本較高，延後。
- **狀態**：待最終確認。

## D10. 版號：單一產品版號

- **決策**：整個 monorepo 一個 SemVer 產品版號，不做前後端兩條版號。由前後端任一 Conventional Commit 共同驅動（`feat`→minor、`fix`→patch）。MVP 前 `0.x`，公開上線升 `1.0.0`。
- **做法**：release-please（single 模式）自動 bump 根 `package.json` + 產 `CHANGELOG.md` + 打 `vX.Y.Z` tag；apps `package.json` 維持 `private` + `0.0.0`。
- **相容性分離**：後端對外相容走 `/api/v1` 路徑版號（見 [05-api-conventions.md](05-api-conventions.md)），與產品版號脫鉤、極少變動；前端無外部 consumer，不需版號。
- **取捨**：捨棄 per-app 獨立版號（過於細碎難維護），改以 scope（`web`/`api`）在 CHANGELOG 區分變更來源。

## D11. 分支策略：GitHub Flow（trunk-based）

- **決策**：`main` = 整合主幹（受保護、禁直接 push、只接 PR），自動部署到 staging；`production` 分支（由 release tag 晉升）= prod。開發走短命分支（`feat/`、`fix/`、`docs/`、`chore/`）→ PR → CI 綠 → squash merge。
- **理由**：solo/小團隊用 Git Flow 過重；GitHub Flow + release-please + 環境晉升契合。
- **不採**：長命 `develop`（main 即整合線）。
- **晉升**：release-please 於 `main` 打 `vX.Y.Z` → 晉升 `production` 觸發 prod 部署。

## D12. 部署環境：dev / preview / staging / prod（業界標準三層 + preview）

- **決策**：採標準三層 + per-PR preview。
  - local/dev：開發者機器。
  - preview（ephemeral）：每個 PR；CF Pages 自動產生。
  - staging/UAT：`main` 自動部署。
  - prod：release tag 晉升 `production`。
- **晉升管線**：`feature → PR(preview) → main(staging) → tag/production(prod)`。
- **基礎設施**：前端 CF Pages（production branch=prod、main=staging、PR=preview）；後端自有 server 跑 prod + staging 兩實例（獨立 DB `prograds_staging`、獨立 port、子網域 `api-staging`，Docker Compose 多檔/profile）。
- **鐵則（12-factor）**：dev/prod parity、config 走環境變數、每環境獨立 DB 與密鑰；staging 絕不碰 prod DB。
- **狀態**：拓樸已定；實際 CD 接線待 apps scaffold。

## D13. Zod 固定 v3

- **決策**：全棧 Zod 鎖 **v3**（非 v4）。
- **理由**：整合套件（`@vee-validate/zod`、後端 `nestjs-zod`）peer 仍要求 Zod 3；v4 會破壞「Zod 共用契約」。
- **取捨**：暫不上 Zod 4，待整合套件全面支援再評估升級。

## D14. 前端內容渲染不使用 Nuxt Content 索引

- **決策**：移除直接 `@nuxt/content` 與 `content.config.ts`，前端內容來源統一走 API；Markdown 題幹/解析只保留 `@nuxtjs/mdc` 渲染。
- **理由**：目前沒有使用 Nuxt Content collection；保留 Content 會讓 Cloudflare Pages build/typecheck 出現不必要的 D1/storage 設定疑慮。
- **釐清**：PostgreSQL 仍是唯一應用 DB（後端，Prisma）；前端不維護額外內容索引。
- **附帶**：`ogImage` 暫停用（需原生 renderer，日後啟用）。

## D15. Toolchain：Node 24 LTS + pnpm 10

- **決策**：Node 目標 **24（Active LTS）**（`.nvmrc`；`engines` 最低 `>=22`）；pnpm **10.34.3**（成熟穩定 major，由 `packageManager` 鎖定、corepack 取用）。捨棄 pnpm 11（剛發布、未夠成熟）。
- **pnpm 10 兩個非直覺設定**：
  - **build script 預設封鎖**（安全性）→ 以 `pnpm.onlyBuiltDependencies` 明確授權原生套件（better-sqlite3、sharp、esbuild、@parcel/watcher、unrs-resolver、vue-demi）。
  - **嚴格 node_modules（不 hoist）**→ 程式直接 import 的套件須列為直接依賴，故 `tailwindcss` 加進 `apps/web`（`main.css` 的 `@import "tailwindcss"`）。
- **維護**：Dependabot 每週升級依賴；major 版本（如 Node/pnpm）以穩定性為先，不盲目追最新。

## D16. 品質工具鏈：統一 Vitest + 各套件自帶 ESLint

- **決策**：測試 runner 全棧統一 **Vitest**（不採後端 Jest）；lint/typecheck/test/format 由 **Turborepo** 從 root 單一入口 fan-out。每個有 lint 的 app/package **自帶 `eslint.config.mjs`**（共用 root 匯出的 `base`，前端 `@nuxt/eslint`、後端 Nest 例外各自覆寫）；root ESLint 只 lint 根層級設定檔，避免重複 lint。
- **理由**：前後端框架天生不同（Nuxt vs Nest），硬塞單一巨型 config 更糟；「規則共用一份 `base`、差異各自覆寫」兼顧一致與隔離。Vitest 與 ESM/Vite 生態契合，前後端同一 runner 降低心智負擔。
- **取捨**：因 pnpm 嚴格 node_modules（不 hoist，見 D15），Vitest 須列為各套件直接 devDep；`packages/db` 僅 re-export 生成的 Prisma client，無原始碼可測/可 lint，刻意不接。
- **入口**：日常一律 root 下 `pnpm lint` / `format` / `typecheck` / `test`（turbo 自動分派、排序、快取）；針對單一套件用 `pnpm -F <name> <task>`。

## D17. 使用者身分：延後至第二階段、OAuth-only（不存密碼）

- **決策**：MVP 全匿名公開（對齊 SEO 命脈），不做登入；身分功能延到第二階段（做題記錄/弱點儀表板/線上追問）才上。屆時採 **OAuth-only**：不存密碼/憑證，只存最小身分對照列（`provider, providerUserId, email?, displayName?`），後端自簽 httpOnly JWT session cookie（父網域），沿用既定 `@nestjs/jwt + passport`（見 [01-architecture.md](01-architecture.md) BOM）。
- **Provider**：首發 **Google**（普及率最高、整合成熟）；**LINE Login** 後續可考慮（與 D9 LINE 推播一條龍）；GitHub/Apple 暫不需要。
- **MVP 提醒訂閱**：用純 email double opt-in，**不綁帳號**（`reminder_subscription` 獨立於 `user`），避免為單一功能提早引入 auth。
- **理由**：非營利開源 → 不碰密碼即移除外洩責任、密碼重設流程與大半法遵負擔；OAuth 仍需一列本地身分以掛載 per-user 資料，但那是外部身分對照鍵、非「帳號」。
- **取捨**：捨棄裝置端純匿名（零 PII，但換裝置/清快取即遺失、無法跨裝置同步、無法長社群），換取跨裝置同步與未來社群可行性。
- **現況**：僅在文件預留決策與模型草圖（見 [02-data-model.md](02-data-model.md)）；**不建 model、不跑 migration**，第二階段才落地。

## D18. 師資（faculty）納入 MVP 正式核心功能

- **決策**：師資陣容頁（系所教授/實驗室/研究方向）列為 MVP 第 5 項正式功能，非附屬/實驗性模組。
- **理由**：schema（`FacultyMember`/`FacultyThesis`/`FacultyDegree`）、content pipeline、API、前端頁面已完整落地
  （10 校內容），且直接支援產品定位「該考哪間」的選校決策，與價值主張一致。
- **現況**：`00-product.md` MVP 清單已補列第 5 項；此前落地已久卻未寫入產品文件，屬本次文件翻新修正。

## D19. AI 離線生成不做程式化批次自動化，維持人工透過 Claude Code 逐題生成

- **決策**：`tools/ai-pipeline` 的 self-consistency 投票 / 佇列批次架構（04-ai-pipeline.md 原「規劃中設計」）**不採用**；
  離線生成長期維持人在環路：人／Claude Code session 依 `PROMPT-generate.md` 逐題手動生成，`tools/ai-pipeline`
  僅保留 `list-pending`／`list-unreviewed`（掃描待處理／待複查）+ `patch.ts`（寫回 markdown）等輔助腳本，
  repo 不安裝 `@anthropic-ai/sdk`。
- **理由**：程式化呼叫 API（含 self-consistency 多次投票）會產生按 token 計費的額外費用；Claude Code session
  本身已是人在環路，每題都有人審查，self-consistency 投票要解決的「降低單次生成隨機錯誤」已被人工把關涵蓋，
  不需要再疊加一層自動化重複解決同一問題。
- **取捨**：放棄批次吞吐量（無法無人值守大量生成），換取零額外 API 成本，且複雜度維持在「兩支輔助腳本」而非
  佇列/重試/CLI 基礎設施。若未來出現大量無人值守生成的明確需求（例如題量遠超人工產能），再重新評估。
- **複查**：正確性複查用 Codex（跨模型交叉檢查）或人工，走訂閱方案（固定月費），不按 token 計費，與本決策
  成本原則一致。複查通過但無人親自看過的題目，`review_status` 設為 `ai_reviewed`；`human_verified` 徽章
  嚴格保留給真人簽核（不會由複查自動觸發），避免信任徽章失真（見 [04-ai-pipeline.md](04-ai-pipeline.md)）。
- **同原則延伸**：目前不打算做全站 AI 功能；若未來重新評估有此需求，預設方向是 Groq + skill（沿用線上層
  既有的免費 API + grounding 模式），而非改接 Claude/OpenAI 按量計費 API，維持同一套成本原則。
