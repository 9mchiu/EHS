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
    confirmExitCallback: null,
};

// Google Sheets API URL (需替換為實際的Web App URL)
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxbWER1QFu0BT8sj7HX1j8WHRX3tDg4-N9avSXeGg4ej_cGaf3NCsLN9NLB8y883p0o3A/exec";

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

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 EHS Game Initialized');
    
    
    // 綁定所有事件監聽器
    bindEventListeners();
    
    // 初始化排行榜資料
    if (gameState.leaderboard.length === 0) {
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
    link.href = 'assets/EHS-guidelines.pdf'; // 替換為實際PDF路徑
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

            updateScore();
        });
    });
    
    return block;
}



function showMessagePopup(message) {
    const popup = document.getElementById('popup-modal');
    const text = document.getElementById('popup-text');
    const btn = document.querySelector('.popup-btn');

    text.innerText = message;

    btn.innerText = 'OK';
    btn.onclick = closePopup;

    popup.classList.remove('hidden');
}

/**
 * 更新計分
 */
function updateScore() {
    let score = 0;
    quizQuestions.forEach(question => {
        if (gameState.answers[question.id] === question.correct) {
            score += 5;
        }
    });
    gameState.score = score;
    document.getElementById('score').textContent = `${score} / 50`;
}

/**
 * 更新導航按鈕狀態
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    
    prevBtn.disabled = gameState.currentQuizPage === 1;
    nextBtn.disabled = gameState.currentQuizPage === gameState.totalQuizPages;
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
function submitQuiz() {
    console.log('📤 提交測驗');

    gameState.quizActive = false;
    updateScore();

    const totalTime = gameState.elapsedTime / 1000;

    const newEntry = {
        id: gameState.employeeId,
        score: gameState.score,
        time: totalTime,
        date: new Date().toLocaleString('zh-TW')
    };

    // 存 leaderboard
    gameState.leaderboard.push(newEntry);

    // 排序
    gameState.leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });

    localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));

    // ❌ 先關掉（避免未定義炸掉）
    // writeToGoogleSheet(newEntry);

    // 計算排名（唯一版本）
    const rank = gameState.leaderboard.findIndex(
        e => e.id === newEntry.id && e.time === newEntry.time
    ) + 1;

    showQuizResult(gameState.score, totalTime, rank);
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
    // 格式化時間
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    const timeStr = 
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0');
    
    // 更新結果顯示
    document.getElementById('result-score').textContent = `${score} / 50`;
    document.getElementById('result-time').textContent = timeStr;
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

    // ❌ 先不要抓 Google Sheet（避免炸掉）
    renderLeaderboardTable();
    showPage('leaderboard-page');
}

/**
 * 渲染排行榜表格
 */
function renderLeaderboardTable() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    gameState.leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        const minutes = Math.floor(entry.time / 60);
        const seconds = Math.floor(entry.time % 60);
        const milliseconds = Math.floor((entry.time % 1) * 100);
        const timeStr = 
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0') + '.' +
            String(milliseconds).padStart(2, '0');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.id}</td>
            <td>${entry.score} / 50</td>
            <td>${timeStr}</td>
        `;
        
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
    
    gameState.leaderboard.forEach((entry, index) => {
        const minutes = Math.floor(entry.time / 60);
        const seconds = Math.floor(entry.time % 60);
        const milliseconds = Math.floor((entry.time % 1) * 100);
        const timeStr = 
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0') + '.' +
            String(milliseconds).padStart(2, '0');
        
        csvContent += `${index + 1},"${entry.id}","${entry.score}/50","${timeStr}","${entry.date}"\n`;
    });
    
    // 建立下載連結
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
/**
 * 打開角色資訊視窗
 * @param {number} characterId - 角色ID
 */
function openCharacterModal(characterId) {
    const characterData = {
        1: {
            name: "消防安全",
            description: "消防安全宣導內容",
            image: "./ERC.png"
        },

        2: {
            name: "安全檢查",
            description: "安全檢查宣導內容",
            image: "./Safety.png"
        },

        3: {
            name: "環境保護",
            description: "環境保護宣導內容",
            image: "./Env.png"
        },

        4: {
            name: "製程管理",
            description: "製程管理宣導內容",
            image: "./PSM.png"
        },

        5: {
            name: "健康保健",
            description: "健康保健宣導內容",
            image: "./HC.png"
        }
    };
    
    const data = characterData[characterId];
    if (data) {
        document.getElementById('modal-character-name').textContent = data.name;
        document.getElementById('modal-character-description').textContent = data.description;
        const modalImage = document.getElementById("modal-image");

        modalImage.src = data.image;

        const modal = document.getElementById('character-modal');
        modal.classList.add('active');
        console.log(`🎭 打開角色視窗: 角色 ${characterId}`);
    }
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
    resetTimer(); // ⭐ 加這行
    document.getElementById('score').textContent = '0 / 50';
    document.getElementById('timer').textContent = '00:00.00';
    showPage('home-page');
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
console.log('  ⏳ Google Sheets 整合（需要後端支援）');

// ===================== POPUP SYSTEM (排行榜查詢彈跳視窗) =====================
function showPopup(message, onOk) {
    const popup = document.getElementById('popup-modal');
    const text = document.getElementById('popup-text');
    const btn = document.getElementById('popup-confirm');

    if (!popup || !text || !btn) return;

    text.innerText = message;
    popup.classList.remove('hidden');

    // 清掉舊事件，避免累積
    btn.onclick = null;

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

    text.innerText = message;

    // 顯示 popup
    popup.classList.remove('hidden');

    // 清除舊事件（避免重複綁定）
    btnConfirm.onclick = null;
    btnCancel.onclick = null;

    // 綁定事件
    btnConfirm.onclick = function () {
        closePopup();
        if (onConfirm) onConfirm();
    };

    btnCancel.onclick = function () {
        closePopup();
        if (onCancel) onCancel();
    };
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

async function writeToGoogleSheet(entry) {
    try {
        const payload = {
            action: "add",
            id: entry.id,
            score: entry.score,
            time: entry.time,
            date: entry.date
        };

        await fetch(GAS_WEB_APP_URL, {
            method: "POST",
            mode: "no-cors", // ⚠️ GAS 常用設定
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log("✅ 已寫入 Google Sheet");
    } catch (err) {
        console.error("❌ 寫入 Google Sheet 失敗", err);
    }
}

async function fetchLeaderboardFromGoogle() {
    try {
        const res = await fetch(GAS_WEB_APP_URL + "?action=get");
        const data = await res.json();

        // 轉換格式（確保跟你本地一致）
        return data.map(item => ({
            id: item.id,
            score: Number(item.score),
            time: Number(item.time),
            date: item.date
        }));
    } catch (err) {
        console.error("❌ 讀取 Google Sheet 失敗", err);
        return null;
    }
}
