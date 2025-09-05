class Character extends MoveableObject {
  height = 260; // was 240
  width = 185; // wider again
  y = 180; // stand a bit higher on the screen
  groundY = 180;
  speed = 10;
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  isJumping = false;
  lastActivityAt = Date.now();
  IDLE_AFTER_MS = 1500;
  LONG_IDLE_AFTER_MS = 6000;
  animKey = 'stand';
  idleFrameIndex = 0;
  lastIdleFrameTime = 0;
  IDLE_FRAME_DELAY = 150;
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
  WALK_SHEET = {
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
    cols: 6,
    rows: 1,
    count: 6,
  };
  HURT_SHEET = {
    path: 'assets/img/2_character_man/4_hurt.png',
    frameW: 128,
    frameH: 128,
    cols: 4,
    rows: 1,
    count: 4,
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
    this.offset = { top: 30, right: 26, bottom: 0, left: 26 };
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
      if (!this.knockbackActive) this.handleHorizontalMove();
      this.updateKnockback();
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
    if (this.world.keyboard.SPACE && !this.isJumping && !this.isAboveGround()) {
      this.jump();
      this.isJumping = true;
      this.jumpFrameIndex = 0;
      this.currentImage = 0;
      this.lastJumpFrameTime = Date.now();
      this.lastActivityAt = this.lastJumpFrameTime;
    }
  }

  startAnimLoop() {
    setInterval(() => {
      const now = Date.now();
      if (this.isDead()) return this.setDeadFrame();
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
  applyKnockbackFrom(enemy) {
    const now = Date.now();
    const dir = enemy?.x > this.x ? -1 : 1; // push away from enemy
    this.knockbackActive = true;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = this.KNOCKBACK_SPEED_Y; // small hop
  }

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
    this.setSheetFrame(this.IDLE_SHEET, this.idleFrameIndex % (this.IDLE_SHEET.count || 1));
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
    const sheetImg = this.imageCache?.[this.IDLE_SHEET.path];
    const cnt = this.getSheetCount(this.IDLE_SHEET, sheetImg) || this.IDLE_SHEET.count || 1;
    this.idleFrameIndex = (this.idleFrameIndex + 1) % cnt;
    this.lastIdleFrameTime = now;
  }

  // Sprite-sheet helpers for idle
  setSheetFrame(sheet, index) {
    const col = index % sheet.cols;
    const row = Math.floor(index / sheet.cols);
    this.currentFrameRect = {
      sx: col * sheet.frameW,
      sy: row * sheet.frameH,
      sw: sheet.frameW,
      sh: sheet.frameH,
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
      sheet.cols = cols;
      sheet.rows = rows;
      sheet.count = sheet.count || cols * rows;
    }
    return sheet.count || cols * rows;
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
