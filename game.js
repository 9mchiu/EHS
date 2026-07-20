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
    sessionToken: null, // 後端 /start 發的簽章 token；交卷時附上，後端用它算用時並計分
    leaderboard: JSON.parse(localStorage.getItem('leaderboard')) || [],
};

// 後端 API（Cloudflare Worker）設定來自 config.js (window.EHS_CONFIG)

// 題目資料：只含題目文字與選項，「正確答案」已移至後端（Cloudflare Worker 的 env.ANSWER_KEY），
// 前端看不到也算不出分數 → 計分完全由後端負責，避免使用者竄改成績。
const quizQuestions = [
    {
        id: 1,
        text: "火災發生時，最正確的第一個動作是？",
        textEn: " What is the most appropriate first action when a fire occurs?​",
        options: [
            { text: "嘗試滅火", textEn: "Try to extinguish the fire​" },
            { text: "先收拾重要物品再逃​", textEn: "Gather important belongings before escaping​" },
            { text: "立即通報並逃生", textEn: "Immediately report and evacuate​" },
            { text: "躲起來等待救援​", textEn: "Hide and wait for rescue​" }
        ]
    },
    {
        id: 2,
        text: "火場逃生時，遇到濃煙應如何行動？",
        textEn: "How should you act when encountering heavy smoke during a fire escape?​",
        options: [
            { text: "站著快速奔跑​", textEn: "Stand and run quickly​" },
            { text: "憋氣衝過去", textEn: "Hold your breath and rush through​" },
            { text: "低姿勢前進", textEn: "Move forward in a low posture​" },
            { text: "躲在原地不動", textEn: "Stay where you are and do not move​" }
        ]
    },
    {
        id: 3,
        text: "「Live Safe」的核心精神是什麼？​",
        textEn: "What is the core principle of “Live Safe”?​",
        options: [
            { text: "只在高風險作業中注意安全", textEn: "Only focus on safety during high-risk operations" },
            { text: "安全是公司的責任", textEn: "Safety is the company’s responsibility​" },
            { text: "每個人都有責任確保自己與他人的安全", textEn: "Everyone is responsible for ensuring their own safety and the safety of others​" },
            { text: "安全只需遵守法規即可", textEn: "Safety only requires compliance with regulations​" }
        ]
    },
    {
        id: 4,
        text: "下列何者是「Live Safe」的行為？",
        textEn: "Which of the following is a “Live Safe” behavior?​",
        options: [
            { text: "未經授權或違反安全規定或控制​", textEn: "Performing work without authorization or in violation of safety rules or controls​​" },
            { text: "違反特殊作業許可規定​", textEn: "Violating special work permit requirements​" },
            { text: "未申請安全變更管理（SMOC）​", textEn: "Failing to apply for Safety Management of Change (SMOC)​" },
            { text: "遵守交通安全規定​", textEn: "Complying with traffic safety regulations​" }
        ]
    },
    {
        id: 5,
        text: "使用紅色特性標籤標示的的廢棄物為哪一類的廢棄物?​",
        textEn: "Which category of waste is labeled with a red characteristic tag?​​",
        options: [
            { text: "有機類", textEn: "Organic​" },
            { text: "酸類​", textEn: "Acid​" },
            { text: "鹼類​", textEn: "Alkali​" },
            { text: "特殊類", textEn: "Special​" }
        ]
    },
    {
        id: 6,
        text: "台中二廠(MTB)與台中四廠(AATT)加總碳排放量落在哪個區間？",
        textEn: "What is the total carbon emission range for Taichung Plant 2 (MTB) and Taichung Plant 4 (AATT) combined?​",
        options: [
            { text: "20-30萬噸/CO2e​", textEn: "200,000–300,000 tons CO₂e​" },
            { text: "31-50萬噸/CO2e​", textEn: "310,000–500,000 tons CO₂e​" },
            { text: "51-100萬噸/CO2e", textEn: "510,000–1,000,000 tons CO₂e​" },
            { text: "101萬噸/CO2e以上", textEn: "Above 1,010,000 tons CO₂e​" }
        ]
    },
    {
        id: 7,
        text: "SMOC 的主要目的為何？",
        textEn: "What is the main purpose of SMOC?​",
        options: [
            { text: "增加生產速度​", textEn: "Increase production speed​" },
            { text: "管控變更帶來的環安衛風險​", textEn: "Control EHS risks caused by changes​" },
            { text: "減少人員訓練時間​", textEn: "Reduce personnel training time​" },
            { text: "降低設備成本", textEn: "Lower equipment costs​" }
        ]
    },
    {
        id: 8,
        text: "以下哪一種情況需要申請 SMOC？",
        textEn: "Which of the following situations requires applying for SMOC?​",
        options: [
            { text: "每天依 SOP 正常作業", textEn: "Daily operations following SOP​" },
            { text: "無任何變更的例行巡檢​", textEn: "Routine inspection with no changes​" },
            { text: "新增化學品或改變使用量​", textEn: "Adding new chemicals or changing usage quantity​" },
            { text: "個人自行調整工作時間​", textEn: "Individually adjusting working hours​" }
        ]
    },
    {
        id: 9,
        text: "假設不小心在公司內受傷，或是在上下班途中發生事故，最慢應幾小時內通報保健中心?​",
        textEn: "If you are accidentally injured at the company or involved in an incident while commuting, within how many hours must you report it to the Health Center at the latest?​",
        options: [
            { text: "24小時內​", textEn: "Within 24 hours" },
            { text: "48小時內​", textEn: "Within 48 hours" },
            { text: "72小時內​", textEn: "Within 72 hours" },
            { text: "不用通報​", textEn: "No need to report​" }
        ]
    },
    {
        id: 10,
        text: "保健中心內有什麼健康測量儀器設備可以使用?​",
        textEn: "What health measurement equipment is available in the Health Center?​",
        options: [
            { text: "血壓計", textEn: "Blood pressure monitor​" },
            { text: "血糖機​", textEn: "Blood glucose meter​" },
            { text: "InBody​", textEn: "InBody" },
            { text: "以上皆有​", textEn: "All of the above​" }
        ]
    }
];

