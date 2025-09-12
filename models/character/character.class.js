/**
 * Represents the main character in the game, extending the MoveableObject class.
 */
class Character extends MoveableObject {
  /**
   * Character height in pixels.
   * @type {number}
   */
  height = 200;

  /**
   * Character width in pixels.
   * @type {number}
   */
  width = 210;

  /**
   * Vertical position (y) of the character on the canvas.
   * @type {number}
   */
  y = 240;

  /**
   * Ground Y position (standing position).
   * @type {number}
   */
  groundY = 240;

  /**
   * Movement speed in pixels per tick.
   * @type {number}
   */
  speed = 10;

  /**
   * Current animation key/name.
   * @type {string}
   */
  animKey = 'stand';

  /**
   * Timestamp of the last player activity.
   * @type {number}
   */
  lastActivityAt = Date.now();

  /**
   * Milliseconds before switching to idle.
   * @type {number}
   */
  IDLE_AFTER_MS = 1500;

  /**
   * Milliseconds before switching to long-idle.
   * @type {number}
   */
  LONG_IDLE_AFTER_MS = 6000;

  /**
   * Sprite sheet config for normal idle animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  IDLE_SHEET = {
    path: 'assets/img/2_character_man/1_idle.png',
    frameW: 128,
    frameH: 128,
    cols: 6,
    rows: 1,
    count: 6,
  };

  /**
   * Sprite sheet config for long idle animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  LONG_IDLE_SHEET = {
    path: 'assets/img/2_character_man/2_idle_long.png',
    frameW: 128,
    frameH: 128,
  };

  /**
   * Sprite sheet config for walking/run animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  WALK_SHEET = {
    path: 'assets/img/2_character_man/7_run.png',
    frameW: 128,
    frameH: 128,
  };

  /**
   * Sprite sheet config for walking during intro sequence.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  WALK_INTRO_SHEET = {
    path: 'assets/img/2_character_man/9_walk.png',
    frameW: 128,
    frameH: 128,
    cols: 9,
    rows: 1,
    count: 9,
  };

  /**
   * Sprite sheet config for jump animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  JUMP_SHEET = {
    path: 'assets/img/2_character_man/6_jump.png',
    frameW: 128,
    frameH: 128,
    cols: 10,
    rows: 1,
    count: 10,
  };

  /**
   * Sprite sheet config for hurt animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  HURT_SHEET = {
    path: 'assets/img/2_character_man/4_hurt.png',
    frameW: 128,
    frameH: 128,
    cols: 3,
    rows: 1,
    count: 3,
  };

  /**
   * Sprite sheet config for attack animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  ATTACK_SHEET = {
    path: 'assets/img/2_character_man/3_attack_stand2.png',
    frameW: 128,
    frameH: 128,
    cols: 3,
    rows: 1,
    count: 3,
  };

  /**
   * Sprite sheet config for special attack animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  SPECIAL_SHEET = {
    path: 'assets/img/2_character_man/3_attack_stand.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };

  /**
   * Sprite sheet config for block animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  BLOCK_SHEET = {
    path: 'assets/img/2_character_man/10_block.png',
    frameW: 128,
    frameH: 128,
  };

  /**
   * Sprite sheet config for death animation.
   * @type {{path:string,frameW:number,frameH:number,cols?:number,rows?:number,count?:number}}
   */
  DEAD_SHEET = {
    path: 'assets/img/2_character_man/5_dead.png',
    frameW: 128,
    frameH: 128,
    cols: 5,
    rows: 1,
    count: 5,
  };

  /**
   * Horizontal attack range in pixels.
   * @type {number}
   */
  ATTACK_RANGE_X = 80;

  /**
   * Frame index where attack becomes active.
   * @type {number}
   */
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
  drawFrame(ctx) {
    const info = this.getDrawImageInfo();
    if (!info) return;
    const pos = this.computeDrawPosition(info.img);
    // draw current frame using computed source rect and destination position
    ctx.drawImage(
      info.img,
      info.sx,
      info.sy,
      info.sw,
      info.sh,
      pos.dx,
      pos.dy,
      info.sw,
      info.sh
    );
  }

  /**
   * Resolve the image and source rectangle for the current frame.
   * @returns {{img:HTMLImageElement,sx:number,sy:number,sw:number,sh:number}|null}
   */
  getDrawImageInfo() {
    const img = this.img || this.imageCache?.[this.IDLE_SHEET.path];
    const rect = this.currentFrameRect;
    if (!img || !rect) return null;
    return { img, sx: rect.sx, sy: rect.sy, sw: rect.sw, sh: rect.sh };
  }

  /**
   * Compute destination position for the current frame on canvas.
   * @param {HTMLImageElement} img - Image used to compute offsets.
   * @returns {{dx:number,dy:number}}
   */
  computeDrawPosition(img) {
    const cam = this.world?.camera_x || 0;
    const dx = Math.round(this.x + cam);
    const dy = Math.round(this.y);
    return { dx, dy };
  }
}
