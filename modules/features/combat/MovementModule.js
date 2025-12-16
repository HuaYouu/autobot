class MovementModule {
  constructor(bot, combatManager) {
    this.bot = bot;
    this.combatManager = combatManager;
    this.isEnabled = false;
  }
  enable() { this.isEnabled = true; }
  disable() { this.isEnabled = false; }
}
module.exports = MovementModule;
