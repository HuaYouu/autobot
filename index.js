// Import thư viện mineflayer và module navigation
const mineflayer = require('mineflayer');
const { showLoginMenu } = require('./navigation.js');
const settings = require('./settings.json');

// Biến để lưu trữ thông tin cấu hình bot
const botArgs = {
  host: settings.host,
  port: settings.port,
  username: settings.username,
  auth: settings.auth,
};

// --- Logic chính của Bot ---
function mainLogic(bot) {
  console.log('*** Bot đã sẵn sàng cho logic chính! ***');
  // Từ đây, bạn có thể phát triển thêm các tính năng khác cho bot.
  // Ví dụ: bot.chat('Xin chào, tôi là một con bot!');
}


// --- Hàm khởi tạo và quản lý Bot ---
let bot; // Biến để giữ instance của bot

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
      // Gọi hàm điều hướng và truyền vào callback để kích hoạt logic chính
      showLoginMenu(bot, () => mainLogic(bot));
    } else {
      // Nếu không bật, đi thẳng vào logic chính
      console.log('Bỏ qua kịch bản điều hướng theo cấu hình.');
      mainLogic(bot);
    }
  });

  // Sự kiện 'kicked' được kích hoạt khi bot bị kick khỏi server
  bot.on('kicked', (reason) => {
    const reasonText = reason ? JSON.parse(reason).text : 'Không rõ lý do';
    console.log(`Bot đã bị kick. Lý do: ${reasonText}`);
    reconnect();
  });

  // Sự kiện 'end' được kích hoạt khi bot mất kết nối
  bot.on('end', (reason) => {
    console.log(`Bot đã mất kết nối. Lý do: ${reason || 'Không rõ lý do'}`);
    reconnect();
  });

  // Sự kiện 'error' để bắt các lỗi không mong muốn
  bot.on('error', (err) => {
    console.error('Đã xảy ra lỗi với bot:', err);
    // Không gọi reconnect ở đây để tránh vòng lặp lỗi kết nối
  });
}

/**
 * Xử lý việc kết nối lại server sau một khoảng thời gian.
 */
function reconnect() {
    console.log('Sẽ thử kết nối lại sau 30 giây...');
    setTimeout(createBot, 30000); // Chờ 30 giây rồi tạo lại bot
}


// --- Khởi chạy Bot lần đầu tiên ---
createBot();