// 本局正確答案表：預設為 null（前端沒有答案），交卷後由後端回傳 answerKey 填入，
// 供「錯題回顧」顯示正確答案。啟用後端時，這裡在交卷前一定是 null → 前端無從得知答案。
let answerKey = null;

// 一頁兩題 → 依題數自動計算總頁數（避免日後改題數時錯位）
gameState.totalQuizPages = Math.ceil(quizQuestions.length / 2);

// 本局實際出題用的清單（每次遊玩會洗牌成不同順序）；預設先放原始順序
gameState.questions = quizQuestions.slice();

/**
 * Fisher–Yates 洗牌（原地打亂並回傳同一陣列）。
 * 用於每次遊玩時隨機化出題順序；作答以題目 id 記錄，故計分不受順序影響。
 */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

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
    document.getElementById('btn-rules-prev').addEventListener('click', showPrevRulesImage);
    document.getElementById('btn-rules-next').addEventListener('click', showNextRulesImage);
    // 輸入工號
    document.getElementById('btn-confirm-employee').addEventListener('click', confirmEmployeeId);
    // 測驗頁面按鈕
    document.getElementById('btn-close-quiz').addEventListener('click', closeQuiz);
    document.getElementById('btn-prev-page').addEventListener('click', previousQuizPage);
    document.getElementById('btn-next-page').addEventListener('click', nextQuizPage);
    document.getElementById('btn-submit-quiz').addEventListener('click', submitQuiz);
    
    // 結果頁面按鈕
    document.getElementById('btn-back-home').addEventListener('click', backToHome);
    document.getElementById('btn-review-wrong').addEventListener('click', showWrongReview);

    // 錯題回顧頁按鈕
    document.getElementById('btn-review-back').addEventListener('click', function () {
        showPage('quiz-result-page');
    });
    document.getElementById('btn-review-home').addEventListener('click', backToHome);
    
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

    // 依背景圖(object-fit:cover)實際範圍定位角色熱區，並隨視窗縮放重算
    positionHotspots();
    window.addEventListener('resize', positionHotspots);
    
    // 點擊模態框背景時關閉
    document.getElementById('character-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCharacterModal();
        }
    });
}

// ===================== CHARACTER HOTSPOT POSITIONING =====================
// 背景圖原始尺寸（background.png）。用來換算 object-fit:cover 後的實際顯示範圍。
const BG_IMAGE_W = 1280;
const BG_IMAGE_H = 720;

// 熱區大小（以背景圖實際顯示寬／高的比例計），放大到足以蓋住整個角色，方便點擊。
const HOTSPOT_W_RATIO = 0.14; // 顯示寬的 14%
const HOTSPOT_H_RATIO = 0.30; // 顯示高的 30%

/**
 * 依 background.png 的 object-fit:cover 實際顯示範圍，將每個角色熱區
 * 對準其在圖中的中心點（data-cx / data-cy 為圖內百分比座標）。
 * 任何螢幕比例都能對準角色，視窗縮放時也會重新計算。
 */
