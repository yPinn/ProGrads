# content — 題庫與標準解答（真相層）

每題一個 markdown（題目＋解答同檔，進 git），由 `@prograds/content-sync` upsert 進 PostgreSQL。
路徑用 slug：`questions/<track>/<school>/<department>/<year>/<exam-subject>[/<group>]/<qNN>.md`。
**合規：只收官方公開考題，每檔 frontmatter 必含 `source_url` 與 `license_status`。**
檔案格式、id 規則與同步流程見 [docs/03-content-pipeline.md](../docs/03-content-pipeline.md)。

> 目前僅有合成範例題（供格式參考）。正式題庫含官方題幹，依規劃將移至**獨立私有 repo**（見 docs/03 repo 分離）。
