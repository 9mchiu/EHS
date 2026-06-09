// ===================== GLOBAL VARIABLES =====================
let gameState = {
    currentPage: 'home',
    employeeId: null,
    quizStarted: false,
    quizActive: false,
    alreadySubmitted: false,
    currentQuizPage: 1,
    totalQuizPages: 5,
    answers: {},
    score: 0,
    startTime: null,
    elapsedTime: 0,
    timerRunning: false,
    timerInterval: null,
    leaderboard: [],  // ✅ 移除 localStorage 載入，改由 Google Sheet 管理
};

// ===================== Google Apps Script 設定區 =====================
// 🔧 請將下方 URL 替換為你部署的 Google Apps Script Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// 🔧 請將下方 URL 替換為你的排行榜網頁網址
const LEADERBOARD_PAGE_URL = 'leaderboard.html'; // 或填入完整網址如 'https://yoursite.com/leaderboard.html'

// ===================== 題目資料 =====================
const quizQuestions = [
    {
        id: 1,
        text: "下列何者是最重要的安全防護措施?",
        textEn: "Which of the following is the most important safety measure?",
        options: [
            { text: "正確戴著安全帽", textEn: "Wearing a hard hat correctly" },
            { text: "定期檢查設備", textEn: "Regular equipment inspection" },
            { text: "遵守操作規則", textEn: "Following operating procedures" },
            { text: "以上皆是", textEn: "All of the above" }
        ],
        correct: 3
    },
    {
        id: 2,
        text: "發生緊急情況時,應該立即通知誰?",
        textEn: "Who should be notified immediately in case of emergency?",
        options: [
            { text: "直屬主管", textEn: "Direct supervisor" },
            { text: "安全人員", textEn: "Safety personnel" },
            { text: "緊急聯絡人", textEn: "Emergency contact" },
            { text: "所有人員", textEn: "All personnel" }
        ],
        correct: 0
    },
    {
        id: 3,
        text: "個人防護裝備（PPE）應該在何時使用?",
        textEn: "When should Personal Protective Equipment (PPE) be used?",
        options: [
            { text: "工作開始前", textEn: "Before starting work" },
            { text: "工作進行中", textEn: "During work" },
            { text: "工作結束前", textEn: "Before work ends" },
            { text: "全程使用", textEn: "Throughout the entire process" }
        ],
        correct: 3
    },
    {
        id: 4,
        text: "在高空作業時，安全繩的檢查頻率應該是?",
        textEn: "How often should safety ropes be checked during high-altitude work?",
        options: [
            { text: "每週一次", textEn: "Once a week" },
            { text: "每月一次", textEn: "Once a month" },
            { text: "使用前檢查", textEn: "Before each use" },
            { text: "每季一次", textEn: "Once a quarter" }
        ],
        correct: 2
    },
    {
        id: 5,
        text: "工作場所噪音超過幾分貝需配戴防護具?",
        textEn: "At what decibel level is hearing protection required in the workplace?",
        options: [
            { text: "70 分貝", textEn: "70 decibels" },
            { text: "80 分貝", textEn: "80 decibels" },
            { text: "85 分貝", textEn: "85 decibels" },
            { text: "90 分貝", textEn: "90 decibels" }
console.log('📋 Popup：確認型(popup-modal) / 訊息型(msg-popup) / 結果型(result-popup)');
