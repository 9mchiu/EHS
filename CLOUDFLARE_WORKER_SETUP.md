# Cloudflare Worker + Durable Object 排行榜 部署教學

本專案的成績資料用 **Cloudflare Worker（迷你後端）+ Durable Object（DO）** 儲存，且**計分由後端負責**（前端拿不到答案、也算不出分數，避免使用者竄改成績）：

- **開始**：進測驗時 `POST {baseUrl}/start`（`{ id }`）→ 後端回一組**簽章 token**，內含伺服器端的開始時間。
- **交卷**：`POST {baseUrl}/submit`（`{ token, answers }`）→ 後端用 token 內時間算「用時」、用 `env.ANSWER_KEY` 算「分數」，**一律忽略前端送來的分數/時間**，回傳 `{ score, time, rank, answerKey }`。
- **讀取**：排行榜 `GET {baseUrl}/leaderboard` → 回傳排序後的 JSON。
- **退路**：`config.js` 的 `api.baseUrl` 留空時，自動退回瀏覽器 `localStorage`（**離線試玩用，無防作弊、也無法算分**）。

後端程式在 [`worker/worker.js`](./worker/worker.js)，設定在 [`worker/wrangler.toml`](./worker/wrangler.toml)。

> **🔑 為什麼答案要放 Cloudflare secret、不寫進程式碼？**
> 本專案原始碼在**公開 GitHub repo**（GitHub Pages）。若把正確答案寫進 `worker.js` 或 `game.js`，答案等於公開在 GitHub 上。
> 因此**正確答案表 `ANSWER_KEY` 與簽章密鑰 `GAME_SECRET` 一律用 Cloudflare Worker secret 設定**（見下方「設定 secret」），這些值不進 git、只存在 Cloudflare。

> **防作弊三道防線**（皆在後端）：
> 1. 答案只在 `env.ANSWER_KEY` → 前端偽造分數無效（後端只認自己算的）。
> 2. 用時由伺服器算（token 夾帶開始時間、HMAC 簽章防竄改）→ 前端送 `time` 無效。
> 3. 一工號只計分一次（first-write-wins）+ 用時下限檢查 → 擋「反覆送答案試出正解再刷分」。

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

**一工號只計分一次**：第一次交卷即定案，之後同工號再交卷會被擋（回 409），不覆蓋、不刷分。

---

## 設定 secret（必做，否則後端會回 500）

計分需要兩個 secret，都用 wrangler 設定（值不會進 git）。在 `worker/` 目錄下：

```bash
cd worker

# 1. 簽章密鑰：隨機字串即可（建議 32 字以上）。用來簽 /start 發的 token，防止竄改開始時間。
npx wrangler secret put GAME_SECRET
# 貼上你自己產生的隨機字串，例如用 `openssl rand -hex 32` 產生

# 2. 正確答案表：JSON 字串，key = 題目 id、value = 正確選項 index（0 起算）。
npx wrangler secret put ANSWER_KEY
# 貼上下面這一整行 JSON（對應目前 game.js 的 10 題）：
```

目前題庫的答案（貼給 `ANSWER_KEY`）：

```json
{"1":2,"2":2,"3":2,"4":3,"5":0,"6":0,"7":1,"8":2,"9":0,"10":3}
```

> ⚠️ **改題目時記得同步更新 `ANSWER_KEY`**：`game.js` 的題目 `id` 與這裡的 key 要對得起來，value 是該題正確選項的索引（第一個選項為 `0`）。改完重跑 `npx wrangler secret put ANSWER_KEY` 覆蓋即可，不必重新 deploy。

> secret 也可在後台設定：Worker 頁 → **Settings → Variables and Secrets → Add**（型別選 *Secret*）。

---

## 方式 A：用 wrangler 部署（建立 DO 必用，推薦）

