/**
 * Module kiểm tra chức năng di chuyển của bot thông qua lệnh chat.
 */
class TestMovementModule {
  /**
   * Khởi tạo module test.
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {object} settings - Đối tượng cấu hình từ settings.json.
   * @param {import('./movement')} movement - Instance của module di chuyển.
   */
  constructor(bot, settings, movement) {
    this.bot = bot;
    this.settings = settings;
    this.movement = movement;
    this.prefix = this.settings.testModule.commandPrefix;

    // Gán listener cho sự kiện chat
    this.bot.on('chat', this.handleChatMessage.bind(this));

    console.log('Module Test Di Chuyển đã được kích hoạt.');
    this.bot.chat(`Module di chuyển đã sẵn sàng. Gõ ${this.prefix}goto <x> <y> <z> để ra lệnh.`);
  }

  /**
   * Xử lý tin nhắn chat đến.
   * @param {string} username - Tên người chơi đã chat.
   * @param {string} message - Nội dung tin nhắn.
   */
  async handleChatMessage(username, message) {
    // Bỏ qua tin nhắn của chính bot
    if (username === this.bot.username) return;

    // Tách tin nhắn thành các phần
    const args = message.trim().split(' ');
    const command = args.shift().toLowerCase();

    // Kiểm tra xem có phải là lệnh goto không
    if (command !== `${this.prefix}goto`) return;

    // Kiểm tra cú pháp lệnh
    if (args.length < 3) {
      this.bot.chat(`Cú pháp sai. Sử dụng: ${this.prefix}goto <x> <y> <z>`);
      return;
    }

    // Phân tích tọa độ
    const x = parseInt(args[0], 10);
    const y = parseInt(args[1], 10);
    const z = parseInt(args[2], 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      this.bot.chat('Tọa độ không hợp lệ. Vui lòng nhập số.');
      return;
    }

    // Bắt đầu di chuyển
    this.bot.chat(`Đã nhận lệnh! Đang di chuyển đến tọa độ (${x}, ${y}, ${z})...`);

    try {
      await this.movement.goTo(x, y, z);
      this.bot.chat(`Đã đến nơi! Tọa độ hiện tại: (${this.bot.entity.position.x.toFixed(2)}, ${this.bot.entity.position.y.toFixed(2)}, ${this.bot.entity.position.z.toFixed(2)})`);
    } catch (error) {
      this.bot.chat(`Di chuyển thất bại: ${error.message}`);
      console.error(error);
    }
  }
}

module.exports = TestMovementModule;
