// Import các thư viện cần thiết
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalNear } = require('mineflayer-pathfinder').goals;
const mcData = require('minecraft-data');

/**
 * Lớp quản lý di chuyển của bot, kết hợp pathfinder và movement.
 */
class BotMovement {
  /**
   * Khởi tạo module di chuyển.
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {object} settings - Đối tượng cấu hình từ settings.json.
   */
  constructor(bot, settings) {
    this.bot = bot;
    this.settings = settings;

    // Tải plugin pathfinder vào bot
    this.bot.loadPlugin(pathfinder);

    // Lấy dữ liệu phiên bản Minecraft của bot
    const defaultMove = new Movements(this.bot, mcData(bot.version));

    // Cấu hình các hành vi di chuyển dựa trên settings.json
    defaultMove.canDig = this.settings.movement.canBreakBlocks;
    defaultMove.canPlace = this.settings.movement.canPlaceBlocks;
    defaultMove.allowSprinting = this.settings.movement.allowSprinting;
    defaultMove.allowParkour = this.settings.movement.allowParkour;

    // Gán cấu hình di chuyển cho pathfinder
    this.bot.pathfinder.setMovements(defaultMove);
    console.log('Module di chuyển đã được khởi tạo và cấu hình.');
  }

  /**
   * Di chuyển bot đến một tọa độ cụ thể.
   * @param {number} x - Tọa độ X.
   * @param {number} y - Tọa độ Y.
   * @param {number} z - Tọa độ Z.
   * @returns {Promise<void>} Một Promise sẽ resolve khi đến nơi hoặc reject khi thất bại.
   */
  goTo(x, y, z) {
    return new Promise((resolve, reject) => {
      // Tạo mục tiêu: đến gần tọa độ trong bán kính đã cấu hình
      const goal = new GoalNear(x, y, z, this.settings.movement.goalRadius);

      // Bắt đầu di chuyển đến mục tiêu
      this.bot.pathfinder.setGoal(goal, true); // `true` để di chuyển theo đường đi thông minh

      // Hàm xử lý khi đến nơi
      const onGoalReached = () => {
        cleanupListeners();
        resolve();
      };

      // Hàm xử lý khi không tìm được đường
      const onPathUpdate = (results) => {
        if (results.status === 'noPath') {
          console.error(`Không tìm thấy đường đi đến ${x}, ${y}, ${z}.`);
          cleanupListeners();
          this.bot.pathfinder.stop(); // Dừng tìm đường
          reject(new Error('Không tìm thấy đường đi.'));
        }
      };

      // Hàm dọn dẹp các listener
      const cleanupListeners = () => {
        this.bot.removeListener('goal_reached', onGoalReached);
        this.bot.removeListener('path_update', onPathUpdate);
      };

      // Gán các listener cho sự kiện
      this.bot.once('goal_reached', onGoalReached);
      this.bot.on('path_update', onPathUpdate); // Dùng 'on' để bắt các cập nhật trạng thái
    });
  }

  /**
   * Hủy bỏ mọi hoạt động di chuyển hiện tại.
   */
  stop() {
    this.bot.pathfinder.stop();
  }
}

module.exports = BotMovement;
