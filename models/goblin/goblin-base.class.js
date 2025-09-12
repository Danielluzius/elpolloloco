/**
 * Represents the base class for goblins, providing common properties and methods.
 * Extends the MoveableObject class.
 */
class GoblinBase extends MoveableObject {
  height = 260;
  width = 210;
  y = 180;
  groundY = 180;
  heartPaths = {
    1: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart1.png',
    2: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart2.png',
    3: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart3.png',
    4: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart4.png',
  };
  heartW = 20;
  heartH = 20;
  heartYOffset = -140;
  animDelay = 220;
  idleSheet = null;
  idleOrder = null;
  _idleIdx = 0;
  _lastFrameAt = 0;
  walkSheet = null;
  walkFrameIdx = 0;
  walkLastAt = 0;
  WALK_DELAY = 110;
  attackSheet = null;
  attackFrameIdx = 0;
  attackLastAt = 0;
  ATTACK_FRAME_DELAY = 60;
  ATTACK_WINDUP_MS = 120;
  attackWindupEndAt = 0;
  attackCooldownEndAt = 0;
  appliedAttackDamage = false;
  isAttacking = false;
  _attackReady = false;
  runSheet = null;
  runFrameIdx = 0;
  runLastAt = 0;
  RUN_DELAY = 70;
  _runReady = false;
  hurtSheet = null;
  hurtFrameIdx = 0;
  hurtLastAt = 0;
  HURT_DELAY = 110;
  hurtActive = false;
  hurtEndAt = 0;
  MIN_HURT_TIME = 500;
  _hurtReady = false;
  deathSheet = null;
  deathFrameIdx = 0;
  deathLastAt = 0;
  DEATH_DELAY = 140;
  DEAD_LINGER_MS = 800;
  dying = false;
  dead = false;
  _deathReady = false;
  _despawnAt = 0;
  hitCount = 0;
  spawnX = 0;
  patrolRadius = 240;
  PATROL_SPEED = 2.0;
  patrolSpeed = 2.0;
  PAUSE_MIN_MS = 800;
  PAUSE_MAX_MS = 2200;
  SEGMENT_MIN_FRAC = 0.1;
  SEGMENT_MAX_FRAC = 0.35;
  IDLE_BIAS_PROB = 0.65;
  patrolDir = -1;
  isPaused = false;
  pauseEndAt = 0;
  _moving = false;
  segmentTargetX = undefined;
  detectionRadius = 320;
  aware = false;
  CHASE_SPEED_FACTOR = 2.7;
  AWARE_SPEED_MULT = 1.55;
  chaseSpeed = 3.7;
  ATTACK_RANGE_X = 60;
  knockbackVX = 0;
  knockbackEndAt = 0;
  KNOCKBACK_DURATION = 300;
  KNOCKBACK_SPEED_X = 12;
  KNOCKBACK_SPEED_Y = 12;
  recentlyHitAt = 0;

  /**
   * Creates an instance of GoblinBase.
   * @param {number} [type=1] - The type of goblin (1, 2, or 3).
   * @param {number} [x=800] - The initial x-coordinate of the goblin.
   */
  constructor(type = 1, x = 800) {
    super();
    this.initBaseState(x);
    this.initSheets(type);
    this.randomizeMovement();
    this.applyGravity();
    this.preloadHearts();
  }

  /**
   * Initializes the base state of the goblin.
   * @param {number} x - The initial x-coordinate of the goblin.
   */
  initBaseState(x) {
    this.x = typeof x === 'number' ? x : 800;
    this.spawnX = this.x;
    this.speed = 0;
    this.otherDirection = true;
    this.offset = { top: 150, right: 80, bottom: 0, left: 80 };
  }

  /**
   * Initializes the sprite sheets for the goblin based on its type.
   * @param {number} type - The type of goblin (1, 2, or 3).
   */
  initSheets(type) {
    const t = Math.max(1, Math.min(3, Math.floor(type)));
    this.setupIdleSheet(t);
    this.setupHurtDeathSheets(t);
    this.setupWalkRunSheets(t);
    this.setupAttackSheet(t);
  }

  /**
   * Sets up the idle sprite sheet for the goblin.
   * @param {number} t - The type of goblin.
   */
  setupIdleSheet(t) {
    const p = `assets/img/3_enemies_goblins/goblin_${t}/3_idle/1_idle_6_sprites.png`;
    const c = this.getSpriteCountFromFilename(p) || 6;
    this.idleSheet = { path: p, cols: c, rows: 1, count: c };
    this.idleOrder = Array.from({ length: c }, (_, i) => i).filter(
      (i) => i !== 1
    );
    this.loadImage(p);
    this.img = this.imageCache[p];
    this.setSheetFrameAuto(this.idleSheet, this.idleOrder[0] || 0);
  }

