// Import các thư viện và module cốt lõi
const mineflayer = require('mineflayer');
const settings = require('./settings.json');
const { showLoginMenu } = require('./navigation.js');

// Import các module tiện ích và quản lý
const BotMovement = require('./modules/utils/movement.js');
const ModuleManager = require('./modules/ModuleManager.js');

// Import các module chức năng
const MovementControllerModule = require('./modules/features/movementController.js');
const CommandManagerModule = require('./modules/features/commandManager.js');

/**
 * Hàm chính để khởi tạo và quản lý bot.
 */
function createBot() {
  console.log(`Đang kết nối tới server ${settings.host}:${settings.port}...`);

  const bot = mineflayer.createBot({
    host: settings.host,
    port: settings.port,
    username: settings.username,
    auth: settings.auth,
    version: settings.version || '1.18.2',
  });

  // --- Giai đoạn 1: Bot Spawn và Điều hướng ---
  bot.once('spawn', () => {
    console.log(`Bot "${bot.username}" đã tham gia server.`);

    // Nếu có kịch bản điều hướng, chạy nó trước
    if (settings.enableLoginMenu) {
      showLoginMenu(bot, () => initializeMainLogic(bot));
    } else {
      initializeMainLogic(bot);
    }
  });

  // --- Xử lý các sự kiện kết nối ---
  bot.on('kicked', (reason) => handleDisconnect(`Bị kick: ${reason ? JSON.parse(reason).text : 'Không rõ lý do'}`));
  bot.on('end', (reason) => handleDisconnect(`Mất kết nối: ${reason || 'Không rõ lý do'}`));
  bot.on('error', (err) => console.error('Lỗi bot:', err));

  function handleDisconnect(logMessage) {
    console.log(logMessage);
    console.log('Sẽ thử kết nối lại sau 30 giây...');
    setTimeout(createBot, 30000);
  }
}

/**
 * Khởi tạo logic chính sau khi bot đã sẵn sàng.
 * @param {import('mineflayer').Bot} bot
 */
function initializeMainLogic(bot) {
  console.log('*** Bắt đầu khởi tạo hệ thống module ***');

  // --- Giai đoạn 2: Khởi tạo các hệ thống cốt lõi ---
  const movementUtil = new BotMovement(bot, { movement: settings.movementOptions });
  const moduleManager = new ModuleManager(bot, settings);

  // --- Giai đoạn 3: Đăng ký các module chức năng ---
  const movementController = new MovementControllerModule(bot, settings.modules.movementController, movementUtil);
  moduleManager.register('movementController', movementController);

  const commandManager = new CommandManagerModule(bot, settings.modules.commandManager, moduleManager);
  moduleManager.register('commandManager', commandManager);

  // --- Giai đoạn 4: Kích hoạt các module theo cấu hình ---
  moduleManager.initializeModules();

  console.log('*** Bot đã sẵn sàng hoạt động! ***');
}

// --- Khởi chạy Bot lần đầu tiên ---
createBot();
