# Rainbow Pony Quiz Game 🦄

這是一個為國小學童設計的「Rainbow Pony」主題網頁問答遊戲，採用 React + Vite 開發，並使用 Google Sheets 與 Google Apps Script (GAS) 作為不需伺服器的簡易後端資料庫。

## 🚀 環境安裝與啟動

1. 確保電腦已安裝 [Node.js](https://nodejs.org/) (建議 v18 以上)。
2. 在專案目錄下執行以下指令安裝套件：
   ```bash
   npm install
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

---

## ☁️ Google Sheets & Apps Script (GAS) 後端建置教學

這個遊戲依賴 Google Apps Script (GAS) 來讀寫玩家資料 (金幣、擁有造型) 以及管理題庫。請按照以下詳細步驟完成後端建置：

### 第一步：建立 Google 試算表 (Database)

1. 開啟 [Google 試算表 (Google Sheets)](https://docs.google.com/spreadsheets/)。
2. 點擊「空白」建立一個新的試算表，請將檔名命名為「`遊戲資料庫`」或任何你喜歡的名稱。
3. 在下方的工作表分頁列，建立以下三個工作表 (Sheet)，**名稱請完全一致**：
   * `Players`
   * `Inventory`
   * `Questions`
4. **設定標題列 (第一列)**：
   * 在 `Players` 工作表的第一列輸入：`id, username, grade, score, coins, lastLogin`
   * 在 `Inventory` 工作表的第一列輸入：`id, ownedSkins, equippedSkin`
   * 在 `Questions` 工作表的第一列輸入：`科目, 年級, 題號, 題目, A, B, C, D, 解答`

### 第二步：匯入題庫資料 (匯入 CSV)

1. 切換到 `Questions` 工作表。
2. 點擊選單列的 **「檔案」 -> 「匯入」**。
3. 選擇「上傳」分頁，並把專案目錄底下的 `questions.csv` 檔案拖曳進去。
4. 匯入選項選擇 **「取代目前的工作表」**，分隔符號選擇「自動偵測」。
5. 點選「匯入資料」，確認 180 題題庫已正確載入。

### 第三步：建立 Google Apps Script (GAS)

1. 回到 Google 試算表畫面。
2. 點擊頂部選單的 **「擴充功能」 -> 「Apps Script」**。
3. 進入 Apps Script 編輯器後，將預設的 `程式碼.gs` 裡面的內容全部清空。
4. 將以下程式碼複製並貼上：

\`\```javascript
function doPost(e) {
  // 防呆：若無 POST body（例如直接用瀏覽器開啟），回傳說明訊息
  if (!e || !e.postData) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Please call via POST request" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;
  const data = payload.data || {};

  let responseData = { status: "success" };

  try {
    if (action === "login") {
      const { username, grade } = data;
      const playerSheet = sheet.getSheetByName("Players");
      const inventorySheet = sheet.getSheetByName("Inventory");
      
      const rows = playerSheet.getDataRange().getValues();
      let userFound = false;
      let userId = "user_" + Date.now();
      let coins = 0;
      let score = 0;
      let ownedSkins = ["default_1"];

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === username) {
          userFound = true;
          userId = rows[i][0];
          score = rows[i][3] || 0;
          coins = rows[i][4] || 0;
          
          const invData = inventorySheet.getDataRange().getValues();
          for (let j = 1; j < invData.length; j++) {
            if (invData[j][0] === userId) {
              ownedSkins = invData[j][1] ? JSON.parse(invData[j][1]) : ["default_1"];
              break;
            }
          }
          break;
        }
      }

      if (!userFound) {
        playerSheet.appendRow([userId, username, grade, score, coins, new Date()]);
        inventorySheet.appendRow([userId, JSON.stringify(ownedSkins), "default_1"]);
      }

      responseData = {
        profile: { id: userId, username, grade, score, coins },
        inventory: { ownedSkins, equippedSkin: "default_1" }
      };

    } else if (action === "updateCoins") {
      const { userId, amount } = data;
      const playerSheet = sheet.getSheetByName("Players");
      const rows = playerSheet.getDataRange().getValues();
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === userId) {
          playerSheet.getRange(i + 1, 5).setValue(amount);
          break;
        }
      }
      
    } else if (action === "updateInventory") {
      const { userId, ownedSkins } = data;
      const inventorySheet = sheet.getSheetByName("Inventory");
      const rows = inventorySheet.getDataRange().getValues();
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === userId) {
          inventorySheet.getRange(i + 1, 2).setValue(JSON.stringify(ownedSkins));
          break;
        }
      }
      
    } else if (action === "getQuestions") {
      const { subject, grade } = data;
      const questionSheet = sheet.getSheetByName("Questions");
      const rows = questionSheet.getDataRange().getValues();
      let questions = [];

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === subject && parseInt(rows[i][1]) === parseInt(grade)) {
          questions.push({
            id: subject + "_" + grade + "_" + rows[i][2],
            text: rows[i][3],
            options: [
              { text: rows[i][4], isCorrect: rows[i][8] === 'A' },
              { text: rows[i][5], isCorrect: rows[i][8] === 'B' },
              { text: rows[i][6], isCorrect: rows[i][8] === 'C' },
              { text: rows[i][7], isCorrect: rows[i][8] === 'D' }
            ]
          });
        }
      }
      responseData = { questions: questions };
    }
  } catch (error) {
    responseData = { status: "error", message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// 提供基本的 GET 回應供瀏覽器測試連線是否正常
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Rainbow Pony GAS is running!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```\`\`

5. 點擊編輯器上方的 **「儲存儲存專案 (💾 磁碟片圖示)」**。你可以將專案名稱改為「Rainbow Pony Backend」。

### 第四步：部署並取得 Web App URL

1. 點擊編輯器右上角的 **「部署」 -> 「新增部署作業」**。
2. 在彈出的視窗左上角，點選齒輪圖示 ⚙️，選擇 **「網頁應用程式 (Web App)」**。
3. 填寫設定：
   * **說明**：隨意填寫 (例如：`v1.0 初始版本`)。
   * **執行身分**：選擇 **「我 (你自己的 Google 帳號)」**。
   * **誰可以存取**：選擇 **「所有人 (Anyone)」**。 (⚠️ 務必選擇此選項，否則前端遊戲無法連接)。
4. 點擊 **「部署」**。
5. **授權存取**：Google 會跳出警告視窗要求授權存取試算表。
   * 點擊「授權存取」。
   * 選擇你的 Google 帳號。
   * 會看到「Google 尚未驗證這個應用程式」，請點擊左下角的「進階」，然後點選底部的「前往『你的專案名稱』(不安全)」。
   * 點擊「允許」。
6. 部署完成後，你會得到一個 **「網頁應用程式網址 (Web app URL)」** (看起來像 `https://script.google.com/macros/s/xxxx/exec`)。
7. **請將這串網址複製下來**。

### 第五步：設定前端的環境變數

1. 回到你的 VS Code 專案目錄 `c:\Users\USER\.gemini\antigravity\scratch\pony-game`。
2. 在專案根目錄下，建立一個名為 `.env` 的新檔案。
3. 在 `.env` 檔案中加入剛才複製的網址：
   ```env
   VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/這裡貼上你剛剛複製的那一長串/exec
   ```
4. **重新啟動前端伺服器**：如果在執行 `npm run dev`，請在終端機按 `Ctrl + C` 終止，然後再次輸入 `npm run dev` 啟動。

---

🎉 **大功告成！** 現在你的遊戲已經完全連接到了真實的 Google Sheets 後端，登入進度、金幣、買的造型都會永久保存了！

---

## 🚀 部署到 GitHub Pages

本專案已同步設定 GitHub Actions，當你推送到 `main` 分支時會自動部署。

### 設定步驟：

1. **GitHub Repository 設定**：將專案上傳至 GitHub。
2. **設定 Secrets**：
   - 到 GitHub 專案的 `Settings` -> `Secrets and variables` -> `Actions`。
   - 新增資密 (New repository secret)，名稱為 `VITE_GOOGLE_APP_SCRIPT_URL`，內容填入你的 GAS `/exec` 網址。
3. **開啟 Pages**：
   - 到 `Settings` -> `Pages`，將 `Build and deployment` 的 `Branch` 設為 `gh-pages`。
4. **自動部署**：
   - 之後每次 `git push origin main`，GitHub 就會自動更新你的線上遊戲網站囉！
