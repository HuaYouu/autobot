/**
 * Module chức năng: Quản lý các module khác thông qua lệnh chat.
 */
class CommandManagerModule {
  /**
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {object} settings - Cấu hình của module này.
   * @param {import('../ModuleManager')} moduleManager - Instance của ModuleManager.
   */
  constructor(bot, settings, moduleManager) {
    this.bot = bot;
    this.settings = settings;
    this.moduleManager = moduleManager;

    this.isEnabled = false;
    this.prefix = this.settings.options.commandPrefix || '!';
    this.chatHandler = this.handleChatMessage.bind(this);
  }

  /**
   * Bật module. Module này thường nên luôn được bật.
   */
  enable() {
    if (this.isEnabled) return;
    this.bot.on('chat', this.chatHandler);
    this.isEnabled = true;
    console.log('Module CommandManager đã được bật.');
  }

  /**
   * Tắt module.
   */
  disable() {
    if (!this.isEnabled) return;
    this.bot.removeListener('chat', this.chatHandler);
    this.isEnabled = false;
    console.log('Module CommandManager đã được tắt.');
  }

  /**
   * Xử lý tin nhắn chat để quản lý các module.
   * @param {string} username - Tên người chơi.
   * @param {string} message - Nội dung tin nhắn.
   */
  async handleChatMessage(username, message) {
    if (username === this.bot.username) return;

    const args = message.trim().split(' ');
    const command = args.shift().toLowerCase();

    // Lệnh để bật/tắt module khác. Ví dụ: !module movementController on
    if (command !== `${this.prefix}module`) return;

    if (args.length < 2) {
      this.bot.chat(`Cú pháp sai. Sử dụng: ${this.prefix}module <tên_module> <on|off>`);
      return;
    }

    const moduleName = args[0];
    const state = args[1].toLowerCase();

    if (state !== 'on' && state !== 'off') {
      this.bot.chat(`Trạng thái không hợp lệ. Sử dụng 'on' hoặc 'off'.`);
      return;
    }

    const isEnabled = state === 'on';

    if (!this.moduleManager.getModule(moduleName)) {
        this.bot.chat(`Module "${moduleName}" không tồn tại.`);
        return;
    }

    this.bot.chat(`Đang ${isEnabled ? 'bật' : 'tắt'} module "${moduleName}"...`);
    await this.moduleManager.toggle(moduleName, isEnabled);
    this.bot.chat(`Module "${moduleName}" đã được ${isEnabled ? 'bật' : 'tắt'}.`);
  }
}

module.exports = CommandManagerModule;
