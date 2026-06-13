// ===================== GLOBAL VARIABLES =====================
// 遊戲狀態管理
let gameState = {
    currentPage: 'home',
    employeeId: null,
    quizStarted: false,
    quizActive: false,
    currentQuizPage: 1,
    totalQuizPages: 5,
    answers: {},
    score: 0,
    startTime: null,
    elapsedTime: 0,
    timerRunning: false,
    timerInterval: null,
    leaderboard: JSON.parse(localStorage.getItem('leaderboard')) || [],
};

// 後端 API（Cloudflare Worker）設定來自 config.js (window.EHS_CONFIG)

// 模擬題目資料 (之後可連接到後端API)
const quizQuestions = [
    {
        id: 1,
        text: "下列何者是最重要的安全防護措施？",
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
        text: "發生緊急情況時，應該立即通知誰？",
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
        text: "個人防護裝備(PPE)應該在何時使用？",
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
        text: "在高空作業時，安全繩的檢查頻率應該是？",
        textEn: "How often should safety ropes be checked during high-altitude work?",
        options: [
            { text: "每週一次", textEn: "Once a week" },
            { text: "每月一次", textEn: "Once a month" },
            { text: "使用前檢查", textEn: "Before each use" },
            { text: "每年一次", textEn: "Once a year" }
        ],
        correct: 2
    },
    {
        id: 5,
        text: "工作環境不安全時應該採取什麼行動？",
        textEn: "What action should be taken if the work environment is unsafe?",
        options: [
            { text: "繼續工作", textEn: "Continue working" },
            { text: "停止工作並報告", textEn: "Stop work and report" },
            { text: "自行修復", textEn: "Fix it yourself" },
            { text: "忽視問題", textEn: "Ignore the issue" }
        ],
        correct: 1
    },
    {
        id: 6,
        text: "安全訓練的主要目的是？",
        textEn: "What is the main purpose of safety training?",
        options: [
            { text: "滿足法規要求", textEn: "Meet regulatory requirements" },
            { text: "預防工作傷害", textEn: "Prevent workplace injuries" },
            { text: "提高工作效率", textEn: "Improve work efficiency" },
            { text: "降低成本", textEn: "Reduce costs" }
        ],
        correct: 1
    },
    {
        id: 7,
        text: "發現有毒物質洩漏時，應該首先？",
        textEn: "What should be done first when discovering a hazardous substance leak?",
        options: [
            { text: "清理洩漏物", textEn: "Clean up the spill" },
            { text: "疏散人員到安全地點", textEn: "Evacuate personnel to a safe location" },
            { text: "通知管理層", textEn: "Notify management" },
            { text: "查找原因", textEn: "Find the cause" }
        ],
        correct: 1
    },
    {
        id: 8,
        text: "工作場所消防安全的重要性是？",
        textEn: "What is the importance of workplace fire safety?",
        options: [
            { text: "保護財產", textEn: "Protect property" },
            { text: "保護人員生命安全", textEn: "Protect personnel lives" },
            { text: "維持營運", textEn: "Maintain operations" },
            { text: "滿足保險要求", textEn: "Meet insurance requirements" }
        ],
        correct: 1
    },
    {
        id: 9,
        text: "工作中感到不適時應該？",
        textEn: "What should be done if you feel unwell during work?",
        options: [
            { text: "繼續工作直到下班", textEn: "Continue working until end of shift" },
            { text: "立即報告主管", textEn: "Report to supervisor immediately" },
            { text: "自行決定是否就醫", textEn: "Decide yourself whether to see a doctor" },
            { text: "告訴同事", textEn: "Tell colleagues" }
        ],
        correct: 1
    },
    {
        id: 10,
        text: "定期安全檢查的頻率應為？",
        textEn: "What should be the frequency of regular safety inspections?",
        options: [
            { text: "每年一次", textEn: "Once a year" },
            { text: "每季一次", textEn: "Once a quarter" },
            { text: "每月至少一次", textEn: "At least once a month" },
            { text: "依組織規定", textEn: "As per organization policy" }
        ],
        correct: 3
    }
];

// 一頁兩題 → 依題數自動計算總頁數（避免日後改題數時錯位）
gameState.totalQuizPages = Math.ceil(quizQuestions.length / 2);

