# 報名人數統計表萃取 — 操作規格（registration.yml）

一份「報名人數統計表」PDF（校方招生單位公告，通常在報名截止後、放榜前發布，僅供參考）萃取成
`registration.yml`：忠實記錄原始所組代碼/名稱，並**盡力**解析出對映既有 `departments.yml`
的 `dept` slug + 組 `code`，供 sync 回填 `AdmissionRound.applicants`。契約以
`packages/shared/src/admission-stats-content.ts`（`RegistrationYml`）為準，本文件不重抄型別、
只補萃取方法學。

> 共用規則（契約=真相、seed slug、寧缺勿假、驗證閘門、日期時區、commit）見 [EXTRACTION.md](./EXTRACTION.md)。

## 工作流程

1. **轉圖**：`pnpm --filter @prograds/pdf-extract to-images <registration.pdf> {content-repo}/images/raw/admission-stats/{year}/{school}/registration/`
   → `page-01.png ...`（gitignored、可重跑）。
2. **確認 session metadata**：`school`（slug）、`year`（**西元**，民國+1911）、`admission_type`
   （看標題判斷，見下）。
3. **對照既有 `admissions/{year}/{school}/[{season}/]departments.yml`**（若尚未抽取，此步只能
   忠實記錄原文、`dept`/`code` 留空，等 departments.yml 補齊後再回頭補）：逐列比對所組**名稱**
   （非代碼，見下）解析出 `dept` slug + `code`。
4. **逐列**產 `registration.yml`（見下）。
5. **驗證與 Commit**：見 [EXTRACTION.md](./EXTRACTION.md)——`validate admission-stats <dir>`（免
   DB）→ `sync`，commit `feat(content): {school}-{year} 報名人數萃取`。

## 路徑與檔

```text
admission-stats/{year}/{school}/[{season}/]registration.yml
```

- `season` 段對齊 `admission_type`；預設 `exam` 省略（見 `ProGrads-content/README.md`
  §admission-stats/）。同校同年有多管道報名表才加段。sync 會驗證「路徑 season ↔ 檔內
  `admission_type` 一致」。
- 檔內 `school`/`year`/`admission_type` 必須等於路徑段。

## `registration.yml`

```yaml
school: nthu
year: 2026
admission_type: exam
announced_at: 2025-10-09 # 統計表公告日 (原文 "114.10.09" 民國年 +1911)
source_url: https://~
rows:
  - official_code: "0524" # 原始所組代碼, 忠實記錄
    name: 資工系 # 原始所組名稱
    dept: cs # 解析後 dept slug (走 schools.seed); 對不到就留空
    code: "" # 對映 AdmissionGroup.code (a/b/c 或 ""); 對不到就留空
    applicant_type: 一般生
    applicants: 2008
  - official_code: "0524"
    name: 資工系
    applicant_type: 在職生
    applicants: 3
    note: 同 0524, 在職生欄
  - official_code: "810"
    name: 資訊聯招
    applicants: 819
    joint: true # 一碼多系, sync 不對映, 忠實記錄即可
```

**方法學**：

- **`admission_type` 判定**（看標題關鍵字）：「考試入學」→ `exam`；「甄試入學」/「推薦甄選」→
  `recommended`；「在職專班」獨立招生（非附掛在 exam 統計表內的欄位）→ `in_service`。
- **與名額流用無關**：報名人數（本檔）跟甄試缺額流用進考試入學名額是兩件獨立的事——流用發生在甄試放榜
  後、通常晚於報名人數表公告，且只影響 `quota` 不影響 `applicants`。抽這份檔不用等流用結果，見
  [docs/06-decisions.md](https://github.com/yPinn/ProGrads/blob/main/docs/06-decisions.md) D20。
- **代碼→slug 對映，靠名稱不靠代碼**：統計表的「所組代碼」是校方自訂編號，**與我方
  `departments.yml` 的 `admission_code`（如有填）不一定同一套**、也未必唯一對應一個 dept。正確
  對映走**所組名稱**比對已存在的 `departments.yml`（`dept` 顯示名／`groups[].name`），對上了才填
  `dept`/`code`；對不上（尚未收錄、或名稱有出入）就都留空、原文存 `name`，**不臆造**。
- **聯招/一碼多系**：一個代碼涵蓋多個系所（如「資訊聯招」「電機學院聯招」）時，`joint: true`，
  `dept`/`code` 留空——sync 天生跳過，等未來有 dept 級細分數據再處理。
- **同代碼多身分別**：一般生/在職生分屬不同欄位時，**每個身分別各佔一列**（`official_code`/
  `name` 相同，`applicant_type` 不同）。若原表已提供「小計」，小計不必另建列（sync 只讀
  `applicant_type` 非「在職」的列寫入主要 `applicants`，在職生列另存 metadata）。
- **同代碼但身分別本身就是不同組別**（如 NYCU「043 一般生 / 044 在職生」用不同代碼）：視為兩個
  獨立 row，各自 `official_code` 不同，一般照§對映流程各自找 `dept`/`code`。
- **`applicants` 只填人數**，不要填「小計」以外的加總或百分比。
- **`announced_at`**：統計表通常有一行「本表僅供參考 + 日期」（民國年），轉西元 `YYYY-MM-DD`。

## 常見易錯

- 拿統計表代碼直接當 `admission_code` 比對——校方代碼跨表/跨年常不穩定，務必用名稱核對。
- 把聯招當單一系所硬塞 `dept`（會在 validate 或人工核對時發現人數對不上名額量級）。
- 民國年沒 +1911。
- 在職生列蓋掉一般生的 `applicants`（兩者是同一 round 的不同事實，不能互相覆寫；一般生為主
  applicants，在職生另存 metadata，見上）。

## 每份完成後輸出

```text
{school}-{year} 報名人數萃取：rows {n}（已對映 {m}，聯招/未對映 {k}）
```
