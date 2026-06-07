# 🌲 2026 守護森林安全計畫 - 互動式線上遊戲

**2026 Forest Safety Education Program - Interactive Online Game**

---

## 📋 專案概述 / Project Overview

這是一個為「2026 守護森林安全計畫」設計的互動式電腦線上遊戲平台。遊戲結合安全教育與趣味互動元素，讓員工在遊玩的同時學習企業安全知識。

This is an interactive online game platform designed for the "2026 Forest Safety Education Program." The game combines safety education with engaging interactive elements, allowing employees to learn corporate safety knowledge while playing.

### 🎯 核心功能 / Key Features

- **🎮 首頁遊戲介面** - 以主視覺作為背景的歡迎頁面
- **❓ 互動式測驗系統** - 10題選擇題，每題5分，共50分滿分
- **⏱️ 即時計時系統** - 精確到0.01秒的計時記錄
- **📊 動態排行榜** - 根據分數和用時自動排序
- **🎭 角色資訊視窗** - 點擊5個角色查看相關訊息
- **🎵 背景音樂** - 增強遊戲沉浸感
- **📱 雙語介面** - 完整的中英文支援（微軟正黑體 + Calibri字體）

---

## 📂 檔案結構 / File Structure

```
EHS/
├── index.html          # 主HTML檔案 - 所有頁面的結構定義
├── style.css           # 樣式表 - 配色呼應主視覺(綠色系)
├── game.js             # 核心邏輯 - 遊戲控制、計時、計分
├── README.md           # 本檔案
├── assets/
│   ├── background.png  # 首頁主視覺背景 (2071 × 1170 pixels)
│   ├── background-music.mp3  # 背景音樂檔案
│   └── EHS-guidelines.pdf    # 宣導內容PDF檔案
└── [其他資源]
```

---

## 🎮 遊戲流程 / Game Flow

### 1️⃣ 首頁 (Home Page)
- 顯示主視覺背景
- **左上角按鈕**：
  - "宣導內容（all）"- 下載PDF指南
  - "排行榜" - 查看全部排名
- **中央按鈕**："開始測驗"
- **角色互動**：滑鼠移到5個角色頭附近顯示泡泡訊息

### 2️⃣ 遊戲規則頁面 (Game Rules Page)
- 顯示遊戲規則（目前為占位符圖片）
- "我同意，開始測驗" 按鈕
- **點擊按鈕後**：時間開始計時

### 3️⃣ 測驗頁面 (Quiz Page)
- **一頁顯示2題**，共5頁
- **左側邊欄**：固定顯示計時和計分
  - 時間（精確到0.01秒）
  - 目前分數 (0/50)
- **題目區域**：
  - 題號、中英文題目、4個選項
  - 實時更新分數
- **導航控制**：
  - "上一頁" / "下一頁" 按鈕
  - 頁碼指示器
  - "提交" 按鈕（完成所有題目後啟用）
  - 右上角 "✕" 關閉按鈕

