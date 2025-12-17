const fs = require('fs').promises;
const path = require('path');

/**
 * Quản lý vòng đời và trạng thái của các module chức năng.
 */
class ModuleManager {
  /**
   * @param {import('mineflayer').Bot} bot - Instance của bot.
   * @param {string} botName - Tên của bot đang được quản lý.
   * @param {object} settings - Toàn bộ đối tượng cấu hình từ settings.json.
   */
  constructor(bot, botName, settings) {
    this.bot = bot;
    this.botName = botName;
    this.settings = settings;
    this.modules = new Map();
    this.settingsPath = path.join(__dirname, '..', 'settings.json');

    console.log(`[${botName}] ModuleManager đã được khởi tạo.`);
  }

  /**
   * Đăng ký một module chức năng.
   * @param {string} name - Tên của module (ví dụ: "movementController").
   * @param {object} moduleInstance - Instance của module.
   */
  register(name, moduleInstance) {
    if (this.modules.has(name)) {
      console.warn(`Module "${name}" đã được đăng ký.`);
      return;
    }
    this.modules.set(name, moduleInstance);
    console.log(`Module "${name}" đã được đăng ký.`);
  }

  /**
   * Khởi tạo các module dựa trên trạng thái `enabled` trong settings.json.
   */
  initializeModules() {
    console.log(`[${this.botName}] Bắt đầu khởi tạo các module theo cấu hình...`);
    const botModulesConfig = this.settings.bots[this.botName]?.modules;
    if (!botModulesConfig) return;

    for (const [name, moduleInstance] of this.modules.entries()) {
      if (botModulesConfig[name]?.enabled) {
        this.toggle(name, true, false); // Bật module, không ghi lại file vì đây là trạng thái ban đầu
      }
    }
    console.log(`[${this.botName}] Hoàn tất khởi tạo module.`);
  }

  /**
   * Bật hoặc tắt một module chức năng.
   * @param {string} name - Tên của module.
   * @param {boolean} state - `true` để bật, `false` để tắt.
   * @param {boolean} [writeToFile=true] - `true` để ghi trạng thái mới vào settings.json.
   */
  async toggle(name, state, writeToFile = true) {
    const moduleInstance = this.modules.get(name);
    if (!moduleInstance) {
      console.error(`Không tìm thấy module có tên "${name}".`);
      return;
    }

    if (moduleInstance.isEnabled === state) {
      console.log(`Module "${name}" đã ở trạng thái ${state ? 'bật' : 'tắt'}.`);
      return;
    }

    try {
      if (state) {
        await moduleInstance.enable();
      } else {
        await moduleInstance.disable();
      }

      console.log(`Module "${name}" đã được ${state ? 'bật' : 'tắt'} thành công.`);

      if (writeToFile) {
        await this.updateSettingsFile(name, state);
      }
    } catch (error) {
      console.error(`Đã xảy ra lỗi khi ${state ? 'bật' : 'tắt'} module "${name}":`, error);
    }
  }

  /**
   * Cập nhật trạng thái `enabled` của một module trong file settings.json.
   * @param {string} name - Tên của module.
   * @param {boolean} state - Trạng thái mới.
   * @private
   */
  async updateSettingsFile(name, state) {
    try {
      // Đọc file settings hiện tại
      const currentSettings = JSON.parse(await fs.readFile(this.settingsPath, 'utf8'));

      // Cập nhật trạng thái
      if (currentSettings.bots[this.botName]?.modules?.[name]) {
        currentSettings.bots[this.botName].modules[name].enabled = state;
      } else {
        console.warn(`[${this.botName}] Không tìm thấy cấu hình cho module "${name}" trong settings.json để cập nhật.`);
        return;
      }

      // Ghi lại file với định dạng đẹp
      await fs.writeFile(this.settingsPath, JSON.stringify(currentSettings, null, 2));
      console.log(`Đã cập nhật trạng thái của module "${name}" trong settings.json.`);
      // Cập nhật settings trong bộ nhớ
      this.settings = currentSettings;

    } catch (error) {
      console.error(`Không thể ghi vào file settings.json:`, error);
    }
  }

  /**
   * Lấy instance của một module đã đăng ký.
   * @param {string} name - Tên của module.
   * @returns {object|undefined}
   */
  getModule(name) {
    return this.modules.get(name);
  }
}

module.exports = ModuleManager;