// 背景音樂檔路徑（留空字串 = 不播放）。要啟用就填音檔路徑，例如 './bgm.mp3'
const BG_MUSIC_SRC = '';

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 EHS Game Initialized');
    
    
    // 綁定所有事件監聽器
    bindEventListeners();
    
    // 初始化排行榜資料（僅在未啟用後端 API 時才載入示例資料，
    // 啟用後一律以後端為唯一資料來源）
    if (!isRemoteBackendEnabled() && gameState.leaderboard.length === 0) {
        loadSampleLeaderboardData();
    }
    
    // 顯示首頁
    showPage('home-page');
});

// ===================== EVENT BINDING FUNCTIONS =====================
/**
 * 綁定所有DOM事件監聽器
 */
function bindEventListeners() {
    // 首頁按鈕
    document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);
    document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboard);
    document.getElementById('btn-event-schedule').addEventListener('click', openEventModal);
    document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
    
    // 遊戲規則頁面按鈕
    document.getElementById('btn-agree-start').addEventListener('click', beginQuiz);
    document.getElementById('btn-close-rules').addEventListener('click', backToHome);
    // 輸入工號
    document.getElementById('btn-confirm-employee').addEventListener('click', confirmEmployeeId);
    // 測驗頁面按鈕
    document.getElementById('btn-close-quiz').addEventListener('click', closeQuiz);
    document.getElementById('btn-prev-page').addEventListener('click', previousQuizPage);
    document.getElementById('btn-next-page').addEventListener('click', nextQuizPage);
    document.getElementById('btn-submit-quiz').addEventListener('click', submitQuiz);
    
    // 結果頁面按鈕
    document.getElementById('btn-back-home').addEventListener('click', backToHome);
    
    // 排行榜頁面按鈕
    document.getElementById('btn-search').addEventListener('click', searchLeaderboard);
    document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
    document.getElementById('btn-back-from-leaderboard').addEventListener('click', backToHome);
    document.getElementById('search-rank').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLeaderboard();
        }
    });
    
    // 模態框關閉按鈕
    document.getElementById('btn-close-event-modal')
        .addEventListener('click', closeEventModal);

    document.getElementById('event-modal')
        .addEventListener('click', function(e) {
            if (e.target === this) {
                closeEventModal();
            }
        });
    document.getElementById('btn-modal-close').addEventListener('click', closeCharacterModal);

    // 角色視窗左右切換（中文版 / 英文版）
    document.getElementById('btn-modal-prev').addEventListener('click', showPrevModalImage);
    document.getElementById('btn-modal-next').addEventListener('click', showNextModalImage);

    // 角色熱區點擊事件
    document.querySelectorAll('.character-hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', function() {
            const characterId = this.dataset.character;
            openCharacterModal(characterId);
        });
    });
    
    // 點擊模態框背景時關閉
    document.getElementById('character-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCharacterModal();
        }
    });
}

// ===================== PAGE NAVIGATION FUNCTIONS =====================
/**
 * 顯示指定頁面
 * @param {string} pageId - 頁面ID
 */
function showPage(pageId) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 顯示指定頁面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        gameState.currentPage = pageId;
        console.log(`📄 已切換至頁面: ${pageId}`);
    }
}

// ===================== HOME PAGE FUNCTIONS =====================
/**
 * 下載PDF文件
 */
function downloadPDF() {
    console.log('📥 下載PDF: 宣導內容(all)');
    // 實現：創建一個指向PDF的下載連結
    // 這裡需要替換為實際的PDF檔案路徑
    const link = document.createElement('a');
    link.href = './EHS-guidelines.pdf';
    link.download = 'EHS sharing contents(all).pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 開始測驗流程
 */
function startQuiz() {
    console.log('🎬 使用者點擊「開始測驗」');
    gameState.quizStarted = true;
    showPage('game-rules-page');
    playBackgroundMusic();
}

/**
 * 開始計時並顯示第一頁題目
 */
function beginQuiz() {
    console.log('✅ 使用者同意規則 → 開啟工號輸入');

    const modal = document.getElementById('employee-modal');
    modal.classList.add('active');
}

function confirmEmployeeId() {
    const input = document.getElementById('employee-id-input');
    const id = input.value.trim();

    if (!id) {
        alert('請輸入工號');
        return;
    }

    gameState.employeeId = id;

    // 關閉 modal
    document.getElementById('employee-modal').classList.remove('active');

    // 👉 這裡才開始遊戲
    startQuizAfterEmployee();
}

function startQuizAfterEmployee() {
    console.log('🎬 開始測驗（正式）');

    gameState.quizActive = true;
    gameState.startTime = Date.now();
    gameState.currentQuizPage = 1;
    gameState.answers = {};
    gameState.score = 0;

    renderQuizQuestions();
    updateProgress(); // 重置側欄作答進度為 0
    showPage('quiz-page');

    // 🔥 只有這裡才啟動 timer
    startTimer();
}

function resetTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    gameState.timerRunning = false;
}

