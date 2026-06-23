# ProGrads 文件

台灣研究所「備考作戰中心」：考古題整理 + AI 解題 + 各校報名情報。
本資料夾是專案**唯一的規格與決策文件來源**。

## 目錄

| 文件                                             | 內容                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| [00-product.md](00-product.md)                   | 產品定位、合規內容政策、功能模組與優先級、roadmap                |
| [01-architecture.md](01-architecture.md)         | 系統架構、前後端分離、部署拓樸、技術配套（BOM）、TypeScript 取捨 |
| [02-data-model.md](02-data-model.md)             | 分類體系、雙軸資料模型、擴充槓桿、例外驗證與修正                 |
| [03-content-pipeline.md](03-content-pipeline.md) | 題庫檔案格式、frontmatter schema、同步流程                       |
| [04-ai-pipeline.md](04-ai-pipeline.md)           | Claude 離線防線、Groq 線上 grounding、self-consistency、成本     |
| [05-api-conventions.md](05-api-conventions.md)   | REST 慣例、Zod/nestjs-zod、錯誤格式、認證                        |
| [06-decisions.md](06-decisions.md)               | 決策紀錄（ADR）：每個重大選型的理由                              |

## 一句話定案

棧：**Nuxt（CF Pages）+ NestJS（Fastify adapter，自有 server）+ Prisma + PostgreSQL**，
monorepo（pnpm + Turborepo）、TypeScript strict、Zod 貫穿全棧、純非營利開源。
