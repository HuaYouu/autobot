// Import các thư viện và module cần thiết
const mineflayer = require('mineflayer');
const settings = require('./settings.json');
const { showLoginMenu } = require('./navigation.js');
const BotMovement = require('./modules/movement.js');
const TestMovementModule = require('./modules/testMovement.js');

// Biến để lưu trữ thông tin cấu hình bot
const botArgs = {
  host: settings.host,
  port: settings.port,
  username: settings.username,
  auth: settings.auth,
  // Tăng version để hỗ trợ các thư viện mới tốt hơn
  version: '1.18.2'
};

// Biến toàn cục để quản lý các module
let bot;
let movement;
let testMovement;

// --- Logic chính của Bot sau khi đăng nhập và điều hướng ---
function mainLogic(bot) {
  console.log('*** Bot đã sẵn sàng cho logic chính! ***');

  // 1. Khởi tạo module di chuyển cốt lõi
  movement = new BotMovement(bot, settings);

  // 2. Kiểm tra và khởi tạo module test nếu được bật
  if (settings.testModule.enable) {
    testMovement = new TestMovementModule(bot, settings, movement);
  }

  // Từ đây, bạn có thể phát triển thêm các tính năng khác cho bot
  // Ví dụ: bot.chat('Xin chào, tôi đã online!');
}


// --- Hàm khởi tạo và quản lý Bot ---

/**
 * Tạo và cấu hình một instance bot mới.
 */
function createBot() {
  console.log(`Đang kết nối tới server ${botArgs.host}:${botArgs.port}...`);
  bot = mineflayer.createBot(botArgs);

  // --- Xử lý các sự kiện của Bot ---

  // Sự kiện 'spawn' được kích hoạt khi bot tham gia vào thế giới game
  bot.once('spawn', () => {
    console.log(`Bot "${bot.username}" đã tham gia server thành công.`);

    // Kiểm tra xem có nên chạy kịch bản điều hướng hay không
    if (settings.enableLoginMenu) {
      showLoginMenu(bot, () => mainLogic(bot));
    } else {
      console.log('Bỏ qua kịch bản điều hướng theo cấu hình.');
      mainLogic(bot);
    }
  });

  // Sự kiện 'kicked'
  bot.on('kicked', (reason) => {
    const reasonText = reason ? JSON.parse(reason).text : 'Không rõ lý do';
    console.log(`Bot đã bị kick. Lý do: ${reasonText}`);
    reconnect();
  });

  // Sự kiện 'end'
  bot.on('end', (reason) => {
    console.log(`Bot đã mất kết nối. Lý do: ${reason || 'Không rõ lý do'}`);
    reconnect();
  });

  // Sự kiện 'error'
  bot.on('error', (err) => {
    console.error('Đã xảy ra lỗi với bot:', err);
  });
}

/**
 * Xử lý việc kết nối lại server.
 */
function reconnect() {
    console.log('Sẽ thử kết nối lại sau 30 giây...');
    setTimeout(createBot, 30000);
}


// --- Khởi chạy Bot lần đầu tiên ---
createBot();
