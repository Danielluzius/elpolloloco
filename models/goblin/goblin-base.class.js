// Base data + sheet setup for Goblin.
class GoblinBase extends MoveableObject {
  // Core dimensions & defaults
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

  // Constructor sets basic state and sheets
  constructor(type = 1, x = 800) {
    super();
    this.initBaseState(x);
    this.initSheets(type);
    this.randomizeMovement();
    this.applyGravity();
    this.preloadHearts();
  }

  // Initialize base position & offsets
  initBaseState(x) {
    this.x = typeof x === 'number' ? x : 800;
    this.spawnX = this.x;
    this.speed = 0;
    this.otherDirection = true;
    this.offset = { top: 150, right: 80, bottom: 0, left: 80 };
  }

  // Load all required sprite sheets
  initSheets(type) {
    const t = Math.max(1, Math.min(3, Math.floor(type)));
    this.setupIdleSheet(t);
    this.setupHurtDeathSheets(t);
    this.setupWalkRunSheets(t);
    this.setupAttackSheet(t);
  }

  // Setup idle sheet and initial frame
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

  // Setup hurt & death sheets
  setupHurtDeathSheets(t) {
    this.hurtSheet = {
      path: `assets/img/3_enemies_goblins/goblin_${t}/4_hurt/1_hurt_3_sprites.png`,
      cols: 3,
      rows: 1,
      count: 3,
    };
    this.loadImage(this.hurtSheet.path);
    this.bindReadyFlag(this.hurtSheet.path, '_hurtReady');
    const map = { 1: 5, 2: 6, 3: 4 };
    const dc = map[t] || 5;
    const dp = `assets/img/3_enemies_goblins/goblin_${t}/5_dead/1_dead_${dc}_sprites.png`;
    const dCnt = this.getSpriteCountFromFilename(dp) || dc;
    this.deathSheet = { path: dp, cols: dCnt, rows: 1, count: dCnt };
    this.loadImage(dp);
    this.bindReadyFlag(dp, '_deathReady');
  }

  // Setup walk & run sheets
  setupWalkRunSheets(t) {
    const wMap = { 1: 8, 2: 9, 3: 9 };
    const wc = wMap[t] || 8;
    this.walkSheet = {
      path: `assets/img/3_enemies_goblins/goblin_${t}/1_walk/1_walk_${wc}_sprites.png`,
      cols: wc,
      rows: 1,
      count: wc,
    };
    this.loadImage(this.walkSheet.path);
    const rMap = { 1: 8, 2: 8, 3: 7 };
    const rc = rMap[t] || 8;
    this.runSheet = {
      path: `assets/img/3_enemies_goblins/goblin_${t}/6_run/1_run_${rc}_sprites.png`,
      cols: rc,
      rows: 1,
      count: rc,
    };
    this.loadImage(this.runSheet.path);
    this.bindReadyFlag(this.runSheet.path, '_runReady');
  }

  // Setup attack sheet
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

  // Attach load listener to update ready flag
  bindReadyFlag(path, flag) {
    const img = this.imageCache[path];
    if (!img) return;
    this[flag] = !!img.complete;
    try {
      img.addEventListener('load', () => (this[flag] = true), { once: true });
    } catch (_) {}
  }

  // Randomize per instance movement parameters
  randomizeMovement() {
    this.patrolSpeed = this.PATROL_SPEED * this.randBetween(0.8, 1.1);
    this.chaseSpeed = Math.max(2.2, this.patrolSpeed * this.CHASE_SPEED_FACTOR);
    this.patrolDir = Math.random() < 0.5 ? -1 : 1;
    this.isPaused = true;
    this.pauseEndAt =
      Date.now() + this.randBetween(this.PAUSE_MIN_MS, this.PAUSE_MAX_MS);
  }

  // Preload heart overlay images
  preloadHearts() {
    try {
      this.loadImages(Object.values(this.heartPaths));
    } catch (_) {}
  }

  // Utility random helper
  randBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}