> ⚠️ 為什麼 DO 沒有「純後台點一點」的部署法？
> SQLite-backed Durable Object 的**類別必須在「初次部署」時透過 wrangler 的 migration（`new_sqlite_classes`）建立**，且官方規定「不能對既有的 DO 類別事後改成 SQLite」。後台無法可靠地完成這個初次建立，所以 **DO 的第一次部署一定要用 wrangler**（之後的維護、查資料可以在後台做，見方式 B）。需先安裝 Node.js。

> ❌ **不需要建立 KV namespace**：DO 版用 Durable Object 儲存，**不要**再跑 `wrangler kv namespace create`。
> 若你照舊教學跑了它、看到 `A KV namespace with the title "EHS" already exists`，忽略即可，不影響部署。

在 `worker/` 目錄下操作：

```bash
cd worker

# 1. 登入 Cloudflare（會開瀏覽器授權）
npx wrangler login

# 2. 部署（會自動套用 wrangler.toml 內的 DO 綁定與 migration；不需先建任何資源）
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
   - F12 Console 應出現 `✅ 已交卷，後端回傳成績`。
   - 結果頁的分數/名次來自後端；若看到「成績送出失敗」或「無法開始測驗」，多半是 `GAME_SECRET` / `ANSWER_KEY` 未設定（後端回 500）。
2. 直接打 API 也能測（把網址換成你的）：
   - 讀取：瀏覽器開 `https://你的網址/leaderboard` → 應看到 JSON 陣列。
   - 驗證偽造無效：直接 `curl -X POST .../submit -d '{"answers":{}}'` 會被擋（`token 無效`），送假分數也沒用（後端只認自己算的）。
3. 回首頁點 **排行榜**，或開 `leaderboard.html`：
   - Console 應出現 `✅ 已從後端讀取 N 筆排行榜資料`，表格顯示成績（分數高、用時短優先）。

---

## 技術備註

- **無競態**：所有寫入都導向同一個 DO 實例（`idFromName('global')`），請求序列化處理；DO 儲存的 input gate 保證讀-改-寫不交錯，多人同時交卷也不會掉資料。
- **強一致性**：DO 儲存讀到的一定是最新值（不像 KV 最終一致）。前端 `computeRank()` 仍會把剛送出的這筆併入排序，網路延遲下名次顯示也穩定。
- **CORS**：Worker 回傳 `Access-Control-Allow-Origin: *`，前端能讀到回應、由 HTTP 狀態碼判斷成敗。要鎖網域就把 `worker.js` 裡 `CORS` 的 `'*'` 換成你的網址。
- **時間欄位**：以「秒（浮點數）」存入，顯示時格式化為 `mm:ss.xx`。
- **吞吐**：單一全域 DO 的寫入有上限（每秒數百筆），內部活動規模綽綽有餘。
- **防作弊**：計分已改由後端負責（答案在 `env.ANSWER_KEY`、用時由伺服器算、一工號一次），前端無法竄改成績。調整參數在 `worker.js` 上方：`POINTS_PER_QUESTION`（每題分數）、`MIN_SECONDS`（用時下限，短於此視為偽造）、`MAX_SECONDS`（token 逾時）。
- **殘留風險（可接受）**：交卷後後端會回傳 `answerKey` 供「錯題回顧」顯示正確答案。理論上有人可用一組工號送隨機答案換取答案表——但那組工號的成績即定案（first-write-wins）無法再刷分，且答案本就是訓練教材、非機密。若要更嚴格可改為不回傳 `answerKey`（會關閉錯題回顧顯示正確答案的功能）。
- **要更嚴格**：可再加工號白名單、鎖 CORS 來源網域（把 `worker.js` 的 `CORS` `'*'` 換成你的 `*.github.io` 網址）。
- **從舊 KV 版遷移**：DO 用獨立儲存，部署後排行榜會從空白開始（舊 KV 測試資料不會帶過來）。如需保留舊資料，可寫一次性匯入腳本把 KV 內容寫入 DO。
