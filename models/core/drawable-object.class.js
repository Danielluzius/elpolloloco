/**
 * Represents a drawable object in the game, capable of rendering images and animations.
 */
class DrawableObject {
  x = 120;
  y = 120;
  height = 150;
  width = 100;
  img;
  imageCache = {};
  currentImage = 0;
  currentFrameRect = null;

  /**
   * Loads an image and caches it.
   * @param {string} path - The path to the image file.
   */
  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
    this.imageCache[path] = this.img;
  }

  /**
   * Draws the object on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  draw(ctx) {
    if (!this.img) return;
    const r = this.currentFrameRect;

    if (r && typeof r.sx === 'number') {
      ctx.drawImage(
        this.img,
        r.sx,
        r.sy,
        r.sw,
        r.sh,
        this.x,
        this.y,
        this.width,
        this.height
      );
      return;
    }

    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  /**
   * Draws the object at a specific position on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate to draw the object.
   * @param {number} dy - The y-coordinate to draw the object.
   */
  drawAt(ctx, dx, dy) {
    if (!this.img) return;
    const r = this.currentFrameRect;

    if (r && typeof r.sx === 'number') {
      ctx.drawImage(
        this.img,
        r.sx,
        r.sy,
        r.sw,
        r.sh,
        dx,
        dy,
        this.width,
        this.height
      );
      return;
    }

    ctx.drawImage(this.img, dx, dy, this.width, this.height);
  }

  /**
   * Draws the current animation frame of the object.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  drawFrame(ctx) {}

  /**
   * Loads multiple images and caches them.
   * @param {string[]} arr - An array of image paths to load.
   */
  loadImages(arr) {
    arr.forEach((path) => {
      const img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  /**
   * Draws the object with directional adjustments (e.g., flipping).
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  drawWithDirection(ctx) {
    if (!this.otherDirection) {
      this.draw(ctx);
      this.drawFrame(ctx);
      this.drawDebugHitboxes(ctx, this.x, this.y);
      return;
    }

    ctx.save();
    ctx.translate(this.x + this.width, 0);
    ctx.scale(-1, 1);
    this.drawAt(ctx, 0, this.y);
    this.drawFrame(ctx);
    this.drawDebugHitboxes(ctx, 0, this.y);
    ctx.restore();
  }

  /**
   * Automatically sets the frame of a sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @param {number} index - The frame index to set.
   */
  setSheetFrameAuto(sheet, index) {
    const img = this.imageCache?.[sheet.path] || this.img;
    if (!img) return;

    const inferredCols = sheet.cols || (sheet.count ? sheet.count : 1);
    const cols = Math.max(1, inferredCols);
    const rows = Math.max(1, sheet.rows || 1);
    const fullW = img.naturalWidth || img.width || 0;
    const fullH = img.naturalHeight || img.height || 0;

    const spacingX = this.calculateSpacing(fullW, cols);
    const spacingY = this.calculateSpacing(fullH, rows);

    const fw =
      sheet.frameW ||
      (fullW ? Math.round((fullW - spacingX * (cols - 1)) / cols) : 128);
    const fh =
      sheet.frameH ||
      (fullH ? Math.round((fullH - spacingY * (rows - 1)) / rows) : 128);

    const marginX = this.calculateMargin(fullW, cols, fw, spacingX);
    const marginY = this.calculateMargin(fullH, rows, fh, spacingY);

    const col = index % cols;
    const row = Math.floor(index / cols) % rows;

    const sx = marginX + col * (fw + spacingX);
    const sy = marginY + row * (fh + spacingY);

    this.currentFrameRect = { sx, sy, sw: fw, sh: fh };
  }

  /**
   * Calculates the spacing between frames in a sprite sheet.
   * @param {number} full - The full dimension (width or height) of the sprite sheet.
   * @param {number} n - The number of frames in the dimension.
   * @returns {number} The calculated spacing.
   */
  calculateSpacing(full, n) {
    if (typeof n !== 'number' || n < 1 || !full) return 0;

    for (let s = 0; s <= 3; s++) {
      const size = (full - s * (n - 1)) / n;
      if (Math.abs(size - Math.round(size)) < 1e-6) return s;
    }

    return 0;
  }

  /**
   * Calculates the margin around frames in a sprite sheet.
   * @param {number} full - The full dimension (width or height) of the sprite sheet.
   * @param {number} n - The number of frames in the dimension.
   * @param {number} frameSize - The size of a single frame.
   * @param {number} spacing - The spacing between frames.
   * @returns {number} The calculated margin.
   */
  calculateMargin(full, n, frameSize, spacing) {
    const used = n * frameSize + (n - 1) * spacing;
    return Math.max(0, Math.floor((full - used) / 2));
  }

  /**
   * Gets the total number of frames in a sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @returns {number} The total number of frames.
   */
  getSheetCountAuto(sheet) {
    if (sheet.count) return sheet.count;
    const cols = Math.max(1, sheet.cols || 1);
    const rows = Math.max(1, sheet.rows || 1);
    return cols * rows;
  }

  /**
   * Extracts the sprite count from a filename.
   * @param {string} path - The path to the sprite sheet file.
   * @returns {number|null} The sprite count, or null if not found.
   */
  getSpriteCountFromFilename(path) {
    if (!path) return null;
    const m = String(path).match(/_(\d+)_sprites\.png$/i);
    if (m && m[1]) return parseInt(m[1], 10) || null;
    return null;
  }

  /**
   * Draws debug hitboxes for the object.
   */
  drawDebugHitboxes() {
    return;
  }
}
