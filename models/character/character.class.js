/**
 * Represents the main character in the game, extending the MoveableObject class.
 */
class Character extends MoveableObject {
  height = 200;
  width = 210;
  y = 240;
  groundY = 240;
  speed = 10;

  animKey = 'stand';
  lastActivityAt = Date.now();
  IDLE_AFTER_MS = 1500;
  LONG_IDLE_AFTER_MS = 6000;

  IDLE_SHEET = {
    path: 'assets/img/2_character_man/1_idle.png',
    frameW: 128,
    frameH: 128,
    cols: 6,
    rows: 1,
    count: 6,
  };
  LONG_IDLE_SHEET = {
    path: 'assets/img/2_character_man/2_idle_long.png',
    frameW: 128,
    frameH: 128,
  };
  WALK_SHEET = {
    path: 'assets/img/2_character_man/7_run.png',
    frameW: 128,
    frameH: 128,
  };
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
    path: 'assets/img/2_character_man/10_block.png',
    frameW: 128,
    frameH: 128,
  };
  DEAD_SHEET = {
    path: 'assets/img/2_character_man/5_dead.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };

  ATTACK_RANGE_X = 80;
  ATTACK_ACTIVE_START_FRAME = 1;

  /**
   * Initializes the character with default properties and preloads core images.
   */
  constructor() {
    super();
    this.offset = { top: 120, right: 80, bottom: 0, left: 80 };
    this.healthSegments = 5;
    this.energy = 100;
    this.defaultStartX = this.x;
    this.preloadCoreImages();
  }

  /**
   * Preloads core images required for the character's animations.
   */
  preloadCoreImages() {
    const imagePaths = [
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
    ];
    imagePaths.forEach((path) => this.loadImage(path));
    this.setInitialImage();
  }

  /**
   * Sets the initial image and frame for the character.
   */
  setInitialImage() {
    const idleImg = this.imageCache[this.IDLE_SHEET.path];
    if (idleImg) {
      this.img = idleImg;
      this.setSheetFrame(this.IDLE_SHEET, 0);
    }
  }

  /**
   * Sets the current frame of the character's sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @param {number} index - The frame index to set.
   */
  setSheetFrame(sheet, index) {
    const img = this.imageCache?.[sheet.path] || this.img;
    const frameW = sheet.frameW || 128;
    const frameH = sheet.frameH || 128;
    let cols = sheet.cols;
    let rows = sheet.rows;
    if (!cols || !rows) {
      this.inferSheetDimensions(sheet, img, frameW, frameH);
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

  /**
   * Infers the dimensions of a sprite sheet if not explicitly provided.
   * @param {Object} sheet - The sprite sheet configuration.
   * @param {HTMLImageElement} img - The image element of the sprite sheet.
   * @param {number} frameW - The width of a single frame.
   * @param {number} frameH - The height of a single frame.
   */
  inferSheetDimensions(sheet, img, frameW, frameH) {
    const w = img?.naturalWidth || 0;
    const h = img?.naturalHeight || 0;
    if (w && frameW) sheet.cols = Math.max(1, Math.floor(w / frameW));
    if (h && frameH) sheet.rows = Math.max(1, Math.floor(h / frameH));
    sheet.cols ||= sheet.count || 1;
    sheet.rows ||= 1;
    sheet.count ||= sheet.cols * sheet.rows;
  }

  /**
   * Gets the total number of frames in a sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @param {HTMLImageElement} img - The image element of the sprite sheet.
   * @returns {number} The total number of frames.
   */
  getSheetCount(sheet, img) {
    if (sheet.count && sheet.cols && sheet.rows) return sheet.count;
    const frameW = sheet.frameW || img?.naturalHeight || 128;
    const naturalW = img?.naturalWidth || 0;
    const canInfer = naturalW > 0 && frameW > 0;
    const cols =
      sheet.cols || (canInfer ? Math.max(1, Math.floor(naturalW / frameW)) : 1);
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

  /**
   * Draws the current frame of the character on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  drawFrame(ctx) {}
}
