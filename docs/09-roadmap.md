# 09 - Roadmap 與產品缺口

本文件記錄版本化的產品缺口、優先順序與延期理由。臨時工作紀錄、個人任務清單與當次審查筆記不放入
`docs/`；`docs/` 只保留會影響產品方向、協作與實作決策的內容。

## 原則

1. 先補「能讓使用者完成決策或累積信任」的功能，再做高成本互動。
2. MVP 不提前引入登入；需要身分的做題記錄、弱點分析、線上追問延到第二階段。
3. 文件中的「現況」必須可被 repo 內實作或版本化決策驗證，不引用本地 scratch notes。

## MVP 優先實踐順序

### P0：信任閉環

目標：讓 AI 解析與官方資料可被信任、可回報、可修正。

- [x] 全站清楚標示「AI 生成解析，僅供參考」（`apps/web/app/pages/questions/[externalId].vue`、`.../paper/[id].vue`）。
- [x] 顯示 `review_status`：`ai_generated` / `ai_reviewed` / `human_verified` / `flagged`（同上兩頁）。
- [ ] 題目/解析頁提供錯誤回報入口，至少可送出題目 id、錯誤類型、使用者描述——尚未實作。
- [ ] 補上 DMCA / 授權取下流程說明與聯絡入口——尚未實作。

理由：這是產品護城河「AI 解題」的信任底座，成本低於線上 AI 追問，且直接降低合規與品質風險。

### P1：招生決策價值

目標：讓「該考哪間」不只是一堆資料，而是可比較的選校決策工具。

- `GET /stats` 接上 `AdmissionStat`，提供報名人數、名額、錄取人數與錄取比。
- 報名情報頁接上錄取比圖表與年份比較。
- 系所/組別頁呈現招生代碼、名額、考科權重、面試/審查比例、報名費、重要日期。

理由：這是題庫以外最立即的使用者價值；比趨勢儀表板需要更少資料縱深，也不需要登入。

### P2：Deadline 提醒訂閱

目標：把靜態報名資訊變成會回訪的工具。

- `reminder_subscription` model + migration。
- `POST /subscriptions`，匿名 email double opt-in，不綁 `user`。
- 訂閱 scope 支援 school / department / track。
- 寄送前需要 unsubscribe token 與 confirmed/unsubscribed 狀態。

理由：符合 MVP 清單，且不必提前做 auth。它能提高回訪與實用性，但要等 schedule/admissions 資料穩定後再做。

### P3：考古題練習體驗收斂

目標：把「題庫瀏覽」推進到「真的能練」。

- 題目頁穩定處理選擇題、申論/計算題、解析顯示與來源資訊。
- 整卷練習需有計時、重新開始、上一題/下一題、答案揭露與狀態重置。
- 補齊主要互動狀態：loading、empty、not found、AI 解析缺漏、來源缺漏。

理由：題庫是主入口；即使做題記錄延到第二階段，匿名練習體驗也應先完整。

### P4：公開站基本防護

目標：公開前避免低成本濫用與營運風險。

- `@nestjs/throttler` + Cloudflare rate limit。
- CORS、helmet、錯誤信封維持一致。
- 公開內容端點維持免登入；高成本功能一律 gated 或延後。

理由：AI 追問、訂閱與公開 API 都會提高濫用面；限流應早於線上 AI 與通知大量使用。

## 明確延後

- **線上 AI 追問**：需 auth 或 BYOK、rate limit、成本控制與 grounding 防線；不應早於信任閉環與限流。
- **做題記錄 / 弱點分析**：依 [06-decisions.md](06-decisions.md) D17 延至第二階段，先做 OAuth-only。
- **考科趨勢產品頁**：依 [07-trends.md](07-trends.md)，需資料縱深與 knowledge-point 受控詞彙表，未達閘門前只保留離線報表。
- **眾包解題、落點估算、社群**：第三階段；需要身分、審核與治理機制。

## 技術與文件缺口

- 前端已列但尚未接線的圖表/表格/表單依賴，應隨 P1/P2 實作啟用；若對應功能延期，應移除未用依賴。
- `@nestjs/throttler`、cache/queue/schedule、Resend、LINE SDK 仍屬規劃；安裝時機應跟上方優先順序一致。
  `@anthropic-ai/sdk` 不安裝（見 [06-decisions.md](06-decisions.md) D19，離線生成維持人工流程）；
  `groq-sdk` 僅在線上追問層真的啟動時才評估。
- `/questions` 與 `/questions/papers` 已具分頁慣例；`/exams`、`/departments`、`/schedules`、`/faculty`
  可在資料量擴大或列表頁需要總數時補齊。
- 後端整合測試、E2E、Sentry 等不阻擋 MVP 內部驗證，但公開前應補到關鍵流程。
