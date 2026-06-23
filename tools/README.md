# tools — 離線腳本

TypeScript + tsx 執行的 workspace 套件。流程見
[docs/03-content-pipeline.md](../docs/03-content-pipeline.md) 與
[docs/04-ai-pipeline.md](../docs/04-ai-pipeline.md)。

- **`content-sync`**（`@prograds/content-sync`）：`ProGrads-content` → Postgres 同步（gray-matter + Zod 驗證 + 冪等 upsert + 合科卷 reconcile + 招生 schedule/departments importer）。
  執行：`pnpm --filter @prograds/content-sync sync`。
- **`ai-pipeline`**（`@prograds/ai-pipeline`）：列出缺少標準解答的題目，批次離線生成解答。
  執行：`pnpm --filter @prograds/ai-pipeline list-pending`。
  工作流程與規格：[PROMPT.md](./ai-pipeline/PROMPT.md)。
- **`pdf-extract`**（`@prograds/pdf-extract`）：PDF 考卷 → PNG 頁面圖片（供 AI 視覺萃取題目用）。
  執行：`pnpm --filter @prograds/pdf-extract to-images <pdf路徑> [output-dir]`。
  輸出請放在 content repo 的 gitignored `images/raw/questions/...` 或 `images/raw/admissions/...`。
  工作流程與規格：[PROMPT.md](./pdf-extract/PROMPT.md)。

## 工具腳本標準

所有 workspace tool 至少維持：

- `lint`：ESLint 唯讀檢查。
- `lint:fix`：ESLint 自動修復。
- `typecheck`：`tsc --noEmit`。

會解析資料、寫檔、同步資料庫或修改 markdown 的 tool 必須另外提供 `test`。測試優先覆蓋 parser、path contract、frontmatter/body mutation、prune/delete 類邏輯與錯誤 exit path；純 one-off 轉檔工具可先以 `typecheck` + CLI usage/error behavior 為最低門檻。

主指令 script 命名其**動作或產出**（verb-led kebab-case，如 `sync`、`crop`、`solve`、`to-images`），不可用裸名詞；同類子變體用 `:` 後綴（如 `sync:prune`）。

> `font-subset` 為刻意排除於 workspace 的獨立 npm 工具（重型 native 依賴 cn-font-split，見 `pnpm-workspace.yaml`），僅提供 `build`，不受本標準約束。

CLI 行為需一致：

- 缺必要參數時輸出 `Usage:` 並以 non-zero exit code 結束。
- 找不到輸入檔、env 未設定、資料契約不符時，錯誤訊息需指出可修正的欄位或路徑。
- 會修改外部狀態的工具應提供 dry-run、preview 或明確驗證流程；若目前不支援 dry-run，README/PROMPT 必須列出修改前後的驗證指令。

## 內容契約驗證

不要維護一份和 `ProGrads-content` 分離的 fixture seed 作為資料真相。內容契約以三層維持：

- `packages/shared` 的 Zod schema 定義 frontmatter/YAML 結構。
- `tools/content-sync` 的 parser 與單元測試驗證 path、frontmatter、body section 的最小契約。
- 實際內容品質以 real content repo 驗證：設定 `CONTENT_DIR` 後執行 `pnpm content:check` 與 `pnpm sync`。

若需要測試新 schema，先用極小 inline sample 覆蓋 parser/schema 邊界；不要建立長期維護的平行內容資料集。

## Pipeline 自動化方向

Prompt 只負責抽取與解題判斷；格式與寫回正確性應逐步交給工具保證：

- `pdf-extract` 保持 PDF → image/crop 的可重跑輸出，後續若新增 markdown scaffold，必須先跑 content-sync contract validation。
- `ai-pipeline` 的 markdown patching 必須保持單元測試覆蓋；大量自動寫回前應支援 dry-run diff 或 preview。
- 所有 pipeline 寫回 content repo 後，以 `pnpm content:check` + `pnpm sync` 作為完成門檻。
