class Character extends MoveableObject {
  height = 260; // was 240
  width = 210; // wider again
  y = 180; // start directly on ground to avoid initial fall
  groundY = 180;
  speed = 10;
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  isJumping = false;
  // Dodge state (replaces jump)
  isDodging = false;
  dodgeFrameIndex = 0;
  lastDodgeFrameTime = 0;
  DODGE_FRAME_DELAY = 40; // legacy default; not used when per-frame delays below are set
  DODGE_FAST_FRAME_DELAY = 25; // frames 0..7
  DODGE_SLOW_FRAME_DELAY = 120; // frames 8..9
  DODGE_FRAME_COUNT = 10; // use all frames of the sprite sheet
  DODGE_SPEED = 30; // shorter reach
  DODGE_DURATION = 800; // default; actual duration is tied to frames*delay
  dodgeVX = 0;
  dodgeEndAt = 0;
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
  JUMP_FORWARD_VX = 8;
  JUMP_INIT_VY = 26; // higher than stomp bounce for small obstacles
  // Block state
  isBlocking = false;
  blockFrameIndex = 0;
  lastBlockFrameTime = 0;
  BLOCK_FRAME_DELAY = 100;
  _blockReady = false;
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
  BLOCK_SHEET = {
    // We'll try to load one of the expected assets for block; default to single-frame fallback
    path: 'assets/img/2_character_man/10_block.png',
    frameW: 128,
    frameH: 128,
    cols: 1,
    rows: 1,
    count: 1,
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
  }

  initImages() {
    // Preload all sheets for the new character
    this.loadImage(this.IDLE_SHEET.path);
    this.loadImage(this.LONG_IDLE_SHEET.path);
    this.loadImage(this.WALK_SHEET.path);
    this.loadImage(this.JUMP_SHEET.path);
    this.loadImage(this.HURT_SHEET.path);
    this.loadImage(this.ATTACK_SHEET.path);
    this.loadImage(this.DEAD_SHEET.path);
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
      // During knockback, ignore player input
      if (!this.knockbackActive && !this.isDodging && !this.isAttacking && !this.isBlocking)
        this.handleHorizontalMove();
      this.updateKnockback();
      this.updateJump();
      this.updateDodge();
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
    this.world.camera_x = -this.x + 100;
  }

  markActivityOnAction() {
    if (this.world.keyboard.D || this.world.keyboard.A || this.world.keyboard.SPACE) this.lastActivityAt = Date.now();
  }

  // Throwing removed; D is used for dodge now

