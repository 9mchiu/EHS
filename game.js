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
  leaderboard: JSON.parse(localStorage.getItem('leaderboard')) || [],
};

// ===================== SharePoint 設定區 =====================
// 🔧 請修改以下兩個設定值
const SHAREPOINT_SITE_URL = 'https://microncorp.sharepoint.com/sites/MTBEHS';
const SHAREPOINT_LIST_NAME = '工安環保月線上遊戲_Leaderboard';

// ===================== 題目資料 =====================
// 🔧 之後替換為正式題目
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
    text: "發生緊急情況時，應該立即通知誰?",
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
    text: "個人防護裝備(PPE)應該在何時使用?",
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
      { text: "每年一次", textEn: "Once a year" }
    ],
    correct: 2
  },
  {
    id: 5,
    text: "工作環境不安全時應該採取什麼行動?",
    textEn: "What action should be taken if the work environment is unsafe?",
    options: [
      { text: "繼續工作", textEn: "Continue working" },
      { text: "停止工作並報告", textEn: "Stop work and report" },
      { text: "自行修復", textEn: "Fix it yourself" },
      { text: "忽略問題", textEn: "Ignore the issue" }
    ],
    correct: 1
  },
  {
    id: 6,
    text: "化學品洩漏時的第一步應該是?",
    textEn: "What is the first step when a chemical spill occurs?",
    options: [
      { text: "立即清理", textEn: "Clean up immediately" },
      { text: "疏散人員", textEn: "Evacuate personnel" },
      { text: "通知主管", textEn: "Notify supervisor" },
      { text: "繼續工作", textEn: "Continue working" }
    ],
    correct: 1
  },
  {
    id: 7,
    text: "正確的手部衛生做法是?",
    textEn: "What is the correct hand hygiene practice?",
    options: [
      { text: "工作前洗手", textEn: "Wash hands before work" },
      { text: "工作後洗手", textEn: "Wash hands after work" },
      { text: "接觸化學品後洗手", textEn: "Wash hands after contact with chemicals" },
      { text: "以上皆是", textEn: "All of the above" }
    ],
    correct: 3
  },
  {
    id: 8,
    text: "進行電氣作業前，應該確認什麼?",
    textEn: "Before performing electrical work, what should be confirmed?",
    options: [
      { text: "電源已切斷", textEn: "Power is disconnected" },
      { text: "設備已上鎖", textEn: "Equipment is locked out" },
      { text: "標示已掛上", textEn: "Tags are applied" },
      { text: "以上皆是", textEn: "All of the above" }
    ],
    correct: 3
  },
  {
    id: 9,
    text: "火災發生時，應該優先採取什麼行動?",
    textEn: "In case of fire, what action should be prioritized?",
    options: [
      { text: "立即滅火", textEn: "Extinguish the fire immediately" },
      { text: "疏散並報警", textEn: "Evacuate and call emergency" },
      { text: "收拾個人物品", textEn: "Collect personal belongings" },
      { text: "等待指示", textEn: "Wait for instructions" }
    ],
    correct: 1
  },
  {
    id: 10,
    text: "噪音防護耳塞應在噪音超過多少分貝時使用?",
    textEn: "Earplugs should be used when noise exceeds how many decibels?",
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
  if (gameState.leaderboard.length === 0) {
    loadSampleLeaderboardData();
  }
  showPage('home-page');
});

// ===================== EVENT BINDING =====================
function bindEventListeners() {
  document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);
  document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboard);
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

  document.getElementById('btn-search').addEventListener('click', searchLeaderboard);
  document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
  document.getElementById('btn-back-from-leaderboard').addEventListener('click', backToHome);
  document.getElementById('search-rank').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') searchLeaderboard();
  });

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

// ===================== POPUP SYSTEM =====================
// 1. 確認型 Popup（有確認+取消）→ popup-modal
// 2. 訊息型 Popup（只有OK）→ msg-popup
// 3. 結果型 Popup → result-popup

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

// ===================== HOME PAGE =====================
function downloadPDF() {
  // 🔧 替換為實際 PDF 路徑
  const link = document.createElement('a');
  link.href = 'assets/EHS-guidelines.pdf';
  link.download = 'EHS sharing contents(all).pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function startQuiz() {
  console.log('🎬 開始測驗');
  gameState.quizStarted = true;
  showPage('game-rules-page');
  playBackgroundMusic();
}

// ===================== QUIZ FLOW =====================
function beginQuiz() {
  document.getElementById('employee-modal').classList.add('active');
}

