# 招生簡章萃取 — 操作規格（schedule.yml 區A + departments.yml 區B）

一份 `prospectus.pdf` 切成**兩區兩檔**，沿抽取層邊界切開：

- **區A → `schedule.yml`**：校級①招生季框架 + ②科目節次時間表。多為乾淨數字/日期，A 層（regex 可讀，CID 字型也行）。
- **區B → `departments.yml`**：③各系所組明細（名額/考科/採計%/面試）。CJK 密集表格，**B 層須 PDF→圖 + vision**。

兩區可獨立成檔：A 層先落地、不被卡 vision 的 B 層綁架，且兩區 git diff 互不污染。背景與三層擁有者見
[docs/03-content-pipeline.md](../../docs/03-content-pipeline.md) §招生資料。契約以
`packages/shared/src/admission-content.ts`（`ScheduleYml` / `DepartmentsYml`）為準，本文件不重抄型別、只補萃取方法學。

> 共用規則（契約=真相、seed slug、寧缺勿假、驗證閘門、日期時區、commit）見 [EXTRACTION.md](./EXTRACTION.md)。

## 工作流程

1. **轉圖（區B 必需）**：`pnpm --filter @prograds/pdf-extract to-images <prospectus.pdf> {content-repo}/images/raw/admissions/{year}/{school}/prospectus/`
   → `page-01.png ...`（gitignored、可重跑）。密集表格辨識不清時用 `crop` 高解析切單區再讀。
2. **確認 session metadata**：`school`（slug）、`year`（**西元**，民國+1911，如 115→2026）、`admission_type`（`exam` 預設 / `recommended` 推甄 / `in_service` 在職）。
3. **區A**：讀「重要日程表」「報名費」「考試時間表」→ 產 `schedule.yml`（見下）。
4. **區B**：逐系所讀「招生系所分則」頁 → 產 `departments.yml`（見下）。**逐校 adapter**：同校跨年版面穩定，一校讀懂一次、隔年複用同套對映。
5. **驗證與 Commit**：見 [EXTRACTION.md](./EXTRACTION.md)——`validate admissions <dir>`（免 DB）→ `sync`，commit `feat(content): {school}-{year} 招生{區A|區B}萃取`。

## 路徑與檔

```text
admissions/{year}/{school}/[{season}/]schedule.yml      # 區A（season 段：exam 可省 / recruit / in-service）
admissions/{year}/{school}/[{season}/]departments.yml   # 區B
```

- `season` 段對齊 `admission_type`；預設 `exam` 省略。同校同年有推甄/在職多份簡章時才加段（避免撞檔）。sync 會驗證「路徑 season ↔ 檔內 `admission_type` 一致」。
- 檔內 `school`/`year` 必須等於路徑段。

## 區A：`schedule.yml`

```yaml
school: nchu
year: 2026 # 西元, 民國 115
admission_type: exam
status: published # not_published | published | superseded
announced_at: 2025-10-16 # 公告日 = 新鮮度錨點
source_url: https://recruit.nchu.edu.tw/
fees:
  application: 1500 # 報名費 TWD
  interview: 500 # 口試費（有才填）
  waiver: [low_income, lower_middle_income] # 低收 / 中低收 減免
schedule: # 扁平事件清單，每筆對映一個 event enum
  - { event: registration_start, at: 2025-11-25T09:00:00+08:00 }
  - { event: registration_end, at: 2025-12-09T17:00:00+08:00 }
  - { event: written_exam, at: 2026-02-06T00:00:00+08:00 }
  - { event: result, at: 2026-03-04T00:00:00+08:00, sequence: 1, note: 第一梯放榜 }
  - { event: result, at: 2026-03-23T00:00:00+08:00, sequence: 2 }
  - { event: enrollment, at: 2026-03-13T09:00:00+08:00, end: 2026-03-16T17:00:00+08:00 }
slots: [] # ②節次時間表（校級筆試時間），無則空陣列
```

**event 對映**（官方中文標籤 → `ScheduleEvent` enum，10 種）：

