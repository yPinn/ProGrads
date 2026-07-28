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

- [x] 系所/組別頁呈現招生代碼、名額、考科權重、面試/審查比例、報名費、重要日期、簡章連結（`apps/web/app/pages/admissions/index.vue`）。
- [x] 錄取比計算：有 `admitted`（實際錄取情況，尚未有資料來源）用實際錄取率，否則用名額估算並標示為估算值（`apps/web/app/utils/admit-rate.ts`，資料來自 `AdmissionRound.applicants`/`quota`，見 [03-content-pipeline.md](03-content-pipeline.md) §報名統計資料）。
- [ ] 錄取比圖表化與年份比較——目前僅年份 tab 切換純文字/表格呈現，無圖表；`echarts`/`vue-echarts` 已是 `apps/web` 依賴但尚未接線。

理由：這是題庫以外最立即的使用者價值；比趨勢儀表板需要更少資料縱深，也不需要登入。多數子項已隨 admissions 頁面迭代完成，剩下的是視覺化。

### P2：Deadline 提醒訂閱

目標：把靜態報名資訊變成會回訪的工具。

- `reminder_subscription` model + migration。
- `POST /subscriptions`，匿名 email double opt-in，不綁 `user`。
- 訂閱 scope 支援 school / department / track。
- 寄送前需要 unsubscribe token 與 confirmed/unsubscribed 狀態。

理由：符合 MVP 清單，且不必提前做 auth。它能提高回訪與實用性，但要等 schedule/admissions 資料穩定後再做。

### P3：考古題練習體驗收斂

目標：把「題庫瀏覽」推進到「真的能練」。

- [x] 題目頁穩定處理選擇題、申論/計算題、解析顯示與來源資訊。
- [x] 整卷練習計時（`useStopwatch`，有 `durationMinutes` 倒數、無則正數）、重新開始/交卷。
- [x] 主要互動狀態（loading/empty/error）由共用元件 `QueryState`/`EmptyState`/`ErrorState` 覆蓋（`pages/questions/*`）。
- [ ] 整卷練習尚無單題上一題/下一題導覽——目前整卷單頁一次呈現所有題目，非逐題模式。

理由：題庫是主入口；即使做題記錄延到第二階段，匿名練習體驗也應先完整。剩下的缺口是單題導覽，非底層機制。

### P4：公開站基本防護

目標：公開前避免低成本濫用與營運風險。

- [x] CORS、helmet、統一錯誤信封已全域接線（`apps/api/src/main.ts`、`common/http-exception.filter.ts`）。
- [ ] `@nestjs/throttler` + Cloudflare rate limit——尚未安裝，公開端點目前**零限流**。

原則（持續適用，非單次任務）：公開內容端點維持免登入；高成本功能一律 gated 或延後。

理由：AI 追問、訂閱與公開 API 都會提高濫用面；限流應早於線上 AI 與通知大量使用。目前只缺限流一項。

## 明確延後

- **線上 AI 追問**：需 auth 或 BYOK、rate limit、成本控制與 grounding 防線；不應早於信任閉環與限流。
- **做題記錄 / 弱點分析**：依 [06-decisions.md](06-decisions.md) D17 延至第二階段，先做 OAuth-only。
- **考科趨勢產品頁**：見下 §考科趨勢，需資料縱深與 knowledge-point 受控詞彙表，未達閘門前只保留離線報表。
- **眾包解題、落點估算、社群**：第三階段；需要身分、審核與治理機制。

## 考科趨勢（規劃，對應 [00-product.md](00-product.md) 第二階段「弱點分析儀表板」）

把歷屆考題的考點／題型沿年份與學校樞紐化，是題庫外第二個數據化差異點（補習班給口耳方向、阿摩無分析，我們給矩陣）；閘門達成前只做離線報表，不開產品頁、不動 schema。

**資料現況**：`question_type`／`question_subject` 已入庫可直接算；考點（frontmatter `knowledge_points`）覆蓋率 100% 但尚未入庫（見 [03-content-pipeline.md](03-content-pipeline.md)，[content.ts](../packages/shared/src/content.ts) 標 phase 2）——考點趨勢價值最高但前置最重（入庫 migration + 受控詞彙表）。

| 階段         | 交付                                                                             | 觸發                  |
| ------------ | -------------------------------------------------------------------------------- | --------------------- |
| P0（已完成） | 離線 `report-trends <dir> [--paper=] [--school=] [--by-points] [--md]`，補題羅盤 | 無                    |
| P0.5         | 考點受控詞彙表（主題→子題兩層），隨補題漸進做                                    | 無                    |
| P1           | `KnowledgePoint` 目錄 + join，sync 建立，validator gate slug                     | P0.5 詞彙穩定         |
| P2           | API + Web 趨勢頁（考點熱力圖 + 題型堆疊 + 跨校比較）                             | P1 +「≥N 卷達 ≥3 年」 |

**風險 guardrail（P1/P2 啟動時的硬性前提，非現在要做）**：

- 預設用佔卷比、非原始次數，避免跟題數混淆；一題多考點/配分加權的計數口徑須在 UI 明講採哪種。
- 考點標註綁定生成用的 AI 模型版本；換模型重生解答導致標註位移時，需整批重標，不零星補。
- 跨校 paper slug 相同不代表考科範圍一致（如某校併入 OS），需一層 canonical 考科分類映射，不能只比字串。
- 收錄視窗＝偽歷史：只有自己策展的年份會讓「趨勢」失真；設最小年份閘門（< 3 年不顯示趨勢箭頭），文案維持描述性、非預測性。
- 詞彙治理規模是最大隱藏成本（單科目已上看 200+ 考點，全站恐 500+），故用兩層分類法，不用 flat slug。

**現階段定案**：P0 工具已足夠、純當補題羅盤；優先投入題庫縱深（同校同科多年份補題），同時餵飽題庫（MVP 護城河）與趨勢兩個目標；P1/P2 不提早動。

## 技術與文件缺口

- 前端已列但尚未接線的圖表/表格/表單依賴，應隨 P1/P2 實作啟用；若對應功能延期，應移除未用依賴。
- `@nestjs/throttler`、cache/queue/schedule、Resend、LINE SDK 仍屬規劃；安裝時機應跟上方優先順序一致。
  `@anthropic-ai/sdk` 不安裝（見 [06-decisions.md](06-decisions.md) D19，離線生成維持人工流程）；
  `groq-sdk` 僅在線上追問層真的啟動時才評估。
- `/questions` 與 `/questions/papers` 已具分頁慣例；`/exams`、`/departments`、`/schedules`、`/faculty`
  可在資料量擴大或列表頁需要總數時補齊。
- 後端整合測試、E2E、Sentry 等不阻擋 MVP 內部驗證，但公開前應補到關鍵流程。
