# 貢獻指南

歡迎貢獻！本專案為非營利學習用途，請先讀 [docs/](docs/)。

## 環境

- Node ≥22（建議 24 LTS，見 `.nvmrc`）、pnpm 10（`corepack enable pnpm`，版本由 `packageManager` 鎖定）、PostgreSQL、Redis。
- `pnpm install` 後，Husky hooks 會自動安裝。

## 分支策略（GitHub Flow，trunk-based）

`main` = 整合主幹（受保護、禁直接 push、只接 PR），自動部署到 **staging**；`production` 分支（由 release tag 晉升）= **prod**。
開短命分支、一支做一件事、merge 後刪除；不使用長命 `develop`。
環境分層見 [docs/06-decisions.md](docs/06-decisions.md) D11/D12。

## 工作流程

1. 從 `main` 開分支，命名對齊 commit type：`feat/...`、`fix/...`、`docs/...`、`chore/...`。
2. 開發；提交前 `pnpm lint && pnpm typecheck && pnpm test`（pre-commit hook 會跑 lint-staged）。
3. 開 PR，CI 綠後 squash merge 回 `main`。
4. release-please 累積變更 → Release PR → 合併打 `vX.Y.Z`。

## Commit 規範（Conventional Commits）

格式：`<type>(<scope>): <subject>`

- type：`feat | fix | refactor | docs | test | chore | perf | ci | build | style | revert`
- scope（建議）：`web | api | db | shared | content | ai | ci | docs | deps | repo`
- 由 commitlint 在 `commit-msg` hook 驗證。

## 程式碼風格

- TypeScript strict；ESLint + Prettier（自動套用）。
- 不可變優先、小檔案高內聚、邊界以 Zod 驗證、錯誤完整處理（見 [docs/05-api-conventions.md](docs/05-api-conventions.md)）。
- 測試目標 80%（單元 + 整合 + E2E）。

## 貢獻考題內容（content/）

- **只收官方已公開考題**，每檔 frontmatter 必含 `source_url` 與 `license_status`。
- `unknown` 授權狀態不得合併。
- 標準解答以 Claude 離線生成為主；人工修正請更新 `review_status`。
- 格式見 [docs/03-content-pipeline.md](docs/03-content-pipeline.md)。

## 文件

所有規格/決策文件統一維護於 `docs/`。新增決策請補 [docs/06-decisions.md](docs/06-decisions.md)。
