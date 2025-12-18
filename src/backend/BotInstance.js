const mineflayer = require('mineflayer');
const path = require('path');
const { EventEmitter } = require('events');
const { showLoginMenu } = require('./navigation.js');
const autoAuth = require('./modules/utils/autoAuth.js');

const BotMovement = require('./modules/utils/movement.js');
const ModuleManager = require('./modules/ModuleManager.js');

// Import feature modules
const CombatManager = require('./modules/features/combatManager.js');

class BotInstance extends EventEmitter {
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.bot = null;
    this.moduleManager = null;
    this.movementUtil = null;
    this.currentStatus = 'stopped';
  }

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

    const movementEvents = ['movement_started', 'movement_stopped', 'movement_reached', 'movement_failed'];
    movementEvents.forEach(eventName => {
      this.bot.on(eventName, (err) => {
        this.emit('movement-update', { event: eventName, error: err ? err.message : null });
      });
    });

    autoAuth(this.bot, this.config);

    this.bot.once('spawn', this.onSpawn.bind(this));
    this.bot.on('kicked', (reason) => this.onDisconnect(`Bị kick: ${reason ? JSON.parse(reason).text : 'Không rõ lý do'}`));
    this.bot.on('end', (reason) => this.onDisconnect(`Mất kết nối: ${reason || 'Không rõ lý do'}`));
    this.bot.on('error', (err) => this.log(`Lỗi bot: ${err.message}`));
  }

  stop() {
    this.log('Đang dừng...');
    if (this.bot) {
      this.bot.quit();
    }
  }

  onSpawn() {
    this.log('Đã spawn vào server.');
    this.currentStatus = 'online';
    this.emit('status', 'online');

    // Initialize utilities that require the bot to be spawned
    this.movementUtil = new BotMovement(this.bot);
    this.movementUtil.configure();

    const loginScriptPath = path.join(__dirname, '..', this.config.loginScript || 'login_manual.txt');
    if (this.config.enableLoginMenu) {
      showLoginMenu(this.bot, loginScriptPath, () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  initializeModules() {
    this.log('Đang khởi tạo hệ thống module...');
    const fullSettings = this.config.settings || {};
    this.moduleManager = new ModuleManager(this.bot, this.name, fullSettings);

    if (this.config.modules.combatManager) {
      const combatManager = new CombatManager(this.bot, this.config.modules.combatManager, this.movementUtil);
      this.moduleManager.register('combatManager', combatManager);
    }

    this.moduleManager.initializeModules();
    this.log('Đã sẵn sàng hoạt động!');
    this.emit('status', 'ready');
  }

  onDisconnect(logMessage) {
    this.log(logMessage);
    this.currentStatus = 'disconnected';
    this.emit('status', 'disconnected');
  }

  log(message) {
    console.log(`[${this.name}] ${message}`);
    this.emit('log', `[${this.name}] ${message}`);
  }

  getFullState() {
    const moduleStates = this.moduleManager ? this.moduleManager.getModuleStates() : {};
    return {
      botStatus: this.currentStatus,
      moduleStates: moduleStates,
    };
  }

  moveTo(x, y, z) {
    if (this.movementUtil) {
      this.movementUtil.moveTo(x, y, z).catch(err => this.log(`Movement failed: ${err.message}`));
    } else {
      this.log('Movement utility is not initialized.');
    }
  }

  stopMovement() {
    if (this.movementUtil) {
      this.movementUtil.stop();
    } else {
      this.log('Movement utility is not initialized.');
    }
  }
}

module.exports = BotInstance;
