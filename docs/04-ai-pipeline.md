# 04 — AI pipeline

## 雙層架構

- **Claude = 品質防線（離線、真相來源）**：離線生成「標準解答 + 知識點」，存成 markdown 檔案。
  **決策（見 [06-decisions.md](06-decisions.md) D19）**：長期維持人在環路（human-in-the-loop）——由人／
  Claude Code session 依 `tools/ai-pipeline/PROMPT-generate.md` 逐題手動生成，`tools/ai-pipeline` 僅提供
  `list-pending`（列出待處理題目）+ markdown patch 輔助，repo **不安裝 `@anthropic-ai/sdk`**，**不建**
  自動呼叫 API 的批次腳本。下方「離線生成」一節描述的 self-consistency 投票 / 佇列退避重試為**不採用**
  的架構草案，僅保留說明曾評估過的方向，非目標。
- **Groq = 線上擴充（免費、快）**：runtime 讀 Claude 的標準解答當 grounding，做白話解釋 / 延伸 / 回答追問。
  選 Groq（而非 OpenRouter / Gemini）是因為目前免費層中品質與速度的組合最佳；線上 AI 呼叫統一走 Groq，
  不另外接其他線上 provider。**現況**：**規劃中，尚未實作**——repo 未依賴 `groq-sdk`，無對應 API 端點
  （見 [09-roadmap.md](09-roadmap.md)「明確延後」）。
- **原則：不做全站 AI**。目前不打算把 AI 擴大成全站功能；未來若重新評估有此需求，預設方向是
  Groq + skill（結構化 prompt / grounding 模式的延伸），而非改接 Claude API——沿用同一套「避免額外
  按量計費」的成本原則（見 D19）。

## Grounding 契約（線上 Groq 必守）

> 以下是經審定的標準解答（權威）。你的任務是白話解釋、補充延伸知識點、回答追問，
> **不得變更結論/答案**。若你認為標準解答有誤，只能**標記**並說明，不得自行改寫。

結論鎖死、只開放擴充——這是整個架構成立的前提，避免較弱的線上模型污染防線。

## 離線生成（現況：人工流程）

生成流程完全由人／Claude Code session 驅動，不呼叫程式化 API：

```text
list-pending → 挑一題 → 依 tools/ai-pipeline/PROMPT-generate.md 在 Claude Code session 手動生成標準解答 + 知識點
  （review_status: ai_generated）
  → list-unreviewed → 依 tools/ai-pipeline/PROMPT-review.md 交由 Codex 或人工複查正確性（跨模型/跨人交叉
    檢查，降低單一模型系統性錯誤風險）
  → 複查通過 review_status: ai_reviewed；有疑慮則修正或標 flagged
  → 用 tools/ai-pipeline/src/patch.ts 寫回 ProGrads-content/*.md
    （frontmatter: model_used / confidence / review_status）
```

`tools/ai-pipeline` 的 `list-pending` 只掃描 content repo 找出缺 `## 標準解答` 的題目並列出；`list-unreviewed`
列出已生成但 `review_status` 仍是 `ai_generated`（尚未複查）的題目——兩者都不呼叫任何 AI API，純掃描本地檔案。
`patch.ts` 純字串處理，寫回 markdown。曾評估過的 self-consistency 投票 + 佇列批次架構**不採用**（見 D19）——
理由是程式化呼叫 API 會產生額外計費，且人工／Codex 已在環路內把關品質，不需要疊加自動化重複解決同一問題。
Codex 複查走訂閱方案（固定月費，非按 token 計費 API），與 D19「避免額外 API 計費」原則一致。

**`review_status` 四態語意**：`ai_generated`（剛生成，未複查）→ `ai_reviewed`（Codex 複查通過，無人親自
看過）→ `human_verified`（真人正式簽核，不會由複查自動觸發）；`flagged`（已標記有疑慮）。`human_verified`
徽章嚴格保留給真人簽核過的題目，避免信任徽章失真（見「品質與信任」）。

## 成本控制

- Claude 離線生成為**一次性成本**（生成完 commit，除非題目改或被回報錯誤才重生成），且透過人工 Claude Code
  session 完成，不產生額外 API 計費。
- 線上以**快取為主**（標準解答存 DB/檔案，重複使用，邊際近零）。
- 即時追問走 **BYOK** 或嚴格 rate limit。

## 品質與信任

- 全站標示「AI 生成解析，僅供參考」，開放錯誤回報。
- 數理題務必多次取共識；低信心題不可直接當標準答案上線。
- `human_verified` 徽章嚴格保留給真人簽核過的題目；Codex 或其他 AI 複查通過但無人親自看過，標
  `ai_reviewed`，不得標成 `human_verified`——徽章代表「人看過」，不是「品質夠好」。

## 未來

知識點向量（pgvector）→ 相似題推薦、知識圖譜、個人化弱點分析。
