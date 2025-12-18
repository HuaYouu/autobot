const { pathfinder } = require('mineflayer-pathfinder');
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { Movements } = require('mineflayer-movement');

/**
 * Utility module for bot movement using mineflayer-pathfinder.
 * This ensures the bot can navigate to specific coordinates accurately.
 */
class BotMovement {
  /**
   * @param {import('mineflayer').Bot} bot - The bot instance.
   */
  constructor(bot) {
    this.bot = bot;
    this.isMoving = false;

    // Load the pathfinder plugin
    this.bot.loadPlugin(pathfinder);
  }

  /**
   * Configures the pathfinder's movement settings. Must be called after the bot has spawned.
   */
  configure() {
    const defaultMove = new Movements(this.bot);
    this.bot.pathfinder.setMovements(defaultMove);
  }

  /**
   * Moves the bot to the specified coordinates.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {number} z - The z-coordinate.
   * @returns {Promise<void>} A promise that resolves when the goal is reached or movement is interrupted.
   */
  moveTo(x, y, z) {
    return new Promise((resolve, reject) => {
      if (this.isMoving) {
        this.stop();
      }
      this.isMoving = true;
      this.bot.emit('movement_started');

      const goal = new GoalBlock(x, y, z);
      this.bot.pathfinder.setGoal(goal, true);

      // Listen for goal completion or interruption
      const onGoalReached = () => cleanupAndResolve();
      const onPathReset = (reason) => {
        if (reason !== 'goal_updated') {
            cleanupAndReject(new Error('Path was reset: ' + reason));
        }
      };

      const cleanup = () => {
        this.bot.removeListener('goal_reached', onGoalReached);
        this.bot.removeListener('path_reset', onPathReset);
        this.isMoving = false;
      };

      const cleanupAndResolve = () => {
        cleanup();
        this.bot.emit('movement_reached');
        resolve();
      };

      const cleanupAndReject = (err) => {
        cleanup();
        this.bot.emit('movement_failed', err);
        reject(err);
      };

      this.bot.once('goal_reached', onGoalReached);
      this.bot.on('path_reset', onPathReset); // Use 'on' because it can be reset for multiple reasons
    });
  }

  /**
   * Stops any current pathfinding movement.
   */
  stop() {
    if (!this.isMoving) return;
    this.bot.pathfinder.stop();
    this.isMoving = false;
    this.bot.emit('movement_stopped');
  }

  /**
   * Makes the bot follow a target entity.
   * @param {import('prismarine-entity').Entity} targetEntity - The entity to follow.
   */
  follow(targetEntity) {
    const { GoalFollow } = require('mineflayer-pathfinder').goals;
    const goal = new GoalFollow(targetEntity, 5); // Follow from 5 blocks away
    this.bot.pathfinder.setGoal(goal, true); // `true` to keep following
  }
}

module.exports = BotMovement;
