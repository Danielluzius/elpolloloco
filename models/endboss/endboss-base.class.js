/**
 * Represents the base class for the end boss, handling core properties and behaviors.
 */
class EndbossBase extends MoveableObject {
  /** @type {number} The height of the end boss. */
  height = 300;

  /** @type {number} The width of the end boss. */
  width = 240;

  /** @type {number} The vertical position of the end boss. */
  y = 140;

  /** @type {Object} The offset for collision detection. */
  offset = { top: 90, right: 60, bottom: 0, left: 60 };

  /** @type {number} The normal movement speed of the end boss. */
  speed = 1.4;

  /** @type {number} The speed when chasing the player. */
  chaseSpeed = 1.4;

  /** @type {number} The detection radius for spotting the player. */
  detectionRadius = 220;

  /** @type {number} The attack range of the end boss. */
  attackRange = 170;

  /** @type {boolean} Indicates if the end boss is awake. */
  awake = false;

  /** @type {string} The current state of the end boss (e.g., 'idle', 'walk'). */
  state = 'idle';

  /** @type {number} The current frame index for animations. */
  frameIndex = 0;

  /** @type {number} The timestamp of the last frame update. */
  lastFrameTime = 0;

  /** @type {boolean} Indicates if the alert animation has been played. */
  alertPlayed = false;

  /** @type {number} The delay between idle animation frames. */
  IDLE_DELAY = 180;

  /** @type {number} The delay between alert animation frames. */
  ALERT_DELAY = 160;

  /** @type {number} The delay between walk animation frames. */
  WALK_DELAY = 110;

  /** @type {number} The delay between attack animation frames. */
  ATTACK_DELAY = 110;

  /** @type {number} The delay between hurt animation frames. */
  HURT_DELAY = 120;

  /** @type {number} The delay between dead animation frames. */
  DEAD_DELAY = 220;

  /** @type {number} The cooldown time for attacks in milliseconds. */
  attackCooldown = 1200;

  /** @type {number} The timestamp of the last attack. */
  lastAttackAt = 0;

  /** @type {number} The windup time before an attack in milliseconds. */
  attackWindupMs = 250;

  /** @type {number|null} The timer ID for the attack windup. */
  _attackWindupTimer = null;

  /** @type {Object} The sprite sheet for the idle animation. */
  SHEET_IDLE = {
    path: 'assets/img/4_enemie_boss_goblin/1_idle_6_sprites.png',
    rows: 1,
  };

  /** @type {Object} The sprite sheet for the alert animation. */
  SHEET_ALERT = {
    path: 'assets/img/4_enemie_boss_goblin/1_alert_3_sprites.png',
    rows: 1,
  };

  /** @type {Object} The sprite sheet for the walk animation. */
  SHEET_WALK = {
    path: 'assets/img/4_enemie_boss_goblin/1_walk_12_sprites.png',
    rows: 1,
  };

  /** @type {Object} The sprite sheet for the attack animation. */
  SHEET_ATTACK = {
    path: 'assets/img/4_enemie_boss_goblin/1_attack_5_sprites.png',
    rows: 1,
  };

  /** @type {Object} The sprite sheet for the hurt animation. */
  SHEET_HURT = {
    path: 'assets/img/4_enemie_boss_goblin/1_hurt_3_sprites.png',
    rows: 1,
  };

  /** @type {Object} The sprite sheet for the dead animation. */
  SHEET_DEAD = {
    path: 'assets/img/4_enemie_boss_goblin/1_dead_3_sprites.png',
    rows: 1,
  };

  /**
   * Initializes the end boss with default health and cooldown values.
   */
  constructor() {
    super();
    this.maxHealthSteps = 10;
    this.healthSteps = 10;
    this.lastHitAt = 0;
    this.hitCooldownMs = 200;
    this._lastAttackIdHit = null;
  }

  /**
   * Ensures the metadata for a sprite sheet is properly initialized.
   * @param {Object} sheet - The sprite sheet configuration.
   */
  ensureSheetMeta(sheet) {
    if (!sheet) return;
    const cnt = this.getSpriteCountFromFilename?.(sheet.path);
    if (cnt && !sheet.count) {
      sheet.count = cnt;
      sheet.cols = cnt;
      sheet.rows = sheet.rows || 1;
    }
  }

  /**
   * Gets the total number of frames in a sprite sheet, with a fallback mechanism.
   * @param {Object} sheet - The sprite sheet configuration.
   * @returns {number} The total number of frames.
   */
  getSheetCountAutoWithFallback(sheet) {
    const fromName = this.getSpriteCountFromFilename(sheet.path);
    if (fromName && fromName > 0) return fromName;
    return this.getSheetCountAuto(sheet);
  }

  /**
   * Safely calculates the current frame index for a sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @returns {number} The safe frame index.
   */
  safeFrameIndex(sheet) {
    const count = this.getSheetCountAutoWithFallback(sheet);
    const nonLoop = ['dead', 'alert', 'hurt', 'attack'].includes(this.state);
    if (nonLoop) return Math.min(this.frameIndex, Math.max(0, count - 1));
    if (count <= 0) return 0;
    return this.frameIndex % count;
  }

  /**
   * Checks if the end boss is alive.
   * @returns {boolean} True if the end boss is alive, otherwise false.
   */
  isAlive() {
    return !this.dead;
  }

  /**
   * Checks if the end boss is awake.
   * @returns {boolean} True if the end boss is awake, otherwise false.
   */
  isAwake() {
    return !!this.awake;
  }

  /**
   * Gets the current health step of the end boss.
   * @returns {number} The current health step.
   */
  getHealthStep() {
    return this.healthSteps;
  }

  /**
   * Initializes the health of the end boss.
   * @param {number} maxSteps - The maximum number of health steps.
   */
  initHealth(maxSteps) {
    this.healthSteps = maxSteps;
    this.maxHealthSteps = maxSteps;
    this.lastHitAt = 0;
    this.hitCooldownMs = this.hitCooldownMs ?? 250;
  }
}
