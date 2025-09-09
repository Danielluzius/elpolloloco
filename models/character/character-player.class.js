class CharacterPlayer extends Character {
  // Intro state
  introActive = false;
  introStartX = 0;
  introTargetX = 0;
  introSpeed = 3.5;
  introFrameIndex = 0;
  lastIntroFrameTime = 0;
  INTRO_FRAME_DELAY = 80;
  // Jump state
  isJumping = false;
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  jumpVX = 0;
  JUMP_FORWARD_VX = 0;
  JUMP_INIT_VY = 26;
  // Special attack
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
  // Idle/long idle
  idleFrameIndex = 0;
  lastIdleFrameTime = 0;
  IDLE_FRAME_DELAY = 220;
  IDLE_FRAME_ORDER = null;
  longIdleFrameIndex = 0;
  lastLongIdleFrameTime = 0;
  LONG_IDLE_FRAME_DELAY = 200;
  // Hurt / knockback
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
  // Block
  isBlocking = false;
  blockFrameIndex = 0;
  lastBlockFrameTime = 0;
  BLOCK_FRAME_DELAY = 100;
  blockSegments = 5;
  // Attack
  isAttacking = false;
  attackFrameIndex = 0;
  lastAttackFrameTime = 0;
  ATTACK_FRAME_DELAY = 90;
  attackEndAt = 0;
  ATTACK_COOLDOWN_MS = 500;
  nextAttackAt = 0;
  _attackSeq = 0;
  // Death anim
  DEAD_FRAME_DELAY = 200;
  deadStartedAt = 0;
  DEATH_INIT_VY = 24;
  DEATH_ACCEL = 3;
  deathArcInit = false;
  deathLastFrameLocked = false;
  // Special VFX frames
  SPECIAL_EFFECT_PATHS = Array.from(
    { length: 10 },
    (_, i) => `assets/img/2_character_man/11_special_attack/${i + 1}.png`
  );

  constructor() {
    super();
    this.loadSpecialEffectImages();
    this.computeIdleOrder();
    this.initLoops();
  }

  // Setup helpers
  loadSpecialEffectImages() {
    this.SPECIAL_EFFECT_PATHS.forEach((p) => this.loadImage(p));
  }
  computeIdleOrder() {
    const img = this.imageCache[this.IDLE_SHEET.path];
    const cnt = this.getSheetCount(this.IDLE_SHEET, img) || 1;
    let order = Array.from({ length: cnt }, (_, i) => i);
    if (order.length > 1) order = order.slice(0, order.length - 1);
    this.IDLE_FRAME_ORDER = order.length ? order : [0];
  }

  initLoops() {
    this.applyGravity();
    this.startInputLoop();
    this.startAnimLoop();
  }

  // Input / camera
  startInputLoop() {
    setInterval(() => this.processInputTick(), 1000 / 60);
  }
  processInputTick() {
    if (this.isDead()) return;
    if (this.introActive) {
      this.updateIntro();
      this.updateCamera();
      return;
    }
    if (!this.knockbackActive && !this.isSpecialAttacking && !this.isAttacking && !this.isBlocking)
      this.handleHorizontalMove();
    this.updateKnockback();
    this.updateJump();
    this.updateSpecialAttack();
    this.updateAttack();
    this.updateBlockState();
    this.updateCamera();
    if (!this.knockbackActive) this.handleJumpKey();
    this.markActivityOnAction();
  }
  handleHorizontalMove() {
    if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
      this.moveRight();
      this.otherDirection = false;
      this.lastActivityAt = Date.now();
    }
    if (this.world.keyboard.LEFT && this.x > 0) {
      this.moveLeft();
      this.otherDirection = true;
      this.lastActivityAt = Date.now();
    }
  }
  updateCamera() {
    const w = this.world;
    if (!w) return;
    if (w.introActive || w.bossIntroActive) {
      w.camera_x = typeof w.introCamX === 'number' ? w.introCamX : -this.x + 100;
      return;
    }
    w.camera_x = -this.x + 100;
  }
  markActivityOnAction() {
    if (this.world.keyboard.S || this.world.keyboard.A || this.world.keyboard.UP || this.world.keyboard.SPACE)
      this.lastActivityAt = Date.now();
  }

  // Jump
  handleJumpKey() {
    const grounded = !this.isAboveGround();
    const clear =
      grounded && !this.isSpecialAttacking && !this.isAttacking && !this.knockbackActive && !this.isBlocking;
    if ((this.world.keyboard.UP || this.world.keyboard.SPACE) && clear) return this.startJump();
    if (this.world.keyboard.S && clear) return this.startSpecialAttack();
    if (this.world.keyboard.A && clear) return this.startAttack();
  }
  startJump() {
    const now = Date.now();
    this.isJumping = true;
    this.speedY = this.JUMP_INIT_VY;
    this.jumpVX = 0;
    this.jumpFrameIndex = 0;
    this.lastJumpFrameTime = now;
    this.animKey = 'jump';
    const img = this.imageCache[this.JUMP_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.JUMP_SHEET, 0);
    }
    this.lastActivityAt = now;
  }
  updateJump() {
    if (this.isJumping && !this.isAboveGround()) {
      this.isJumping = false;
      this.jumpVX = 0;
    }
  }

  // Special
  startSpecialAttack() {
    const maxSeg = this.world?.characterChargeBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.world?.character?.chargeSegments ?? 0));
    if (cur < maxSeg) return;
    const now = Date.now();
    this.isSpecialAttacking = true;
    this.specialFrameIndex = 0;
    this.effectFrameIndex = 0;
    this.lastSpecialFrameTime = now;
    this.lastEffectFrameTime = now;
    if (this.world) {
      this.world.character.chargeSegments = 0;
      this.world.characterChargeBar?.setSegments(0);
    }
    const img = this.imageCache[this.SPECIAL_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.SPECIAL_SHEET, 0);
      this.animKey = 'special';
    }
    this.lastActivityAt = now;
  }
  updateSpecialAttack() {
    if (!this.isSpecialAttacking) return;
    this.advanceSpecialFrames();
    this.applySpecialWindPush();
    this.finishSpecialIfDone();
  }
  advanceSpecialFrames() {
    const now = Date.now();
    const specCnt = this.getSheetCount(this.SPECIAL_SHEET, this.imageCache[this.SPECIAL_SHEET.path]) || 5;
    if (now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY && this.specialFrameIndex < specCnt - 1) {
      this.specialFrameIndex++;
      this.lastSpecialFrameTime = now;
    }
    const effCnt = this.SPECIAL_EFFECT_PATHS.length;
    if (now - this.lastEffectFrameTime >= this.EFFECT_FRAME_DELAY && this.effectFrameIndex < effCnt - 1) {
      this.effectFrameIndex++;
      this.lastEffectFrameTime = now;
    }
  }
  applySpecialWindPush() {
    const w = this.world;
    if (!w?.level?.enemies) return;
    const dir = this.otherDirection ? -1 : 1;
    const cx = this.x + this.width / 2;
    const range = 90 + this.effectFrameIndex * 30;
    for (const enemy of w.level.enemies) {
      if (!enemy || enemy.dead || enemy.dying) continue;
      const ex = enemy.x + (enemy.width || 0) / 2;
      const dx = ex - cx;
      const inFront = dir > 0 ? dx >= 0 && dx <= range : dx <= 0 && -dx <= range;
      if (!inFront) continue;
      const ey = enemy.y + (enemy.height || 0) / 2;
      const cy = this.y + this.height / 2;
      if (Math.abs(ey - cy) > 200) continue;
      const push = dir * this.WIND_PUSH_SPEED;
      if (typeof enemy.knockbackVX === 'number') {
        enemy.knockbackVX = push;
        enemy.knockbackEndAt = Date.now() + 360;
      } else {
        enemy.x += push;
      }
    }
  }
  finishSpecialIfDone() {
    const cnt = this.getSheetCount(this.SPECIAL_SHEET, this.imageCache[this.SPECIAL_SHEET.path]) || 5;
    if (this.specialFrameIndex >= cnt - 1 && this.effectFrameIndex >= this.SPECIAL_EFFECT_PATHS.length - 1) {
      this.isSpecialAttacking = false;
      this.specialFrameIndex = 0;
      this.effectFrameIndex = 0;
    }
  }
  setSpecialFrame(now) {
    const img = this.imageCache[this.SPECIAL_SHEET.path];
    const cnt = this.getSheetCount(this.SPECIAL_SHEET, img) || 5;
    if (this.specialFrameIndex < cnt - 1 && now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY) {
      this.specialFrameIndex++;
      this.lastSpecialFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(this.SPECIAL_SHEET, Math.min(this.specialFrameIndex, cnt - 1));
    this.animKey = 'special';
  }
  drawFrame(ctx) {
    if (!this.isSpecialAttacking) return;
    const idx = Math.max(0, Math.min(this.SPECIAL_EFFECT_PATHS.length - 1, this.effectFrameIndex));
    const path = this.SPECIAL_EFFECT_PATHS[idx];
    const img = this.imageCache?.[path];
    if (!img) return;
    const cam = this.world?.camera_x || 0;
    const baseX = this.otherDirection ? 0 : Math.round(this.x + cam);
    const baseY = Math.round(this.y);
    const move = this.effectFrameIndex * this.EFFECT_MOVE_STEP;
    const dx = Math.round(baseX + (this.width - this.SPECIAL_EFFECT_W) / 2 + move);
    const dy = Math.round(baseY + this.height - this.SPECIAL_EFFECT_H + this.SPECIAL_EFFECT_FEET_OFFSET);
    ctx.drawImage(img, dx, dy, this.SPECIAL_EFFECT_W, this.SPECIAL_EFFECT_H);
  }

  // Animation driver
  startAnimLoop() {
    setInterval(() => this.animTick(), 50);
  }
  animTick() {
    const now = Date.now();
    if (this.isDead()) return this.setDeadFrame();
    if (this.introActive) return this.setIntroWalkFrame();
    if (this.isSpecialAttacking) return this.setSpecialFrame(now);
    if (this.isHurt()) return this.setHurtFrame();
    if (this.isAttacking) return this.setAttackFrame(now);
    if (this.isAboveGround() || this.isJumping) return this.setJumpFrame(now);
    if (this.isBlocking) return this.setBlockFrame(now);
    this.setGroundedFrame(now);
  }

  // Intro
  startIntroWalk(startX, targetX) {
    this.introActive = true;
    this.introStartX = startX;
    this.introTargetX = targetX;
    this.x = startX;
    this.otherDirection = false;
    this.currentImage = 0;
    this.introFrameIndex = 0;
    this.lastIntroFrameTime = Date.now();
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.WALK_INTRO_SHEET, 0);
    }
    if (this.world) {
      this.world.introActive = true;
      this.world.introCamX = -targetX + 100;
      this.world.camera_x = this.world.introCamX;
    }
  }
  updateIntro() {
    const dx = this.introTargetX - this.x;
    if (dx > 0) this.x += Math.min(this.introSpeed, dx);
    if (this.x >= this.introTargetX) {
      this.x = this.introTargetX;
      this.introActive = false;
      if (this.world) {
        this.world.introActive = false;
        delete this.world.introCamX;
      }
      this.setDefaultStandFrame();
      this.lastActivityAt = Date.now();
    }
  }
  setIntroWalkFrame() {
    const now = Date.now();
    if (this.animKey !== 'intro_walk') {
      this.currentImage = 0;
      this.introFrameIndex = 0;
      this.lastIntroFrameTime = now;
    }
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.WALK_INTRO_SHEET, img) || 9;
    if (now - this.lastIntroFrameTime >= this.INTRO_FRAME_DELAY) {
      this.introFrameIndex = (this.introFrameIndex + 1) % cnt;
      this.lastIntroFrameTime = now;
    }
    this.setSheetFrame(this.WALK_INTRO_SHEET, this.introFrameIndex % cnt);
    this.animKey = 'intro_walk';
  }

  // Death
  setDeadFrame() {
    this.updateDeadFrameIndex();
    this.applyDeathSprite();
    this.speedY = 0;
    this.y = this.groundY;
  }
  updateDeadFrameIndex() {
    if (!this.deadStartedAt) this.deadStartedAt = Date.now();
    let idx = Math.floor((Date.now() - this.deadStartedAt) / this.DEAD_FRAME_DELAY);
    const img = this.imageCache[this.DEAD_SHEET.path];
    const cnt = this.getSheetCount(this.DEAD_SHEET, img) || this.DEAD_SHEET.count || 1;
    if (idx >= cnt) {
      idx = cnt - 1;
      this.deathLastFrameLocked = true;
    }
    this._deadFrameIdx = idx;
  }
  applyDeathSprite() {
    const img = this.imageCache[this.DEAD_SHEET.path];
    if (!img) return;
    const cnt = this.getSheetCount(this.DEAD_SHEET, img) || 1;
    const idx = Math.min(this._deadFrameIdx, cnt - 1);
    this.img = img;
    this.setSheetFrame(this.DEAD_SHEET, idx);
    this.animKey = 'dead';
  }

  // Hurt / knockback
  setHurtFrame() {
    const now = Date.now();
    if (this.animKey !== 'hurt') {
      this.hurtFrameIndex = 0;
      this.lastHurtFrameTime = now;
      this._hurtAnimStartAt = now;
    }
    const img = this.imageCache[this.HURT_SHEET.path];
    if (img) {
      const cnt = this.getSheetCount(this.HURT_SHEET, img) || 1;
      const start = this._hurtAnimStartAt || now;
      const end = this.hurtEndAt || start + this.HURT_FRAME_DELAY * cnt;
      const total = Math.max(1, end - start);
      const elapsed = Math.max(0, Math.min(total, now - start));
      const target = Math.min(cnt - 1, Math.floor((elapsed / total) * cnt));
      this.hurtFrameIndex = Math.max(this.hurtFrameIndex, target);
      this.img = img;
      this.setSheetFrame(this.HURT_SHEET, this.hurtFrameIndex);
    }
    this.animKey = 'hurt';
  }
  updateKnockback() {
    if (!this.knockbackActive) return;
    this.x += this.knockbackVX;
    this.knockbackVX *= 0.9;
    if (Date.now() >= this.knockbackEndAt) {
      this.knockbackActive = false;
      this.knockbackVX = 0;
    }
  }
  applyKnockbackFrom(enemy) {
    if (this.isSpecialAttacking) return;
    const now = Date.now();
    const dir = enemy?.x > this.x ? -1 : 1;
    this.knockbackActive = true;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = 0;
    this.hurtEndAt = this.knockbackEndAt;
  }
  isHurt() {
    if (this.hurtEndAt) return Date.now() < this.hurtEndAt;
    return super.isHurt();
  }

  // Jump anim
  setJumpFrame(now) {
    const img = this.imageCache[this.JUMP_SHEET.path];
    const cnt = this.getSheetCount(this.JUMP_SHEET, img) || 1;
    if (this.jumpFrameIndex < cnt - 1 && now - this.lastJumpFrameTime >= this.JUMP_FRAME_DELAY) {
      this.jumpFrameIndex++;
      this.lastJumpFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.jumpFrameIndex, cnt - 1));
    this.animKey = 'jump';
  }

  // Attack
  startAttack() {
    const now = Date.now();
    if (now < (this.nextAttackAt || 0)) return;
    this.attackId = ++this._attackSeq;
    this.isAttacking = true;
    this.attackFrameIndex = 0;
    this.lastAttackFrameTime = now;
    const frames = this.getSheetCount(this.ATTACK_SHEET, this.imageCache[this.ATTACK_SHEET.path]) || 3;
    this.attackEndAt = now + frames * this.ATTACK_FRAME_DELAY;
    const img = this.imageCache[this.ATTACK_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.ATTACK_SHEET, 0);
    }
    this.animKey = 'attack';
    this.lastActivityAt = now;
  }
  updateAttack() {
    if (!this.isAttacking) return;
    const now = Date.now();
    if (now >= this.attackEndAt) {
      this.isAttacking = false;
      this.attackFrameIndex = 0;
      this.nextAttackAt = now + this.ATTACK_COOLDOWN_MS;
    }
  }
  setAttackFrame(now) {
    const img = this.imageCache[this.ATTACK_SHEET.path];
    const cnt = this.getSheetCount(this.ATTACK_SHEET, img) || 3;
    if (this.attackFrameIndex < cnt - 1 && now - this.lastAttackFrameTime >= this.ATTACK_FRAME_DELAY) {
      this.attackFrameIndex++;
      this.lastAttackFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(this.ATTACK_SHEET, Math.min(this.attackFrameIndex, cnt - 1));
    this.animKey = 'attack';
  }
  isAttackActiveWindow() {
    return this.isAttacking && this.attackFrameIndex >= this.ATTACK_ACTIVE_START_FRAME;
  }
  getAttackHitboxRect() {
    const b = this.getBoundsWithOffset(this);
    const range = this.ATTACK_RANGE_X;
    return this.otherDirection
      ? { left: b.left - range, right: b.left, top: b.top, bottom: b.bottom }
      : { left: b.right, right: b.right + range, top: b.top, bottom: b.bottom };
  }

  // Grounded animation selection
  setGroundedFrame(now) {
    this.resetJumpStateIfNeeded();
    const moving = this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
    const inactive = now - this.lastActivityAt;
    if (moving && !this.isBlocking) return this.setWalkFrame();
    if (inactive >= this.LONG_IDLE_AFTER_MS) return this.setLongIdleFrame(now);
    if (inactive >= this.IDLE_AFTER_MS) return this.setIdleFrame(now);
    this.setDefaultStandFrame();
  }
  resetJumpStateIfNeeded() {
    if (!this.isJumping) return;
    this.currentImage = 0;
    this.jumpFrameIndex = 0;
    this.isJumping = false;
  }

  // Damage model
  hit() {
    if (this.isSpecialAttacking) return;
    if (typeof this.applySegmentHit === 'function') this.applySegmentHit();
    else super.hit();
  }
  applySegmentHit() {
    if (this.isDead && this.isDead()) return true;
    const maxSeg = 5;
    const current = typeof this.healthSegments === 'number' ? this.healthSegments : maxSeg;
    const next = Math.max(0, current - 1);
    this.healthSegments = next;
    const segToEnergy = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 };
    this.energy = segToEnergy[next] ?? Math.round((next / maxSeg) * 100);
    this.lastHit = Date.now();
    const now = Date.now();
    if (!this.hurtEndAt || now >= this.hurtEndAt) this.hurtEndAt = now + 350;
    if (this.healthSegments <= 0) {
      this.energy = 0;
      return true;
    }
    return false;
  }

  // Idle / walk
  setDefaultStandFrame() {
    const img = this.imageCache[this.IDLE_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.IDLE_SHEET, 0);
      this.animKey = 'stand';
    }
    this.idleFrameIndex = 0;
    this.longIdleFrameIndex = 0;
  }
  setWalkFrame() {
    if (this.animKey !== 'walk') this.currentImage = 0;
    const img = this.imageCache[this.WALK_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.WALK_SHEET, img) || 1;
    const idx = this.currentImage % cnt;
    this.setSheetFrame(this.WALK_SHEET, idx);
    this.currentImage++;
    this.animKey = 'walk';
    this.idleFrameIndex = 0;
    this.longIdleFrameIndex = 0;
  }
  setLongIdleFrame(now) {
    this.ensureLongIdleState(now);
    this.advanceLongIdleFrame(now);
    const img = this.imageCache[this.LONG_IDLE_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, img) || 1;
    const idx = Math.min(this.longIdleFrameIndex, cnt - 1);
    this.setSheetFrame(this.LONG_IDLE_SHEET, idx);
    this.animKey = 'long_idle';
    this.idleFrameIndex = 0;
  }
  ensureLongIdleState(now) {
    if (this.animKey === 'long_idle') return;
    this.currentImage = 0;
    this.longIdleFrameIndex = 0;
    this.lastLongIdleFrameTime = now;
  }
  advanceLongIdleFrame(now) {
    if (now - this.lastLongIdleFrameTime < this.LONG_IDLE_FRAME_DELAY) return;
    const img = this.imageCache?.[this.LONG_IDLE_SHEET.path];
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, img) || 1;
    this.longIdleFrameIndex = Math.min(cnt - 1, this.longIdleFrameIndex + 1);
    this.lastLongIdleFrameTime = now;
  }
  setIdleFrame(now) {
    this.ensureIdleState(now);
    this.advanceIdleFrame(now);
    const img = this.imageCache[this.IDLE_SHEET.path];
    this.img = img;
    const order = this.IDLE_FRAME_ORDER?.length ? this.IDLE_FRAME_ORDER : [0];
    const frame = order[this.idleFrameIndex % order.length];
    this.setSheetFrame(this.IDLE_SHEET, frame);
    this.animKey = 'idle';
    this.longIdleFrameIndex = 0;
  }
  ensureIdleState(now) {
    if (this.animKey === 'idle') return;
    this.currentImage = 0;
    this.idleFrameIndex = 0;
    this.lastIdleFrameTime = now;
  }
  advanceIdleFrame(now) {
    if (now - this.lastIdleFrameTime < this.IDLE_FRAME_DELAY) return;
    const order = this.IDLE_FRAME_ORDER?.length ? this.IDLE_FRAME_ORDER : [0];
    this.idleFrameIndex = (this.idleFrameIndex + 1) % order.length;
    this.lastIdleFrameTime = now;
  }

  // Block
  updateBlockState() {
    const wantsBlock = !!this.world?.keyboard?.D;
    const canBlockNow = (this.blockSegments || 0) > 0;
    this.isBlocking = wantsBlock && canBlockNow && !this.isSpecialAttacking && !this.isAttacking && !this.isHurt();
    if (!this.isBlocking) this.blockFrameIndex = 0;
  }
  setBlockFrame(now) {
    const img = this.imageCache[this.BLOCK_SHEET.path];
    const cnt = this.getSheetCount(this.BLOCK_SHEET, img) || 1;
    const holdIdx = Math.max(0, cnt - 1);
    if (cnt > 1 && now - this.lastBlockFrameTime >= this.BLOCK_FRAME_DELAY && this.blockFrameIndex < holdIdx) {
      this.blockFrameIndex = Math.min(this.blockFrameIndex + 1, holdIdx);
      this.lastBlockFrameTime = now;
    }
    const idx = Math.min(Math.max(0, this.blockFrameIndex), holdIdx);
    if (img) {
      this.img = img;
      this.setSheetFrame(this.BLOCK_SHEET, idx);
      this.animKey = 'block';
    }
  }
  triggerBlock() {
    this.blockFrameIndex = 0;
    this.lastBlockFrameTime = Date.now();
    if (typeof this.blockSegments === 'number' && this.blockSegments > 0)
      this.blockSegments = Math.max(0, this.blockSegments - 1);
  }

  // Stomp (used by goblins)
  isStomping(enemy) {
    if (!(this.speedY < 0)) return false;
    const aBottom = this.y + this.height - (this.offset?.bottom || 0);
    const prevBottom = aBottom + this.speedY;
    const bTop = enemy.y + (enemy.offset?.top || 0);
    const bTopExpanded = Math.max(enemy.y, bTop - 8);
    const tolerance = 24;
    return prevBottom <= bTopExpanded + tolerance && !(enemy instanceof Endboss);
  }
  placeOnTopOf(enemy) {
    const enemyTop = enemy.y + (enemy.offset?.top || 0);
    const charBottomOffset = this.offset?.bottom || 0;
    this.y = enemyTop - (this.height - charBottomOffset) - 2;
  }
  bounceAfterStomp() {
    this.speedY = 18;
    this.isJumping = true;
    this.jumpFrameIndex = 0;
    this.currentImage = 0;
    this.lastJumpFrameTime = Date.now();
  }
}
