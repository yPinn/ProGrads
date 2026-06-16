# 05 — API 慣例

## 風格

- REST，資源命名用複數名詞：`/categories`、`/tracks`、`/subjects`、`/schools`、`/departments`、`/exams`、`/questions`、`/schedules`、`/stats`。
- 版本前綴：`/api/v1`。
- 過濾/分頁用 query，**以 slug 過濾**（非顯示名）：`?track=computer-science&school=ntu&year=2025&page=1&pageSize=20`。

## 契約：Zod 單一事實來源

- request/response schema 定義在 `packages/shared`。
- 後端 `apps/api` 用 `nestjs-zod` 由同一 schema 生成 DTO 與驗證 + Swagger。
- 前端 `apps/web` 用同一 schema 推導型別與表單驗證（VeeValidate）。

## 統一回應格式

成功：

```json
{ "data": {}, "meta": { "page": 1, "pageSize": 20, "total": 134 } }
```

錯誤：

```json
{ "error": { "code": "NOT_FOUND", "message": "question not found", "details": null } }
```

- `meta` 僅分頁端點需要。
- `error.code` 為穩定列舉（給前端判斷），`message` 給人看，敏感資訊不外洩。

## 認證

- JWT 放 httpOnly cookie，網域設父網域（`*.domain`）以跨 `app.` / `api.` 子網域。
- 公開內容端點免登入；做題記錄 / 提醒訂閱 / AI 追問需登入。
- 限流：`@nestjs/throttler` + CF 邊緣雙層。

## 邊界驗證

所有外部輸入（query、body、外部 API 回應、檔案內容）在 boundary 以 Zod 驗證，fail fast。

## 文件

`@nestjs/swagger` 自動產生 OpenAPI（`/api/docs`），供貢獻者與前端型別生成使用。
