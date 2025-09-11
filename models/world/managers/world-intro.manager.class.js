/**
 * Manages the introduction sequence for the game world.
 */
class WorldIntroManager {
  /**
   * Creates a new WorldIntroManager instance.
   * @param {object} world - The game world instance.
   */
  constructor(world) {
    this.w = world;
  }

  /**
   * Triggers the boss introduction sequence.
   * @param {object} boss - The boss instance.
   */
  trigger(boss) {
    try {
      this.prepare();
      this.panToBoss(boss);
    } catch (_) {
      this.finish();
    }
  }

  /**
   * Prepares the game world for the boss introduction.
   */
  prepare() {
    const w = this.w;
    w.bossIntroActive = true;
    w._savedKeyboardRef = w.keyboard;
    w.keyboard = {};
  }

  /**
   * Pans the camera to the boss.
   * @param {object} boss - The boss instance.
   */
  panToBoss(boss) {
    const w = this.w;
    const from = w.camera_x || 0;
    const center = (w.canvas?.width || 720) / 2;
    const target = this.calculateCameraTarget(center, boss);
    w.animateCamera(from, target, 1200, () => this.startBossWalk(boss));
  }

  /**
   * Calculates the target camera position for the boss.
   * @param {number} center - The center of the canvas.
   * @param {object} boss - The boss instance.
   * @returns {number} The target camera position.
   */
  calculateCameraTarget(center, boss) {
    return Math.round(
      center +
        (this.w.bossIntroCamOffsetX || 0) -
        (boss.x + (boss.width || 0) / 2)
    );
  }

  /**
   * Starts the boss walking sequence.
   * @param {object} boss - The boss instance.
   */
  startBossWalk(boss) {
    const w = this.w;
    this.scheduleHudObjective();
    this.initializeBossWalk(boss);
    const targetX = boss.x - 220;
    const speed = 2.0;
    w._bossIntroWalkTimer = setInterval(() => {
      if (!w.bossIntroActive) return this.clearWalk();
      this.updateBossPosition(boss, targetX, speed);
    }, 1000 / 60);
  }

  /**
   * Initializes the boss walking state.
   * @param {object} boss - The boss instance.
   */
  initializeBossWalk(boss) {
    boss.state = 'walk';
    boss.frameIndex = 0;
    boss.otherDirection = true;
  }

  /**
   * Updates the boss position during the walking sequence.
   * @param {object} boss - The boss instance.
   * @param {number} targetX - The target x-coordinate for the boss.
   * @param {number} speed - The walking speed of the boss.
   */
  updateBossPosition(boss, targetX, speed) {
    boss.x = Math.max(targetX, boss.x - speed);
    boss.otherDirection = true;
    if (boss.x <= targetX + 0.5) {
      this.clearWalk();
      this.finishBossWalk(boss);
    }
  }

  /**
   * Finishes the boss walking sequence.
   * @param {object} boss - The boss instance.
   */
  finishBossWalk(boss) {
    boss.state = 'idle';
    boss.frameIndex = 0;
    setTimeout(() => this.w.returnCameraToCharacter(), 500);
  }

  /**
   * Schedules the HUD objective display.
   */
  scheduleHudObjective() {
    const w = this.w;
    try {
      if (w._bossIntroHudSwitchTimer) clearTimeout(w._bossIntroHudSwitchTimer);
      w._bossIntroHudSwitchTimer = setTimeout(() => {
        w._bossIntroHudSwitchTimer = null;
        w.goblinCounter?.enableObjectiveMode?.('DEFEAT THE', 'GOBLIN KING');
      }, 1000);
    } catch (_) {}
  }

  /**
   * Clears the boss walking timer.
   */
  clearWalk() {
    const w = this.w;
    try {
      if (w._bossIntroWalkTimer) clearInterval(w._bossIntroWalkTimer);
    } catch (_) {}
    w._bossIntroWalkTimer = null;
  }

  /**
   * Finishes the boss introduction sequence.
   */
  finish() {
    const w = this.w;
    if (w._savedKeyboardRef) w.keyboard = w._savedKeyboardRef;
    w._savedKeyboardRef = null;
    w.bossIntroActive = false;
    w.bossIntroDone = true;
    w.introCamX = undefined;
    try {
      if (w._bossIntroHudSwitchTimer) clearTimeout(w._bossIntroHudSwitchTimer);
    } catch (_) {}
    w._bossIntroHudSwitchTimer = null;
  }
}
