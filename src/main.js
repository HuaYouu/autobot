const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const BotManager = require('./backend/BotManager.js');

const botManager = new BotManager();
let mainWindow;
let botConfigs; // Cache for bot configurations

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/frontend/index.html');
  mainWindow.webContents.openDevTools();
}

// Function to read settings
async function loadBotConfigs() {
    try {
        const configPath = path.join(__dirname, '..', 'settings.json');
        const data = await fs.promises.readFile(configPath, 'utf8');
        botConfigs = JSON.parse(data);
        return botConfigs;
    } catch (error) {
        console.error('Failed to read settings.json:', error);
        botConfigs = null;
        return null;
    }
}


app.whenReady().then(async () => {
  await loadBotConfigs();
  createWindow();

  // Forward events from BotManager to the renderer
  botManager.on('log', (message) => {
    if (mainWindow) {
      mainWindow.webContents.send('log-message', message);
    }
  });

  botManager.on('bot-status-update', (update) => {
    if (mainWindow) {
      mainWindow.webContents.send('bot-status-update', update);
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-bot-configs', async () => {
  return botConfigs || await loadBotConfigs();
});

ipcMain.handle('get-bot-state', (event, botName) => {
    const botInstance = botManager.runningBots.get(botName);
    if (botInstance) {
        return botInstance.getFullState();
    }
    // Nếu bot không chạy, trả về trạng thái mặc định
    return {
        botStatus: 'stopped',
        moduleStates: {},
    };
});

ipcMain.on('toggle-bot', (event, { botName, state }) => {
    console.log(`Main: Received toggle-bot for ${botName} to ${state}`);
    if (state) {
        if (!botConfigs || !botConfigs.bots[botName]) {
            console.error(`Error: No configuration found for bot "${botName}".`);
            mainWindow.webContents.send('log-message', `[System] Lỗi: Không tìm thấy cấu hình cho bot "${botName}".`);
            return;
        }
        const config = { ...botConfigs.bots[botName], settings: botConfigs }; // Pass full settings
        botManager.toggleBot(botName, state, config);
    } else {
        botManager.toggleBot(botName, state, null); // No config needed to stop
    }
});

ipcMain.on('toggle-module', (event, { botName, moduleName, state }) => {
    console.log(`Main: Received toggle-module for ${botName}, ${moduleName} to ${state}`);
    botManager.toggleModule(botName, moduleName, state);
});

ipcMain.on('send-command', (event, { botName, command }) => {
    console.log(`Main: Received command for ${botName}: ${command}`);
    const botInstance = botManager.runningBots.get(botName);
    if (botInstance && botInstance.bot && botInstance.bot.state === 'spawned') {
        botInstance.bot.chat(command);
        mainWindow.webContents.send('log-message', `[${botName}] > ${command}`);
    } else {
        const message = `[System] Bot "${botName}" chưa sẵn sàng để nhận lệnh.`;
        console.log(message);
        mainWindow.webContents.send('log-message', message);
    }
});
