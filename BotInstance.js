const mineflayer = require('mineflayer');
const path = require('path');
const { showLoginMenu } = require('./navigation.js');
const autoAuth = require('./modules/utils/autoAuth.js');

const BotMovement = require('./modules/utils/movement.js');
const ModuleManager = require('./modules/ModuleManager.js');

// Import các module chức năng
const CombatManager = require('./modules/features/combatManager.js');

/**
 * Đại diện cho một instance bot độc lập, quản lý vòng đời của chính nó.
 */
class BotInstance {
  /**
   * @param {string} name - Tên định danh của bot.
   * @param {object} config - Đối tượng cấu hình đầy đủ cho bot này.
   */
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.bot = null; // mineflayer bot instance
    this.moduleManager = null;
  }

  /**
   * Khởi động bot.
   */
  start() {
    console.log(`[${this.name}] Đang khởi động...`);

    this.bot = mineflayer.createBot({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      auth: this.config.auth,
      version: this.config.version || false,
    });

    // Gắn module auto-auth nếu có mật khẩu
    autoAuth(this.bot, this.config);

    // Gắn các listener sự kiện cốt lõi
    this.bot.once('spawn', this.onSpawn.bind(this));
    this.bot.on('kicked', (reason) => this.onDisconnect(`Bị kick: ${reason ? JSON.parse(reason).text : 'Không rõ lý do'}`));
    this.bot.on('end', (reason) => this.onDisconnect(`Mất kết nối: ${reason || 'Không rõ lý do'}`));
    this.bot.on('error', (err) => console.error(`[${this.name}] Lỗi bot:`, err));
  }

  /**
   * Dừng bot một cách an toàn.
   */
  stop() {
    console.log(`[${this.name}] Đang dừng...`);
    if (this.bot) {
      this.bot.quit();
    }
  }

  /**
   * Xử lý khi bot spawn vào thế giới.
   * @private
   */
  onSpawn() {
    console.log(`[${this.name}] Đã spawn vào server.`);

    const loginScriptPath = path.join(__dirname, this.config.loginScript || 'login_manual.txt');

    if (this.config.enableLoginMenu) {
      showLoginMenu(this.bot, loginScriptPath, () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  /**
   * Khởi tạo hệ thống module cho bot này.
   * @private
   */
  initializeModules() {
    console.log(`[${this.name}] Đang khởi tạo hệ thống module...`);

    const movementUtil = new BotMovement(this.bot, { movement: this.config.movementOptions });
    // ModuleManager cần toàn bộ file settings để có thể ghi lại
    const fullSettings = require('./settings.json');
    this.moduleManager = new ModuleManager(this.bot, this.name, fullSettings);

    // Đăng ký các module
    if (this.config.modules.combatManager) {
      const combatManager = new CombatManager(this.bot, this.config.modules.combatManager, movementUtil);
      this.moduleManager.register('combatManager', combatManager);
    }

    this.moduleManager.initializeModules();

    console.log(`[${this.name}] Đã sẵn sàng hoạt động!`);
  }

  /**
   * Xử lý khi mất kết nối.
   * @param {string} logMessage - Thông điệp để ghi log.
   * @private
   */
  onDisconnect(logMessage) {
    console.log(`[${this.name}] ${logMessage}`);
    // BotManager sẽ xử lý việc khởi động lại nếu cần
  }
}

module.exports = BotInstance;
