# ProGrads 文件

台灣研究所「備考作戰中心」：考古題整理 + AI 解題 + 各校報名情報。
本資料夾是專案**唯一的規格與決策文件來源**。

## 目錄

| 文件                                             | 內容                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| [00-product.md](00-product.md)                   | 產品定位、合規內容政策、功能模組與優先級、roadmap                    |
| [01-architecture.md](01-architecture.md)         | 系統架構、前後端分離、部署拓樸、技術配套（BOM）、TypeScript 取捨     |
| [02-data-model.md](02-data-model.md)             | 分類體系、雙軸資料模型、擴充槓桿、例外驗證與修正                     |
| [03-content-pipeline.md](03-content-pipeline.md) | 內容檔格式（題目／招生／師資）、參照解析、驗證與同步流程             |
| [04-ai-pipeline.md](04-ai-pipeline.md)           | Claude 離線防線、Groq 線上 grounding、self-consistency、成本         |
| [05-api-conventions.md](05-api-conventions.md)   | REST 慣例、Zod/nestjs-zod、錯誤格式、認證                            |
| [06-decisions.md](06-decisions.md)               | 決策紀錄（ADR）：每個重大選型的理由                                  |
| [08-design-system.md](08-design-system.md)       | 前端設計系統：token 分層、按鈕 intent、icon 登記、eslint 護欄        |
| [09-roadmap.md](09-roadmap.md)                   | Roadmap 與產品缺口：MVP 優先順序、延期理由、考科趨勢規劃、公開前缺口 |

## 一句話定案

棧：**Nuxt（CF Pages）+ NestJS（Fastify adapter，自有 server）+ Prisma + PostgreSQL**，
monorepo（pnpm + Turborepo）、TypeScript strict、Zod 貫穿全棧、純非營利開源。

## 撰寫慣例

每個主題只在一處完整說明，其餘文件連結、不重述（歸屬對照見 [06-decisions.md](06-decisions.md) D21）。
`00`–`05`/`08` 為現況參考，程式碼改了才跟著改；本檔以外的 ADR（`06`）與 roadmap（`09`）是會被推翻的判斷，條列優先、why 一句話帶過。未實作功能不寫成完整案例，草稿內容精簡或移出正文。
