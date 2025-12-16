const BotInstance = require('./BotInstance.js');

/**
 * Quản lý việc tạo và chạy nhiều instance bot.
 */
class BotManager {
  constructor() {
    /** @type {Map<string, BotInstance>} */
    this.runningBots = new Map();
  }

  /**
   * Khởi động một bot mới.
   * @param {string} name - Tên định danh của bot.
   * @param {object} config - Cấu hình cho bot.
   */
  startBot(name, config) {
    if (this.runningBots.has(name)) {
      console.log(`Bot "${name}" đã đang chạy.`);
      return;
    }

    console.log(`BotManager: Yêu cầu khởi động bot "${name}"...`);
    const botInstance = new BotInstance(name, config);
    this.runningBots.set(name, botInstance);
    botInstance.start();
  }

  /**
   * Dừng một bot đang chạy.
   * @param {string} name - Tên của bot.
   */
  stopBot(name) {
    const botInstance = this.runningBots.get(name);
    if (!botInstance) {
      console.log(`Bot "${name}" không đang chạy hoặc không tồn tại.`);
      return;
    }

    console.log(`BotManager: Yêu cầu dừng bot "${name}"...`);
    botInstance.stop();
    this.runningBots.delete(name);
  }

  /**
   * Bật hoặc tắt một bot.
   * @param {string} name - Tên bot.
   * @param {boolean} state - `true` để bật, `false` để tắt.
   * @param {object} config - Cấu hình cần thiết để khởi động bot nếu `state` là `true`.
   */
  toggleBot(name, state, config) {
      if (state) {
          this.startBot(name, config);
      } else {
          this.stopBot(name);
      }
  }

  /**
   * Liệt kê tất cả các bot đang chạy.
   * @returns {string[]} Danh sách tên các bot đang chạy.
   */
  listBots() {
    return Array.from(this.runningBots.keys());
  }

  /**
   * Bật hoặc tắt một module của một bot cụ thể.
   * @param {string} botName - Tên của bot.
   * @param {string} moduleName - Tên của module.
   * @param {boolean} state - `true` để bật, `false` để tắt.
   */
  toggleModule(botName, moduleName, state) {
    const botInstance = this.runningBots.get(botName);
    if (!botInstance) {
      console.log(`Bot "${botName}" không đang chạy hoặc không tồn tại.`);
      return;
    }
    if (!botInstance.moduleManager) {
      console.log(`Bot "${botName}" chưa khởi tạo xong ModuleManager.`);
      return;
    }
    console.log(`BotManager: Yêu cầu ${state ? 'bật' : 'tắt'} module "${moduleName}" cho bot "${botName}"...`);
    botInstance.moduleManager.toggle(moduleName, state);
  }
}

module.exports = BotManager;