  /**
   * Sets up the hurt and death sprite sheets for the goblin.
   * @param {number} t - The type of goblin.
   */
  setupHurtDeathSheets(t) {
    this._setupHurtSheet(t);
    this._setupDeathSheet(t);
  }

  /**
   * Sets up the walk and run sprite sheets for the goblin.
   * @param {number} t - The type of goblin.
   */
  setupWalkRunSheets(t) {
    this._setupWalkSheet(t);
    this._setupRunSheet(t);
  }

  /**
   * Configures the hurt sprite sheet and readiness for the given type.
   * @param {number} t - Goblin type.
   * @private
   */
  _setupHurtSheet(t) {
    const path = `assets/img/3_enemies_goblins/goblin_${t}/4_hurt/1_hurt_3_sprites.png`;
    this.hurtSheet = { path, cols: 3, rows: 1, count: 3 };
    this.loadImage(path);
    this.bindReadyFlag(path, '_hurtReady');
  }

  /**
   * Configures the death sprite sheet and readiness for the given type.
   * @param {number} t - Goblin type.
   * @private
   */
  _setupDeathSheet(t) {
    const map = { 1: 5, 2: 6, 3: 4 };
    const dc = map[t] || 5;
    const dp = `assets/img/3_enemies_goblins/goblin_${t}/5_dead/1_dead_${dc}_sprites.png`;
    const dCnt = this.getSpriteCountFromFilename(dp) || dc;
    this.deathSheet = { path: dp, cols: dCnt, rows: 1, count: dCnt };
    this.loadImage(dp);
    this.bindReadyFlag(dp, '_deathReady');
  }

  /**
   * Configures the walk sprite sheet for the given type.
   * @param {number} t - Goblin type.
   * @private
   */
  _setupWalkSheet(t) {
    const wMap = { 1: 8, 2: 9, 3: 9 };
    const wc = wMap[t] || 8;
    const path = `assets/img/3_enemies_goblins/goblin_${t}/1_walk/1_walk_${wc}_sprites.png`;
    this.walkSheet = { path, cols: wc, rows: 1, count: wc };
    this.loadImage(path);
  }

  /**
   * Configures the run sprite sheet and ready flag for the given type.
   * @param {number} t - Goblin type.
   * @private
   */
  _setupRunSheet(t) {
    const rMap = { 1: 8, 2: 8, 3: 7 };
    const rc = rMap[t] || 8;
    const path = `assets/img/3_enemies_goblins/goblin_${t}/6_run/1_run_${rc}_sprites.png`;
    this.runSheet = { path, cols: rc, rows: 1, count: rc };
    this.loadImage(path);
    this.bindReadyFlag(path, '_runReady');
  }

  /**
   * Sets up the attack sprite sheet for the goblin.
   * @param {number} t - The type of goblin.
   */
  setupAttackSheet(t) {
    const aMap = { 1: 5, 2: 5, 3: 6 };
    const ac = aMap[t] || 5;
    this.attackSheet = {
      path: `assets/img/3_enemies_goblins/goblin_${t}/2_attack/1_attack_${ac}_sprites.png`,
      cols: ac,
      rows: 1,
      count: ac,
    };
    this.loadImage(this.attackSheet.path);
    this.bindReadyFlag(this.attackSheet.path, '_attackReady');
  }

  /**
   * Binds a ready flag to the sprite sheet's image load event.
   * @param {string} path - The path to the sprite sheet image.
   * @param {string} flag - The flag to set when the image is loaded.
   */
  bindReadyFlag(path, flag) {
    const img = this.imageCache[path];
    if (!img) return;
    this[flag] = !!img.complete;
    try {
      img.addEventListener('load', () => (this[flag] = true), { once: true });
    } catch (_) {}
  }

  /**
   * Randomizes the goblin's movement properties.
   */
  randomizeMovement() {
    this.patrolSpeed = this.PATROL_SPEED * this.randBetween(0.8, 1.1);
    this.chaseSpeed = Math.max(2.2, this.patrolSpeed * this.CHASE_SPEED_FACTOR);
    this.patrolDir = Math.random() < 0.5 ? -1 : 1;
    this.isPaused = true;
    this.pauseEndAt =
      Date.now() + this.randBetween(this.PAUSE_MIN_MS, this.PAUSE_MAX_MS);
  }

  /**
   * Preloads the heart images for the goblin.
   */
  preloadHearts() {
    try {
      this.loadImages(Object.values(this.heartPaths));
    } catch (_) {}
  }

  /**
   * Generates a random number between the specified range.
   * @param {number} min - The minimum value.
   * @param {number} max - The maximum value.
   * @returns {number} A random number between min and max.
   */
  randBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}
