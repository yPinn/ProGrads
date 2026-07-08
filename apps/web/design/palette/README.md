# 配色探索 / Palette Exploration

ProGrads 品牌配色研究（尚未進 `../tokens.json`）。資料驅動：**一個結構 `index.html` ＋ 一組組顏色 `schemes.js`**。

- `index.html` — 結構與引用（無樣式/邏輯/資料）。
- `styles.css` — 版面與元件樣式（顏色全走 CSS 變數，不寫死方案色）。
- `app.js` — 渲染邏輯：讀 `window.SCHEMES`、把選定色組灌進 CSS 變數、即時算 TUNED、選單/鍵盤事件。
- `schemes.js` — 顏色設定值：`window.SCHEMES = [{ id, light, dark }, …]`。每個 scheme 只含**品牌＋中性** 21 token/模式（bg、面階、border、ink 階、primary/accent、board、d1–d5、shadow）。**新增配色＝在此 append 一筆**，不用 build、不用改其他檔。
  - 狀態燈號 `success/warning/error/info`（＋`-ink` 文字階）是**固定螢光筆組**，不隨畫作主題變，統一定義在同檔的 `window.STATUS = { light, dark }`（對齊 live 的 semantic.css）。這是設計慣例：品牌色隨主題、狀態色固定，使用者才學得會「紅＝錯」。
- 操作：下拉選方案、`← →` 切方案、`空白鍵` RAW/TUNED 閃比。

## 現有方案

| id               | 來源                        | 主色 / 輔色           |
| ---------------- | --------------------------- | --------------------- |
| 01-starry-night  | 梵谷《星夜》                | 靛藍 / 星金           |
| 02-ink-gold      | Rembrandt《夜巡》           | 墨黑 / 金赭           |
| 03-klimt         | Klimt《吻》                 | 靛藍 / 鎏金           |
| 04-turner        | Turner《Val d'Aosta》       | 赭橘 / 棕金           |
| 05-vermeer       | Vermeer《倒牛奶》           | 群青 / 金赭           |
| 06-van-eyck      | Van Eyck《阿諾菲尼》        | 深綠(黑板) / 赭       |
| 07-grant-wood    | Grant Wood《美國哥德》      | 橄欖綠 / 暖褐         |
| 08-homer         | Winslow Homer《一籃蛤蜊》   | 藍橫線 / 鉛筆赭       |
| 09-hokusai       | 葛飾北齋《神奈川沖浪裏》    | 深普魯士藍 / 沙金     |
| 10-vermeer-pearl | Vermeer《戴珍珠耳環的少女》 | 群青 / 金（近黑墨）   |
| 11-mondrian      | Mondrian《百老匯爵士樂》    | 靛藍 / 明黃（淨白底） |
| 12-malevich      | Malevich《至上主義構成》    | 深藍 / 金             |
| 13-kahlo         | Kahlo《自畫像》             | 橄欖綠 / 琥珀金       |
| 14-lewitt        | Sol LeWitt《Squiggles》     | 天青 / 黃             |

06–08 為「黑板綠＋筆記本紙質」方向的 ColorLisa 候選（深綠/學堂/筆記本各偏一半）。

09–11 為「修正 08-homer 奶油底低對比」方向：改用值對比更強、色相分離更清楚的畫作
（深藍／近黑墨／淨白底），全部 light+dark 通過 WCAG AA（ink/bg ≥7、primary/bg 與
on-primary/primary ≥4.5）。

12–14 為「Pantone 2026 Cloud Dancer（#f0eee9）當 light 底」系列：底色釘死，另四色取自
ColorLisa 深對比畫作，主色色相拉開（深藍／橄欖綠／天青）。近白底＋近黑墨，對比再上一階，
全部 light+dark 通過 WCAG AA。