| 官方常見用語            | enum                 | 備註                            |
| ----------------------- | -------------------- | ------------------------------- |
| 領取繳費帳號 / 預備登記 | `account_open`       | 報名前置                        |
| 網路報名開始            | `registration_start` |                                 |
| 報名截止                | `registration_end`   |                                 |
| 審查資料上傳截止        | `document_deadline`  | 與報名同窗時仍各記一筆          |
| 准考證列印              | `admit_card`         |                                 |
| 筆試 / 考試             | `written_exam`       | 跨多日用 `end` 標結束           |
| 複試（面試）名單公告    | `shortlist`          |                                 |
| 面試 / 口試 / 複試      | `interview`          | **校級才放這；組級面試日見區B** |
| 放榜 / 錄取公告         | `result`             | 多梯用 `sequence`（1,2,…）      |
| 報到 / 註冊             | `enrollment`         | 區間用 `at`+`end`               |

**規則**（日期/時區見 [EXTRACTION.md](./EXTRACTION.md)）：

- 報名費列 A 層（日程表裡的乾淨數字）；減免身分用 `waiver: [low_income, lower_middle_income]`。
- `slots`（②時間表）：**考試時間掛科目/節次、校級共用**（系所明細頁只有佔分%，不放考試時間）。格式 `slots: [{ date, periods: [{ period, start, end, note }] }]`；查不到校級筆試時間表就留 `[]`。

## 區B：`departments.yml`（vision）

```yaml
school: nchu
year: 2026
depts:
  - dept: cse # 系所 slug（seed，須存在於 schools.seed）
    source_url: https://www.cs.nchu.edu.tw/
    groups:
      - code: a # ASCII 甲/乙/丙→a/b/c；無分組留 ""
        name: 資訊科學與工程組 # 有組名才填
        admission_code: "891" # 官方招生代碼（字串）
        applicant_type: 一般生 # 身分別
        quota: 29
        result_batch: 1 # 放榜梯次
        methods: [written] # written | review | interview（採用的考試項目）
        exam: { written: 100 } # 各項佔錄取總成績 %，和=100
        papers:
          - { name: 資料結構與演算法, subjects: [ds, algo] }
          - { name: 計算機組織與作業系統, subjects: [co, os] }
        tiebreak: [資料結構與演算法, 計算機組織與作業系統] # 同分參酌順序
        note: 招生名額含 AI 人才培育計畫外加 4 名
```

**方法學**：

- **系所 slug**：中文系名 → `dept` slug 走 seed 對照，勿自創（seed 規則見 [EXTRACTION.md](./EXTRACTION.md)）。
- **組 `code`**：甲/乙/丙 → `a`/`b`/`c`（ASCII 小寫）；整系不分組留 `""`。組**身分跨年穩定**，逐年檔重複宣告同一組即冪等。
- **考科 `papers`**：一份考卷一筆；`subjects` 只填能對映到 seed slug 的科目，對映不確定就留 `[]` 並在 `note` 記原文。合科用單一 paper + 多 subject + `note` 說明配比（如 `note: "離散 60% 線代 40%"`）。
- **採計權重——兩種語意分清**：
  - `exam.{written,review,interview}` = **三大項**（筆試/審查/口試）佔**錄取總成績** %，和=100。
  - `paper.weight` = **單科**佔**總分** %（組內筆試各科的細分，選填）。
  - 簡章常見 `[× N.NN]` 是**加權倍數非百分比**——換算成 % 時在檔頭 `note` 註明「倍數→%近似換算」，保留原始倍數於 paper `note`。
- **`methods`**：該組實際採用的項目子集，對齊 `exam` 有值的鍵（純筆試 `[written]`；含面試 `[written, interview]`）。
- **面試**：組級面試日期掛**這裡**（`interview_at: 2026-03-20`，date 或 datetime），**不掛區A**。
- **`quota`**：直接照簡章數字填，**不用**推算甄試名額流用後的定案值——考試入學名額常因甄試缺額流用而增加
  （只增不減），簡章公告時的數字是流用前下限，屬已知限制，見 [docs/06-decisions.md](https://github.com/yPinn/ProGrads/blob/main/docs/06-decisions.md) D20。

## 常見易錯

- 民國年沒 +1911；或 `written_exam` 跨兩天沒補 `end`。
- 把組級面試日誤掛區A的 `interview` 事件（區A只放校級面試）。
- 把加權倍數當百分比直接填進 `weight`（倍數 ≠ %）。
- `dept` 用了未 seed 的 slug（validate 會擋，勿硬填）。

## 每份完成後輸出

```text
{school}-{year} 招生萃取：schedule.yml（events {n}, slots {n}），departments.yml（depts {n}, groups {n}），未解欄位 {n} 處（列於 note）
```