function confirmEmployeeId() {
  const input = document.getElementById('employee-id-input');
  const id = input.value.trim();
  if (!id) { alert('請輸入工號'); return; }
  gameState.employeeId = id;
  document.getElementById('employee-modal').classList.remove('active');
  startQuizAfterEmployee();
}

function startQuizAfterEmployee() {
  gameState.quizActive = true;
  gameState.alreadySubmitted = false;
  gameState.startTime = Date.now();
  gameState.currentQuizPage = 1;
  gameState.answers = {};
  gameState.score = 0;
  renderQuizQuestions();
  showPage('quiz-page');
  startTimer();
}

function renderQuizQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  const start = (gameState.currentQuizPage - 1) * 2;
  const end = Math.min(start + 2, quizQuestions.length);
  for (let i = start; i < end; i++) {
    container.appendChild(createQuestionElement(quizQuestions[i], i + 1));
  }
  document.getElementById('page-number').textContent = gameState.currentQuizPage;
  document.getElementById('total-pages').textContent = gameState.totalQuizPages;
  updateNavigationButtons();
}

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
      </label>`;
  });
  block.innerHTML = `
    <div class="question-number">第 ${questionNumber} 題 / Question ${questionNumber}</div>
    <div class="question-text">${question.text}</div>
    <div class="question-text-en">${question.textEn}</div>
    <div class="question-options">${optionsHTML}</div>`;
  block.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function () {
      gameState.answers[parseInt(this.name.split('-')[1])] = parseInt(this.value);
    });
  });
  return block;
}

function updateNavigationButtons() {
  document.getElementById('btn-prev-page').disabled = gameState.currentQuizPage === 1;
  document.getElementById('btn-next-page').disabled = gameState.currentQuizPage === gameState.totalQuizPages;
}

function previousQuizPage() {
  if (gameState.currentQuizPage > 1) {
    gameState.currentQuizPage--;
    renderQuizQuestions();
    document.getElementById('questions-container').scrollTop = 0;
  }
}

function nextQuizPage() {
  if (gameState.currentQuizPage < gameState.totalQuizPages) {
    gameState.currentQuizPage++;
    renderQuizQuestions();
    document.getElementById('questions-container').scrollTop = 0;
  }
}

function updateScore() {
  let score = 0;
  quizQuestions.forEach(q => { if (gameState.answers[q.id] === q.correct) score += 5; });
  gameState.score = score;
  document.getElementById('score').textContent = `${score} / 50`;
}

// ===================== 提交測驗 =====================
function submitQuiz() {
  console.log('📤 提交測驗');
  if (gameState.alreadySubmitted) return;
  gameState.alreadySubmitted = true;
  gameState.quizActive = false;

  updateScore();
  const totalTime = gameState.elapsedTime / 1000;
  const min = Math.floor(totalTime / 60);
  const sec = Math.floor(totalTime % 60);
  const ms = Math.floor((totalTime % 1) * 100);
  const timeStr = String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0') + '.' + String(ms).padStart(2,'00');

  const newEntry = {
    id: gameState.employeeId || 'GUEST',
    score: gameState.score,
    time: totalTime,
    timeStr: timeStr,
    date: new Date().toLocaleString('zh-TW')
  };

  // 本機備份
  saveToLocalStorage(newEntry);

  // ✅ 寫入 SharePoint List（公司內部，不受 DLP 限制）
  writeToSharePoint(newEntry);

  const rank = gameState.leaderboard.findIndex(
    e => e.id === newEntry.id && e.score === newEntry.score && Math.abs(e.time - newEntry.time) < 0.01
  ) + 1;

  showResultPopup(gameState.score, totalTime, rank || 1);
}

// ===================== SharePoint REST API 整合 =====================
/**
 * 寫入成績到 SharePoint List
 * 使用公司內部 SharePoint REST API，不受 DLP 外部連線限制
 * @param {object} entry - 成績資料
 */
function writeToSharePoint(entry) {
  if (!SHAREPOINT_SITE_URL || SHAREPOINT_SITE_URL.includes('你的公司')) {
    console.warn('⚠️ 尚未設定 SharePoint URL，跳過雲端寫入');
    return;
  }

  const apiUrl = `${SHAREPOINT_SITE_URL}/_api/web/lists/getbytitle('${SHAREPOINT_LIST_NAME}')/items`;

  // 先取得 Request Digest（SharePoint 寫入所需的安全驗證碼）
  fetch(`${SHAREPOINT_SITE_URL}/_api/contextinfo`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose'
    },
    credentials: 'include' // 使用登入的公司帳號憑證
  })
  .then(res => res.json())
  .then(contextData => {
    const digestValue = contextData.d.GetContextWebInformation.FormDigestValue;

    // 寫入資料到 SharePoint List
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digestValue
      },
      credentials: 'include',
      body: JSON.stringify({
        '__metadata': { 'type': `SP.Data.${SHAREPOINT_LIST_NAME}ListItem` },
        'Title': entry.id,           // 工號
        'Score': entry.score,         // 分數
        'TimeSeconds': entry.time,    // 時間(秒)
        'TimeDisplay': entry.timeStr, // 時間(顯示)
        'GameDate': entry.date        // 日期
      })
    });
  })
  .then(res => {
    if (res.ok) {
      console.log('✅ 成功寫入 SharePoint List');
    } else {
      console.warn('⚠️ 寫入 SharePoint 失敗，狀態碼:', res.status);
    }
  })
  .catch(err => {
    console.warn('⚠️ SharePoint 寫入錯誤（本機備份已儲存）:', err);
  });
}

/**
 * 從 SharePoint List 讀取排行榜
 * 排序後顯示前20名
 */
function loadFromSharePoint() {
  if (!SHAREPOINT_SITE_URL || SHAREPOINT_SITE_URL.includes('你的公司')) {
    console.warn('⚠️ 尚未設定 SharePoint URL，使用本機資料');
    renderLeaderboardTable();
    return;
  }

  // 顯示載入中
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center; padding:30px; color:#40916c;">
        ⏳ 載入中... / Loading...
      </td>
    </tr>`;

  // 讀取所有資料，依分數降序、時間升序排列
  const apiUrl = `${SHAREPOINT_SITE_URL}/_api/web/lists/getbytitle('${SHAREPOINT_LIST_NAME}')/items` +
    `?$select=Title,Score,TimeSeconds,TimeDisplay,GameDate` +
    `&$orderby=Score desc,TimeSeconds asc` +
    `&$top=25`; // 多取幾筆，讓並列邏輯有空間處理

  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json;odata=verbose'
    },
    credentials: 'include' // 使用公司帳號憑證
  })
  .then(res => res.json())
  .then(data => {
    if (data.d && data.d.results && data.d.results.length > 0) {
      const records = data.d.results.map(item => ({
        id: item.Title || '',
        score: Number(item.Score || 0),
        time: Number(item.TimeSeconds || 0),
        timeStr: item.TimeDisplay || '00:00.00',
        date: item.GameDate || ''
      })).filter(r => r.id !== '');

      // 排序
      records.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      });

      // 保留前20名（含並列）
      gameState.leaderboard = getTop20WithTies(records);
      localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
      renderLeaderboardTable();
      console.log('✅ 排行榜已從 SharePoint 載入，共', gameState.leaderboard.length, '筆');
    } else {
      console.log('ℹ️ SharePoint List 目前無資料');
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:30px; color:#999;">
            尚無遊玩紀錄 / No records yet
          </td>
        </tr>`;
    }
  })
  .catch(err => {
    console.warn('⚠️ 無法從 SharePoint 讀取，改用本機備份:', err);
    renderLeaderboardTable();
  });
}

/**
 * 儲存到本機 localStorage（備份用）
 */
function saveToLocalStorage(entry) {
  const local = JSON.parse(localStorage.getItem('leaderboard')) || [];
  local.push(entry);
  local.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time - b.time;
  });
  gameState.leaderboard = getTop20WithTies(local);
  localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
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

// ===================== 結果彈跳視窗 =====================
function showResultPopup(score, time, rank) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  const ms = Math.floor((time % 1) * 100);
  const timeStr = String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0') + '.' + String(ms).padStart(2,'00');

  document.getElementById('popup-result-score').textContent = `${score} / 50`;
  document.getElementById('popup-result-time').textContent = timeStr;
  document.getElementById('popup-result-rank').textContent = `#${rank}`;

  const btnHome = document.getElementById('btn-result-home');
  const btnLB = document.getElementById('btn-result-leaderboard');
  btnHome.onclick = function () { closeResultPopup(); backToHome(); };
  btnLB.onclick = function () { closeResultPopup(); showLeaderboard(); };

  document.getElementById('result-popup').classList.remove('hidden');
  console.log(`🏆 結果：分數${score}, 時間${timeStr}, 排名#${rank}`);
}

