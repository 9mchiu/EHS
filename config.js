// ===================== EHS 排行榜資料讀寫設定 =====================
// 成績「寫入」與排行榜「讀取」都透過 Cloudflare Worker（迷你後端）。
// 只要把下方 baseUrl 填成你的 Worker 網址，遊戲即會：
//   - 提交成績 → POST {baseUrl}/submit
//   - 讀排行榜 → GET  {baseUrl}/leaderboard
//
// 若維持預設（baseUrl 留空），系統會自動退回使用瀏覽器 localStorage（本機暫存），
// 仍可正常遊玩，只是成績不會同步到雲端。
//
// 部署步驟請見 CLOUDFLARE_WORKER_SETUP.md
// =============================================================

window.EHS_CONFIG = {
    api: {
        // 你的 Cloudflare Worker 網址（結尾不要加斜線）。
        // 取得方式：部署 Worker 後，於 Cloudflare 後台複製 *.workers.dev 網址。
        // 範例： https://ehs-leaderboard.your-name.workers.dev
        baseUrl: "https://young-mountain-58c6.charlychiu.workers.dev/",
    },
};
