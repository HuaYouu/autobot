const mineflayer = require('mineflayer');
const path = require('path');
const { EventEmitter } = require('events');
const { showLoginMenu } = require('./navigation.js');
const autoAuth = require('./modules/utils/autoAuth.js');

const BotMovement = require('./modules/utils/movement.js');
const ModuleManager = require('./modules/ModuleManager.js');

// Import feature modules
const CombatManager = require('./modules/features/combatManager.js');

/**
 * Represents an independent bot instance, managing its own lifecycle and emitting events.
 * @extends EventEmitter
 */
class BotInstance extends EventEmitter {
  /**
   * @param {string} name - The identifier for the bot.
   * @param {object} config - The full configuration object for this bot.
   */
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.bot = null;
    this.moduleManager = null;
    this.currentStatus = 'stopped'; // Thêm trạng thái ban đầu
  }

  /**
   * Starts the bot.
   */
  start() {
    this.log('Đang khởi động...');
    this.currentStatus = 'connecting';
    this.emit('status', 'connecting');

    this.bot = mineflayer.createBot({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      auth: this.config.auth,
      version: this.config.version || false,
    });

    autoAuth(this.bot, this.config);

    this.bot.once('spawn', this.onSpawn.bind(this));
    this.bot.on('kicked', (reason) => this.onDisconnect(`Bị kick: ${reason ? JSON.parse(reason).text : 'Không rõ lý do'}`));
    this.bot.on('end', (reason) => this.onDisconnect(`Mất kết nối: ${reason || 'Không rõ lý do'}`));
    this.bot.on('error', (err) => this.log(`Lỗi bot: ${err.message}`));
  }

  /**
   * Safely stops the bot.
   */
  stop() {
    this.log('Đang dừng...');
    if (this.bot) {
      this.bot.quit();
    }
  }

  /**
   * Handles the bot spawning into the world.
   * @private
   */
  onSpawn() {
    this.log('Đã spawn vào server.');
    this.currentStatus = 'online';
    this.emit('status', 'online');

    const loginScriptPath = path.join(__dirname, '..', this.config.loginScript || 'login_manual.txt');

    if (this.config.enableLoginMenu) {
      showLoginMenu(this.bot, loginScriptPath, () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  /**
   * Initializes the module system for this bot.
   * @private
   */
  initializeModules() {
    this.log('Đang khởi tạo hệ thống module...');

    // This is problematic for a UI app. We need a better way to manage settings.
    // For now, we'll assume settings are passed in config.
    const fullSettings = this.config.settings || {};

    this.moduleManager = new ModuleManager(this.bot, this.name, fullSettings);

    // Register modules
    if (this.config.modules.combatManager) {
      const movementUtil = new BotMovement(this.bot, { movement: this.config.movementOptions });
      const combatManager = new CombatManager(this.bot, this.config.modules.combatManager, movementUtil);
      this.moduleManager.register('combatManager', combatManager);
    }

    this.moduleManager.initializeModules();

    this.log('Đã sẵn sàng hoạt động!');
    this.emit('status', 'ready');
  }

  /**
   * Handles disconnection.
   * @param {string} logMessage - The message to log.
   * @private
   */
  onDisconnect(logMessage) {
    this.log(logMessage);
    this.currentStatus = 'disconnected';
    this.emit('status', 'disconnected');
  }

  /**
   * Emits a log message.
   * @param {string} message - The message to log.
   */
  log(message) {
    console.log(`[${this.name}] ${message}`); // Keep console log for backend debugging
    this.emit('log', `[${this.name}] ${message}`);
  }

  /**
   * Lấy trạng thái đầy đủ của bot, bao gồm trạng thái kết nối và trạng thái của các module.
   * @returns {{botStatus: string, moduleStates: Object<string, boolean>}}
   */
  getFullState() {
    const moduleStates = this.moduleManager ? this.moduleManager.getModuleStates() : {};
    return {
      botStatus: this.currentStatus,
      moduleStates: moduleStates,
    };
  }
}

module.exports = BotInstance;