// ===================== QUIZ FUNCTIONS =====================
/**
 * 啟動計時器
 */
function startTimer() {
    const timerElement = document.getElementById('timer');

    // 🔒 防止重複啟動
    if (gameState.timerRunning) return;

    gameState.timerRunning = true;

    gameState.timerInterval = setInterval(function () {
        if (gameState.quizActive) {
            const elapsed = Date.now() - gameState.startTime;
            gameState.elapsedTime = elapsed;

            const totalSeconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const milliseconds = Math.floor((elapsed % 1000) / 10);

            timerElement.textContent =
                String(minutes).padStart(2, '0') + ':' +
                String(seconds).padStart(2, '0') + '.' +
                String(milliseconds).padStart(2, '0');
        }
    }, 10);
}

/**
 * 渲染測驗題目（一頁兩題）
 */
function renderQuizQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    // 計算當前頁面顯示的題目索引
    const startIndex = (gameState.currentQuizPage - 1) * 2;
    const endIndex = Math.min(startIndex + 2, quizQuestions.length);
    
    // 顯示題目
    for (let i = startIndex; i < endIndex; i++) {
        const question = quizQuestions[i];
        const questionBlock = createQuestionElement(question, i + 1);
        container.appendChild(questionBlock);
    }
    
    // 更新頁面指示器
    document.getElementById('page-number').textContent = gameState.currentQuizPage;
    document.getElementById('total-pages').textContent = gameState.totalQuizPages;
    
    // 更新導航按鈕狀態
    updateNavigationButtons();
}

/**
 * 創建題目元素
 * @param {object} question - 題目資料
 * @param {number} questionNumber - 題號
 * @returns {HTMLElement}
 */
function createQuestionElement(question, questionNumber) {
    const block = document.createElement('div');
    block.className = 'question-block';
    
    let optionsHTML = '';
    question.options.forEach((option, index) => {
        const isChecked = gameState.answers[question.id] === index ? 'checked' : '';
        optionsHTML += `
            <label class="option">
                <input type="radio" name="question-${question.id}" value="${index}" ${isChecked}>
                <span class="option-text">${String.fromCharCode(65 + index)}. ${option.text}</span>
                <span class="option-text-en">${option.textEn}</span>
            </label>
        `;
    });
    
    block.innerHTML = `
        <div class="question-number">第 ${questionNumber} 題 / Question ${questionNumber}</div>
        <div class="question-text">${question.text}</div>
        <div class="question-text-en">${question.textEn}</div>
        <div class="question-options">
            ${optionsHTML}
        </div>
    `;
    
    // 綁定選項變更事件
    block.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const questionId = parseInt(this.name.split('-')[1]);
            gameState.answers[questionId] = parseInt(this.value);

            // 只更新「作答進度」，不即時計分（避免盯著分數反推答案作弊）
            updateProgress();
        });
    });
    
    return block;
}



/**
 * 計算目前總分（純計算、不更新畫面）。
 * 作答期間不顯示分數，避免玩家盯著分數變化反推正確答案。
 * @returns {number} 總分
 */
function calculateScore() {
    let score = 0;
    quizQuestions.forEach(question => {
        if (gameState.answers[question.id] === question.correct) {
            score += 5;
        }
    });
    gameState.score = score;
    return score;
}

/**
 * 更新側欄「作答進度」（已作答題數 / 總題數），不洩漏分數。
 */
function updateProgress() {
    const answered = quizQuestions.filter(
        q => gameState.answers[q.id] !== undefined
    ).length;
    const el = document.getElementById('score');
    if (el) el.textContent = `${answered} / ${quizQuestions.length}`;
}

/**
 * 更新導航按鈕狀態
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    const submitBtn = document.getElementById('btn-submit-quiz');

    const isFirst = gameState.currentQuizPage === 1;
    const isLast = gameState.currentQuizPage === gameState.totalQuizPages;

    prevBtn.disabled = isFirst;

    // 最後一頁才顯示「提交」，其餘頁顯示「下一頁」
    nextBtn.style.display = isLast ? 'none' : '';
    if (submitBtn) submitBtn.style.display = isLast ? '' : 'none';
}

/**
 * 上一頁
 */
