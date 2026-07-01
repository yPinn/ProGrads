# exam-solvers — 計算量大考題的答案驗證

小而可重用的 solver，用來**驗證**計算量大的考題答案（排程、管線、數值）。它們撐起 Tier2 解答的
`confidence` 欄位：當答案是非平凡計算的產物時，這裡的腳本就是它可重現的證明。

這**不是**通用對答機——每種題型的數學不同。可重用的單位是**題型族 solver**，逐題資料則放在一個薄薄的
_case_，餵給 solver 並斷言記錄的答案。

## 結構

```text
src/
├── <technique>/        可重用 solver——按「技術／題型族」組織，不按科目
│   └── *.ts            例：scheduling/chain-makespan.ts
└── cases/              一題一檔，操作某 solver 並斷言其答案
    └── {school}-{year}-{subject}-q{NN}.ts
```

為何按技術而非科目：solver 以「它做的數學」聚類，而那會跨科目（一個排程 DP 同時服務 OS 排程與演算法題；
一個管線模擬器純屬計算機組織）。科目資訊放在 **case 檔名**，不放在目錄樹。

先平鋪，肥了才長深度：只有當同一族出現第二個 solver 時，才開 `<technique>/` 子資料夾。

## 慣例

- **Solver**（`src/<technique>/*.ts`）：純函式，instance 進 → result 出，無 I/O、不寫死考題資料。
  匯出具型別的 `Instance` / `Result` 介面。代價不大時泛化到自然參數（例：K 條 chain，而非寫死 2）。
- **Case**（`src/cases/*.ts`）：import 某 solver，定義特定 instance，印出計算過程，與記錄答案不符時
  `process.exit(1)`——故一個 case 同時是回歸測試。命名 `{school}-{year}-{subject}-q{NN}.ts` 對齊 content repo。

## 執行

```bash
# 跑單一 case（印出計算過程，與記錄答案不符則 exit 非零）：
pnpm --filter @prograds/exam-solvers solve src/cases/ntu-2026-co-os-q14.ts

pnpm --filter @prograds/exam-solvers test
pnpm --filter @prograds/exam-solvers typecheck
pnpm --filter @prograds/exam-solvers lint
```

## 現有 solver

| 技術                                                                           | 檔案                           | 用於               |
| ------------------------------------------------------------------------------ | ------------------------------ | ------------------ |
| 單機 makespan、有序 chain、release time、序列相依 setup                        | `scheduling/chain-makespan.ts` | ntu-2026-co-os-q14 |
| In-order 管線時序（可配置 forwarding / split-phase regfile / 2-bit predictor） | `pipeline/inorder-sim.ts`      | ntu-2026-co-os-q11 |
