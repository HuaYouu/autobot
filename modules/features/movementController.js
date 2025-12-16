/**
 * Module chức năng: Điều khiển di chuyển của bot qua lệnh chat.
 */
class MovementControllerModule {
  /**
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {object} settings - Cấu hình của module này.
   * @param {import('../utils/movement')} movementUtil - Module tiện ích di chuyển.
   */
  constructor(bot, settings, movementUtil) {
    this.bot = bot;
    this.settings = settings;
    this.movementUtil = movementUtil;

    this.isEnabled = false;
    this.prefix = this.settings.options.commandPrefix || '!';

    // Bind `this` cho handler để có thể thêm và gỡ listener
    this.chatHandler = this.handleChatMessage.bind(this);
  }

  /**
   * Bật module.
   */
  enable() {
    if (this.isEnabled) return;
    this.bot.on('chat', this.chatHandler);
    this.isEnabled = true;
    console.log('Module MovementController đã được bật.');
    this.bot.chat(`Di chuyển bằng lệnh chat đã được BẬT. Gõ ${this.prefix}goto <x> <y> <z> để di chuyển.`);
  }

  /**
   * Tắt module.
   */
  disable() {
    if (!this.isEnabled) return;
    this.bot.removeListener('chat', this.chatHandler);
    this.isEnabled = false;
    console.log('Module MovementController đã được tắt.');
    this.bot.chat('Di chuyển bằng lệnh chat đã được TẮT.');
  }

  /**
   * Xử lý tin nhắn chat đến.
   * @param {string} username - Tên người chơi đã chat.
   * @param {string} message - Nội dung tin nhắn.
   */
  async handleChatMessage(username, message) {
    if (username === this.bot.username) return;

    const args = message.trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command !== `${this.prefix}goto`) return;

    if (args.length < 3) {
      this.bot.chat(`Cú pháp sai. Sử dụng: ${this.prefix}goto <x> <y> <z>`);
      return;
    }

    const x = parseInt(args[0], 10);
    const y = parseInt(args[1], 10);
    const z = parseInt(args[2], 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      this.bot.chat('Tọa độ không hợp lệ. Vui lòng nhập số.');
      return;
    }

    this.bot.chat(`Đã nhận lệnh! Đang di chuyển đến tọa độ (${x}, ${y}, ${z})...`);

    try {
      await this.movementUtil.goTo(x, y, z);
      this.bot.chat(`Đã đến nơi!`);
    } catch (error) {
      this.bot.chat(`Di chuyển thất bại: ${error.message}`);
    }
  }
}

module.exports = MovementControllerModule;