  handleJumpKey() {
    // Start actions only when grounded and not in conflicting states
    const canActionGrounded =
      !this.isDodging && !this.isAttacking && !this.knockbackActive && !this.isAboveGround() && !this.isBlocking;
    const wantsJump = !!this.world.keyboard.SPACE;
    const wantsDodge = !!this.world.keyboard.D;
    if (wantsJump && canActionGrounded) {
      this.startJump();
    } else if (wantsDodge && canActionGrounded) {
      this.startDodge();
    }
    // 'A' triggers a standing attack on ground
    if (
      this.world.keyboard.A &&
      !this.isDodging &&
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
    const dir = this.otherDirection ? -1 : 1;
    this.jumpVX = dir * this.JUMP_FORWARD_VX;
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
    // forward drift with damping
    if (Math.abs(this.jumpVX) > 0.1) {
      this.x += this.jumpVX;
      this.jumpVX *= 0.94;
      if (this.world?.level) {
        if (this.x < 0) this.x = 0;
        if (this.x > this.world.level.level_end_x) this.x = this.world.level.level_end_x;
      }
    }
    // end jump when landing (i.e., no longer above ground)
    if (!this.isAboveGround()) {
      this.isJumping = false;
      this.jumpVX = 0;
    }
  }

  startDodge() {
    const now = Date.now();
    const dir = this.otherDirection ? -1 : 1; // left if facing left
    this.isDodging = true;
    this.dodgeVX = dir * this.DODGE_SPEED;
    // Duration aligned exactly to animation frames with variable timing
    const frames = Math.min(this.DODGE_FRAME_COUNT || 10, this.JUMP_SHEET?.count || 10);
    const total = Array.from({ length: frames }, (_, i) =>
      i <= 7 ? this.DODGE_FAST_FRAME_DELAY : this.DODGE_SLOW_FRAME_DELAY
    ).reduce((a, b) => a + b, 0);
    this.dodgeEndAt = now + total;
    // init animation counters
    this.dodgeFrameIndex = 0;
    this.lastDodgeFrameTime = now;
    this.animKey = 'dodge';
    // ensure we don't have any residual vertical motion
    this.speedY = 0;
    // show first frame immediately to avoid visible delay
    const sheetImg = this.imageCache[this.JUMP_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      this.setSheetFrame(this.JUMP_SHEET, 0);
    }
    this.lastActivityAt = now;
  }

  updateDodge() {
    if (!this.isDodging) return;
    const now = Date.now();
    // Horizontal burst with moderate damping (ends quicker)
    this.x += this.dodgeVX;
    this.dodgeVX *= 0.9;
    // Clamp within level bounds if world exists
    if (this.world?.level) {
      if (this.x < 0) this.x = 0;
      if (this.x > this.world.level.level_end_x) this.x = this.world.level.level_end_x;
    }
    // End dodge when animation time is up or speed decays sufficiently
    if (now >= this.dodgeEndAt || Math.abs(this.dodgeVX) < 1.5) {
      this.isDodging = false;
      this.dodgeVX = 0;
    }
  }

  startAnimLoop() {
    setInterval(() => {
      const now = Date.now();
      if (this.isDead()) return this.setDeadFrame();
      // Dodge animation has priority over hurt and ground/air states
      if (this.isDodging) return this.setDodgeFrame(now);
      if (this.isHurt()) return this.setHurtFrame();
      if (this.isAttacking) return this.setAttackFrame(now);
      if (this.isAboveGround() || this.isJumping) return this.setJumpFrame(now);
      if (this.isBlocking) return this.setBlockFrame(now);
      this.setGroundedFrame(now);
    }, 50);
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
  const end = this.hurtEndAt || (start + this.HURT_FRAME_DELAY * cnt);
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

  setDodgeFrame(now) {
    const sheetImg = this.imageCache[this.JUMP_SHEET.path];
    const cntReal = this.getSheetCount(this.JUMP_SHEET, sheetImg) || 1;
    const cnt = Math.min(cntReal, this.DODGE_FRAME_COUNT || cntReal);
    if (this.dodgeFrameIndex < cnt - 1) {
      const delay = this.dodgeFrameIndex <= 6 ? this.DODGE_FAST_FRAME_DELAY : this.DODGE_SLOW_FRAME_DELAY;
      if (now - this.lastDodgeFrameTime >= delay) {
        this.dodgeFrameIndex++;
        this.lastDodgeFrameTime = now;
      }
    }
    this.img = sheetImg;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.dodgeFrameIndex, cnt - 1));
    this.animKey = 'dodge';
  }

  // Attack logic
  startAttack() {
    const now = Date.now();
    if (now < (this.nextAttackAt || 0)) return; // cooldown gate
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
    if (this.isDodging) return; // invulnerable to knockback during dodge
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
    if (this.isDodging) return;
    super.hit();
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
    const wantsBlock = !!this.world?.keyboard?.S;
    this.isBlocking = wantsBlock && !this.isDodging && !this.isAttacking && !this.isHurt();
    if (!this.isBlocking) {
      this.blockFrameIndex = 0; // reset when released
    }
  }

  setBlockFrame(now) {
    // if we have a multi-frame sheet, animate slowly; otherwise hold first frame
    const sheetImg = this.imageCache[this.BLOCK_SHEET.path];
    const cnt = this.getSheetCount(this.BLOCK_SHEET, sheetImg) || 1;
    // Target frame to hold while blocking: third frame (index 2), but never exceed available frames
    const holdIdx = Math.min(2, Math.max(0, cnt - 1));
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
  }

  prepareBlockSheet() {
    // Try a few candidate paths to be resilient to asset layout
    const candidates = [
      { path: 'assets/img/2_character_man/10_block.png', count: 4 },
      { path: 'assets/img/2_character_man/10_block/1_block_6_sprites.png', count: 6 },
      { path: 'assets/img/2_character_man/10_block/1_block_5_sprites.png', count: 5 },
      { path: 'assets/img/2_character_man/10_block/1_block_4_sprites.png', count: 4 },
      { path: 'assets/img/2_character_man/10_block/1_block_3_sprites.png', count: 3 },
    ];
    for (const c of candidates) {
      try {
        const img = new Image();
        img.onload = () => {
          if (!this._blockReady) {
            this._blockReady = true;
            this.BLOCK_SHEET.path = c.path;
            this.BLOCK_SHEET.cols = c.count;
            this.BLOCK_SHEET.rows = 1;
            this.BLOCK_SHEET.count = c.count;
            this.imageCache[c.path] = img;
          }
        };
        img.src = c.path;
      } catch (_) {}
    }
  }

  // Prefer exact hurt timing synced to knockback
  isHurt() {
    if (this.hurtEndAt) {
      return Date.now() < this.hurtEndAt;
    }
    return super.isHurt();
  }
}
