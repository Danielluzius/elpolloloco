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
    if (this._hasFrameRect()) this._drawFromRect(ctx, this.x, this.y);
    else this._drawFull(ctx, this.x, this.y);
  }

  /**
   * Draws the object at a specific position on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate to draw the object.
   * @param {number} dy - The y-coordinate to draw the object.
   */
  drawAt(ctx, dx, dy) {
    if (!this.img) return;
    if (this._hasFrameRect()) this._drawFromRect(ctx, dx, dy);
    else this._drawFull(ctx, dx, dy);
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
    if (!this.otherDirection) return this._drawFacingRight(ctx);
    ctx.save();
    this._applyFlip(ctx);
    this._drawFacingLeft(ctx);
    ctx.restore();
  }

  /**
   * Automatically sets the frame of a sprite sheet.
   * @param {Object} sheet - The sprite sheet configuration.
   * @param {number} index - The frame index to set.
   */
  setSheetFrameAuto(sheet, index) {
    const img = this._getSheetImage(sheet);
    if (!img) return;
    const { cols, rows } = this._getGrid(sheet, img);
    const { fullW, fullH } = this._getImageSize(img);
    const spacingX = this.calculateSpacing(fullW, cols);
    const spacingY = this.calculateSpacing(fullH, rows);
    const { fw, fh } = this._getFrameSize(
      sheet,
      fullW,
      fullH,
      cols,
      rows,
      spacingX,
      spacingY
    );
    const { marginX, marginY } = this._getMargins(
      fullW,
      fullH,
      cols,
      rows,
      fw,
      fh,
      spacingX,
      spacingY
    );
    this.currentFrameRect = this._computeFrameRect(
      index,
      cols,
      rows,
      fw,
      fh,
      marginX,
      marginY,
      spacingX,
      spacingY
    );
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

  /**
   * Checks whether a frame rect is currently set.
   * @returns {boolean}
   * @private
   */
  _hasFrameRect() {
    const r = this.currentFrameRect;
    return !!(r && typeof r.sx === 'number');
  }

  /**
   * Draws the current frame rect at the given position.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} dx
   * @param {number} dy
   * @private
   */
  _drawFromRect(ctx, dx, dy) {
    const r = this.currentFrameRect;
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
  }

  /**
   * Draws the full image at the given position.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} dx
   * @param {number} dy
   * @private
   */
  _drawFull(ctx, dx, dy) {
    ctx.drawImage(this.img, dx, dy, this.width, this.height);
  }

  /**
   * Applies a horizontal flip transform around the object's left edge.
   * @param {CanvasRenderingContext2D} ctx
   * @private
   */
  _applyFlip(ctx) {
    ctx.translate(this.x + this.width, 0);
    ctx.scale(-1, 1);
  }

  /**
   * Draws facing right including overlays.
   * @param {CanvasRenderingContext2D} ctx
   * @private
   */
  _drawFacingRight(ctx) {
    this.draw(ctx);
    this.drawFrame(ctx);
    this.drawDebugHitboxes(ctx, this.x, this.y);
  }

  /**
   * Draws facing left including overlays (already flipped).
   * @param {CanvasRenderingContext2D} ctx
   * @private
   */
  _drawFacingLeft(ctx) {
    this.drawAt(ctx, 0, this.y);
    this.drawFrame(ctx);
    this.drawDebugHitboxes(ctx, 0, this.y);
  }

  /**
   * Gets the image to use for the provided sheet.
   * @param {Object} sheet
   * @returns {HTMLImageElement|null}
   * @private
   */
  _getSheetImage(sheet) {
    return this.imageCache?.[sheet.path] || this.img || null;
  }

  /**
   * Returns the grid definition (cols/rows).
   * @param {Object} sheet
   * @param {HTMLImageElement} img
   * @returns {{cols:number,rows:number}}
   * @private
   */
  _getGrid(sheet, img) {
    const inferredCols = sheet.cols || (sheet.count ? sheet.count : 1);
    return {
      cols: Math.max(1, inferredCols),
      rows: Math.max(1, sheet.rows || 1),
    };
  }

  /**
   * Returns natural dimensions of the image.
   * @param {HTMLImageElement} img
   * @returns {{fullW:number, fullH:number}}
   * @private
   */
  _getImageSize(img) {
    return {
      fullW: img.naturalWidth || img.width || 0,
      fullH: img.naturalHeight || img.height || 0,
    };
  }

  /**
   * Computes frame width/height.
   * @param {Object} sheet
   * @param {number} fullW
   * @param {number} fullH
   * @param {number} cols
   * @param {number} rows
   * @param {number} spacingX
   * @param {number} spacingY
   * @returns {{fw:number, fh:number}}
   * @private
   */
  _getFrameSize(sheet, fullW, fullH, cols, rows, spacingX, spacingY) {
    const fw =
      sheet.frameW ||
      (fullW ? Math.round((fullW - spacingX * (cols - 1)) / cols) : 128);
    const fh =
      sheet.frameH ||
      (fullH ? Math.round((fullH - spacingY * (rows - 1)) / rows) : 128);
    return { fw, fh };
  }

  /**
   * Computes margins around frames.
   * @param {number} fullW
   * @param {number} fullH
   * @param {number} cols
   * @param {number} rows
   * @param {number} fw
   * @param {number} fh
   * @param {number} spacingX
   * @param {number} spacingY
   * @returns {{marginX:number, marginY:number}}
   * @private
   */
  _getMargins(fullW, fullH, cols, rows, fw, fh, spacingX, spacingY) {
    const marginX = this.calculateMargin(fullW, cols, fw, spacingX);
    const marginY = this.calculateMargin(fullH, rows, fh, spacingY);
    return { marginX, marginY };
  }

  /**
   * Computes the source rectangle for a frame index.
   * @param {number} index
   * @param {number} cols
   * @param {number} rows
   * @param {number} fw
   * @param {number} fh
   * @param {number} marginX
   * @param {number} marginY
   * @param {number} spacingX
   * @param {number} spacingY
   * @returns {{sx:number, sy:number, sw:number, sh:number}}
   * @private
   */
  _computeFrameRect(
    index,
    cols,
    rows,
    fw,
    fh,
    marginX,
    marginY,
    spacingX,
    spacingY
  ) {
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    const sx = marginX + col * (fw + spacingX);
    const sy = marginY + row * (fh + spacingY);
    return { sx, sy, sw: fw, sh: fh };
  }
}
