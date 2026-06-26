# 配色探索 / Palette Exploration

ProGrads 品牌配色研究（尚未進 `../tokens.json`）。資料驅動：**一個結構 `index.html` ＋ 一組組顏色 `schemes.js`**。

- `index.html` — 結構與引用（無樣式/邏輯/資料）。
- `styles.css` — 版面與元件樣式（顏色全走 CSS 變數，不寫死方案色）。
- `app.js` — 渲染邏輯：讀 `window.SCHEMES`、把選定色組灌進 CSS 變數、即時算 TUNED、選單/鍵盤事件。
- `schemes.js` — 顏色設定值：`window.SCHEMES = [{ id, light, dark }, …]`。**新增配色＝在此 append 一筆**（24 token/模式），不用 build、不用改其他檔。
- 操作：下拉選方案、`← →` 切方案、`空白鍵` RAW/TUNED 閃比。

## 現有方案

| id              | 來源                      | 主色 / 輔色     |
| --------------- | ------------------------- | --------------- |
| 01-starry-night | 梵谷《星夜》              | 靛藍 / 星金     |
| 02-ink-gold     | Rembrandt《夜巡》         | 墨黑 / 金赭     |
| 03-klimt        | Klimt《吻》               | 靛藍 / 鎏金     |
| 04-turner       | Turner《Val d'Aosta》     | 赭橘 / 棕金     |
| 05-vermeer      | Vermeer《倒牛奶》         | 群青 / 金赭     |
| 06-van-eyck     | Van Eyck《阿諾菲尼》      | 深綠(黑板) / 赭 |
| 07-grant-wood   | Grant Wood《美國哥德》    | 橄欖綠 / 暖褐   |
| 08-homer        | Winslow Homer《一籃蛤蜊》 | 藍橫線 / 鉛筆赭 |

06–08 為「黑板綠＋筆記本紙質」方向的 ColorLisa 候選（深綠/學堂/筆記本各偏一半）。
