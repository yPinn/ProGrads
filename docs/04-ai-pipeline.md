# 04 — AI pipeline

## 雙層架構

- **Claude = 品質防線（離線、真相來源）**：離線生成「標準解答 + 知識點」，存成 markdown 檔案。
  **現況**：人在環路（human-in-the-loop）半自動——由人／Claude Code session 依 `tools/ai-pipeline/PROMPT.md`
  逐題手動生成，`tools/ai-pipeline` 僅提供 `list-pending`（列出待處理題目）+ markdown patch 輔助，
  repo **未依賴 `@anthropic-ai/sdk`**，尚無自動呼叫 API 的批次腳本。下方「離線生成」一節描述的
  self-consistency 投票 / 佇列退避重試為**規劃中**目標，非現況。
- **Groq = 線上擴充（免費、快）**：runtime 讀 Claude 的標準解答當 grounding，做白話解釋 / 延伸 / 回答追問。
  **現況**：**規劃中，尚未實作**——repo 未依賴 `groq-sdk`，無對應 API 端點（見
  [tasks/todo.md](../tasks/todo.md) P2「AI online follow-up」）。

## Grounding 契約（線上 Groq 必守）

> 以下是經審定的標準解答（權威）。你的任務是白話解釋、補充延伸知識點、回答追問，
> **不得變更結論/答案**。若你認為標準解答有誤，只能**標記**並說明，不得自行改寫。

結論鎖死、只開放擴充——這是整個架構成立的前提，避免較弱的線上模型污染防線。

## 離線生成（內容工廠，規劃中設計）

以下為目標架構（self-consistency 投票、佇列化批次），**尚未實作**——現況為人工依
`tools/ai-pipeline/PROMPT.md` 逐題手動生成（見上「雙層架構」）：

```text
for 每題官方考題:
  Claude 跑 N 次 → 依 answer_type 整併：
    mc / 數值題  → 多數決（self-consistency 投票）
    申論 / 證明  → 共識合併 + 潤稿
  產出 標準解答 + 知識點 + confidence
  confidence 低 → review_queue（人工或強模型複核）
  寫入 ProGrads-content/*.md（frontmatter: model_used / confidence / review_status）
```

規劃執行位置：`tools/` 腳本或 `nestjs-commander` CLI（非 runtime）。**現況**：`tools/ai-pipeline`
的 `list-pending` 只掃描 content repo 找出缺 `## 標準解答` 的題目並列出，不呼叫任何 AI API；
實際生成由人／Claude Code session 手動完成後，用 `tools/ai-pipeline/src/patch.ts` 寫回 markdown。

## 成本控制

- Claude 離線生成為**一次性成本**（生成完 commit，除非題目改或被回報錯誤才重生成）。
- 線上以**快取為主**（標準解答存 DB/檔案，重複使用，邊際近零）。
- 即時追問走 **BYOK** 或嚴格 rate limit。
- 批次需加佇列 + 退避重試 + 進度記錄（可中斷續跑）。

## 品質與信任

- 全站標示「AI 生成解析，僅供參考」，開放錯誤回報。
- 數理題務必多次取共識；低信心題不可直接當標準答案上線。
- 審定後標 `human_verified` 徽章，建立信任。

## 未來

知識點向量（pgvector）→ 相似題推薦、知識圖譜、個人化弱點分析。