function previousQuizPage() {
    if (gameState.currentQuizPage > 1) {
        gameState.currentQuizPage--;
        renderQuizQuestions();
        document.getElementById('questions-container').scrollTop = 0;
    }
}

/**
 * 下一頁
 */
function nextQuizPage() {
    if (gameState.currentQuizPage < gameState.totalQuizPages) {
        gameState.currentQuizPage++;
        renderQuizQuestions();
        document.getElementById('questions-container').scrollTop = 0;
    }
}

/**
 * 提交測驗
 */
async function submitQuiz() {
    console.log('📤 提交測驗');

    // 檢查是否每題都已作答
    const unanswered = quizQuestions.filter(
        q => gameState.answers[q.id] === undefined
    );
    if (unanswered.length > 0) {
        showPopup(
            `還有 ${unanswered.length} 題未作答，請全部作答後再提交。\n` +
            `You still have ${unanswered.length} unanswered question(s).`
        );
        return;
    }

    gameState.quizActive = false;
    resetTimer(); // 停止計時器（避免閒置 interval 持續觸發）
    calculateScore(); // 交卷時才真正計分

    const totalTime = gameState.elapsedTime / 1000;

    const newEntry = {
        id: gameState.employeeId,
        score: gameState.score,
        time: totalTime,
        date: new Date().toLocaleString('zh-TW')
    };

    // 本機備份（離線/讀取失敗時的後備）
    gameState.leaderboard.push(newEntry);
    gameState.leaderboard.sort((a, b) => (b.score - a.score) || (a.time - b.time));
    localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));

    // 透過後端 API 寫入（fire-and-forget）
    submitToRemote(newEntry);

    // 計算名次（優先以後端全體資料為準）
    const rank = await computeRank(newEntry);

    showQuizResult(gameState.score, totalTime, rank);
}

/**
 * 計算名次：若已啟用後端 API，用後端全體資料併入本次成績後排序；
 * 否則用本機資料。
 * @param {{id:string, score:number, time:number}} entry
 * @returns {Promise<number>} 名次（1 起算）
 */
async function computeRank(entry) {
    let board = gameState.leaderboard;

    if (isRemoteBackendEnabled()) {
        const remote = await fetchLeaderboardFromRemote();
        if (remote) {
            board = remote.slice();
            // 後端（KV 邊緣節點）可能還沒同步剛送出的這筆 → 手動併入再排序
            const exists = board.some(e =>
                e.id === entry.id &&
                Number(e.time) === Number(entry.time) &&
                Number(e.score) === Number(entry.score)
            );
            if (!exists) board.push(entry);
            board.sort((a, b) => (b.score - a.score) || (a.time - b.time));
        }
    }

    const rank = board.findIndex(e =>
        e.id === entry.id &&
        Number(e.time) === Number(entry.time) &&
        Number(e.score) === Number(entry.score)
    ) + 1;

    return rank > 0 ? rank : board.length;
}

    
function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 100);

    return (
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0')
    );
}

/**
 * 關閉測驗 (點擊X按鈕)
 */
function closeQuiz() {

    // 🟡 進入暫停狀態（停止計時更新）
    pauseTimer();

    showConfirmPopup(
        '確定要離開測驗嗎？進度將不會被保存。/ Are you sure? Your progress will not be saved.',
        
        // ✅ 確認離開
        function () {
            gameState.quizActive = false;
            gameState.quizStarted = false;
            gameState.timerRunning = false;
            backToHome();
        },

        // ❌ 取消 → 繼續遊戲
        function () {
            resumeTimer();
        }
    );
}

/**
 * 顯示測驗結果
 * @param {number} score - 分數
 * @param {number} time - 用時(秒)
 * @param {number} rank - 排名
 */
function showQuizResult(score, time, rank) {
    // 更新結果顯示
    document.getElementById('result-score').textContent = `${score} / 50`;
    document.getElementById('result-time').textContent = formatTime(time);
    document.getElementById('result-rank').textContent = `#${rank}`;
    
    // 顯示結果頁面
    showPage('quiz-result-page');
}

// ===================== LEADERBOARD FUNCTIONS =====================
/**
 * 顯示排行榜
 */
