class CharacterPlayer extends Character {
  introActive = false;
  introStartX = 0;
  introTargetX = 0;
  introSpeed = 3.5;
  introFrameIndex = 0;
  lastIntroFrameTime = 0;
  INTRO_FRAME_DELAY = 80;
  isJumping = false;
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  jumpVX = 0;
  JUMP_FORWARD_VX = 0;
  JUMP_INIT_VY = 26;
  isSpecialAttacking = false;
  specialFrameIndex = 0;
  lastSpecialFrameTime = 0;
  SPECIAL_FRAME_DELAY = 90;
  effectFrameIndex = 0;
  lastEffectFrameTime = 0;
  EFFECT_FRAME_DELAY = 50;
  specialEndAt = 0;
  SPECIAL_EFFECT_W = 200;
  SPECIAL_EFFECT_H = 200;
  SPECIAL_EFFECT_FEET_OFFSET = 60;
  EFFECT_MOVE_STEP = 26;
  WIND_PUSH_SPEED = 36;
  idleFrameIndex = 0;
  lastIdleFrameTime = 0;
  IDLE_FRAME_DELAY = 220;
  IDLE_FRAME_ORDER = null;
  longIdleFrameIndex = 0;
  lastLongIdleFrameTime = 0;
  LONG_IDLE_FRAME_DELAY = 200;
  hurtFrameIndex = 0;
  lastHurtFrameTime = 0;
  HURT_FRAME_DELAY = 90;
  hurtEndAt = 0;
  _hurtAnimStartAt = 0;
  knockbackActive = false;
  knockbackEndAt = 0;
  knockbackVX = 0;
  KNOCKBACK_SPEED_X = 10;
  KNOCKBACK_DURATION = 350;
  isBlocking = false;
  blockFrameIndex = 0;
  lastBlockFrameTime = 0;
  BLOCK_FRAME_DELAY = 100;
  BLOCK_DURATION_MS = 800;
  IDLE_AFTER_MS = 1200;
  LONG_IDLE_AFTER_MS = 4000;
  STOMP_FRAME_DELAY = 90;
  HEART_POTION_HEAL = 2;
  ATTACK_RANGE_X = 120;
  ATTACK_ACTIVE_START_FRAME = 1;
  blockSegments = 5;
  isAttacking = false;
  attackFrameIndex = 0;
  lastAttackFrameTime = 0;
  ATTACK_FRAME_DELAY = 90;
  attackEndAt = 0;
  ATTACK_COOLDOWN_MS = 500;
  nextAttackAt = 0;
  _attackSeq = 0;
  DEAD_FRAME_DELAY = 200;
  deadStartedAt = 0;
  DEATH_INIT_VY = 24;
  DEATH_ACCEL = 3;
  deathArcInit = false;
  deathLastFrameLocked = false;
  SPECIAL_EFFECT_PATHS = Array.from(
    { length: 10 },
    (_, i) => `assets/img/2_character_man/11_special_attack/${i + 1}.png`
  );

  constructor() {
    super();
    this.preloadAssets();
    this.computeIdleOrder();
    this.initLoops();
  }

  preloadAssets() {
    this.SPECIAL_EFFECT_PATHS.forEach((p) => this.loadImage(p));
  }

  computeIdleOrder() {
    const img = this.imageCache[this.IDLE_SHEET?.path];
    const cnt = this.getSheetCount?.(this.IDLE_SHEET, img) || 1;
    let order = Array.from({ length: cnt }, (_, i) => i);
    if (order.length > 1) order = order.slice(0, order.length - 1);
    this.IDLE_FRAME_ORDER = order.length ? order : [0];
  }

  initLoops() {
    this.applyGravity?.();
    this.startInputLoop();
    this.startAnimLoop();
  }

  startInputLoop() {
    setInterval(() => this.processInputTick?.(), 1000 / 60);
  }

  startAnimLoop() {
    setInterval(() => this.animTick?.(), 50);
  }

  processInputTick() {}
  animTick() {}
  drawFrame() {}
  markActivity() {
    this.lastActivityAt = Date.now();
  }
  updateBlockState() {}
  startHurt() {
    this.hurtEndAt = Date.now() + 600;
  }
  isHurt() {
    return this.hurtEndAt && Date.now() < this.hurtEndAt;
  }
}
