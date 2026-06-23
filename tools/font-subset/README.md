# font-subset — 標題明體子集化

把 **GenWanMin2 TW**（源雲明體月，標題用襯線字）子集化、切塊成 `woff2` 以自託管；
產物由 web app 於 `/fonts/genwanmin/` 提供。

只出 **Regular (400)** 一個字重——editorial 設計只用一種襯線字重、以字級拉出層級。
原始 OTF 已 git-ignore（每個約 22 MB）。

> 此工具刻意排除於 pnpm workspace（重型 native 依賴 cn-font-split，見 `pnpm-workspace.yaml`），
> 以獨立 npm 按需安裝執行。

## 重跑

```sh
# 1. 下載 release（git-ignored）並解壓到 src/otf/
curl -L -o GenWanMin2TW-otf.zip \
  https://github.com/ButTaiwan/genwan-font/releases/download/v2.100/GenWanMin2TW-otf.zip
unzip GenWanMin2TW-otf.zip -d src/otf

# 2. 子集化 -> apps/web/public/fonts/genwanmin/（woff2 chunks + result.css）
npm install
npm run build
```

`src/subset.mjs` 的 `css.fontFamily` 必須維持 `"GenWanMin2 TW"`，以對齊
`apps/web/app/assets/css/main.css` 的 `--font-serif`。

授權：GenWanMin 採 SIL OFL 1.1（可免費商用、允許自託管）。
