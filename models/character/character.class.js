class Character extends MoveableObject {
  // Basic physical appearance and movement
  height = 200;
  width = 210;
  y = 240;
  groundY = 240;
  speed = 10;

  // Minimal shared state used by subclasses
  animKey = 'stand';
  lastActivityAt = Date.now();
  IDLE_AFTER_MS = 1500;
  LONG_IDLE_AFTER_MS = 6000;

  // Sprite-sheet configs (used across subclasses)
  IDLE_SHEET = { path: 'assets/img/2_character_man/1_idle.png', frameW: 128, frameH: 128, cols: 6, rows: 1, count: 6 };
  LONG_IDLE_SHEET = { path: 'assets/img/2_character_man/2_idle_long.png', frameW: 128, frameH: 128 };
  WALK_SHEET = { path: 'assets/img/2_character_man/7_run.png', frameW: 128, frameH: 128 };
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
  HURT_SHEET = { path: 'assets/img/2_character_man/4_hurt.png', frameW: 128, frameH: 128, cols: 3, rows: 1, count: 3 };
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
  BLOCK_SHEET = { path: 'assets/img/2_character_man/10_block.png', frameW: 128, frameH: 128 };
  DEAD_SHEET = { path: 'assets/img/2_character_man/5_dead.png', frameW: 128, frameH: 128, cols: 5, rows: 1, count: 5 };

  // Attack config
  ATTACK_RANGE_X = 80;
  ATTACK_ACTIVE_START_FRAME = 1;

  constructor() {
    super();
    this.offset = { top: 120, right: 80, bottom: 0, left: 80 };
    this.healthSegments = 5;
    this.energy = 100;
    this.defaultStartX = this.x;
    this.preloadCoreImages();
  }

  preloadCoreImages() {
    [
      this.IDLE_SHEET.path,
      this.LONG_IDLE_SHEET.path,
      this.WALK_SHEET.path,
      this.WALK_INTRO_SHEET.path,
      this.JUMP_SHEET.path,
      this.HURT_SHEET.path,
      this.ATTACK_SHEET.path,
      this.SPECIAL_SHEET.path,
      this.DEAD_SHEET.path,
      this.BLOCK_SHEET.path,
    ].forEach((p) => this.loadImage(p));
    const idleImg = this.imageCache[this.IDLE_SHEET.path];
    if (idleImg) {
      this.img = idleImg;
      this.setSheetFrame(this.IDLE_SHEET, 0);
    }
  }

  // Utilities shared by subclasses
  setSheetFrame(sheet, index) {
    const img = this.imageCache?.[sheet.path] || this.img;
    const frameW = sheet.frameW || 128;
    const frameH = sheet.frameH || 128;
    let cols = sheet.cols,
      rows = sheet.rows;
    if (!cols || !rows) {
      const w = img?.naturalWidth || 0,
        h = img?.naturalHeight || 0;
      if (w && frameW) cols = Math.max(1, Math.floor(w / frameW));
      if (h && frameH) rows = Math.max(1, Math.floor(h / frameH));
      cols = cols || sheet.count || 1;
      rows = rows || 1;
      sheet.cols ||= cols;
      sheet.rows ||= rows;
      sheet.count ||= cols * rows;
    }
    const safeCols = Math.max(1, cols || 1);
    const col = index % safeCols,
      row = Math.floor(index / safeCols);
    this.currentFrameRect = { sx: col * frameW, sy: row * frameH, sw: frameW, sh: frameH };
  }

  getSheetCount(sheet, img) {
    if (sheet.count && sheet.cols && sheet.rows) return sheet.count;
    const frameW = sheet.frameW || img?.naturalHeight || 128;
    const naturalW = img?.naturalWidth || 0;
    const canInfer = naturalW > 0 && frameW > 0;
    const cols = sheet.cols || (canInfer ? Math.max(1, Math.floor(naturalW / frameW)) : 1);
    const rows = sheet.rows || 1;
    if ((sheet.cols && sheet.rows) || canInfer) {
      sheet.cols ||= cols;
      sheet.rows ||= rows;
      sheet.count ||= cols * rows;
    }
    sheet.cols ||= 1;
    sheet.rows ||= 1;
    sheet.count ||= sheet.cols * sheet.rows;
    return sheet.count;
  }

  // Base drawFrame does nothing; subclasses can overlay VFX
  drawFrame(ctx) {}
}
