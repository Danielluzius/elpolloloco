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
  DODGE_FRAME_DELAY = 40; // 10 frames * 40ms = 400ms total
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
  HURT_FRAME_DELAY = 110; // a bit faster
  // Knockback state
  knockbackActive = false;
  knockbackEndAt = 0;
  knockbackVX = 0;
  KNOCKBACK_SPEED_X = 10;
  KNOCKBACK_SPEED_Y = 14;
  KNOCKBACK_DURATION = 350; // ms
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
  DEAD_SHEET = {
    path: 'assets/img/2_character_man/5_dead.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };
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
    this.loadImage(this.DEAD_SHEET.path);
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
      if (!this.knockbackActive && !this.isDodging) this.handleHorizontalMove();
      this.updateKnockback();
      this.updateDodge();
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
    if (this.world.keyboard.D) this.lastActivityAt = Date.now();
  }

  shouldThrow(now, cooldownMs, lastThrowAt, bottlesAvailable) {
    if (this.knockbackActive) return false;
    const pressed = !!this.world?.keyboard?.D;
    const cooled = now - (lastThrowAt || 0) >= cooldownMs;
    return pressed && cooled && bottlesAvailable > 0;
  }

  handleJumpKey() {
    // SPACE triggers a directional dodge instead of a vertical jump
    if (this.world.keyboard.SPACE && !this.isDodging && !this.knockbackActive && !this.isAboveGround()) {
      this.startDodge();
    }
  }

  startDodge() {
    const now = Date.now();
    const dir = this.otherDirection ? -1 : 1; // left if facing left
    this.isDodging = true;
    this.dodgeVX = dir * this.DODGE_SPEED;
    // Duration aligned exactly to animation frames
    const frames = Math.min(this.DODGE_FRAME_COUNT || 10, this.JUMP_SHEET?.count || 10);
    const frameDelay = this.DODGE_FRAME_DELAY || this.JUMP_FRAME_DELAY || 80;
    this.dodgeEndAt = now + frames * frameDelay;
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
      if (this.isAboveGround()) return this.setJumpFrame(now);
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
    }
    const sheetImg = this.imageCache[this.HURT_SHEET.path];
    if (sheetImg) {
      this.img = sheetImg;
      const cnt = this.getSheetCount(this.HURT_SHEET, sheetImg) || 1;
      // advance only until last frame, no loop
      if (this.hurtFrameIndex < cnt - 1 && now - this.lastHurtFrameTime >= this.HURT_FRAME_DELAY) {
        this.hurtFrameIndex++;
        this.lastHurtFrameTime = now;
      }
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
      if (now - this.lastDodgeFrameTime >= this.DODGE_FRAME_DELAY) {
        this.dodgeFrameIndex++;
        this.lastDodgeFrameTime = now;
      }
    }
    this.img = sheetImg;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.dodgeFrameIndex, cnt - 1));
    this.animKey = 'dodge';
  }

  setGroundedFrame(now) {
    this.resetJumpStateIfNeeded();
    const moving = this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
    const inactiveMs = now - this.lastActivityAt;
    if (moving) return this.setWalkFrame();
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
    this.speedY = this.KNOCKBACK_SPEED_Y; // small hop
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
}
