# Cloudflare Worker + Durable Object 排行榜 部署教學

本專案的成績資料用 **Cloudflare Worker（迷你後端）+ Durable Object（DO）** 儲存：

- **寫入**：遊戲提交時 `POST {baseUrl}/submit`（JSON）→ Worker 轉給 DO 寫入。
- **讀取**：排行榜 `GET {baseUrl}/leaderboard` → 回傳排序後的 JSON。
- **退路**：`config.js` 的 `api.baseUrl` 留空時，自動退回瀏覽器 `localStorage`，仍可遊玩。

後端程式在 [`worker/worker.js`](./worker/worker.js)，設定在 [`worker/wrangler.toml`](./worker/wrangler.toml)。

> **為什麼用 Durable Object？**
> 先前用「單一 KV key 存整個排行榜」，每次交卷都「讀整包 → 改 → 寫整包」。多人**同時**交卷時會用各自手上的舊資料互相覆蓋，導致**真實成績遺失**（競態）。
> Durable Object 保證「全域唯一實例、請求序列化處理」，讀-改-寫不會交錯，從根本消除競態；其儲存也是**強一致性**（KV 是最終一致）。
> SQLite-backed DO 在 **Workers 免費方案即可使用**（5GB 額度），不需付費升級。

資料結構（DO storage key=`list`，值為陣列）：

```json
[
  { "id": "A12345", "score": 40, "time": 73.21, "date": "2026/6/9 下午10:33:00" }
]
```

同一工號只保留「最高分」那筆；同分時較快者覆蓋。

---

## 方式 A：用 wrangler 部署（建立 DO 必用，推薦）

> ⚠️ 為什麼 DO 沒有「純後台點一點」的部署法？
> SQLite-backed Durable Object 的**類別必須在「初次部署」時透過 wrangler 的 migration（`new_sqlite_classes`）建立**，且官方規定「不能對既有的 DO 類別事後改成 SQLite」。後台無法可靠地完成這個初次建立，所以 **DO 的第一次部署一定要用 wrangler**（之後的維護、查資料可以在後台做，見方式 B）。需先安裝 Node.js。

在 `worker/` 目錄下操作：

```bash
cd worker

# 1. 登入 Cloudflare（會開瀏覽器授權）
npx wrangler login

# 2. 部署（會自動套用 wrangler.toml 內的 DO 綁定與 migration）
npx wrangler deploy
```

`wrangler.toml` 已設定好，不需再手動建立資源：

```toml
name = "ehs-leaderboard"
main = "worker.js"
compatibility_date = "2025-01-01"

[[durable_objects.bindings]]
name = "LEADERBOARD"
class_name = "Leaderboard"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["Leaderboard"]
```

部署完成後 wrangler 會印出 `*.workers.dev` 網址。

---

## 方式 B：Cloudflare 後台（部署後的維護與查資料）

> DO 的**初次建立**請用方式 A；**部署完成後**，下面這些都能在後台 GUI 操作，不必再碰指令。

1. **查看 / 進入 Worker**：<https://dash.cloudflare.com> → **Workers & Pages** → 點 `ehs-leaderboard`。可看到對外網址、請求用量、錯誤記錄（Logs）。
2. **改程式**：Worker 頁 → **Edit code**（`</> Quick edit`）→ 改 `worker.js` → **Deploy**。
   - ⚠️ 注意：只「改邏輯」可以；若要**新增/變更 DO 類別**仍須回方式 A 用 wrangler 跑 migration。
3. **查 / 改 / 清空排行榜資料**：**Storage & Databases → Durable Objects** → 選到 `Leaderboard` namespace → **Data Studio**。
   - 可用表格/SQL 瀏覽、編輯、刪除資料（只有 SQLite-backed DO 能用 Data Studio）。
   - 適合：賽後查成績、手動修正某筆、活動前**清空重置**排行榜。
4. **鎖定來源（CORS）**：要只允許自家網域，回方式 A 把 `worker.js` 的 `CORS` 由 `'*'` 改成你的網址後重新 `wrangler deploy`。

---

## 把網址填進前端

打開專案的 [`config.js`](./config.js)，把網址填進 `baseUrl`（**結尾不要加斜線**）：

```js
window.EHS_CONFIG = {
    api: {
        baseUrl: "https://ehs-leaderboard.your-name.workers.dev",
    },
};
```

---

## 驗證

1. 用瀏覽器開 `index.html`，完成一次測驗並提交：
   - F12 Console 應出現 `✅ 已透過後端 API 寫入成績`。
2. 直接打 API 也能測（把網址換成你的）：
   - 讀取：瀏覽器開 `https://你的網址/leaderboard` → 應看到 JSON 陣列。
3. 回首頁點 **排行榜**，或開 `leaderboard.html`：
   - Console 應出現 `✅ 已從後端讀取 N 筆排行榜資料`，表格顯示成績（分數高、用時短優先）。

---

## 技術備註

- **無競態**：所有寫入都導向同一個 DO 實例（`idFromName('global')`），請求序列化處理；DO 儲存的 input gate 保證讀-改-寫不交錯，多人同時交卷也不會掉資料。
- **強一致性**：DO 儲存讀到的一定是最新值（不像 KV 最終一致）。前端 `computeRank()` 仍會把剛送出的這筆併入排序，網路延遲下名次顯示也穩定。
- **CORS**：Worker 回傳 `Access-Control-Allow-Origin: *`，前端能讀到回應、由 HTTP 狀態碼判斷成敗。要鎖網域就把 `worker.js` 裡 `CORS` 的 `'*'` 換成你的網址。
- **時間欄位**：以「秒（浮點數）」存入，顯示時格式化為 `mm:ss.xx`。
- **吞吐**：單一全域 DO 的寫入有上限（每秒數百筆），內部活動規模綽綽有餘。
- **防灌水（選用）**：`/submit` 目前公開可寫，適合內部活動。如需更嚴格，可在 `worker.js` 加：工號白名單、共用密鑰（前端帶自訂 header 比對）、分數/時間合理範圍檢查、或簡易限流。
- **從舊 KV 版遷移**：DO 用獨立儲存，部署後排行榜會從空白開始（舊 KV 測試資料不會帶過來）。如需保留舊資料，可寫一次性匯入腳本把 KV 內容寫入 DO。
