# Cloudflare Worker + KV 排行榜 部署教學

本專案的成績資料改用 **Cloudflare Worker（迷你後端）+ KV（鍵值儲存）**：

- **寫入**：遊戲提交時 `POST {baseUrl}/submit`（JSON）→ Worker 寫進 KV。
- **讀取**：排行榜 `GET {baseUrl}/leaderboard` → Worker 回傳排序後的 JSON。
- **退路**：`config.js` 的 `api.baseUrl` 留空時，自動退回瀏覽器 `localStorage`，仍可遊玩。

後端程式在 [`worker/worker.js`](./worker/worker.js)，設定在 [`worker/wrangler.toml`](./worker/wrangler.toml)。
費用：**$0**（免費額度每天 10 萬次請求、KV 讀 10 萬／寫 1000 次／天，內部活動遠遠用不完）。

資料結構（KV 內 key=`leaderboard`，值為陣列）：

```json
[
  { "id": "A12345", "score": 40, "time": 73.21, "date": "2026/6/9 下午10:33:00" }
]
```

同一工號只保留「最高分」那筆；同分時較快者覆蓋。

---

## 方式 A：Cloudflare 後台點一點（不碰指令，推薦）

### 1. 註冊並進入 Workers
1. 到 <https://dash.cloudflare.com> 註冊／登入（免費）。
2. 左側選 **Workers & Pages** → **Create application** → **Create Worker**。
3. 取個名字，例如 `ehs-leaderboard` → **Deploy**（先部署一個預設範本）。

### 2. 建立 KV namespace
1. 左側 **Storage & Databases**（或 **Workers & Pages → KV**）→ **Create a namespace**。
2. 名稱填 `EHS`（隨意）→ **Add**。

### 3. 把 KV 綁定到 Worker
1. 回到剛建立的 Worker → **Settings** → **Bindings**（或 **Variables and Secrets → KV Namespace Bindings**）。
2. **Add binding**：
   - **Variable name** 一定要填 **`EHS`**（程式用 `env.EHS` 存取，名稱要一模一樣）。
   - **KV namespace** 選剛剛建立的那個。
3. **Save / Deploy**。

### 4. 貼上後端程式
1. Worker 頁面 → **Edit code**（`</> Quick edit`）。
2. 把編輯器內容**全部刪掉**，貼上專案裡 [`worker/worker.js`](./worker/worker.js) 的完整內容。
3. 右上 **Deploy**。

### 5. 拿到網址，填進前端
1. Worker 頁面上方會有一個網址，像：
   ```
   https://ehs-leaderboard.your-name.workers.dev
   ```
2. 打開專案的 [`config.js`](./config.js)，把它填進 `baseUrl`（**結尾不要加斜線**）：
   ```js
   window.EHS_CONFIG = {
       api: {
           baseUrl: "https://ehs-leaderboard.your-name.workers.dev",
       },
   };
   ```

---

## 方式 B：用 wrangler 指令列（習慣 CLI 的話）

需先安裝 Node.js。在 `worker/` 目錄下操作：

```bash
cd worker

# 1. 登入 Cloudflare（會開瀏覽器授權）
npx wrangler login

# 2. 建立 KV namespace，會印出一段 id
npx wrangler kv namespace create EHS

# 3. 把上一步印出的 id 貼進 wrangler.toml 的 id="..."
#    kv_namespaces = [ { binding = "EHS", id = "貼這裡" } ]

# 4. 部署
npx wrangler deploy
```

部署完成後 wrangler 會印出 `*.workers.dev` 網址，照「方式 A 第 5 步」填進 `config.js`。

---

## 驗證

1. 用瀏覽器開 `index.html`，完成一次測驗並提交：
   - F12 Console 應出現 `✅ 已透過後端 API 寫入成績`。
2. 直接打 API 也能測（把網址換成你的）：
   - 讀取： 瀏覽器開 `https://你的網址/leaderboard` → 應看到 JSON 陣列。
3. 回首頁點 **排行榜**，或開 `leaderboard.html`：
   - Console 應出現 `✅ 已從後端讀取 N 筆排行榜資料`，表格顯示成績（分數高、用時短優先）。

---

## 技術備註

- **CORS**：Worker 回傳 `Access-Control-Allow-Origin: *`，所以前端能讀到回應、可由 HTTP 狀態碼確認寫入成敗（比舊的 Google `no-cors` 寫法可靠）。若要鎖定只允許自家網域，把 `worker.js` 裡 `CORS` 的 `'*'` 換成你的網址。
- **KV 一致性**：KV 全球邊緣節點為「最終一致」，剛寫完馬上讀，偶爾可能還沒同步到當下節點。前端 `computeRank()` 已手動把剛送出的這筆併入排序，名次顯示不受影響。
- **時間欄位**：以「秒（浮點數）」存入，顯示時格式化為 `mm:ss.xx`。
- **防灌水（選用）**：目前 `/submit` 為公開可寫，適合內部活動。如需更嚴格，可在 `worker.js` 加：
  - 工號白名單（只接受名單內的 `id`）。
  - 共用密鑰（前端帶自訂 header，Worker 比對）。
  - 簡易限流（用 KV 記錄各 IP / 工號的提交次數）。