async function showLeaderboard() {
    console.log('📊 開啟排行榜');

    showPage('leaderboard-page');

    if (isRemoteBackendEnabled()) {
        // 後端 API 為唯一資料來源
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="4" style="text-align:center;color:#999;">讀取中… / Loading…</td></tr>';
        }

        const remote = await fetchLeaderboardFromRemote();
        if (remote) {
            // 讀取成功（即使 0 筆也以後端為準）
            gameState.leaderboard = remote;
        } else {
            console.warn('⚠️ 讀取後端失敗，暫時顯示本機資料');
        }
        renderLeaderboardTable();
    } else {
        // 未設定後端 API：使用本機資料
        renderLeaderboardTable();
    }
}

/**
 * 渲染排行榜表格
 */
function renderLeaderboardTable() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    gameState.leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');

        // 使用 textContent 而非 innerHTML，避免工號/日期含 HTML 造成 XSS
        const cells = [
            String(index + 1),
            entry.id,
            `${entry.score} / 50`,
            formatTime(entry.time),
        ];

        cells.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
}

/**
 * 搜尋排行榜
 */
function searchLeaderboard() {
    const searchInput = document.getElementById('search-rank').value.trim();
    
    if (!searchInput) {
        showPopup('請輸入工號 / Please enter Employee ID');
        return;
    }
    
    const foundIndex = gameState.leaderboard.findIndex(entry => entry.id === searchInput);
    
    if (foundIndex !== -1) {
        showPopup(
    `您的排名是第 ${foundIndex + 1} 名 / Your rank is #${foundIndex + 1}`,
        function () {
            showPage('leaderboard-page'); // 確保回到排行榜
        }
    );
    } else {
        showPopup('未找到相關記錄 / No record found');
    }
    
}

/**
 * 匯出排行榜為Excel/CSV格式
 * 支援格式：Excel (.xlsx) 或 CSV (.csv)
 */
