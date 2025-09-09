class EndbossBase extends MoveableObject {
  height = 300;
  width = 240;
  y = 140;
  offset = { top: 90, right: 60, bottom: 0, left: 60 };
  speed = 1.4;
  chaseSpeed = 1.4;
  detectionRadius = 220;
  attackRange = 170;
  awake = false;
  state = 'idle';
  frameIndex = 0;
  lastFrameTime = 0;
  alertPlayed = false;
  IDLE_DELAY = 180;
  ALERT_DELAY = 160;
  WALK_DELAY = 110;
  ATTACK_DELAY = 110;
  HURT_DELAY = 120;
  DEAD_DELAY = 220;
  attackCooldown = 1200;
  lastAttackAt = 0;
  attackWindupMs = 250;
  _attackWindupTimer = null;
  SHEET_IDLE = {
    path: 'assets/img/4_enemie_boss_goblin/1_idle_6_sprites.png',
    rows: 1,
  };
  SHEET_ALERT = {
    path: 'assets/img/4_enemie_boss_goblin/1_alert_3_sprites.png',
    rows: 1,
  };
  SHEET_WALK = {
    path: 'assets/img/4_enemie_boss_goblin/1_walk_12_sprites.png',
    rows: 1,
  };
  SHEET_ATTACK = {
    path: 'assets/img/4_enemie_boss_goblin/1_attack_5_sprites.png',
    rows: 1,
  };
  SHEET_HURT = {
    path: 'assets/img/4_enemie_boss_goblin/1_hurt_3_sprites.png',
    rows: 1,
  };
  SHEET_DEAD = {
    path: 'assets/img/4_enemie_boss_goblin/1_dead_3_sprites.png',
    rows: 1,
  };
  constructor() {
    super();
    this.maxHealthSteps = 10;
    this.healthSteps = 10;
    this.lastHitAt = 0;
    this.hitCooldownMs = 200;
    this._lastAttackIdHit = null;
  }
  ensureSheetMeta(sheet) {
    if (!sheet) return;
    const cnt = this.getSpriteCountFromFilename?.(sheet.path);
    if (cnt && !sheet.count) {
      sheet.count = cnt;
      sheet.cols = cnt;
      sheet.rows = sheet.rows || 1;
    }
  }
  getSheetCountAutoWithFallback(sheet) {
    const fromName = this.getSpriteCountFromFilename(sheet.path);
    if (fromName && fromName > 0) return fromName;
    return this.getSheetCountAuto(sheet);
  }
  safeFrameIndex(sheet) {
    const count = this.getSheetCountAutoWithFallback(sheet);
    const nonLoop = ['dead', 'alert', 'hurt', 'attack'].includes(this.state);
    if (nonLoop) return Math.min(this.frameIndex, Math.max(0, count - 1));
    if (count <= 0) return 0;
    return this.frameIndex % count;
  }
  isAlive() {
    return !this.dead;
  }
  isAwake() {
    return !!this.awake;
  }
  getHealthStep() {
    return this.healthSteps;
  }
  initHealth(maxSteps) {
    this.healthSteps = maxSteps;
    this.maxHealthSteps = maxSteps;
    this.lastHitAt = 0;
    this.hitCooldownMs = this.hitCooldownMs ?? 250;
  }
}
