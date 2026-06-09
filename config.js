// ===================== EHS 資料讀寫設定 =====================
// 此檔案集中管理「Google Form 寫入」與「Google Sheet 讀取」所需的設定。
// 填完下方欄位後，遊戲即會把成績寫進 Google 表單、並從試算表讀取排行榜。
// 若維持預設（未填寫），系統會自動退回使用瀏覽器 localStorage（本機暫存）。
//
// 設定步驟請見 GOOGLE_SHEET_SETUP.md
// =============================================================

window.EHS_CONFIG = {
    // ---------- 1. 寫入：Google 表單 ----------
    form: {
        // Google 表單的「送出」端點。
        // 取得方式：開啟表單 → 預覽(👁) → F12 → 找 <form action="..."> 的網址，
        // 結尾必須是 /formResponse（不是 /viewform）。
        // 範例： https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxxxxxx/formResponse
        actionUrl: "https://docs.google.com/forms/d/e/FORM_ID/formResponse",

        // 每個欄位對應的 entry 編號。
        // 取得方式：表單預覽頁 → F12 → 找每個 <input name="entry.123456789">。
        entries: {
            id:    "entry.1111111111", // 工號
            score: "entry.2222222222", // 分數
            time:  "entry.3333333333", // 用時（秒，數字）
            date:  "entry.4444444444", // 作答時間（文字）
        },
    },

    // ---------- 2. 讀取：Google 試算表 ----------
    sheet: {
        // 試算表 ID：網址 .../spreadsheets/d/【這一段】/edit 中間那串。
        // 試算表需設為「知道連結的任何人 → 檢視者」。
        id: "SHEET_ID",

        // 工作表（分頁）名稱，通常 Google 表單回應分頁叫「表單回應 1」。
        // 若留空字串則讀取第一個分頁。
        name: "表單回應 1",

        // 試算表「標題列(第一列)」每欄的文字，用來對應到程式欄位。
        // 請填成你試算表實際的欄位標題（大小寫不拘）。
        // 注意：Google 表單回應分頁第一欄通常是「時間戳記」，這裡不需要列出。
        columns: {
            id:    "工號",
            score: "分數",
            time:  "用時",
            date:  "作答時間",
        },
    },
};
