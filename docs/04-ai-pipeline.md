# 04 — AI pipeline

## 雙層架構

- **Claude = 品質防線（離線、真相來源）**：離線批次生成「標準解答 + 知識點」，存成 markdown 檔案。
- **Groq = 線上擴充（免費、快）**：runtime 讀 Claude 的標準解答當 grounding，做白話解釋 / 延伸 / 回答追問。

## Grounding 契約（線上 Groq 必守）

> 以下是經審定的標準解答（權威）。你的任務是白話解釋、補充延伸知識點、回答追問，
> **不得變更結論/答案**。若你認為標準解答有誤，只能**標記**並說明，不得自行改寫。

結論鎖死、只開放擴充——這是整個架構成立的前提，避免較弱的線上模型污染防線。

## 離線生成（內容工廠）

```text
for 每題官方考題:
  Claude 跑 N 次 → 依 answer_type 整併：
    mc / 數值題  → 多數決（self-consistency 投票）
    申論 / 證明  → 共識合併 + 潤稿
  產出 標準解答 + 知識點 + confidence
  confidence 低 → review_queue（人工或強模型複核）
  寫入 ProGrads-content/*.md（frontmatter: model_used / confidence / review_status）
```

執行位置：`tools/` 腳本或 `nestjs-commander` CLI（非 runtime）。

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
