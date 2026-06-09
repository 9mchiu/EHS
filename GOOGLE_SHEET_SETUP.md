# Google 表單寫入 + Google 試算表讀取 設定教學

本專案的成績資料採「**純前端、免後端**」做法：

- **寫入**：遊戲提交時，用 HTTP POST 送到 **Google 表單** 的 `formResponse` 端點。
- **讀取**：排行榜直接讀 **Google 試算表**（gviz JSON 端點）。

所有設定集中在 [`config.js`](./config.js)。未填寫前，遊戲會自動退回使用瀏覽器 `localStorage`（本機暫存），仍可正常遊玩。

---

## 一、建立 Google 表單（負責寫入）

1. 到 <https://forms.google.com> 建立新表單，依序新增 **4 個「簡答」題**，題目建議命名：
   | 題目 | 內容 |
   |------|------|
   | 工號 | 文字 |
   | 分數 | 數字 |
   | 用時 | 數字（秒） |
   | 作答時間 | 文字 |

   > ⚠️ 題目順序與名稱可自訂，但下方取 `entry` 編號時要對應正確。

2. 取得 **送出端點網址** 與 **entry 編號**：
   - 點右上角 **預覽（👁 眼睛圖示）** 開啟表單填寫頁。
   - 按 **F12** 開啟開發者工具 → **Elements / 元素**。
   - 搜尋 `<form`，找到 `action="https://docs.google.com/forms/d/e/XXXX/formResponse"`，整段就是 `actionUrl`。
   - 搜尋每個 `<input ... name="entry.123456789">`，記下每個欄位的 `entry.數字`。
     （小技巧：在預覽頁每題隨意填一個值 → 送出 → 在網址列／Network 也能看到 `entry.xxxx=值`。）

3. 把取得的值填進 `config.js` 的 `form` 區塊：
   ```js
   form: {
       actionUrl: "https://docs.google.com/forms/d/e/你的FORM_ID/formResponse",
       entries: {
           id:    "entry.aaaaaaaaaa", // 工號題
           score: "entry.bbbbbbbbbb", // 分數題
           time:  "entry.cccccccccc", // 用時題
           date:  "entry.dddddddddd", // 作答時間題
       },
   },
   ```

---

## 二、連結試算表並開放讀取（負責顯示）

1. 在表單編輯頁 → **回覆 (Responses)** 分頁 → 點試算表圖示 **連結至試算表 (Link to Sheets)**，建立回應試算表。

2. 開啟該試算表，把 **第一列（標題列）** 的欄位名稱對好。Google 表單會自動帶入「時間戳記 + 你的 4 個題目名稱」，例如：

   | 時間戳記 | 工號 | 分數 | 用時 | 作答時間 |
   |----------|------|------|------|----------|

   > 程式是用「標題文字」對應欄位的，所以 `config.js` 的 `sheet.columns` 要跟這裡的標題一致。

3. **開放讀取權限**：右上角 **共用 (Share)** → 一般存取權改為
   **知道連結的任何人 (Anyone with the link)** → 角色 **檢視者 (Viewer)**。
   （只要可檢視即可，不需要「發布到網路」。）

4. 從試算表網址取得 **試算表 ID**：
   ```
   https://docs.google.com/spreadsheets/d/【這一段就是 ID】/edit#gid=0
   ```

5. 填進 `config.js` 的 `sheet` 區塊：
   ```js
   sheet: {
       id: "你的SHEET_ID",
       name: "表單回應 1",   // 分頁名稱；留空字串則讀第一個分頁
       columns: {
           id:    "工號",
           score: "分數",
           time:  "用時",
           date:  "作答時間",
       },
   },
   ```

---

## 三、驗證

1. 用瀏覽器開 `index.html`，完成一次測驗並提交。
   - F12 Console 應出現 `✅ 已透過 Google 表單寫入成績`。
   - 到 Google 試算表確認多了一列資料。
2. 回首頁點 **排行榜**，或直接開 `leaderboard.html`：
   - Console 應出現 `✅ 已從 Google 試算表讀取 N 筆排行榜資料`。
   - 表格顯示試算表內容（依分數高、用時短排序）。

---

## 技術備註

- **寫入用 `mode: 'no-cors'`**：Google 表單不回傳 CORS 標頭，瀏覽器讀不到回應內容，但資料會成功送出，所以無法用回應判斷成敗（程式以 try/catch 盡力處理）。
- **讀取用 gviz**：端點為
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={分頁名}`，
  回傳會包在 `google.visualization.Query.setResponse(...)` 內，程式已自動去殼解析。
- **時間欄位**：以「秒（浮點數）」存入，顯示時格式化為 `mm:ss.xx`。
- **安全性**：表單與試算表為公開可寫/可讀，適合內部活動；如需防灌水，建議加上工號白名單或改走有驗證的後端。