function positionHotspots() {
    const hotspots = document.querySelectorAll('.character-hotspot');
    if (hotspots.length === 0) return;

    // 背景圖填滿整個視窗（#home-page 為 100% 視窗大小）
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 計算 cover 後的顯示尺寸與偏移（被裁切的方向會有負偏移）
    const imgRatio = BG_IMAGE_W / BG_IMAGE_H;
    const viewRatio = vw / vh;

    let renderW, renderH, offsetX, offsetY;
    if (viewRatio > imgRatio) {
        // 視窗較寬 → 以寬為準縮放，上下被裁切
        renderW = vw;
        renderH = vw / imgRatio;
        offsetX = 0;
        offsetY = (vh - renderH) / 2;
    } else {
        // 視窗較窄 → 以高為準縮放，左右被裁切
        renderH = vh;
        renderW = vh * imgRatio;
        offsetY = 0;
        offsetX = (vw - renderW) / 2;
    }

    hotspots.forEach(hotspot => {
        const cx = parseFloat(hotspot.dataset.cx);
        const cy = parseFloat(hotspot.dataset.cy);
        if (Number.isNaN(cx) || Number.isNaN(cy)) return;

        const px = offsetX + (cx / 100) * renderW;
        const py = offsetY + (cy / 100) * renderH;

        hotspot.style.left = `${px}px`;
        hotspot.style.top = `${py}px`;
        hotspot.style.width = `${renderW * HOTSPOT_W_RATIO}px`;
        hotspot.style.height = `${renderH * HOTSPOT_H_RATIO}px`;
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
    initRulesImage();          // 進規則頁時重設為中文版並準備切換鈕
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

async function startQuizAfterEmployee() {
    console.log('🎬 開始測驗（正式）');

    // 向後端要一組簽章 token（內含伺服器端的開始時間，用時以此為準，前端無法竄改）。
    // 未啟用後端時 token 維持 null，走本機模式（無防作弊，僅供離線試玩）。
    gameState.sessionToken = null;
    answerKey = null; // 新一局：清掉上一局的答案，交卷後才由後端回填
    if (isRemoteBackendEnabled()) {
        const token = await startRemoteSession(gameState.employeeId);
        if (!token) {
            showPopup(
                '無法連線到伺服器，暫時無法開始測驗，請稍後再試。\n' +
                'Cannot reach the server. Please try again later.'
            );
            backToHome();
            return;
        }
        gameState.sessionToken = token;
    }

    gameState.quizActive = true;
    gameState.startTime = Date.now();
    gameState.currentQuizPage = 1;
    gameState.answers = {};
    gameState.score = 0;

    // 每次遊玩隨機打亂出題順序
    gameState.questions = shuffleArray(quizQuestions.slice());

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
    
    // 計算當前頁面顯示的題目索引（依本局洗牌後的順序）
    const startIndex = (gameState.currentQuizPage - 1) * 2;
    const endIndex = Math.min(startIndex + 2, gameState.questions.length);

    // 顯示題目
    for (let i = startIndex; i < endIndex; i++) {
        const question = gameState.questions[i];
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
 * 依「後端回傳的答案表 answerKey」計算總分（僅在交卷後、拿到 answerKey 時有意義）。
 * 前端在交卷前沒有 answerKey，因此無法自行算分或反推答案。
 * 正式分數以後端回傳為準，此函式僅供離線後備顯示。
 * @returns {number} 總分
 */
function calculateScore() {
    let score = 0;
    if (answerKey) {
        gameState.questions.forEach(question => {
            if (gameState.answers[question.id] === Number(answerKey[question.id])) {
                score += 10;
            }
        });
    }
    gameState.score = score;
    return score;
}

/**
 * 更新側欄「作答進度」（已作答題數 / 總題數），不洩漏分數。
 */
function updateProgress() {
    const answered = gameState.questions.filter(
        q => gameState.answers[q.id] !== undefined
    ).length;
    const el = document.getElementById('score');
    if (el) el.textContent = `${answered} / ${gameState.questions.length}`;
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
    const unanswered = gameState.questions.filter(
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

    if (isRemoteBackendEnabled()) {
        // 後端模式：把作答送給後端，由後端計分並算用時（前端不再自行算分）
        const result = await submitToRemote(gameState.answers);

        if (!result) {
            // 連線失敗：不顯示假分數，請使用者重試
            showPopup(
                '成績送出失敗，請檢查網路後再試一次。\n' +
                'Failed to submit your result. Please check your connection and try again.'
            );
            gameState.quizActive = true; // 允許重按提交
            return;
        }

        // 後端回傳答案表 → 錯題回顧才有正確答案可顯示
        if (result.answerKey) answerKey = result.answerKey;

        if (result.error === 'already_submitted') {
            showPopup(
                '此工號先前已完成測驗，將顯示已記錄的成績（不覆蓋）。\n' +
                'This ID has already completed the quiz; showing the recorded result.'
            );
        }

        gameState.score = Number(result.score) || 0;
        const totalTime = Number(result.time) || (gameState.elapsedTime / 1000);
        showQuizResult(gameState.score, totalTime, result.rank);
        return;
    }

    // 本機模式（未設定後端）：無答案表可算分，僅供離線試玩
    calculateScore();
    const totalTime = gameState.elapsedTime / 1000;
    const newEntry = {
        id: gameState.employeeId,
        score: gameState.score,
        time: totalTime,
        date: new Date().toLocaleString('zh-TW')
    };
    gameState.leaderboard.push(newEntry);
    gameState.leaderboard.sort((a, b) => (b.score - a.score) || (a.time - b.time));
    localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
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
    document.getElementById('result-score').textContent = `${score} / 100`;
    document.getElementById('result-time').textContent = formatTime(time);
    document.getElementById('result-rank').textContent = `#${rank}`;
    
    // 顯示結果頁面
    showPage('quiz-result-page');
}

/**
 * 錯題回顧：列出本局答錯的題目，標示「你的選擇」與「正確答案」。
 * 依本局出題順序顯示；全對則顯示恭喜訊息。
 */
function showWrongReview() {
    const list = document.getElementById('review-list');
    if (!list) return;
    list.innerHTML = '';

    // 沒有答案表（後端未回傳/離線）就無法顯示正確答案
    if (!answerKey) {
        list.innerHTML =
            '<div class="review-empty">' +
            '<p class="review-empty-zh">目前無法載入正確答案。</p>' +
            '<p class="review-empty-en">Correct answers are not available.</p>' +
            '</div>';
        showPage('quiz-review-page');
        return;
    }

    // 找出答錯（含未作答）的題目，維持本局出題順序
    const wrong = gameState.questions.filter(
        q => gameState.answers[q.id] !== Number(answerKey[q.id])
    );

    if (wrong.length === 0) {
        list.innerHTML =
            '<div class="review-empty">' +
            '<p class="review-empty-zh">🎉 全部答對，沒有錯題！</p>' +
            '<p class="review-empty-en">All correct — no wrong answers!</p>' +
            '</div>';
        showPage('quiz-review-page');
        return;
    }

    wrong.forEach((q, idx) => {
        const userIdx = gameState.answers[q.id]; // 可能為 undefined（未作答）

        const correctIdx = Number(answerKey[q.id]);
        let optionsHTML = '';
        q.options.forEach((opt, i) => {
            let cls = 'review-option';
            let tag = '';
            if (i === correctIdx) {
                cls += ' correct';
                tag = '✓ 正確答案 / Correct';
            } else if (i === userIdx) {
                cls += ' wrong';
                tag = '✗ 你的作答 / Your answer';
            }
            optionsHTML +=
                `<div class="${cls}">` +
                `<span class="review-opt-text">${String.fromCharCode(65 + i)}. ${opt.text}` +
                `<span class="review-opt-en">${opt.textEn}</span></span>` +
                (tag ? `<span class="review-tag">${tag}</span>` : '') +
                `</div>`;
        });

        const yourPick = (userIdx === undefined)
            ? '（未作答 / Not answered）'
            : '';

        const item = document.createElement('div');
        item.className = 'review-item';
        item.innerHTML =
            `<div class="review-q">${idx + 1}. ${q.text} ${yourPick}</div>` +
            `<div class="review-q-en">${q.textEn}</div>` +
            `<div class="review-options">${optionsHTML}</div>`;
        list.appendChild(item);
    });

    showPage('quiz-review-page');
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
            `${entry.score} / 100`,
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
        csvContent += `${index + 1},"${csvCell(entry.id)}","${entry.score}/100","${timeStr}","${csvCell(entry.date)}"\n`;
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
    const placeholder = document.getElementById('modal-image-placeholder');
    if (modalImage) {
        // 圖檔存在 → 顯示圖片；不存在（例如英文版尚未補上）→ 顯示「圖片準備中」佔位畫面
        modalImage.onload = function () {
            modalImage.style.display = '';
            if (placeholder) placeholder.style.display = 'none';
        };
        modalImage.onerror = function () {
            modalImage.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
        };
        modalImage.src = modalImages[modalImageIndex];
    }

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

// ===================== GAME RULES IMAGE (中／英切換) =====================
// 遊戲規則頁：中文版與英文版兩張圖，可用左右按鈕切換（與角色視窗相同行為）
const rulesImages = ['./gamerules.png', './gamerules_ENG.png'];
let rulesImageIndex = 0;

/**
 * 重設並渲染規則圖（每次進入規則頁時呼叫，預設顯示中文版）。
 */
function initRulesImage() {
    rulesImageIndex = 0;
    renderRulesImage();
}

/**
 * 依目前索引渲染規則圖，並更新頁碼與切換鈕顯示。
 */
function renderRulesImage() {
    const img = document.getElementById('rules-image');
    const placeholder = document.getElementById('rules-image-placeholder');
    if (img) {
        // 圖檔存在 → 顯示；不存在（例如英文版尚未補上）→ 顯示「圖片準備中」佔位畫面
        img.onload = function () {
            img.style.display = '';
            if (placeholder) placeholder.style.display = 'none';
        };
        img.onerror = function () {
            img.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
        };
        img.src = rulesImages[rulesImageIndex];
    }

    const indexEl = document.getElementById('rules-image-index');
    const totalEl = document.getElementById('rules-image-total');
    if (indexEl) indexEl.textContent = String(rulesImageIndex + 1);
    if (totalEl) totalEl.textContent = String(rulesImages.length);

    // 只有一張圖時，隱藏左右切換鈕與頁碼
    const showNav = rulesImages.length > 1;
    ['btn-rules-prev', 'btn-rules-next'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = showNav ? '' : 'none';
    });
    const indicator = document.getElementById('rules-indicator');
    if (indicator) indicator.style.display = showNav ? '' : 'none';
}

/** 規則圖切換到上一張（循環）。 */
function showPrevRulesImage() {
    rulesImageIndex = (rulesImageIndex - 1 + rulesImages.length) % rulesImages.length;
    renderRulesImage();
}

/** 規則圖切換到下一張（循環）。 */
function showNextRulesImage() {
    rulesImageIndex = (rulesImageIndex + 1) % rulesImages.length;
    renderRulesImage();
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
        { id: 'EMP0001', score: 100, time: 120.50, date: '2026-06-07 10:30' },
        { id: 'EMP0002', score: 100, time: 125.30, date: '2026-06-07 10:25' },
        { id: 'EMP0003', score: 90, time: 145.20, date: '2026-06-07 10:20' },
        { id: 'EMP0004', score: 80, time: 180.15, date: '2026-06-07 10:15' },
        { id: 'EMP0005', score: 70, time: 200.80, date: '2026-06-07 10:10' }
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
 * 開始一局測驗：向後端要一組簽章 token（內含伺服器端開始時間）。
 * @param {string} id 工號
 * @returns {Promise<string|null>} token；失敗回 null
 */
async function startRemoteSession(id) {
    if (!isRemoteBackendEnabled()) return null;
    try {
        const res = await fetch(`${apiBaseUrl()}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.token) {
            console.error(`❌ 取得測驗 token 失敗（HTTP ${res.status}）`, data.error || '');
            return null;
        }
        return data.token;
    } catch (err) {
        console.error('❌ 取得測驗 token 失敗', err);
        return null;
    }
}

/**
 * 交卷：把作答（{ 題目id: 選項index }）連同 token 送給後端，由後端計分並算用時。
 * 前端不再送 score / time，後端一律以自己算的為準。
 * @param {Object<string, number>} answers 作答表
 * @returns {Promise<{ok?:boolean, error?:string, score?:number, time?:number, rank?:number, answerKey?:Object}|null>}
 *          後端回傳的結果物件（含 409 already_submitted）；連線失敗回 null
 */
async function submitToRemote(answers) {
    if (!isRemoteBackendEnabled()) return null;
    try {
        const res = await fetch(`${apiBaseUrl()}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: gameState.sessionToken,
                answers,
            }),
        });
        const data = await res.json().catch(() => null);
        if (data == null) {
            console.error(`❌ 交卷失敗（HTTP ${res.status}，無法解析回應）`);
            return null;
        }
        // 200（成功）與 409（已完成）都帶有可用資料 → 回傳給呼叫端處理；
        // 其餘 4xx/5xx（如 token 無效、伺服器未設定）視為失敗。
        if (!res.ok && res.status !== 409) {
            console.error(`❌ 交卷失敗（HTTP ${res.status}）`, data.error || '');
            return null;
        }
        console.log('✅ 已交卷，後端回傳成績');
        return data;
    } catch (err) {
        console.error('❌ 交卷失敗', err);
        return null;
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
