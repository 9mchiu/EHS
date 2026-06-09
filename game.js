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
        ],
        correct: 2
    }
];

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎮 EHS Game Initialized');
    bindEventListeners();
    showPage('home-page');
});

// ===================== EVENT BINDING =====================
function bindEventListeners() {
    document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);

    // ✅ 排行榜按鈕：開啟另一個排行榜網頁
    document.getElementById('btn-leaderboard').addEventListener('click', openLeaderboardPage);

    document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
    document.getElementById('btn-schedule').addEventListener('click', openScheduleModal);

    document.getElementById('btn-schedule-close').addEventListener('click', closeScheduleModal);
    document.getElementById('schedule-modal').addEventListener('click', function (e) {
        if (e.target === this) closeScheduleModal();
    });

    document.getElementById('btn-agree-start').addEventListener('click', beginQuiz);
    document.getElementById('btn-confirm-employee').addEventListener('click', confirmEmployeeId);

    document.getElementById('btn-close-quiz').addEventListener('click', closeQuiz);
    document.getElementById('btn-prev-page').addEventListener('click', previousQuizPage);
    document.getElementById('btn-next-page').addEventListener('click', nextQuizPage);
    document.getElementById('btn-submit-quiz').addEventListener('click', submitQuiz);

    const btnBackHome = document.getElementById('btn-back-home');
    if (btnBackHome) btnBackHome.addEventListener('click', backToHome);

    document.getElementById('btn-modal-close').addEventListener('click', closeCharacterModal);
    document.querySelectorAll('.character-hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', function () {
            openCharacterModal(this.dataset.character);
        });
    });
    document.getElementById('character-modal').addEventListener('click', function (e) {
        if (e.target === this) closeCharacterModal();
    });

    const btnMsgOk = document.getElementById('msg-popup-ok');
    if (btnMsgOk) btnMsgOk.addEventListener('click', closeMsgPopup);
}

// ===================== PAGE NAVIGATION =====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        gameState.currentPage = pageId;
        console.log(`📄 已切換至頁面: ${pageId}`);
    }
}

// ===================== 排行榜：開啟外部網頁 =====================
/**
 * ✅ 點擊排行榜按鈕後，開啟獨立的排行榜網頁（新分頁）
 */
function openLeaderboardPage() {
    window.open(LEADERBOARD_PAGE_URL, '_blank');
}

// ===================== Google Apps Script 整合 =====================
/**
 * ✅ 寫入成績到 Google Sheet（透過 Google Apps Script Web App）
 * @param {object} entry - 成績資料
 */
