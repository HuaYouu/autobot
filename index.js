const readline = require('readline');
const BotManager = require('./BotManager.js');
const settings = require('./settings.json');

// --- Khởi tạo ---
const botManager = new BotManager();

/**
 * Tự động khởi động các bot được đánh dấu `enabled_on_startup: true`.
 */
function startInitialBots() {
  console.log('Đang khởi động các bot ban đầu...');
  for (const botName in settings.bots) {
    const botConfig = settings.bots[botName];
    if (botConfig.enabled_on_startup) {
      botManager.startBot(botName, botConfig);
    }
  }
}

/**
 * Thiết lập giao diện dòng lệnh (CLI).
 */
function setupCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', (line) => {
    const args = line.trim().split(' ');
    const command = args.shift().toLowerCase();

    switch (command) {
      case 'start':
        if (args.length < 1) {
          console.log('Sử dụng: start <tên_bot>');
        } else {
          const botName = args[0];
          const botConfig = settings.bots[botName];
          if (botConfig) {
            botManager.startBot(botName, botConfig);
          } else {
            console.log(`Không tìm thấy cấu hình cho bot "${botName}".`);
          }
        }
        break;

      case 'stop':
        if (args.length < 1) {
          console.log('Sử dụng: stop <tên_bot>');
        } else {
          botManager.stopBot(args[0]);
        }
        break;

      case 'list':
        const runningBots = botManager.listBots();
        if (runningBots.length === 0) {
          console.log('Không có bot nào đang chạy.');
        } else {
          console.log('Các bot đang chạy:', runningBots.join(', '));
        }
        break;

      case 'exit':
        console.log('Đang dừng tất cả các bot và thoát...');
        botManager.listBots().forEach(botName => botManager.stopBot(botName));
        rl.close();
        process.exit(0);
        break;

      default:
        console.log('Lệnh không xác định. Các lệnh có sẵn: start, stop, list, exit');
        break;
    }

    rl.prompt();
  }).on('close', () => {
    console.log('CLI đã đóng.');
    process.exit(0);
  });
}

// --- Chạy ứng dụng ---
startInitialBots();
setupCLI();
