# 師資陣容萃取 — 操作規格（faculty/{school}/{dept}.yml）

各系所「專任師資」roster，一系所一檔，以 `校/系所` 為軸（非年度循環，無年份段）。

> **來源多為系所官網師資頁（HTML）、非 PDF**——實務用瀏覽/`WebFetch` 讀頁即可；本規格與 pdf-extract 同置僅為集中萃取規格。必要時（頁面 JS 重、或只有 PDF 名冊）可另存 PDF 再 `to-images` 轉圖以 vision 讀。

契約以 `packages/shared/src/faculty-content.ts`（`FacultyYml`）為準，本文件不重抄型別、只補萃取方法學。
資料模型見 [docs/02-data-model.md](../../docs/02-data-model.md) §師資增量；流程見 [docs/03-content-pipeline.md](../../docs/03-content-pipeline.md) §師資資料。

> 共用規則（契約=真相、seed slug、寧缺勿假、驗證閘門、日期時區、commit）見 [EXTRACTION.md](./EXTRACTION.md)。

## 工作流程

1. **定位來源**：找系所官網「專任師資／師資陣容」頁（記 URL → `source_url`）。抓取當日 → `as_of`。
2. **確認 metadata**：`school`/`dept` 為 seed slug（`schools.seed`，須已存在；缺則先補 seed）。
3. **逐人萃取** → `members[]`（見下）。**欄位彈性**：頁面沒有的欄位就略去，不臆造。
4. **驗證與 Commit**：見 [EXTRACTION.md](./EXTRACTION.md)——`validate faculty <dir>`（免 DB）→ `sync`，commit `feat(content): {school}-{dept} 師資陣容`。補全順序另有唯讀報告：`pnpm --filter @prograds/content-sync report-coverage {content-repo}/faculty [--gaps]`。

## 檔格式

```yaml
school: ntu # seed slug
dept: csie # seed slug（須存在於該校 schools.seed）
as_of: 2026-07-01 # 抓取日 = 新鮮度錨點
source_url: "https://www.csie.ntu.edu.tw/zh_tw/member/Faculty" # 系所師資頁

members:
  - name: "陳祝嵩" # 中文姓名 = 系內身分鍵（department 內唯一），必填
    slug: chu-song-chen # 選填 URL handle（官方英文名衍生時才填）；非身分鍵
    name_en: "Chu-Song Chen"
    title: "教授" # 學術職級，見下
    note: "系主任" # 行政職/借調等放這，title 只留學術職級
    research_areas: ["Computer Vision", "Machine Learning"] # 自由文字標籤
    homepage: "https://..." # 有才填
    degrees: # 學歷（選填）
      - {
          level: phd,
          institution: "Princeton University",
          field: "Electrical Engineering",
          year: 1995,
        }
    theses: # 論文佐證（選填）
      - title: "..."
        year: 2025
        role: authored # advised | authored
        url: "https://doi.org/..." # 穩定連結（DOI 佳）
```

## 欄位規則

| 欄位             | 規則                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `name`           | **中文姓名**，系內唯一（官網必有、較拼音穩定少撞名）。是身分＋冪等 upsert 鍵，**同名須消歧**       |
| `slug`           | 選填 URL handle，取官方英文名 kebab（`Chu-Song Chen`→`chu-song-chen`）；不是身分鍵，可不填         |
| `title`          | 只放**學術職級**：`教授`/`副教授`/`助理教授`/`特聘教授`/`講座教授`/`名譽教授`/`兼任教授` 等        |
| `note`           | 行政職（`系主任`/`所長`/`院長`）、借調、合聘等非職級資訊放這，勿混進 `title`                       |
| `research_areas` | 自由文字標籤陣列；照官網用語（中英不強制統一），不確定就少列勿臆造                                 |
| `degrees[]`      | `level` ∈ `bachelor`/`master`/`phd`/`other`；`institution`=授予校（資源訊號）；`field`/`year` 選填 |
| `theses[]`       | `role`＝`advised`（指導學生論文，NDLTD）｜`authored`（教授自著，DBLP/OpenAlex）；`url` 用穩定連結  |

## 方法學

- **最高學歷優先**：`degrees` 至少收最高學歷（多數頁面只列 PhD）；`institution` 是備考「師承/資源」訊號，值得抓。查得到才補碩/學士。
- **theses 來源分流**：`authored`（教授代表作）來自 DBLP / OpenAlex / 個人頁，挑穩定 DOI；`advised`（指導的學生論文）來自 NDLTD（臺灣博碩士論文網）。**只收有穩定連結者**，寧缺勿假。第一刀可先只補少數 `authored` 代表作，其餘後續補。
- **彈性**：此契約物件為寬鬆（非 `.strict()`），缺欄無妨（寧缺勿假見 [EXTRACTION.md](./EXTRACTION.md)）。
- **檔即完整 roster**：一系所一檔涵蓋該系全部專任師資；sync 會**剔除檔中已移除的成員**，故補檔時勿刪既有人員（除非確已離職）。

## 每份完成後輸出

```text
{school}/{dept} 師資萃取：{n} 人（職稱 {n}，研究方向 {n}，學歷 {n}，著作 {n} 人）as_of {date}
```