function exportToExcel() {
    console.log('📥 匯出排行榜資料');
    
    if (gameState.leaderboard.length === 0) {
        showPopup('目前沒有排行榜資料可匯出 / No leaderboard data to export');
        return;
    }
    
    // 準備CSV資料
    let csvContent = '排行,工號,分數,時間,日期\n';
    csvContent += 'Rank,Employee ID,Score,Time,Date\n';
    
    // 跳脫 CSV 內的雙引號（"" 代表一個 "），避免工號/日期含引號破壞欄位
    const csvCell = v => String(v == null ? '' : v).replace(/"/g, '""');

    gameState.leaderboard.forEach((entry, index) => {
        const timeStr = formatTime(entry.time);
        csvContent += `${index + 1},"${csvCell(entry.id)}","${entry.score}/50","${timeStr}","${csvCell(entry.date)}"\n`;
    });
    
    // 建立下載連結
    // 前置 UTF-8 BOM（﻿），讓 Excel 正確辨識編碼，避免中文亂碼
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `EHS-Leaderboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ 排行榜已匯出為CSV格式');
}

// ===================== EVENT MODAL FUNCTIONS =====================

function openEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.add('active');
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('active');
}

// ===================== CHARACTER MODAL FUNCTIONS =====================

// 角色視窗目前的圖片清單與索引（每個角色含中文版 + 英文版，可左右切換）
let modalImages = [];
let modalImageIndex = 0;

/**
 * 打開角色資訊視窗
 * @param {number} characterId - 角色ID
 */
function openCharacterModal(characterId) {
    // 每個角色對應兩張 16:9 圖片：[中文版, 英文版]
    const characterImages = {
        1: ['./ERC.png', './ERC_ENG.png'],       // 消防安全
        2: ['./Safety.png', './Safety_ENG.png'],  // 安全檢查
        3: ['./Env.png', './Env_ENG.png'],        // 環境保護
        4: ['./PSM.png', './PSM_ENG.png'],        // 製程管理
        5: ['./HC.png', './HC_ENG.png'],          // 健康保健
    };

    const images = characterImages[characterId];
    if (!images) return;

    modalImages = images;
    modalImageIndex = 0;
    renderModalImage();

    const modal = document.getElementById('character-modal');
    modal.classList.add('active');
    console.log(`🎭 打開角色視窗: 角色 ${characterId}`);
}

/**
 * 依目前索引渲染角色視窗圖片，並更新頁碼與切換鈕顯示。
 */
function renderModalImage() {
    if (modalImages.length === 0) return;

    const modalImage = document.getElementById('modal-image');
    if (modalImage) modalImage.src = modalImages[modalImageIndex];

    const indexEl = document.getElementById('modal-image-index');
    const totalEl = document.getElementById('modal-image-total');
    if (indexEl) indexEl.textContent = String(modalImageIndex + 1);
    if (totalEl) totalEl.textContent = String(modalImages.length);

    // 只有一張圖時，隱藏左右切換鈕與頁碼
    const showNav = modalImages.length > 1;
    ['btn-modal-prev', 'btn-modal-next'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = showNav ? '' : 'none';
    });
    const indicator = document.querySelector('.modal-indicator');
    if (indicator) indicator.style.display = showNav ? '' : 'none';
}

/**
 * 切換到上一張圖片（循環）。
 */
function showPrevModalImage() {
    if (modalImages.length === 0) return;
    modalImageIndex = (modalImageIndex - 1 + modalImages.length) % modalImages.length;
    renderModalImage();
}

/**
 * 切換到下一張圖片（循環）。
 */
function showNextModalImage() {
    if (modalImages.length === 0) return;
    modalImageIndex = (modalImageIndex + 1) % modalImages.length;
    renderModalImage();
}

/**
 * 關閉角色資訊視窗
 */
function closeCharacterModal() {
    const modal = document.getElementById('character-modal');
    modal.classList.remove('active');
}

// ===================== UTILITY FUNCTIONS =====================

/**
 * 返回首頁
 */
function backToHome() {
    gameState.quizStarted = false;
    gameState.quizActive = false;
    gameState.currentQuizPage = 1;
    gameState.answers = {};
    gameState.score = 0;
    resetTimer();
    stopBackgroundMusic();
    document.getElementById('score').textContent = `0 / ${quizQuestions.length}`;
    document.getElementById('timer').textContent = '00:00.00';
    showPage('home-page');
}

// ===================== BACKGROUND MUSIC =====================
/**
 * 播放背景音樂。需在 BG_MUSIC_SRC 設定音檔路徑才會播放；
 * 未設定則靜默略過，瀏覽器自動播放被拒時也以 catch 吞掉。
 */
function playBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if (!audio) return;

    if (BG_MUSIC_SRC && !audio.getAttribute('src')) {
        audio.src = BG_MUSIC_SRC;
    }
    if (!audio.getAttribute('src')) return; // 尚未設定音檔，略過

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
        p.catch(() => console.info('ℹ️ 背景音樂需使用者互動後才能播放'));
    }
}

/**
 * 停止背景音樂並歸零。
 */
function stopBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
}

/**
 * 加載示例排行榜資料 (用於演示)
 */
function loadSampleLeaderboardData() {
    gameState.leaderboard = [
        { id: 'EMP0001', score: 50, time: 120.50, date: '2026-06-07 10:30' },
        { id: 'EMP0002', score: 50, time: 125.30, date: '2026-06-07 10:25' },
        { id: 'EMP0003', score: 45, time: 145.20, date: '2026-06-07 10:20' },
        { id: 'EMP0004', score: 40, time: 180.15, date: '2026-06-07 10:15' },
        { id: 'EMP0005', score: 35, time: 200.80, date: '2026-06-07 10:10' }
    ];
    localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
}

// ===================== CONSOLE LOG FOR DEBUGGING =====================
console.log('🎮 EHS 互動式電腦線上遊戲 - 代碼已加載');
console.log('📋 功能清單:');
console.log('  ✅ 首頁（主視覺背景）');
console.log('  ✅ 遊戲規則頁面');
console.log('  ✅ 測驗頁面（一頁兩題）');
console.log('  ✅ 計時計分系統');
console.log('  ✅ 排行榜系統');
console.log('  ✅ 排行榜匯出Excel/CSV');
console.log('  ✅ 角色資訊視窗');
console.log('  ✅ 背景音樂');
console.log('  ✅ 後端 API 成績寫入 / 排行榜讀取（見 config.js）');

// ===================== POPUP SYSTEM (排行榜查詢彈跳視窗) =====================
function showPopup(message, onOk) {
    const popup = document.getElementById('popup-modal');
    const text = document.getElementById('popup-text');
    const btn = document.getElementById('popup-confirm');
    const btnCancel = document.getElementById('popup-cancel');

    if (!popup || !text || !btn) return;

    text.innerText = message;
    popup.classList.remove('hidden');

    // 單鈕模式：隱藏取消鈕
    if (btnCancel) btnCancel.style.display = 'none';
    btn.innerText = '確認 / OK';

    btn.onclick = function () {
        closePopup();
        if (onOk) onOk();
    };
}


function showConfirmPopup(message, onConfirm, onCancel) {
    const popup = document.getElementById('popup-modal');
    const text = document.getElementById('popup-text');
    const btnConfirm = document.getElementById('popup-confirm');
    const btnCancel = document.getElementById('popup-cancel');

    if (!popup || !text || !btnConfirm) return;

    text.innerText = message;
    popup.classList.remove('hidden');

    // 雙鈕模式：顯示取消鈕
    if (btnCancel) btnCancel.style.display = '';
    btnConfirm.innerText = '確認 / OK';

    btnConfirm.onclick = function () {
        closePopup();
        if (onConfirm) onConfirm();
    };

    if (btnCancel) {
        btnCancel.onclick = function () {
            closePopup();
            if (onCancel) onCancel();
        };
    }
}

function closePopup() {
    const popup = document.getElementById('popup-modal');
    popup.classList.add('hidden');
}

// 點選叉叉 時間暫停
function pauseTimer() {
    gameState.quizActive = false;
}

function resumeTimer() {
    if (!gameState.quizActive && gameState.startTime) {
        gameState.quizActive = true;

        // 修正 startTime（避免時間跳掉）
        gameState.startTime = Date.now() - gameState.elapsedTime;

        startTimer();
    }
}

// ===================== 後端 API（Cloudflare Worker）資料讀寫 =====================

/**
 * 判斷 config.js 是否已填好後端網址（未填則退回 localStorage）。
 * @returns {boolean}
 */
function isRemoteBackendEnabled() {
    const c = window.EHS_CONFIG;
    if (!c || !c.api) return false;
    const url = c.api.baseUrl;
    return typeof url === 'string' && /^https?:\/\//.test(url.trim());
}

/** 取得去除尾端斜線的後端網址。 */
function apiBaseUrl() {
    return window.EHS_CONFIG.api.baseUrl.trim().replace(/\/+$/, '');
}

/**
 * 透過 HTTP POST 把一筆成績寫入後端（Cloudflare Worker → KV）。
 * 後端回傳正常 CORS，因此可由回應碼確認是否成功。
 * @param {{id:string, score:number, time:number, date:string}} entry
 * @returns {Promise<boolean>} 是否寫入成功
 */
async function submitToRemote(entry) {
    if (!isRemoteBackendEnabled()) {
        console.warn('⚠️ 尚未設定後端網址（config.js），略過寫入，僅存本機。');
        return false;
    }

    try {
        const res = await fetch(`${apiBaseUrl()}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: entry.id,
                score: entry.score,
                time: entry.time,
                date: entry.date,
            }),
        });

        if (!res.ok) {
            console.error(`❌ 寫入後端失敗（HTTP ${res.status}）`);
            return false;
        }
        console.log('✅ 已透過後端 API 寫入成績');
        return true;
    } catch (err) {
        console.error('❌ 寫入後端失敗', err);
        return false;
    }
}

/**
 * 從後端（Cloudflare Worker）讀取排行榜資料。
 * @returns {Promise<Array<{id:string,score:number,time:number,date:string}>|null>}
 */
async function fetchLeaderboardFromRemote() {
    if (!isRemoteBackendEnabled()) return null;

    try {
        const res = await fetch(`${apiBaseUrl()}/leaderboard`);
        if (!res.ok) {
            console.error(`❌ 讀取後端排行榜失敗（HTTP ${res.status}）`);
            return null;
        }

        const data = await res.json();
        const rows = (Array.isArray(data) ? data : []).map(item => ({
            id: item.id,
            score: Number(item.score),
            time: Number(item.time),
            date: item.date,
        })).filter(item => item.id != null && item.id !== '');

        // 排序：分數高優先，分數相同比時間短（後端已排序，這裡保險再排一次）
        rows.sort((a, b) => (b.score - a.score) || (a.time - b.time));

        console.log(`✅ 已從後端讀取 ${rows.length} 筆排行榜資料`);
        return rows;
    } catch (err) {
        console.error('❌ 讀取後端排行榜失敗', err);
        return null;
    }
}