### 4️⃣ 結果頁面 (Result Page)
- 顯示：
  - **分數** (x / 50)
  - **用時** (MM:SS.MS格式)
  - **目前排名** (#x)
- "返回首頁" 按鈕
- **自動寫入排行榜及Google Sheets**

### 5️⃣ 排行榜頁面 (Leaderboard Page)
- **可滾動表格**，包含欄位：
  - 排行 / Rank
  - 工號 / Employee ID
  - 分數 / Score
  - 時間 / Time
- **排序規則**：
  1. 分數越高排越前面
  2. 同分者，時間短的排前面
- **搜尋功能**：輸入工號查詢排名
- "返回首頁" 按鈕

### 6️⃣ 角色資訊視窗 (Character Modal)
- **大小**：主視覺寬度的70%（16:9比例）
- **內容**：
  - 16:9 簡報圖片（目前為占位符）
  - 角色名稱和描述
  - 關閉按鈕
- **顏色**：呼應主視覺色調（綠色系）

---

## 🎨 設計系統 / Design System

### 色彩配置 / Color Palette
- **主綠色**：`#40916c` - 樹木、自然
- **深綠色**：`#2d6a4f` - 文字、強調
- **淺綠色**：`#52b788` - 次要按鈕
- **強調紅色**：`#d62828` - 提交、關閉按鈕
- **背景色**：`#f9f9f9` - 頁面背景

### 字體設定 / Typography
- **中文**：微軟正黑體 (Microsoft JhengHei)
- **英文**：Calibri
- **標題**：28px (黑體)
- **內文**：16px (正常)
- **次要文字**：12-14px (灰色)

### 響應式設計 / Responsive Design
- **目標設備**：電腦端（無需滑動）
- **視窗尺寸**：基於2071×1170背景大小
- **縮放比例**：模態框70%縮放

---

## 🔧 使用方法 / How to Use

### 基本安裝 / Installation

1. **複製所有檔案**到專案目錄
2. **準備資源檔案**：
   - `assets/background.png` - 首頁背景（2071×1170 pixels）
   - `assets/background-music.mp3` - 背景音樂
   - `assets/EHS-guidelines.pdf` - PDF下載檔案

3. **使用本地伺服器開啟**（推薦）：
   ```bash
   # 使用Python簡單伺服器
   python -m http.server 8000
   
   # 或使用Live Server (VS Code 擴充)
   ```

4. **打開瀏覽器**：`http://localhost:8000`

---

## 🎵 背景音樂設定 / Background Music Setup

### 如何加入音樂

1. **準備音樂檔案**：
   - 支援格式：`.mp3`, `.wav`, `.ogg`
   - 建議：`assets/background-music.mp3`

2. **放置位置**：
   ```
   assets/
   └── background-music.mp3
   ```

3. **音樂已自動集成**在 `game.js` 中，功能為：
   - 頁面加載時自動播放（受瀏覽器靜音政策限制）
   - 使用者首次點擊後強制啟動
   - 整個遊戲過程中持續迴圈播放

### 如何修改音樂設定

在 `game.js` 中，找到 `initializeBackgroundMusic()` 函數：

```javascript
/**
 * 初始化背景音樂
 * 修改此區塊以自訂音樂行為
 */
function initializeBackgroundMusic() {
    const audioElement = document.getElementById('background-music');
    
    if (audioElement) {
        audioElement.loop = true;  // ← 改為 false 關閉迴圈
        audioElement.volume = 0.5; // ← 設定音量(0-1)
        
        // 修改自動播放行為...
    }
}
```

### 音樂相關設定參數

| 參數 | 說明 | 修改位置 |
|------|------|---------|
| `loop` | 是否迴圈播放 | `game.js` L18 |
| `volume` | 音量大小(0-1) | 在 `initializeBackgroundMusic()` 函數中新增 |
| `src` | 音樂檔案路徑 | `index.html` L343 |

---

## 📊 資料寫入 / Data Integration

### 排行榜本地存儲
- **儲存位置**：瀏覽器 LocalStorage
- **資料格式**：JSON
- **自動保存**：每次提交時更新

### Google Sheets 整合
- **試算表連結**：https://docs.google.com/spreadsheets/d/1hu-ETXiYleeRwWAIfsfXYyVkEkrNrCTmh9g_ilh3k0I/edit?gid=0#gid=0
- **目前狀態**：⏳ 需要後端支援
- **實現方案**：
  - **方案A**：Google Sheets API + Node.js後端
  - **方案B**：使用Google Apps Script Webhook
  - **方案C**：使用第三方整合服務(如 Zapier)

**實現步驟** (需要開發)：
1. 設定Google Sheets API認證
2. 在 `game.js` 的 `writeToGoogleSheet()` 函數中實現API呼叫
3. 或建立後端端點代理寫入操作

---

## ✏️ 修改與更新 / Customization

### 更改題目
在 `game.js` 中修改 `quizQuestions` 陣列：

```javascript
const quizQuestions = [
    {
        id: 1,
        text: "新題目?",
        textEn: "New question?",
        options: [
            { text: "選項1", textEn: "Option 1" },
            { text: "選項2", textEn: "Option 2" },
            { text: "選項3", textEn: "Option 3" },
            { text: "選項4", textEn: "Option 4" }
        ],
        correct: 0  // 正確答案的索引(0-3)
    },
    // ... 更多題目
];
```

### 更改背景圖
在 `index.html` 中修改背景圖路徑：
```html
<img src="assets/background.png" alt="Background" class="background-image">
```

### 更改角色訊息
在 `game.js` 中修改 `openCharacterModal()` 函數的 `characterData` 物件：

```javascript
const characterData = {
    1: {
        name: '新角色名稱',
        description: '新的描述文字'
    },
    // ...
};
```

### 更改色系
在 `style.css` 中全域修改顏色變數（目前使用直接色碼）：

```css
/* 主綠色 - 修改此處改變整體配色 */
.btn-primary, .btn-agree, .time-score-box, etc. {
    background-color: #40916c;  /* ← 改此色碼 */
}
```

---

## 🐛 程式碼組織 / Code Organization

### HTML (`index.html`)
- ✅ **功能分區標籤**：每個區塊都有HTML註解說明
- 📄 首頁頁面 (HOME PAGE)
- ❓ 遊戲規則頁面 (GAME RULES PAGE)
- 🎮 測驗頁面 (QUIZ PAGE)
- 📈 結果頁面 (QUIZ RESULT PAGE)
- 📊 排行榜頁面 (LEADERBOARD PAGE)
- 🎭 角色模態框 (CHARACTER MODAL)

### CSS (`style.css`)
- ✅ **清晰的分區註解**
- 🎨 全域樣式 (GLOBAL STYLES)
- 📦 容器樣式 (APP CONTAINER)
- 🏠 首頁樣式 (HOME PAGE STYLES)
- 🔘 按鈕樣式 (BUTTON STYLES)
- 💬 角色氣泡 (CHARACTER HOTSPOT & BUBBLE)
- 🎮 測驗區域 (QUIZ PAGE)
- 📊 排行榜區域 (LEADERBOARD PAGE)

### JavaScript (`game.js`)
- ✅ **詳細的函數文件註解**（JSDoc格式）
- 🎮 全域變數 (GLOBAL VARIABLES)
- 🎵 背景音樂 (BACKGROUND MUSIC FUNCTIONS)
- 📍 頁面導航 (PAGE NAVIGATION FUNCTIONS)
- ❓ 題目渲染 (QUIZ FUNCTIONS)
- 📊 排行榜 (LEADERBOARD FUNCTIONS)
- 🎭 角色互動 (CHARACTER MODAL FUNCTIONS)
- 🛠️ 工具函數 (UTILITY FUNCTIONS)

---

## 📝 待辦項目 / TODO List

- [ ] 完成Google Sheets API整合（後端開發）
- [ ] 製作實際的遊戲規則圖片替換佔位符
- [ ] 製作5個角色對應的簡報圖片（16:9）
- [ ] 準備並上傳背景音樂檔案
- [ ] 製作PDF宣導檔案
- [ ] 測試不同瀏覽器相容性
- [ ] 優化行動設備支援（如需要）
- [ ] 新增音效效果（點擊、提交等）
- [ ] 實現使用者登入系統（工號驗證）
- [ ] 新增結果分析儀表板

---

## 🌐 瀏覽器支援 / Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ IE 11（不建議）

---

## 📄 授權 / License

© 2026 Micron Taiwan - EHS Department

---

## 📞 聯絡方式 / Contact

如有問題或建議，請聯絡EHS相關部門。

For questions or suggestions, please contact the EHS department.

---

## 🔄 版本記錄 / Version History

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0 | 2026-06-07 | 初始版本上線 |
| - | - | 待更新... |

---

**上次更新 / Last Updated**: 2026-06-07

**開發者 / Developer**: EHS Game Development Team