function closeResultPopup() {
  const popup = document.getElementById('result-popup');
  if (popup) popup.classList.add('hidden');
}

// ===================== LEADERBOARD =====================
/**
 * 顯示排行榜
 * 優先從 SharePoint List 讀取，失敗時使用本機備份
 */
function showLeaderboard() {
  console.log('📊 顯示排行榜');
  closeResultPopup();
  closeConfirmPopup();
  closeMsgPopup();
  showPage('leaderboard-page');

  // ✅ 從 SharePoint 讀取最新資料
  loadFromSharePoint();
}

function renderLeaderboardTable() {
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = '';

  if (gameState.leaderboard.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:30px; color:#999;">
          尚無遊玩紀錄 / No records yet
        </td>
      </tr>`;
    return;
  }

  let currentRank = 1;
  gameState.leaderboard.forEach((entry, index) => {
    if (index > 0) {
      const prev = gameState.leaderboard[index - 1];
      if (entry.score !== prev.score || Math.abs(entry.time - prev.time) >= 0.01) {
        currentRank = index + 1;
      }
    }
    const timeStr = entry.timeStr || (() => {
      const min = Math.floor(entry.time / 60);
      const sec = Math.floor(entry.time % 60);
      const ms = Math.floor((entry.time % 1) * 100);
      return String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'00') + '.' + String(ms).padStart(2,'00');
    })();
    const row = document.createElement('tr');
    row.innerHTML = `<td>${currentRank}</td><td>${entry.id}</td><td>${entry.score} / 50</td><td>${timeStr}</td>`;
    tbody.appendChild(row);
  });
}

function getTop20WithTies(sortedList) {
  if (sortedList.length <= 20) return sortedList;
  const cutoff = sortedList[19];
  return sortedList.filter((entry, index) => {
    if (index < 20) return true;
    return entry.score === cutoff.score && Math.abs(entry.time - cutoff.time) < 0.01;
  });
}

function searchLeaderboard() {
  const input = document.getElementById('search-rank').value.trim();
  if (!input) {
    showPopup('請輸入工號\nPlease enter Employee ID', '⚠️');
    return;
  }
  const idx = gameState.leaderboard.findIndex(e => e.id === input);
  if (idx !== -1) {
    showPopup(`工號 ${input}\n目前排名第 ${idx + 1} 名\nEmployee ${input} — Rank #${idx + 1}`, '🏆');
  } else {
    showPopup('查無此工號的記錄\nNo record found for this ID', '❌');
  }
}