function writeToGoogleSheet(entry) {
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('YOUR_SCRIPT_ID')) {
        console.warn('⚠️ 尚未設定 Google Apps Script URL，跳過雲端寫入');
        return;
    }

    const params = new URLSearchParams({
        action: 'write',
        id: entry.id,
        score: entry.score,
        time: entry.time,
        timeStr: entry.timeStr,
        date: entry.date
    });

    fetch(`${GAS_WEB_APP_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'  // Google Apps Script 需要 no-cors
    })
    .then(() => {
        console.log('✅ 成績已送出至 Google Sheet');
    })
    .catch(err => {
        console.warn('⚠️ Google Sheet 寫入錯誤:', err);
    });
}

// ===================== POPUP SYSTEM =====================
function showConfirmPopup(message, onConfirm, onCancel) {
    const popup = document.getElementById('popup-modal');
    const text = document.getElementById('popup-text');
    const btnConfirm = document.getElementById('popup-confirm');
    const btnCancel = document.getElementById('popup-cancel');

    text.innerText = message;
    popup.classList.remove('hidden');

    btnConfirm.onclick = null;
    btnCancel.onclick = null;

    btnConfirm.onclick = function () { closeConfirmPopup(); if (onConfirm) onConfirm(); };
    btnCancel.onclick = function () { closeConfirmPopup(); if (onCancel) onCancel(); };
}

function closeConfirmPopup() {
    const popup = document.getElementById('popup-modal');
    if (popup) popup.classList.add('hidden');
}

function closePopup() { closeConfirmPopup(); }

function showPopup(message, icon) {
    const msgPopup = document.getElementById('msg-popup');
    const msgText = document.getElementById('msg-popup-text');
    if (!msgPopup || !msgText) { alert(message); return; }
    msgText.innerHTML = message.replace(/\n/g, '<br>');
    const iconEl = msgPopup.querySelector('.msg-popup-icon');
    if (iconEl && icon) iconEl.textContent = icon;
    msgPopup.classList.remove('hidden');
}

function closeMsgPopup() {
    const msgPopup = document.getElementById('msg-popup');
    if (msgPopup) msgPopup.classList.add('hidden');
}

// ===================== QUIZ FLOW =====================
function startQuiz() {
    showPage('game-rules-page');
}

function beginQuiz() {
    // 顯示工號輸入
    const modal = document.getElementById('employee-modal');
    if (modal) modal.classList.add('active');
}

function confirmEmployeeId() {
    const input = document.getElementById('employee-id-input');
    const id = input ? input.value.trim() : '';
    if (!id) {
        showPopup('請輸入工號\nPlease enter Employee ID', '⚠️');
        return;
    }
    gameState.employeeId = id;
    const modal = document.getElementById('employee-modal');
    if (modal) modal.classList.remove('active');

    // 初始化測驗
    gameState.answers = {};
    gameState.score = 0;
    gameState.currentQuizPage = 1;
    gameState.alreadySubmitted = false;
    gameState.quizStarted = true;
    gameState.quizActive = true;
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;

    renderQuizPage();
    showPage('quiz-page');
    startTimer();
}

function renderQuizPage() {
    const container = document.getElementById('questions-container');
    if (!container) return;
    container.innerHTML = '';

    const page = gameState.currentQuizPage;
    const perPage = Math.ceil(quizQuestions.length / gameState.totalQuizPages);
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, quizQuestions.length);
    const pageQuestions = quizQuestions.slice(start, end);

    pageQuestions.forEach((q) => {
        const block = document.createElement('div');
        block.className = 'question-block';
        block.innerHTML = `
            <div class="question-number">Q${q.id}</div>
            <div class="question-text">${q.text}</div>
            <div class="question-text-en">${q.textEn}</div>
            <div class="question-options">
                ${q.options.map((opt, i) => `
                    <div class="option">
                        <input type="radio" name="q${q.id}" id="q${q.id}_${i}" value="${i}"
                            ${gameState.answers[q.id] === i ? 'checked' : ''}>
                        <label for="q${q.id}_${i}">
                            <span class="option-text">${opt.text}</span>
                            <span class="option-text-en">${opt.textEn}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(block);

        // 記錄作答
        block.querySelectorAll(`input[name="q${q.id}"]`).forEach(radio => {
            radio.addEventListener('change', function () {
                gameState.answers[q.id] = parseInt(this.value);
            });
        });
    });

    // 更新頁碼與按鈕
    const indicator = document.getElementById('page-indicator');
    if (indicator) indicator.textContent = `${page} / ${gameState.totalQuizPages}`;

    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const btnSubmit = document.getElementById('btn-submit-quiz');

    if (btnPrev) btnPrev.style.display = page > 1 ? 'flex' : 'none';
    if (btnNext) btnNext.style.display = page < gameState.totalQuizPages ? 'flex' : 'none';
    if (btnSubmit) btnSubmit.style.display = page === gameState.totalQuizPages ? 'flex' : 'none';
}

function previousQuizPage() {
    if (gameState.currentQuizPage > 1) {
        gameState.currentQuizPage--;
        renderQuizPage();
    }
}

function nextQuizPage() {
    if (gameState.currentQuizPage < gameState.totalQuizPages) {
        gameState.currentQuizPage++;
        renderQuizPage();
    }
}

function submitQuiz() {
    if (gameState.alreadySubmitted) return;

    showConfirmPopup(
        '確定要提交測驗嗎?\nAre you sure you want to submit?',
        function () {
            gameState.alreadySubmitted = true;
            pauseTimer();

            // 計算分數
            const pointsPerQuestion = 50 / quizQuestions.length;
            let score = 0;
            quizQuestions.forEach(q => {
                if (gameState.answers[q.id] === q.correct) {
                    score += pointsPerQuestion;
                }
            });
            gameState.score = Math.round(score);

            const totalTime = gameState.elapsedTime / 1000;
            const min = Math.floor(totalTime / 60);
            const sec = Math.floor(totalTime % 60);
            const ms = Math.floor((totalTime % 1) * 100);
            const timeStr = String(min).padStart(2, '0') + ':' +
                            String(sec).padStart(2, '0') + '.' +
                            String(ms).padStart(2, '00');

            const newEntry = {
                id: gameState.employeeId || 'GUEST',
                score: gameState.score,
                time: totalTime,
                timeStr: timeStr,
                date: new Date().toLocaleString('zh-TW')
            };

            // ✅ 寫入 Google Sheet
            writeToGoogleSheet(newEntry);

            // 顯示結果（排名由排行榜頁面呈現，這裡僅顯示個人成績）
            showResultPopup(gameState.score, totalTime);
        },
        null
    );
}

// ===================== 結果彈跳視窗 =====================
function showResultPopup(score, time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    const timeStr = String(min).padStart(2, '0') + ':' +
                    String(sec).padStart(2, '0') + '.' +
                    String(ms).padStart(2, '00');

    document.getElementById('popup-result-score').textContent = `${score} / 50`;
    document.getElementById('popup-result-time').textContent = timeStr;

    // ✅ 排名改為提示開啟排行榜頁面查看
    const rankEl = document.getElementById('popup-result-rank');
    if (rankEl) rankEl.textContent = '請至排行榜頁面查看';

    const btnHome = document.getElementById('btn-result-home');
    const btnLB = document.getElementById('btn-result-leaderboard');
    btnHome.onclick = function () { closeResultPopup(); backToHome(); };

    // ✅ 結果頁排行榜按鈕 → 開啟排行榜網頁
    btnLB.onclick = function () { closeResultPopup(); openLeaderboardPage(); };

    document.getElementById('result-popup').classList.remove('hidden');
    console.log(`🏆 結果：分數${score}, 時間${timeStr}`);
}

function closeResultPopup() {
    const popup = document.getElementById('result-popup');
    if (popup) popup.classList.add('hidden');
}

// ===================== 關閉測驗 =====================
function closeQuiz() {
    pauseTimer();
    showConfirmPopup(
        '確定要離開測驗嗎？進度將不會被保存。\nAre you sure? Your progress will not be saved.',
        function () {
            gameState.quizActive = false;
            gameState.quizStarted = false;
            gameState.timerRunning = false;
            backToHome();
        },
        function () { resumeTimer(); }
    );
}

// ===================== CHARACTER MODAL =====================
function openCharacterModal(characterId) {
    const characterData = {
        1: { name: "消防安全", description: "消防安全宣導內容", image: "./ERC.png" },
        2: { name: "安全檢查", description: "安全檢查宣導內容", image: "./Safety.png" },
        3: { name: "環境保護", description: "環境保護宣導內容", image: "./Env.png" },
        4: { name: "製程管理", description: "製程管理宣導內容", image: "./PSM.png" },
        5: { name: "健康保健", description: "健康保健宣導內容", image: "./HC.png" }
    };
    const data = characterData[characterId];
    if (data) {
        document.getElementById('modal-character-name').textContent = data.name;
        document.getElementById('modal-character-description').textContent = data.description;
        document.getElementById('modal-image').src = data.image;
        document.getElementById('character-modal').classList.add('active');
    }
}

function closeCharacterModal() {
    document.getElementById('character-modal').classList.remove('active');
}

// ===================== SCHEDULE MODAL =====================
function openScheduleModal() {
    document.getElementById('schedule-modal').classList.add('active');
    console.log('📅 開啟活動日程表');
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.remove('active');
    console.log('❌ 關閉活動日程表');
}

// ===================== UTILITY =====================
function backToHome() {
    console.log('🏠 返回首頁');
    closeResultPopup();
    closeConfirmPopup();
    closeMsgPopup();
    gameState.quizStarted = false;
    gameState.quizActive = false;
    gameState.alreadySubmitted = false;
    gameState.currentQuizPage = 1;
    gameState.answers = {};
    gameState.score = 0;
    resetTimer();
    document.getElementById('score').textContent = '0 / 50';
    document.getElementById('timer').textContent = '00:00.00';
    showPage('home-page');
}

function downloadPDF() {
    const link = document.createElement('a');
    // 🔧 替換為實際 PDF 路徑
    link.href = './safety-guide.pdf';
    link.download = 'safety-guide.pdf';
    link.click();
}

// ===================== TIMER FUNCTIONS =====================
function startTimer() {
    const timerEl = document.getElementById('timer');
    if (gameState.timerRunning) return;
    gameState.timerRunning = true;
    gameState.timerInterval = setInterval(function () {
        if (gameState.quizActive) {
            const elapsed = Date.now() - gameState.startTime;
            gameState.elapsedTime = elapsed;
            const totalSec = Math.floor(elapsed / 1000);
            const min = Math.floor(totalSec / 60);
            const sec = totalSec % 60;
            const ms = Math.floor((elapsed % 1000) / 10);
            timerEl.textContent =
                String(min).padStart(2, '0') + ':' +
                String(sec).padStart(2, '0') + '.' +
                String(ms).padStart(2, '0');
        }
    }, 10);
}

function resetTimer() {
    if (gameState.timerInterval) { clearInterval(gameState.timerInterval); gameState.timerInterval = null; }
    gameState.timerRunning = false;
    gameState.elapsedTime = 0;
}

function pauseTimer() { gameState.quizActive = false; }

function resumeTimer() {
    if (!gameState.quizActive && gameState.startTime) {
        gameState.quizActive = true;
        gameState.startTime = Date.now() - gameState.elapsedTime;
        startTimer();
    }
}

// ===================== 背景音樂 =====================
function playBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if (audio) {
        audio.volume = 0.3;
        audio.play().catch(e => console.log('音樂播放需要使用者互動:', e));
    }
}

// ===================== DEBUG LOG =====================
console.log('🎮 EHS 互動式電腦線上遊戲 - 代碼已加載');
console.log('✅ 使用 Google Sheets + Apps Script 作為跨裝置成績儲存');
console.log('📋 Popup：確認型(popup-modal) / 訊息型(msg-popup) / 結果型(result-popup)');
