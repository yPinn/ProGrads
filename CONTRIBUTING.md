# 貢獻指南

歡迎貢獻！本專案為非營利學習用途，請先讀 [docs/](docs/)。環境需求、常用指令、分支與 commit/PR 規範都在本檔——這是本 repo 操作規範的唯一來源，`README.md` 只留最小 quickstart。

## 環境與初始化

需求：Node ≥22（建議 24 LTS，見 `.nvmrc`）、pnpm 11（`corepack enable pnpm`，版本由 `packageManager` 鎖定）、Docker（本機 PostgreSQL）。Redis 後期才需要（見 `docker-compose.yml`）。

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate # 對齊 packageManager
pnpm install                               # 完成後 Husky hooks 會自動安裝
docker compose up -d postgres             # 本機 Postgres（host 5433，僅綁 localhost）
cp packages/db/.env.example packages/db/.env   # 設 DATABASE_URL
pnpm --filter @prograds/db db:migrate     # 套用 migration（建表）
pnpm --filter @prograds/db db:seed        # 灌參照資料（分類/學校/系所）
cp tools/content-sync/.env.example tools/content-sync/.env  # 設 DATABASE_URL + CONTENT_DIR（指向 ProGrads-content）
pnpm sync                                 # 同步內容（考古題/招生）content → DB；需先 seed
pnpm --filter @prograds/api dev           # 後端 API（http://localhost:8088/api/v1，docs 於 /api/v1/docs）
pnpm --filter @prograds/web dev           # 前端（http://localhost:3000）
```

## 常用指令

根目錄 `pnpm <script>`，依使用情境分區。

### 日常開發

| 指令             | 用途                               |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | 各 app 並行開發伺服器（turbo）     |
| `pnpm build`     | 建置全部 app                       |
| `pnpm typecheck` | 全 workspace 型別檢查              |
| `pnpm test`      | 全 workspace 測試                  |
| `pnpm clean`     | 清 build 產物並移除 `node_modules` |

### 程式碼品質

CI 用 `lint` / `:check`，本機修用 `fix`。

| 指令                | 用途                                                  |
| ------------------- | ----------------------------------------------------- |
| `pnpm lint`         | eslint + markdownlint + 各 workspace lint（唯讀檢查） |
| `pnpm lint:fix`     | eslint + markdownlint + 各 workspace 自動修復         |
| `pnpm lint:md`      | 只跑 markdownlint（針對性手動執行）                   |
| `pnpm format`       | prettier 寫入整個 repo                                |
| `pnpm format:check` | prettier 唯讀檢查                                     |
| `pnpm fix`          | 一鍵 `format` + `lint:fix`                            |

### 內容資料

content repo 與 DB 同步；內容契約與驗證流程見 [tools/README.md](tools/README.md)。

| 指令                 | 用途                                                       |
| -------------------- | ---------------------------------------------------------- |
| `pnpm sync`          | content → DB 同步（考古題/招生；需先 seed）                |
| `pnpm sync:prune`    | 同步並刪除已從 content repo 移除且帶 `sourcePath` 的資料   |
| `pnpm db:refresh`    | 一鍵 `migrate deploy → seed → sync`（空庫/重置用）         |
| `pnpm content`       | 對 `../ProGrads-content` 跑 prettier + markdownlint 並寫入 |
| `pnpm content:check` | 同上唯讀檢查                                               |

## 分支策略（GitHub Flow，trunk-based）

`main` = 整合主幹（受保護、禁直接 push、只接 PR），自動部署到 **staging**；`production` 分支（由 release tag 晉升）= **prod**。
開短命分支、一支做一件事、merge 後刪除；不使用長命 `develop`。
環境分層見 [docs/06-decisions.md](docs/06-decisions.md) D11/D12。

## 工作流程

1. 從 `main` 開分支，命名對齊 commit type：`feat/...`、`fix/...`、`docs/...`、`chore/...`。
2. 開發；提交前 `pnpm lint && pnpm typecheck && pnpm test`（pre-commit hook 會跑 lint-staged）。
3. 開 PR，CI 綠後 squash merge 回 `main`。
4. release-please 累積變更 → Release PR → 合併打 `vX.Y.Z`。

## Commit 與 PR 訊息（統一格式，英文）

**Commit**（Conventional Commits，標題 + 可選 body）：

```text
<type>(<scope>): <subject>

<body — 簡述 what/why，可條列>

<footer — 可選：BREAKING CHANGE: ... / Refs #123>
```

- type：`feat | fix | refactor | docs | test | chore | perf | ci | build | style | revert`
- scope（建議）：`web | api | db | shared | content | ai | ci | docs | deps | repo`
- 標題由 commitlint 在 `commit-msg` hook 驗證；body 選填但鼓勵簡述變更。

**PR**：title 同 Conventional Commits；body 用結構化模板（Summary / Changes / Verification / Related，見 `.github/PULL_REQUEST_TEMPLATE.md`）。

> Squash 合併時，repo 設定為以 **PR 標題 + 內文**作為 `main` 上的 commit 訊息——故結構化 PR body 會成為該次 commit 的描述，commit 與 PR 自動一致。

## 程式碼風格

- TypeScript strict；ESLint + Prettier（自動套用）。每個 app/package 自帶 `eslint.config.mjs`（共用 root `base`，前端 `@nuxt/eslint`、後端 Nest 例外各自覆寫）；root ESLint 只 lint 根層級設定檔。
- 註解與文件語言：
  - **程式碼註解一律英文**、精簡、解釋 _why_ 而非 _what_，能連結 `docs/` 就連結。中文僅保留在無法乾淨英譯處：檔案內的字面標記（如 `## 題目`、`## 標準解答`）、考卷/系所官方名稱、被引用的畫面文案，以及 zh-TW 日期格式輸出。Zod `.describe()` 為對外 API 文件字串，維持中文。
  - **文件與 README 用繁中**；README 標題統一 `# <名稱> — <一句話描述>`。`docs/` 為規格/決策的唯一來源，新增決策補 `docs/06-decisions.md`。
  - seed 檔（`packages/db/prisma/seed/`）標註中文參照資料，維持中文。
- 不可變優先、小檔案高內聚、邊界以 Zod 驗證、錯誤完整處理（見 [docs/05-api-conventions.md](docs/05-api-conventions.md)）。
- 測試：runner 全棧統一 **Vitest**，目標 80%（單元 + 整合）；E2E 尚未實作，公開前補齊（見 [docs/09-roadmap.md](docs/09-roadmap.md)）。指令一律從 root 跑，見上方常用指令與 [docs/06-decisions.md](docs/06-decisions.md) D16。

## 貢獻考題內容

考題內容存放於私有 repo [ProGrads-content](https://github.com/yPinn/ProGrads-content)，非本 monorepo；內容契約（`source_url`/`license_status`）與驗證流程見 [tools/README.md](tools/README.md)。

## 文件

所有規格/決策文件統一維護於 `docs/`。新增決策請補 [docs/06-decisions.md](docs/06-decisions.md)。
