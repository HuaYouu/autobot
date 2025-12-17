const { GoalFollow } = require('mineflayer-pathfinder').goals;
const { pvp } = require('mineflayer-pvp');

// Import bộ khung module con
const TargetingModule = require('./combat/TargetingModule.js');
const MovementModule = require('./combat/MovementModule.js');
const AttackModule = require('./combat/AttackModule.js');
const DefenseModule = require('./combat/DefenseModule.js');
const SupportModule = require('./combat/SupportModule.js');

/**
 * Module chức năng: Quản lý toàn bộ hành vi chiến đấu của bot.
 */
class CombatManager {
  /**
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {object} settings - Cấu hình của module này (`settings.modules.combatManager`).
   * @param {import('../../utils/movement')} movementUtil - Module tiện ích di chuyển.
   */
  constructor(bot, settings, movementUtil) {
    this.bot = bot;
    this.settings = settings;
    this.movementUtil = movementUtil;
    this.config = this.settings.options || {};

    this.isEnabled = false;
    this.logicInterval = null; // ID của setInterval cho vòng lặp logic

    // Trạng thái nội bộ
    this.state = {
      currentTarget: null,
      patrolIndex: 0,
      isRetreating: false,
    };

    // Tải plugin pvp
    this.bot.loadPlugin(pvp);

    // Khởi tạo các module con
    this.submodules = {
      targeting: new TargetingModule(bot, this),
      movement: new MovementModule(bot, this),
      attack: new AttackModule(bot, this),
      defense: new DefenseModule(bot, this),
      support: new SupportModule(bot, this),
    };
  }

  /**
   * Bật CombatManager.
   */
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // Bật các module con theo cấu hình
    for (const name in this.config.submodules) {
      if (this.config.submodules[name] && this.submodules[name]) {
        this.submodules[name].enable();
      }
    }

    // Bắt đầu vòng lặp logic chính
    this.logicInterval = setInterval(() => this.tick(), 500); // Chạy mỗi 0.5 giây
    console.log(`[${this.bot.username}] CombatManager đã được BẬT. Chế độ: ${this.config.mode}`);
  }

  /**
   * Tắt CombatManager.
   */
  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    // Dừng vòng lặp logic
    if (this.logicInterval) {
      clearInterval(this.logicInterval);
      this.logicInterval = null;
    }

    // Dừng mọi hành động
    this.bot.stopDigging();
    this.bot.deactivateItem();
    this.movementUtil.stop();
    this.bot.pathfinder.stop();
    this.bot.pvp.stop();

    // Tắt các module con
    Object.values(this.submodules).forEach(sm => sm.disable());

    console.log(`[${this.bot.username}] CombatManager đã được TẮT.`);
  }

  /**
   * Vòng lặp logic chính, được gọi định kỳ.
   */
  tick() {
    if (!this.isEnabled) return;

    // Logic rút lui ưu tiên hàng đầu
    if (this.handleRetreat()) {
      return; // Nếu đang rút lui, không làm gì khác
    }

    // Tìm và quản lý mục tiêu
    this.findAndManageTarget();

    // Nếu có mục tiêu, thực hiện hành vi chiến đấu
    if (this.state.currentTarget) {
      this.engageTarget();
      return;
    }

    // Nếu không có mục tiêu, thực hiện hành vi theo chế độ
    switch (this.config.mode) {
      case 'guardian':
        this.guardianLogic();
        break;
      case 'patrol':
        this.patrolLogic();
        break;
      case 'aggressive':
        // Đứng yên chờ mục tiêu nếu không có
        break;
    }
  }

  // --- Logic Chế độ ---
  guardianLogic() {
    const owner = this.bot.players[this.config.guardianTarget]?.entity;
    if (!owner) {
      // console.log(`[${this.bot.username}] Không tìm thấy người bảo vệ: ${this.config.guardianTarget}`);
      return;
    }
    // Đi theo chủ nhân ở khoảng cách 5 block
    this.bot.pathfinder.setGoal(new GoalFollow(owner, 5), true);
  }

  patrolLogic() {
    const patrolPoints = this.config.patrolArea || [];
    if (patrolPoints.length === 0) return;

    const targetPoint = patrolPoints[this.state.patrolIndex];
    const goal = { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z };

    // Nếu đã đến gần điểm tuần tra, chuyển sang điểm tiếp theo
    if (this.bot.entity.position.distanceTo(goal) < 3) {
      this.state.patrolIndex = (this.state.patrolIndex + 1) % patrolPoints.length;
    }
    this.movementUtil.goTo(goal.x, goal.y, goal.z).catch(() => {});
  }

  // --- Logic Hành vi ---

  findAndManageTarget() {
    // Nếu mục tiêu đã chết hoặc quá xa, hủy mục tiêu
    if (this.state.currentTarget) {
      if (this.state.currentTarget.health <= 0 || this.bot.entity.position.distanceTo(this.state.currentTarget.position) > 30) {
        this.state.currentTarget = null;
      }
      return; // Vẫn đang trong combat, không tìm mục tiêu mới
    }

    const blacklist = this.config.blacklist || [];
    const whitelist = this.config.whitelist || [];

    const target = this.bot.nearestEntity(entity => {
      const isPlayer = entity.type === 'player';
      const isMob = entity.kind === 'Hostile mob';
      const name = entity.username || entity.name;

      if (!isPlayer && !isMob) return false;
      if (whitelist.includes(name)) return false;
      if (blacklist.includes(name)) return true; // Ưu tiên blacklist
      if (this.config.mode === 'aggressive' && isPlayer) return true; // Tấn công người chơi lạ trong chế độ aggressive

      return false;
    });

    if (target) {
        console.log(`[${this.bot.username}] Phát hiện mục tiêu mới: ${target.username || target.name}`);
        this.state.currentTarget = target;
    }
  }

  engageTarget() {
    if (!this.state.currentTarget) return;

    // Giao toàn bộ quyền kiểm soát chiến đấu cho plugin pvp
    // Nó sẽ tự động di chuyển, nhìn và tấn công mục tiêu.
    this.bot.pvp.attack(this.state.currentTarget);
  }

  handleRetreat() {
    const healthThreshold = this.config.retreatHealthLevel || 0;
    const currentHealth = this.bot.health;

    if (this.state.isRetreating) {
      // Nếu đã hồi đủ máu, ngừng rút lui
      if (currentHealth > healthThreshold + 5) {
        this.state.isRetreating = false;
        this.movementUtil.stop();
        console.log(`[${this.bot.username}] Đã hồi phục, ngừng rút lui.`);
        return false;
      }
      // Nếu vẫn đang rút lui, tiếp tục chạy
      return true;
    }

    if (currentHealth <= healthThreshold) {
      this.state.isRetreating = true;
      this.state.currentTarget = null; // Bỏ mục tiêu hiện tại
      this.movementUtil.stop(); // Dừng di chuyển hiện tại

      console.log(`[${this.bot.username}] Máu thấp (${currentHealth}), bắt đầu rút lui!`);
      // Tìm một vị trí an toàn cách xa 30 block
      const currentPos = this.bot.entity.position;
      const safePos = currentPos.offset(
        (Math.random() - 0.5) * 60,
        0,
        (Math.random() - 0.5) * 60
      );
      this.movementUtil.goTo(safePos.x, safePos.y, safePos.z).catch(() => {
          this.state.isRetreating = false; // Thất bại, thử lại lần sau
      });
      return true;
    }

    return false;
  }
}

module.exports = CombatManager;
