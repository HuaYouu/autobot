const { EventEmitter } = require('events');
const BotInstance = require('./BotInstance.js');

/**
 * Manages the creation and running of multiple bot instances, and aggregates their events.
 * @extends EventEmitter
 */
class BotManager extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, BotInstance>} */
    this.runningBots = new Map();
  }

  /**
   * Starts a new bot.
   * @param {string} name - The identifier for the bot.
   * @param {object} config - The configuration for the bot.
   */
  startBot(name, config) {
    if (this.runningBots.has(name)) {
      this.emit('log', `[BotManager] Bot "${name}" is already running.`);
      return;
    }

    this.emit('log', `[BotManager] Requesting to start bot "${name}"...`);
    const botInstance = new BotInstance(name, config);

    // Bubble up events from the instance
    botInstance.on('log', (message) => {
      this.emit('log', message);
    });
    botInstance.on('status', (status) => {
      this.emit('bot-status-update', { botName: name, status });
    });

    this.runningBots.set(name, botInstance);
    botInstance.start();
  }

  /**
   * Stops a running bot.
   * @param {string} name - The name of the bot.
   */
  stopBot(name) {
    const botInstance = this.runningBots.get(name);
    if (!botInstance) {
      this.emit('log', `[BotManager] Bot "${name}" is not running or does not exist.`);
      return;
    }

    this.emit('log', `[BotManager] Requesting to stop bot "${name}"...`);
    // Remove listeners to prevent memory leaks
    botInstance.removeAllListeners();
    botInstance.stop();
    this.runningBots.delete(name);
    // Notify UI that the bot is stopped
    this.emit('bot-status-update', { botName: name, status: 'stopped' });
  }

  /**
   * Toggles a bot on or off.
   * @param {string} name - The bot's name.
   * @param {boolean} state - `true` to turn on, `false` to turn off.
   * @param {object} config - Configuration needed to start the bot if `state` is `true`.
   */
  toggleBot(name, state, config) {
      if (state) {
          this.startBot(name, config);
      } else {
          this.stopBot(name);
      }
  }

  /**
   * Lists all running bots.
   * @returns {string[]} A list of running bot names.
   */
  listBots() {
    return Array.from(this.runningBots.keys());
  }

  /**
   * Toggles a module for a specific bot.
   * @param {string} botName - The name of the bot.
   * @param {string} moduleName - The name of the module.
   * @param {boolean} state - `true` to enable, `false` to disable.
   */
  toggleModule(botName, moduleName, state) {
    const botInstance = this.runningBots.get(botName);
    if (!botInstance) {
      this.emit('log', `[BotManager] Bot "${botName}" is not running or does not exist.`);
      return;
    }
    if (!botInstance.moduleManager) {
      this.emit('log', `[BotManager] Bot "${botName}"'s ModuleManager is not ready yet.`);
      return;
    }
    this.emit('log', `[BotManager] Requesting to ${state ? 'enable' : 'disable'} module "${moduleName}" for bot "${botName}"...`);
    botInstance.moduleManager.toggle(moduleName, state);
  }

  /**
   * Cập nhật các tùy chọn cho một module của một bot cụ thể.
   * @param {string} botName - Tên của bot.
   * @param {string} moduleName - Tên của module.
   * @param {object} newOptions - Các tùy chọn mới.
   */
  updateModuleOptions(botName, moduleName, newOptions) {
    const botInstance = this.runningBots.get(botName);
    if (!botInstance || !botInstance.moduleManager) {
      this.emit('log', `[BotManager] Bot "${botName}" is not ready to update module options.`);
      return;
    }
    this.emit('log', `[BotManager] Requesting to update options for module "${moduleName}" for bot "${botName}"...`);
    botInstance.moduleManager.updateModuleOptions(moduleName, newOptions);
  }
}

module.exports = BotManager;
