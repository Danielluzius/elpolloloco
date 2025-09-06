class Endboss extends MoveableObject {
  // Basic dimensions tuned for goblin boss sprite sheet
  height = 300;
  width = 240;
  y = 140;
  // Movement
  speed = 1.4; // slow approach
  chaseSpeed = 1.4;
  detectionRadius = 220;
  attackRange = 170;
  // State
  awake = false;
  state = 'idle';
  frameIndex = 0;
  lastFrameTime = 0;
  alertPlayed = false;
  // Timings
  IDLE_DELAY = 180;
  ALERT_DELAY = 160;
  WALK_DELAY = 110;
  ATTACK_DELAY = 110;
  HURT_DELAY = 120;
  DEAD_DELAY = 220;
  attackCooldown = 1200;
  lastAttackAt = 0;
  attackWindupMs = 250; // small delay before starting attack when in range
  _attackWindupTimer = null;

  // Sprite sheets (goblin boss)
  SHEET_IDLE = { path: 'assets/img/4_enemie_boss_goblin/1_idle_6_sprites.png', rows: 1 };
  SHEET_ALERT = { path: 'assets/img/4_enemie_boss_goblin/1_alert_3_sprites.png', rows: 1 };
  SHEET_WALK = { path: 'assets/img/4_enemie_boss_goblin/1_walk_12_sprites.png', rows: 1 };
  SHEET_ATTACK = { path: 'assets/img/4_enemie_boss_goblin/1_attack_5_sprites.png', rows: 1 };
  SHEET_HURT = { path: 'assets/img/4_enemie_boss_goblin/1_hurt_3_sprites.png', rows: 1 };
  SHEET_DEAD = { path: 'assets/img/4_enemie_boss_goblin/1_dead_3_sprites.png', rows: 1 };

  constructor() {
    super();
    this.initImages();
    this.x = 4550;
    this.initLoops();
  }

  initImages() {
    // Preload all sheets; set initial to idle first frame
    this.loadImage(this.SHEET_IDLE.path);
    this.loadImage(this.SHEET_ALERT.path);
    this.loadImage(this.SHEET_WALK.path);
    this.loadImage(this.SHEET_ATTACK.path);
    this.loadImage(this.SHEET_HURT.path);
    this.loadImage(this.SHEET_DEAD.path);
    // Ensure sheet metadata (cols/count) from filename counts
    this.ensureSheetMeta(this.SHEET_IDLE);
    this.ensureSheetMeta(this.SHEET_ALERT);
    this.ensureSheetMeta(this.SHEET_WALK);
    this.ensureSheetMeta(this.SHEET_ATTACK);
    this.ensureSheetMeta(this.SHEET_HURT);
    this.ensureSheetMeta(this.SHEET_DEAD);
    const idleImg = this.imageCache[this.SHEET_IDLE.path];
    if (idleImg) {
      this.img = idleImg;
      // Try to clamp to first frame
      this.setSheetFrameAuto(this.SHEET_IDLE, 0);
    }
  }

  initLoops() {
    this.startStateAnimLoop();
    this.startWalkLoop();
  }

  // Wake and start alert once when character enters detection radius
  wakeIfNear(character) {
    const dx = Math.abs(character.x + character.width / 2 - (this.x + this.width / 2));
    if (dx <= this.detectionRadius) {
      this.awake = true;
      if (!this.alertPlayed && this.state === 'idle') {
        this.state = 'alert';
        this.frameIndex = 0;
        this.lastFrameTime = Date.now();
      }
    }
  }

  // Attempt to start an attack when in range with a small windup and cooldown
  checkAndStartAttack(world) {
    if (!this.awake || this.dead || world.character.isDead()) return;
    const now = Date.now();
    const dx = Math.abs(world.character.x + world.character.width / 2 - (this.x + this.width / 2));
    const inRange = dx <= this.attackRange;
    const cooled = now - (this.lastAttackAt || 0) >= this.attackCooldown;
    const busy = this.state === 'attack' || this.state === 'hurt' || this.dead;
    if (!inRange || !cooled || busy) return;
    // windup before switching to attack
    if (this._attackWindupTimer) return; // already preparing
    this._attackWindupTimer = setTimeout(() => {
      this._attackWindupTimer = null;
      if (this.dead) return;
      // recheck conditions
      const now2 = Date.now();
      const cx = world.character.x + world.character.width / 2;
      const bx = this.x + this.width / 2;
      const stillInRange = Math.abs(cx - bx) <= this.attackRange;
      const cooled2 = now2 - (this.lastAttackAt || 0) >= this.attackCooldown;
      if (!stillInRange || !cooled2) return;
      this.state = 'attack';
      this.frameIndex = 0;
      this.lastFrameTime = now2;
      this.lastAttackAt = now2;
      this.scheduleAttackHitCheck(world);
    }, this.attackWindupMs);
  }

  scheduleAttackHitCheck(world) {
    // Hit around frame 3 of attack sequence
    const hitWindowStart = 3;
    setTimeout(() => {
      if (this.state !== 'attack' || this.dead) return;
      this.tryApplyBossAttackDamage(world);
    }, hitWindowStart * this.ATTACK_DELAY);
  }

  tryApplyBossAttackDamage(world) {
    const ch = world?.character;
    if (!ch || ch.isDead?.()) return;
    // Check distance
    const cx = ch.x + ch.width / 2;
    const bx = this.x + this.width / 2;
    const closeNow = Math.abs(cx - bx) <= this.attackRange + 10;
    if (!closeNow) return;
    // Vertical overlap check
    const a = this.getBoundsWithOffset?.(this) || { top: this.y, bottom: this.y + this.height };
    const b = ch.getBoundsWithOffset?.(ch) || { top: ch.y, bottom: ch.y + ch.height };
    const vOverlap = a.bottom > b.top && a.top < b.bottom;
    if (!vOverlap) return;
    // Block check similar to goblin, but do not knock back boss
    if (ch.isBlocking) {
      const bossOnRight = this.x > ch.x;
      const facingRight = !ch.otherDirection;
      const blockCovers = (bossOnRight && facingRight) || (!bossOnRight && ch.otherDirection);
      if (blockCovers) {
        ch.triggerBlock?.();
        // small penalty to avoid immediate re-hit
        const now = Date.now();
        this.lastAttackAt = now; // reset cooldown baseline
        return;
      }
    }
    // Apply normal goblin damage
    world.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  startStateAnimLoop() {
    setInterval(() => {
      // If character is dead, force idle state and animate idle only
      const chDead = this.world?.character?.isDead?.();
      if (chDead && !this.dead) {
        this.awake = false;
        this.alertPlayed = false;
        this.state = 'idle';
        // keep cycling idle frames
        const nowIdle = Date.now();
        const { sheet, delay } = { sheet: this.SHEET_IDLE, delay: this.IDLE_DELAY };
        this.advanceFrameIfDue(nowIdle, delay);
        const len = this.getSheetCountAutoWithFallback(sheet);
        if (this.frameIndex >= len) this.loopFrame(len);
        this.setCurrentSheetFrame(sheet);
        return;
      }
      const now = Date.now();
      const { sheet, delay } = this.pickAnim();
      this.advanceFrameIfDue(now, delay);
      const len = this.getSheetCountAutoWithFallback(sheet);
      this.applyTransitions(len);
      this.setCurrentSheetFrame(sheet);
    }, 50);
  }

  advanceFrameIfDue(now, delay) {
    if (now - this.lastFrameTime >= delay) {
      this.frameIndex++;
      this.lastFrameTime = now;
    }
  }

  pickAnim() {
    if (this.state === 'dead' || this.dead) return { sheet: this.SHEET_DEAD, delay: this.DEAD_DELAY };
    if (this.state === 'alert') return { sheet: this.SHEET_ALERT, delay: this.ALERT_DELAY };
    if (this.state === 'attack') return { sheet: this.SHEET_ATTACK, delay: this.ATTACK_DELAY };
    if (this.state === 'hurt') return { sheet: this.SHEET_HURT, delay: this.HURT_DELAY };
    if (this.state === 'walk') return { sheet: this.SHEET_WALK, delay: this.WALK_DELAY };
    // idle and default
    return { sheet: this.SHEET_IDLE, delay: this.IDLE_DELAY };
  }

  applyTransitions(length) {
    if (this.state === 'dead') return this.clampOnDead(length);
    if (this.state === 'alert' && this.frameIndex >= this.getSheetCountAutoWithFallback(this.SHEET_ALERT))
      return this.onAlertDone();
    if (this.state === 'attack' && this.frameIndex >= length) return this.onAttackDone();
    if (this.state === 'hurt' && this.frameIndex >= length) return this.onHurtDone();
    if (this.state === 'walk' && this.frameIndex >= length) return this.loopFrame(length);
    if (this.state === 'idle') {
      if (this.frameIndex >= this.getSheetCountAutoWithFallback(this.SHEET_IDLE)) this.loopFrame(length);
    }
  }

  clampOnDead(length) {
    this.frameIndex = Math.min(this.frameIndex, length - 1);
  }

  onAlertDone() {
    this.alertPlayed = true;
    this.state = 'walk';
    this.frameIndex = 0;
  }

  onAttackDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  onHurtDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  loopFrame(length) {
    this.frameIndex = 0;
  }

  setCurrentSheetFrame(sheet) {
    // set img to sheet and select frame region
    this.ensureSheetMeta(sheet);
    const img = this.imageCache[sheet.path];
    if (img) this.img = img;
    const idx = this.safeFrameIndex(sheet);
    this.setSheetFrameAuto(sheet, idx);
  }

  getSheetCountAutoWithFallback(sheet) {
    // Prefer count from filename; else approximate with helper
    const fromName = this.getSpriteCountFromFilename(sheet.path);
    if (fromName && fromName > 0) return fromName;
    return this.getSheetCountAuto(sheet);
  }

  // Ensure we have sensible cols/count for auto sheet cutter
  ensureSheetMeta(sheet) {
    if (!sheet) return;
    const cnt = this.getSpriteCountFromFilename?.(sheet.path);
    if (cnt && !sheet.count) {
      sheet.count = cnt;
      sheet.cols = cnt;
      sheet.rows = sheet.rows || 1;
    }
  }

  safeFrameIndex(sheet) {
    const count = this.getSheetCountAutoWithFallback(sheet);
    // Clamp for non-looping sequences
    const nonLoop = this.state === 'dead' || this.state === 'alert' || this.state === 'hurt' || this.state === 'attack';
    if (nonLoop) return Math.min(this.frameIndex, Math.max(0, count - 1));
    // loop for idle/walk
    if (count <= 0) return 0;
    return this.frameIndex % count;
  }

  startWalkLoop() {
    setInterval(() => {
      if (this.dead) return;
      if (this.world?.character?.isDead?.()) {
        // stop all movement when character is dead
        this.speed = 0;
        return;
      }
      // Update facing direction towards character when awake
      const char = this.world?.character;
      if (char) this.otherDirection = char.x < this.x; // face the character

      // Simple chase when awake
      if (this.awake && (this.state === 'walk' || this.state === 'attack')) {
        if (char) {
          const dx = char.x - this.x;
          if (Math.abs(dx) > 2) {
            this.speed = this.chaseSpeed;
            if (dx < 0) this.moveLeft();
            else this.moveRight();
          }
        }
      }

      // Keep chasing once awakened; do not revert to idle when player moves away
    }, 1000 / 60);
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

  // On hit: reduce HP, no knockback; do not re-trigger hurt animation while already in hurt/attack
  applyHit(amount = 1, now = Date.now(), defaultMaxSteps = null) {
    const cooldown = this.hitCooldownMs ?? 250;
    if (!this.lastHitAt || now - this.lastHitAt >= cooldown) {
      if (this.maxHealthSteps == null && defaultMaxSteps != null) this.maxHealthSteps = defaultMaxSteps;
      const max = this.maxHealthSteps ?? defaultMaxSteps ?? 0;
      const current = this.healthSteps ?? max;
      this.healthSteps = Math.max(0, current - amount);
      this.lastHitAt = now;
      if (this.healthSteps === 0) {
        this.dead = true;
        this.speed = 0;
        this.state = 'dead';
        this.frameIndex = 0;
      } else {
        // Only switch to hurt if not already attacking or hurting (non-stackable animation)
        if (this.state !== 'hurt' && this.state !== 'attack') {
          this.state = 'hurt';
          this.frameIndex = 0;
          this.lastFrameTime = now;
        }
      }
      return true;
    }
    return false;
  }

  initHealth(maxSteps) {
    this.healthSteps = maxSteps;
    this.maxHealthSteps = maxSteps;
    this.lastHitAt = 0;
    this.hitCooldownMs = this.hitCooldownMs ?? 250;
  }

  getBarrierRect(margin, width) {
    const x = this.x + this.width - margin;
    return { x, y: -1000, width, height: 3000, offset: { top: 0, right: 0, bottom: 0, left: 0 } };
  }
}