// ===================== 匯出 CSV =====================
function exportToExcel() {
  if (gameState.leaderboard.length === 0) {
    showPopup('目前沒有排行榜資料\nNo leaderboard data available', '📋');
    return;
  }
  let csv = '排行,工號,分數,時間,日期\nRank,Employee ID,Score,Time,Date\n';
  gameState.leaderboard.forEach((entry, i) => {
    const t = entry.timeStr || '00:00.00';
    csv += `${i + 1},"${entry.id}","${entry.score}/50","${t}","${entry.date}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `EHS-Leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

function loadSampleLeaderboardData() {
  gameState.leaderboard = [
    { id: 'EMP0001', score: 50, time: 120.50, timeStr: '02:00.50', date: '2026-06-07 10:30' },
    { id: 'EMP0002', score: 50, time: 125.30, timeStr: '02:05.30', date: '2026-06-07 10:25' },
    { id: 'EMP0003', score: 45, time: 145.20, timeStr: '02:25.20', date: '2026-06-07 10:20' },
    { id: 'EMP0004', score: 40, time: 180.15, timeStr: '03:00.15', date: '2026-06-07 10:15' },
    { id: 'EMP0005', score: 35, time: 200.80, timeStr: '03:20.80', date: '2026-06-07 10:10' }
  ];
  localStorage.setItem('leaderboard', JSON.stringify(gameState.leaderboard));
}

// ===================== 背景音樂 =====================
// 🔧 替換 BGM 路徑為實際音樂檔案
function playBackgroundMusic() {
  const audio = document.getElementById('bg-music');
  if (audio) {
    audio.volume = 0.3;
    audio.play().catch(e => console.log('音樂播放需要使用者互動:', e));
  }
}

// ===================== DEBUG LOG =====================
console.log('🎮 EHS 互動式電腦線上遊戲 - 代碼已加載');
console.log('✅ 使用 SharePoint List 作為跨裝置排行榜儲存');
console.log('📋 Popup：確認型(popup-modal) / 訊息型(msg-popup) / 結果型(result-popup)');
