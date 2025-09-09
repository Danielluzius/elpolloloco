class Endboss extends MoveableObject {
  // Basic dimensions tuned for goblin boss sprite sheet
  height = 300;
  width = 240;
  y = 140;
  // Tighter collision hitbox (narrower and shorter than sprite)
  offset = { top: 90, right: 60, bottom: 0, left: 60 };
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
    // Boss HP: 10 segments, not active until alert/awake
    this.maxHealthSteps = 10;
    this.healthSteps = 10;
    this.lastHitAt = 0;
    this.hitCooldownMs = 200; // in 150–250ms range
    this._lastAttackIdHit = null; // to prevent multi-hit per player attack
  }

  // Preloads all sprite sheets and sets initial image.
  initImages() {
    this._loadAllSheets();
    this._ensureAllSheetMeta();
    this._setInitialIdleFrame();
  }

  // Loads all boss sheet images.
  _loadAllSheets() {
    [this.SHEET_IDLE, this.SHEET_ALERT, this.SHEET_WALK, this.SHEET_ATTACK, this.SHEET_HURT, this.SHEET_DEAD].forEach(
      (s) => this.loadImage(s.path)
    );
  }

  // Ensures meta (count/cols) for each sheet.
  _ensureAllSheetMeta() {
    [this.SHEET_IDLE, this.SHEET_ALERT, this.SHEET_WALK, this.SHEET_ATTACK, this.SHEET_HURT, this.SHEET_DEAD].forEach(
      (s) => this.ensureSheetMeta(s)
    );
  }

  // Sets initial idle frame.
  _setInitialIdleFrame() {
    const idleImg = this.imageCache[this.SHEET_IDLE.path];
    if (!idleImg) return;
    this.img = idleImg;
    this.setSheetFrameAuto(this.SHEET_IDLE, 0);
  }

  // Starts update loops for animation and movement.
  initLoops() {
    this.startStateAnimLoop();
    this.startWalkLoop();
  }

  // Wakes the boss when player is within detection radius.
  wakeIfNear(character) {
    const dx = Math.abs(character.x + character.width / 2 - (this.x + this.width / 2));
    if (dx <= this.detectionRadius) {
      this.awake = true;
      if (this.healthSteps == null) {
        this.maxHealthSteps = 10;
        this.healthSteps = 10;
      }
      if (!this.alertPlayed && this.state === 'idle') {
        this.state = 'alert';
        this.frameIndex = 0;
        this.lastFrameTime = Date.now();
      }
    }
  }

  // Attempts to initiate an attack sequence with windup.
  checkAndStartAttack(world) {
    if (!this._canAttemptAttack(world)) return;
    if (this._attackWindupTimer) return;
    this._attackWindupTimer = setTimeout(() => this._executeAttackStart(world), this.attackWindupMs);
  }

  // Checks preconditions for attack attempt.
  _canAttemptAttack(world) {
    if (!this.awake || this.dead || world.character.isDead()) return false;
    const dx = Math.abs(world.character.x + world.character.width / 2 - (this.x + this.width / 2));
    if (dx > this.attackRange) return false;
    const cooled = Date.now() - (this.lastAttackAt || 0) >= this.attackCooldown;
    if (!cooled) return false;
    const busy = ['attack', 'hurt'].includes(this.state);
    return !busy;
  }

  // Executes actual attack state switch after windup.
  _executeAttackStart(world) {
    this._attackWindupTimer = null;
    if (this.dead) return;
    if (!this._stillCanAttack(world)) return;
    const now = Date.now();
    this.state = 'attack';
    this.frameIndex = 0;
    this.lastFrameTime = now;
    this.lastAttackAt = now;
    this.scheduleAttackHitCheck(world);
  }

  // Revalidates attack conditions after windup.
  _stillCanAttack(world) {
    const cx = world.character.x + world.character.width / 2;
    const bx = this.x + this.width / 2;
    const inRange = Math.abs(cx - bx) <= this.attackRange;
    const cooled = Date.now() - (this.lastAttackAt || 0) >= this.attackCooldown;
    return inRange && cooled && !this.dead;
  }

  // Schedules the damage frame inside the attack.
  scheduleAttackHitCheck(world) {
    const hitFrame = 3;
    setTimeout(() => this._attackHitWindow(world), hitFrame * this.ATTACK_DELAY);
  }

  // Processes hit window of the attack.
  _attackHitWindow(world) {
    if (this.state !== 'attack' || this.dead) return;
    this.tryApplyBossAttackDamage(world);
  }

  // Applies damage to player if in range or handles block.
  tryApplyBossAttackDamage(world) {
    const ch = world?.character;
    if (!ch || ch.isDead?.()) return;
    if (!this._isPlayerVerticallyInRange(ch)) return;
    if (this._attemptBlockResponse(ch)) return;
    world.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  // Checks vertical & horizontal proximity.
  _isPlayerVerticallyInRange(ch) {
    const cx = ch.x + ch.width / 2;
    const bx = this.x + this.width / 2;
    if (Math.abs(cx - bx) > this.attackRange + 10) return false;
    const a = this.getBoundsWithOffset?.(this) || { top: this.y, bottom: this.y + this.height };
    const b = ch.getBoundsWithOffset?.(ch) || { top: ch.y, bottom: ch.y + ch.height };
    return a.bottom > b.top && a.top < b.bottom;
  }

  // Handles block logic and returns true if attack was blocked.
  _attemptBlockResponse(ch) {
    if (!ch.isBlocking) return false;
    const bossOnRight = this.x > ch.x;
    const facingRight = !ch.otherDirection;
    const blockCovers = (bossOnRight && facingRight) || (!bossOnRight && ch.otherDirection);
    if (!blockCovers) return false;
    ch.triggerBlock?.();
    this._startBlockKnockback(bossOnRight ? 1 : -1);
    this.lastAttackAt = Date.now();
    return true;
  }

  // Starts a short knockback animation after block.
  _startBlockKnockback(dir) {
    this.speedY = 0;
    const duration = 220;
    const speed = 8;
    this._blockKnockbackEndAt = Date.now() + duration;
    this._blockKnockbackVX = dir * speed;
    if (!this._blockKbLoop) this._startBlockKbLoop();
  }

  // Starts the knockback loop interval.
  _startBlockKbLoop() {
    this._blockKbLoop = setInterval(() => this._blockKbTick(), 1000 / 60);
  }

  // Processes a single knockback frame.
  _blockKbTick() {
    const t = Date.now();
    if (t >= (this._blockKnockbackEndAt || 0)) return this._endBlockKb();
    if (!this._blockKnockbackVX) return;
    this.x += this._blockKnockbackVX;
    this._blockKnockbackVX *= 0.9;
  }

  // Ends the knockback loop.
  _endBlockKb() {
    this._blockKnockbackVX = 0;
    clearInterval(this._blockKbLoop);
    this._blockKbLoop = null;
  }

  // Starts main state animation interval.
  startStateAnimLoop() {
    setInterval(() => this._stateAnimTick(), 50);
  }

  // Executes a single animation tick.
  _stateAnimTick() {
    if (this._handleCharDeadAnim()) return;
    const now = Date.now();
    const { sheet, delay } = this.pickAnim();
    this.advanceFrameIfDue(now, delay);
    const len = this.getSheetCountAutoWithFallback(sheet);
    this.applyTransitions(len);
    this.setCurrentSheetFrame(sheet);
  }

  // Handles forced idle cycle when character dead.
  _handleCharDeadAnim() {
    const chDead = this.world?.character?.isDead?.();
    if (!chDead || this.dead) return false;
    this.awake = false;
    this.alertPlayed = false;
    this.state = 'idle';
    const now = Date.now();
    this.advanceFrameIfDue(now, this.IDLE_DELAY);
    const len = this.getSheetCountAutoWithFallback(this.SHEET_IDLE);
    if (this.frameIndex >= len) this.loopFrame(len);
    this.setCurrentSheetFrame(this.SHEET_IDLE);
    return true;
  }

  // Advances frame counter if delay passed.
  advanceFrameIfDue(now, delay) {
    if (now - this.lastFrameTime >= delay) {
      this.frameIndex++;
      this.lastFrameTime = now;
    }
  }

  // Picks current sheet + delay based on state.
  pickAnim() {
    if (this.state === 'dead' || this.dead) return { sheet: this.SHEET_DEAD, delay: this.DEAD_DELAY };
    if (this.state === 'alert') return { sheet: this.SHEET_ALERT, delay: this.ALERT_DELAY };
    if (this.state === 'attack') return { sheet: this.SHEET_ATTACK, delay: this.ATTACK_DELAY };
    if (this.state === 'hurt') return { sheet: this.SHEET_HURT, delay: this.HURT_DELAY };
    if (this.state === 'walk') return { sheet: this.SHEET_WALK, delay: this.WALK_DELAY };
    // idle and default
    return { sheet: this.SHEET_IDLE, delay: this.IDLE_DELAY };
  }

  // Applies animation state transitions.
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

  // Clamps frame index on death sequence end.
  clampOnDead(length) {
    this.frameIndex = Math.min(this.frameIndex, length - 1);
  }

  // Handles end of alert animation.
  onAlertDone() {
    this.alertPlayed = true;
    this.state = 'walk';
    this.frameIndex = 0;
  }

  // Handles end of attack animation.
  onAttackDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  // Handles end of hurt animation.
  onHurtDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  // Loops a frame sequence.
  loopFrame(length) {
    this.frameIndex = 0;
  }

  // Sets current frame image from sheet.
  setCurrentSheetFrame(sheet) {
    this.ensureSheetMeta(sheet);
    const img = this.imageCache[sheet.path];
    if (img) this.img = img;
    const idx = this.safeFrameIndex(sheet);
    this.setSheetFrameAuto(sheet, idx);
  }

  // Returns sprite count for a sheet.
  getSheetCountAutoWithFallback(sheet) {
    const fromName = this.getSpriteCountFromFilename(sheet.path);
    if (fromName && fromName > 0) return fromName;
    return this.getSheetCountAuto(sheet);
  }

  // Ensures sheet meta (count/cols) derived from filename.
  ensureSheetMeta(sheet) {
    if (!sheet) return;
    const cnt = this.getSpriteCountFromFilename?.(sheet.path);
    if (cnt && !sheet.count) {
      sheet.count = cnt;
      sheet.cols = cnt;
      sheet.rows = sheet.rows || 1;
    }
  }

  // Returns safe frame index (looping or clamped).
  safeFrameIndex(sheet) {
    const count = this.getSheetCountAutoWithFallback(sheet);
    const nonLoop = this.state === 'dead' || this.state === 'alert' || this.state === 'hurt' || this.state === 'attack';
    if (nonLoop) return Math.min(this.frameIndex, Math.max(0, count - 1));
    if (count <= 0) return 0;
    return this.frameIndex % count;
  }

  // Starts walking / chasing interval.
  startWalkLoop() {
    setInterval(() => this._walkTick(), 1000 / 60);
  }

  // Executes a single walk tick.
  _walkTick() {
    if (this.dead) return;
    const ch = this.world?.character;
    if (ch?.isDead?.()) return (this.speed = 0);
    if (ch) this.otherDirection = ch.x < this.x;
    if (!this.awake || !['walk', 'attack'].includes(this.state) || !ch) return;
    const dx = ch.x - this.x;
    if (Math.abs(dx) <= 2) return;
    this.speed = this.chaseSpeed;
    dx < 0 ? this.moveLeft() : this.moveRight();
  }

  // Returns true if boss is not dead.
  isAlive() {
    return !this.dead;
  }

  // Returns whether boss is awake.
  isAwake() {
    return !!this.awake;
  }

  // Returns current remaining health steps.
  getHealthStep() {
    return this.healthSteps;
  }

  // Applies a damage hit and manages state changes.
  applyHit(amount = 1, now = Date.now(), defaultMaxSteps = null, attackId = null) {
    if (!this.awake || this.dead) return false;
    if (attackId != null && this._lastAttackIdHit === attackId) return false;
    const cooldown = this.hitCooldownMs ?? 200;
    if (this.lastHitAt && now - this.lastHitAt < cooldown) return false;
    if (this.maxHealthSteps == null) this.maxHealthSteps = defaultMaxSteps ?? 10;
    if (this.healthSteps == null) this.healthSteps = this.maxHealthSteps;
    const current = this.healthSteps;
    const next = Math.max(0, current - 1); // always -1 segment per spec
    this.healthSteps = next;
    this.lastHitAt = now;
    if (attackId != null) this._lastAttackIdHit = attackId;
    if (this.healthSteps === 0) {
      this.dead = true;
      this.speed = 0;
      this.state = 'dead';
      this.frameIndex = 0; // Dead once
    } else {
      if (this.state !== 'hurt' && this.state !== 'attack') {
        this.state = 'hurt';
        this.frameIndex = 0;
        this.lastFrameTime = now;
      }
    }
    return true;
  }

  // Initializes boss health steps.
  initHealth(maxSteps) {
    this.healthSteps = maxSteps;
    this.maxHealthSteps = maxSteps;
    this.lastHitAt = 0;
    this.hitCooldownMs = this.hitCooldownMs ?? 250;
  }
}
