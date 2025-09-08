class Character extends MoveableObject {
  height = 200; // was 240
  width = 210; // wider again
  y = 240; // start directly on ground to avoid initial fall
  groundY = 240;
  speed = 10;
  // Intro auto-walk state
  introActive = false;
  introStartX = 0;
  introTargetX = 0;
  introSpeed = 3.5; // slightly faster intro walk (~210 px/s at 60fps)
  defaultStartX = 0;
  introFrameIndex = 0;
  lastIntroFrameTime = 0;
  INTRO_FRAME_DELAY = 80; // faster cadence for smoother intro walk
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  isJumping = false;
  // Special attack state (replaces dodge on 'D')
  isSpecialAttacking = false;
  specialFrameIndex = 0;
  lastSpecialFrameTime = 0;
  SPECIAL_FRAME_DELAY = 90;
  specialEndAt = 0;
  // Visual effect for special (10 frames)
  SPECIAL_EFFECT_PATHS = Array.from(
    { length: 10 },
    (_, i) => `assets/img/2_character_man/11_special_attack/${i + 1}.png`
  );
  effectFrameIndex = 0;
  lastEffectFrameTime = 0;
  EFFECT_FRAME_DELAY = 50;
  SPECIAL_EFFECT_W = 200;
  SPECIAL_EFFECT_H = 200;
  SPECIAL_EFFECT_FEET_OFFSET = 60; // even lower at the feet/ground
  EFFECT_MOVE_STEP = 26; // VFX travels faster away from player
  WIND_PUSH_SPEED = 36; // stronger wind push for special
  lastActivityAt = Date.now();
  IDLE_AFTER_MS = 1500;
  LONG_IDLE_AFTER_MS = 6000;
  animKey = 'stand';
  idleFrameIndex = 0;
  lastIdleFrameTime = 0;
  IDLE_FRAME_DELAY = 220; // slowed idle
  // For idle, skip the last frame (glitch). We'll use an order array excluding the final index.
  IDLE_FRAME_ORDER = null;
  // Hurt animation timing (slower, non-loop)
  hurtFrameIndex = 0;
  lastHurtFrameTime = 0;
  HURT_FRAME_DELAY = 90; // slightly faster per request
  hurtEndAt = 0; // duration synced to knockback
  _hurtAnimStartAt = 0;
  // Knockback state
  knockbackActive = false;
  knockbackEndAt = 0;
  knockbackVX = 0;
  KNOCKBACK_SPEED_X = 10;
  KNOCKBACK_SPEED_Y = 14; // kept for compatibility, but not used anymore
  KNOCKBACK_DURATION = 350; // ms
  // Jump state (separate from dodge)
  jumpVX = 0;
  JUMP_FORWARD_VX = 0; // no horizontal impulse on jump
  JUMP_INIT_VY = 26; // higher than stomp bounce for small obstacles
  // Block state
  isBlocking = false;
  blockFrameIndex = 0;
  lastBlockFrameTime = 0;
  BLOCK_FRAME_DELAY = 100;
  _blockReady = false;
  // Block resource (5 charges)
  blockSegments = 5;
  // Sprite-sheet config for new idle
  IDLE_SHEET = {
    path: 'assets/img/2_character_man/1_idle.png',
    frameW: 128,
    frameH: 128,
    cols: 6,
    rows: 1,
    count: 6,
  };
  // Additional sheets
  LONG_IDLE_SHEET = {
    path: 'assets/img/2_character_man/2_idle_long.png',
    frameW: 128,
    frameH: 128,
  };
  // Use RUN sheet instead of WALK for movement animation
  WALK_SHEET = {
    path: 'assets/img/2_character_man/7_run.png',
    frameW: 128,
    frameH: 128,
    // cols/rows/count will be inferred from image dimensions
  };
  // Intro WALK sheet (9 frames)
  WALK_INTRO_SHEET = {
    path: 'assets/img/2_character_man/9_walk.png',
    frameW: 128,
    frameH: 128,
    cols: 9,
    rows: 1,
    count: 9,
  };
  JUMP_SHEET = {
    path: 'assets/img/2_character_man/6_jump.png',
    frameW: 128,
    frameH: 128,
    cols: 10,
    rows: 1,
    count: 10,
  };
  HURT_SHEET = {
    path: 'assets/img/2_character_man/4_hurt.png',
    frameW: 128,
    frameH: 128,
    cols: 3,
    rows: 1,
    count: 3,
  };
  ATTACK_SHEET = {
    path: 'assets/img/2_character_man/3_attack_stand2.png',
    frameW: 128,
    frameH: 128,
    cols: 3,
    rows: 1,
    count: 3,
  };
  SPECIAL_SHEET = {
    path: 'assets/img/2_character_man/3_attack_stand.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };
  BLOCK_SHEET = {
    // We'll try to load one of the expected assets for block; default to single-frame fallback
    path: 'assets/img/2_character_man/10_block.png',
    frameW: 128,
    frameH: 128,
  };
  // Attack hitbox config
  ATTACK_RANGE_X = 80; // reach in front of character
  ATTACK_ACTIVE_START_FRAME = 1; // only frames >= this can hit
  DEAD_SHEET = {
    path: 'assets/img/2_character_man/5_dead.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };
  // Attack state
  isAttacking = false;
  attackFrameIndex = 0;
  lastAttackFrameTime = 0;
  ATTACK_FRAME_DELAY = 90;
  attackEndAt = 0;
  ATTACK_COOLDOWN_MS = 500;
  nextAttackAt = 0;
  // (no lunge for normal attack)
  longIdleFrameIndex = 0;
  lastLongIdleFrameTime = 0;
  LONG_IDLE_FRAME_DELAY = 200;

  constructor() {
    super();
    this.offset = { top: 120, right: 80, bottom: 0, left: 80 };
    this.initImages();
    this.initLoops();
    this.DEAD_FRAME_DELAY = 200;
    this.deadStartedAt = 0;
    this.DEATH_INIT_VY = 24;
    this.DEATH_ACCEL = 3;
    this.deathArcInit = false;
    this.deathLastFrameLocked = false;
    // New: 5-segment health model (L + 3xM + R). Start full by default; world may re-init.
    this.healthSegments = 5;
    this.energy = 100; // legacy compatibility for percentage-based bars
    // Remember where the character normally starts (target for intro)
    this.defaultStartX = this.x;
  }

  initImages() {
    // Preload all sheets for the new character
    this.loadImage(this.IDLE_SHEET.path);
    this.loadImage(this.LONG_IDLE_SHEET.path);
    this.loadImage(this.WALK_SHEET.path);
    this.loadImage(this.WALK_INTRO_SHEET.path);
    this.loadImage(this.JUMP_SHEET.path);
    this.loadImage(this.HURT_SHEET.path);
    this.loadImage(this.ATTACK_SHEET.path);
    this.loadImage(this.SPECIAL_SHEET.path);
    this.loadImage(this.DEAD_SHEET.path);
    // Preload special effect frames
    this.SPECIAL_EFFECT_PATHS.forEach((p) => this.loadImage(p));
    // Try candidates for block sheet
    this.prepareBlockSheet();
    // Set initial sprite to first idle frame so something is visible immediately
    const idleImg = this.imageCache[this.IDLE_SHEET.path];
    if (idleImg) {
      this.img = idleImg;
      this.setSheetFrame(this.IDLE_SHEET, 0);
      // Build idle frame order and skip the last sprite (glitch)
      const cnt = this.getSheetCount(this.IDLE_SHEET, idleImg) || this.IDLE_SHEET.count || 1;
      let order = Array.from({ length: cnt }, (_, i) => i);
      if (order.length > 1) order = order.slice(0, order.length - 1); // drop last
      if (!order.length) order = [0];
      this.IDLE_FRAME_ORDER = order;
    }
  }

  initLoops() {
    this.applyGravity();
    this.startInputLoop();
    this.startAnimLoop();
  }

  startInputLoop() {
    setInterval(() => {
      if (this.isDead()) return;
      // During intro, auto-walk and lock camera; ignore player input
      if (this.introActive) {
        this.updateIntro();
        this.updateCamera();
        return;
      }
      // During knockback, ignore player input
      if (!this.knockbackActive && !this.isSpecialAttacking && !this.isAttacking && !this.isBlocking)
        this.handleHorizontalMove(); // applies both on ground and mid-air
      this.updateKnockback();
      this.updateJump();
      this.updateSpecialAttack();
      this.updateAttack();
      this.updateBlockState();
      this.updateCamera();
      if (!this.knockbackActive) this.handleJumpKey();
      this.markActivityOnAction();
    }, 1000 / 60);
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
    // Lock camera during intro to keep left edge anchored
    if (this.world?.introActive) {
      // During intro, keep camera already positioned at the final target location
      const camAtTarget = typeof this.world.introCamX === 'number' ? this.world.introCamX : -this.introTargetX + 100;
      this.world.camera_x = camAtTarget;
      return;
    }
    this.world.camera_x = -this.x + 100;
  }

  markActivityOnAction() {
    if (this.world.keyboard.S || this.world.keyboard.A || this.world.keyboard.UP || this.world.keyboard.SPACE)
      this.lastActivityAt = Date.now();
  }

  // Throwing removed; D is used for special now

  handleJumpKey() {
    // Start actions only when grounded and not in conflicting states
    const canActionGrounded =
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.knockbackActive &&
      !this.isAboveGround() &&
      !this.isBlocking;
    const wantsJump = !!(this.world.keyboard.UP || this.world.keyboard.SPACE);
    const wantsSpecial = !!this.world.keyboard.S;
    if (wantsJump && canActionGrounded) {
      this.startJump();
    } else if (wantsSpecial && canActionGrounded) {
      this.startSpecialAttack();
    }
    // 'A' triggers a standing attack on ground
    if (
      this.world.keyboard.A &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.knockbackActive &&
      !this.isAboveGround() &&
      !this.isBlocking
    ) {
      this.startAttack();
    }
  }

  startJump() {
    const now = Date.now();
    this.isJumping = true;
    this.speedY = this.JUMP_INIT_VY;
    // No horizontal impulse on jump; horizontal control remains via arrow keys
    this.jumpVX = 0;
    // init animation counters
    this.jumpFrameIndex = 0;
    this.lastJumpFrameTime = now;
    this.animKey = 'jump';
    const sheetImg = this.imageCache[this.JUMP_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.JUMP_SHEET, 0);
    }
    this.lastActivityAt = now;
  }

  updateJump() {
    if (!this.isJumping) return;
    // No forward drift; horizontal control is handled by handleHorizontalMove()
    // end jump when landing (i.e., no longer above ground)
    if (!this.isAboveGround()) {
      this.isJumping = false;
      this.jumpVX = 0;
    }
  }

  // Dodge removed; replaced by special attack

  updateSpecialAttack() {
    if (!this.isSpecialAttacking) return;
    const now = Date.now();
    // Advance character special frames
    const specImg = this.imageCache[this.SPECIAL_SHEET.path];
    const specCnt = this.getSheetCount(this.SPECIAL_SHEET, specImg) || 5;
    if (now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY && this.specialFrameIndex < specCnt - 1) {
      this.specialFrameIndex++;
      this.lastSpecialFrameTime = now;
    }
    // Advance effect frames
    const effCnt = this.SPECIAL_EFFECT_PATHS.length;
    if (now - this.lastEffectFrameTime >= this.EFFECT_FRAME_DELAY && this.effectFrameIndex < effCnt - 1) {
      this.effectFrameIndex++;
      this.lastEffectFrameTime = now;
    }
    // End when both animations have reached the end
    if (this.specialFrameIndex >= specCnt - 1 && this.effectFrameIndex >= effCnt - 1) {
      this.isSpecialAttacking = false;
      this.specialFrameIndex = 0;
      this.effectFrameIndex = 0;
    }
    // Apply wind push to enemies while special runs
    try {
      const world = this.world;
      if (world && world.level && world.level.enemies) {
        const dir = this.otherDirection ? -1 : 1;
        const cx = this.x + this.width / 2;
        const range = 90 + this.effectFrameIndex * 30; // larger expanding wave
        for (const enemy of world.level.enemies) {
          if (!enemy || enemy.dead || enemy.dying) continue;
          const ex = enemy.x + (enemy.width || 0) / 2;
          const dx = ex - cx;
          const inFront = dir > 0 ? dx >= 0 && dx <= range : dx <= 0 && -dx <= range;
          if (!inFront) continue;
          // basic vertical overlap window
          const ey = enemy.y + (enemy.height || 0) / 2;
          const cy = this.y + this.height / 2;
          if (Math.abs(ey - cy) > 200) continue;
          // push away
          const push = dir * this.WIND_PUSH_SPEED;
          if (typeof enemy.knockbackVX === 'number') {
            enemy.knockbackVX = push;
            enemy.knockbackEndAt = Date.now() + 360; // longer push duration
          } else {
            enemy.x += push;
          }
        }
      }
    } catch (_) {}
  }

  startAnimLoop() {
    setInterval(() => {
      const now = Date.now();
      if (this.isDead()) return this.setDeadFrame();
      if (this.introActive) return this.setIntroWalkFrame();
      // Special has priority over hurt and ground/air states
      if (this.isSpecialAttacking) return this.setSpecialFrame(now);
      if (this.isHurt()) return this.setHurtFrame();
      if (this.isAttacking) return this.setAttackFrame(now);
      if (this.isAboveGround() || this.isJumping) return this.setJumpFrame(now);
      if (this.isBlocking) return this.setBlockFrame(now);
      this.setGroundedFrame(now);
    }, 50);
  }

  // Intro helpers
  startIntroWalk(startX, targetX) {
    this.introActive = true;
    this.introStartX = startX;
    this.introTargetX = targetX;
    this.x = startX;
    this.otherDirection = false; // walk in facing right
    this.currentImage = 0;
    this.introFrameIndex = 0;
    this.lastIntroFrameTime = Date.now();
    const sheetImg = this.imageCache[this.WALK_INTRO_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.WALK_INTRO_SHEET, 0);
    }
    if (this.world) {
      this.world.introActive = true;
      // Immediately place camera at the end position so the scene starts focused there
      this.world.introCamX = -targetX + 100;
      this.world.camera_x = this.world.introCamX;
    }
  }

  updateIntro() {
    // Move smoothly towards target; stop exactly on target
    const dx = this.introTargetX - this.x;
    if (dx > 0) {
      const step = Math.min(this.introSpeed, dx);
      this.x += step;
    }
    if (this.x >= this.introTargetX) {
      this.x = this.introTargetX;
      this.introActive = false;
      if (this.world) {
        this.world.introActive = false;
        // Clear intro camera lock; normal camera follow resumes next tick
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
    const sheetImg = this.imageCache[this.WALK_INTRO_SHEET.path];
    this.img = sheetImg;
    const cnt = this.getSheetCount(this.WALK_INTRO_SHEET, sheetImg) || 9;
    if (now - this.lastIntroFrameTime >= this.INTRO_FRAME_DELAY) {
      this.introFrameIndex = (this.introFrameIndex + 1) % cnt;
      this.lastIntroFrameTime = now;
    }
    this.setSheetFrame(this.WALK_INTRO_SHEET, this.introFrameIndex % cnt);
    this.animKey = 'intro_walk';
  }

  // Special attack sequence
  startSpecialAttack() {
    const maxSeg = this.world?.characterChargeBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.world?.character?.chargeSegments ?? 0));
    if (cur < maxSeg) return; // need full charge
    const now = Date.now();
    this.isSpecialAttacking = true;
    this.specialFrameIndex = 0;
    this.effectFrameIndex = 0;
    this.lastSpecialFrameTime = now;
    this.lastEffectFrameTime = now;
    // Consume charge immediately and update HUD
    if (this.world) {
      this.world.character.chargeSegments = 0;
      this.world.characterChargeBar?.setSegments(0);
    }
    // Lock into special pose immediately (first frame)
    const sheetImg = this.imageCache[this.SPECIAL_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.SPECIAL_SHEET, 0);
      this.animKey = 'special';
    }
    this.lastActivityAt = now;
  }

  setSpecialFrame(now) {
    const sheetImg = this.imageCache[this.SPECIAL_SHEET.path];
    const cnt = this.getSheetCount(this.SPECIAL_SHEET, sheetImg) || 5;
    if (this.specialFrameIndex < cnt - 1) {
      if (now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY) {
        this.specialFrameIndex++;
        this.lastSpecialFrameTime = now;
      }
    }
    this.img = sheetImg;
    this.setSheetFrame(this.SPECIAL_SHEET, Math.min(this.specialFrameIndex, cnt - 1));
    this.animKey = 'special';
  }

  // Draw overlay effect for special attack
  drawFrame(ctx) {
    if (!this.isSpecialAttacking) return;
    const idx = Math.max(0, Math.min(this.SPECIAL_EFFECT_PATHS.length - 1, this.effectFrameIndex));
    const path = this.SPECIAL_EFFECT_PATHS[idx];
    const img = this.imageCache?.[path];
    if (!img) return;
    try {
      const cam = this.world?.camera_x || 0;
      // Base X depends on flip: when flipped, our draw context is mirrored and origin is at 0
      const baseX = this.otherDirection ? 0 : Math.round(this.x + cam);
      const baseY = Math.round(this.y);
      // Move effect away from player over time
      // In mirrored context, positive dx moves left on screen; in normal context, positive dx moves right.
      // So use a positive move for both facings to always travel toward the facing direction visually.
      const move = this.effectFrameIndex * this.EFFECT_MOVE_STEP;
      const dx = Math.round(baseX + (this.width - this.SPECIAL_EFFECT_W) / 2 + move);
      // Place even closer to the ground
      const dy = Math.round(baseY + this.height - this.SPECIAL_EFFECT_H + this.SPECIAL_EFFECT_FEET_OFFSET);
      ctx.drawImage(img, dx, dy, this.SPECIAL_EFFECT_W, this.SPECIAL_EFFECT_H);
    } catch (_) {}
  }

  setDeadFrame() {
    this.updateDeadFrameIndex();
    this.applyDeathSprite();
    // No death physics: character stays on ground; animation handles the fall visually
    this.speedY = 0;
    this.y = this.groundY;
  }

  updateDeadFrameIndex() {
    if (!this.deadStartedAt) this.deadStartedAt = Date.now();
    let idx = Math.floor((Date.now() - this.deadStartedAt) / this.DEAD_FRAME_DELAY);
    const sheetImg = this.imageCache[this.DEAD_SHEET.path];
    const cnt = this.getSheetCount(this.DEAD_SHEET, sheetImg) || this.DEAD_SHEET.count || 1;
    if (idx >= cnt) {
      idx = cnt - 1;
      this.deathLastFrameLocked = true;
    }
    this._deadFrameIdx = idx;
  }

  applyDeathSprite() {
    const sheetImg = this.imageCache[this.DEAD_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      const cnt = this.getSheetCount(this.DEAD_SHEET, sheetImg) || 1;
      const idx = Math.min(this._deadFrameIdx, cnt - 1);
      this.setSheetFrame(this.DEAD_SHEET, idx);
      this.animKey = 'dead';
    }
  }

  ensureDeathArcInit() {
    if (this.deathArcInit) return;
    this.deathArcInit = true;
    this.speedY = this.DEATH_INIT_VY;
  }

  applyDeathPhysics() {
    this.y -= this.speedY;
    this.speedY -= this.DEATH_ACCEL;
  }

  setHurtFrame() {
    const now = Date.now();
    // initialize hurt state once
    if (this.animKey !== 'hurt') {
      this.hurtFrameIndex = 0;
      this.lastHurtFrameTime = now;
      this._hurtAnimStartAt = now;
    }
    const sheetImg = this.imageCache[this.HURT_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      const cnt = this.getSheetCount(this.HURT_SHEET, sheetImg) || 1;
      // Drive frames so last frame aligns with the end of hurt (synced to knockback)
      const start = this._hurtAnimStartAt || now;
      const end = this.hurtEndAt || start + this.HURT_FRAME_DELAY * cnt;
      const total = Math.max(1, end - start);
      const elapsed = Math.max(0, Math.min(total, now - start));
      const targetIdx = Math.min(cnt - 1, Math.floor((elapsed / total) * cnt));
      this.hurtFrameIndex = Math.max(this.hurtFrameIndex, targetIdx);
      this.setSheetFrame(this.HURT_SHEET, this.hurtFrameIndex);
    }
    this.animKey = 'hurt';
  }

  // Knockback helpers

  updateKnockback() {
    if (!this.knockbackActive) return;
    const now = Date.now();
    // horizontal push with slight damping
    this.x += this.knockbackVX;
    this.knockbackVX *= 0.9;
    if (now >= this.knockbackEndAt) {
      this.knockbackActive = false;
      this.knockbackVX = 0;
    }
  }

  setJumpFrame(now) {
    const sheetImg = this.imageCache[this.JUMP_SHEET.path];
    const cnt = this.getSheetCount(this.JUMP_SHEET, sheetImg) || 1;
    if (this.jumpFrameIndex < cnt - 1) {
      if (now - this.lastJumpFrameTime >= this.JUMP_FRAME_DELAY) {
        this.jumpFrameIndex++;
        this.lastJumpFrameTime = now;
      }
    }
    this.img = sheetImg;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.jumpFrameIndex, cnt - 1));
    this.animKey = 'jump';
  }

  // setDodgeFrame removed

  // Attack logic
  startAttack() {
    const now = Date.now();
    if (now < (this.nextAttackAt || 0)) return; // cooldown gate
    // New: unique ID per attack to allow enemies/boss to count only once per attack
    this._attackSeq = (this._attackSeq || 0) + 1;
    this.attackId = this._attackSeq;
    this.isAttacking = true;
    this.attackFrameIndex = 0;
    this.lastAttackFrameTime = now;
    const frames = this.getSheetCount(this.ATTACK_SHEET, this.imageCache[this.ATTACK_SHEET.path]) || 3;
    const delay = this.ATTACK_FRAME_DELAY;
    this.attackEndAt = now + frames * delay;
    // show first frame immediately
    const sheetImg = this.imageCache[this.ATTACK_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
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
    const sheetImg = this.imageCache[this.ATTACK_SHEET.path];
    const cnt = this.getSheetCount(this.ATTACK_SHEET, sheetImg) || 3;
    if (this.attackFrameIndex < cnt - 1) {
      if (now - this.lastAttackFrameTime >= this.ATTACK_FRAME_DELAY) {
        this.attackFrameIndex++;
        this.lastAttackFrameTime = now;
      }
    }
    this.img = sheetImg;
    this.setSheetFrame(this.ATTACK_SHEET, Math.min(this.attackFrameIndex, cnt - 1));
    this.animKey = 'attack';
  }

  // Attack helpers for world collision
  isAttackActiveWindow() {
    return this.isAttacking && this.attackFrameIndex >= this.ATTACK_ACTIVE_START_FRAME;
  }

  getAttackHitboxRect() {
    // Build a slim rectangle in front of character at body height
    const b = this.getBoundsWithOffset(this);
    const range = this.ATTACK_RANGE_X;
    if (!this.otherDirection) {
      // facing right
      return { left: b.right, right: b.right + range, top: b.top, bottom: b.bottom };
    }
    // facing left
    return { left: b.left - range, right: b.left, top: b.top, bottom: b.bottom };
  }

  setGroundedFrame(now) {
    this.resetJumpStateIfNeeded();
    const moving = this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
    const inactiveMs = now - this.lastActivityAt;
    if (moving && !this.isBlocking) return this.setWalkFrame();
    if (inactiveMs >= this.LONG_IDLE_AFTER_MS) return this.setLongIdleFrame(now);
    if (inactiveMs >= this.IDLE_AFTER_MS) return this.setIdleFrame(now);
    this.setDefaultStandFrame();
  }

  resetJumpStateIfNeeded() {
    if (!this.isJumping) return;
    this.currentImage = 0;
    this.jumpFrameIndex = 0;
    this.isJumping = false;
  }

  // Ignore knockback while dodging
  applyKnockbackFrom(enemy) {
    if (this.isSpecialAttacking) return; // ignore knockback during special
    const now = Date.now();
    const dir = enemy?.x > this.x ? -1 : 1; // push away from enemy
    this.knockbackActive = true;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    // Only horizontal push; no vertical hop
    this.speedY = 0;
    // Sync hurt duration to knockback window exactly
    this.hurtEndAt = this.knockbackEndAt;
  }

  // While dodging, ignore damage
  hit() {
    if (this.isSpecialAttacking) return;
    // Route to segment-based logic; keep fallback to super if not set
    if (typeof this.applySegmentHit === 'function') {
      this.applySegmentHit();
    } else {
      super.hit();
    }
  }

  // New: 5-segment hit processing. Depletes in order from right, updates energy, returns true if dead.
  applySegmentHit() {
    // Debounce via isHurt handled by world; still guard here if needed
    // If already dead, ignore
    if (this.isDead && this.isDead()) return true;
    // Determine current segments and reduce by 1 (R -> M -> L maps to segments count)
    const maxSeg = 5;
    const current = typeof this.healthSegments === 'number' ? this.healthSegments : maxSeg;
    const next = Math.max(0, current - 1);
    this.healthSegments = next;
    // Map segments -> legacy energy (for existing logic/animations)
    // 5 -> 100, 4 -> 80, 3 -> 60, 2 -> 40, 1 -> 20, 0 -> 0
    const segToEnergy = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 };
    this.energy = segToEnergy[next] ?? Math.round((next / maxSeg) * 100);
    // Mark lastHit for short invulnerability if hurtEndAt is not in use yet
    this.lastHit = Date.now();
    // Trigger hurt animation timing window if not already set by knockback
    const now = Date.now();
    if (!this.hurtEndAt || now >= this.hurtEndAt) {
      this.hurtEndAt = now + 350; // short default window; usually overwritten by knockback sync
    }
    // If no segments left, mark dead
    if (this.healthSegments <= 0) {
      this.energy = 0;
      return true;
    }
    return false;
  }

  setDefaultStandFrame() {
    // Use first frame from idle sheet
    const sheetImg = this.imageCache[this.IDLE_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.IDLE_SHEET, 0);
      this.animKey = 'stand';
    }
    this.idleFrameIndex = 0;
    this.longIdleFrameIndex = 0;
  }

  setWalkFrame() {
    if (this.animKey !== 'walk') this.currentImage = 0;
    const sheetImg = this.imageCache[this.WALK_SHEET.path];
    this.img = sheetImg;
    const cnt = this.getSheetCount(this.WALK_SHEET, sheetImg) || 1;
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
    const sheetImg = this.imageCache[this.LONG_IDLE_SHEET.path];
    this.img = sheetImg;
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, sheetImg) || 1;
    const idx = Math.min(this.longIdleFrameIndex, cnt - 1); // do not loop
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
    // advance but clamp at last frame (no loop)
    const sheetImg = this.imageCache?.[this.LONG_IDLE_SHEET.path];
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, sheetImg) || 1;
    this.longIdleFrameIndex = Math.min(cnt - 1, this.longIdleFrameIndex + 1);
    this.lastLongIdleFrameTime = now;
  }

  setIdleFrame(now) {
    this.ensureIdleState(now);
    this.advanceIdleFrame(now);
    const sheetImg = this.imageCache[this.IDLE_SHEET.path];
    this.img = sheetImg;
    const order = this.IDLE_FRAME_ORDER && this.IDLE_FRAME_ORDER.length ? this.IDLE_FRAME_ORDER : [0];
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
    const order = this.IDLE_FRAME_ORDER && this.IDLE_FRAME_ORDER.length ? this.IDLE_FRAME_ORDER : [0];
    this.idleFrameIndex = (this.idleFrameIndex + 1) % order.length;
    this.lastIdleFrameTime = now;
  }

  // Sprite-sheet helpers for idle
  setSheetFrame(sheet, index) {
    // Ensure we have safe cols/rows to avoid NaN rendering when metadata is missing
    const img = this.imageCache?.[sheet.path] || this.img;
    const frameW = sheet.frameW || 128;
    const frameH = sheet.frameH || 128;
    let cols = sheet.cols;
    let rows = sheet.rows;

    if (!cols || !rows) {
      const naturalW = img?.naturalWidth || 0;
      const naturalH = img?.naturalHeight || 0;
      if (naturalW > 0 && frameW > 0) {
        cols = Math.max(1, Math.floor(naturalW / frameW));
      }
      if (naturalH > 0 && frameH > 0) {
        rows = Math.max(1, Math.floor(naturalH / frameH));
      }
      // Final safety fallback
      cols = cols || sheet.count || 1;
      rows = rows || 1;
      // Persist for next calls when we have something meaningful
      sheet.cols = sheet.cols || cols;
      sheet.rows = sheet.rows || rows;
      if (!sheet.count && cols && rows) sheet.count = cols * rows;
    }

    const safeCols = Math.max(1, cols || 1);
    const col = index % safeCols;
    const row = Math.floor(index / safeCols);
    this.currentFrameRect = {
      sx: col * frameW,
      sy: row * frameH,
      sw: frameW,
      sh: frameH,
    };
  }

  getSheetCount(sheet, img) {
    // Prefer explicit metadata; otherwise infer only when image dimensions are known.
    if (sheet.count && sheet.cols && sheet.rows) return sheet.count;
    const frameW = sheet.frameW || img?.naturalHeight || 128;
    const naturalW = img?.naturalWidth || 0;
    const canInfer = naturalW > 0 && frameW > 0;
    const inferredCols = canInfer ? Math.max(1, Math.floor(naturalW / frameW)) : 1;
    const cols = sheet.cols || inferredCols;
    const rows = sheet.rows || 1;
    // Only persist when we successfully inferred using actual image width or explicit provided values exist
    if ((sheet.cols && sheet.rows) || canInfer) {
      sheet.cols = sheet.cols || cols;
      sheet.rows = sheet.rows || rows;
      sheet.count = sheet.count || cols * rows;
    }
    // Always return at least 1 and make sure cols/rows aren’t undefined in later calls
    sheet.cols = sheet.cols || 1;
    sheet.rows = sheet.rows || 1;
    sheet.count = sheet.count || sheet.cols * sheet.rows;
    return sheet.count;
  }

  // Stomp helpers moved from World
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

  // Block helpers
  updateBlockState() {
    const wantsBlock = !!this.world?.keyboard?.D;
    const canBlockNow = (this.blockSegments || 0) > 0;
    this.isBlocking = wantsBlock && canBlockNow && !this.isSpecialAttacking && !this.isAttacking && !this.isHurt();
    if (!this.isBlocking) {
      this.blockFrameIndex = 0; // reset when released
    }
  }

  setBlockFrame(now) {
    // if we have a multi-frame sheet, animate slowly; otherwise hold first frame
    const sheetImg = this.imageCache[this.BLOCK_SHEET.path];
    const cnt = this.getSheetCount(this.BLOCK_SHEET, sheetImg) || 1;
    // Target frame to hold while blocking: last frame of the sheet
    const holdIdx = Math.max(0, cnt - 1);
    if (cnt > 1) {
      if (now - this.lastBlockFrameTime >= this.BLOCK_FRAME_DELAY && this.blockFrameIndex < holdIdx) {
        this.blockFrameIndex = Math.min(this.blockFrameIndex + 1, holdIdx);
        this.lastBlockFrameTime = now;
      }
    } else {
      this.blockFrameIndex = 0;
    }
    // Always clamp to safe range to avoid invisible sprite due to OOB frame
    const idx = Math.min(Math.max(0, this.blockFrameIndex), holdIdx);
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.BLOCK_SHEET, idx);
      this.animKey = 'block';
    }
  }

  triggerBlock() {
    // Called when an attack is successfully blocked; can be used to reset animation or play SFX
    this.blockFrameIndex = 0;
    this.lastBlockFrameTime = Date.now();
    // Consume one block charge on successful block
    if (typeof this.blockSegments === 'number' && this.blockSegments > 0) {
      this.blockSegments = Math.max(0, this.blockSegments - 1);
      // Optional: brief lock to prevent immediate re-block exploits (keeps feel responsive)
      // this._blockRecoverAt = Date.now() + 100; // if you want a tiny cooldown
    }
  }

  prepareBlockSheet() {
    // Load only the known existing single-frame asset to avoid 404s
    const path = 'assets/img/2_character_man/10_block.png';
    try {
      const img = new Image();
      img.onload = () => {
        this._blockReady = true;
        this.BLOCK_SHEET.path = path;
        // Do not force cols/rows here; allow inference from image width using frameW/frameH
        this.imageCache[path] = img;
      };
      img.src = path;
    } catch (_) {}
  }

  // Prefer exact hurt timing synced to knockback
  isHurt() {
    if (this.hurtEndAt) {
      return Date.now() < this.hurtEndAt;
    }
    return super.isHurt();
  }
}
