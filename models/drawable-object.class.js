class DrawableObject {
  x = 120;
  y = 120;
  height = 150;
  width = 100;
  img;
  imageCache = {};
  currentImage = 0;
  currentFrameRect = null; // optional source rect for sprite sheets { sx, sy, sw, sh }

  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
    // Also cache single images by path for later lookup
    this.imageCache[path] = this.img;
  }

  draw(ctx) {
    if (!this.img) return;
    const r = this.currentFrameRect;
    if (r && typeof r.sx === 'number') {
      ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, this.x, this.y, this.width, this.height);
    } else {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }

  // Draw at specific coordinates without changing this.x/this.y
  drawAt(ctx, dx, dy) {
    if (!this.img) return;
    const r = this.currentFrameRect;
    if (r && typeof r.sx === 'number') {
      ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, dx, dy, this.width, this.height);
    } else {
      ctx.drawImage(this.img, dx, dy, this.width, this.height);
    }
  }

  drawFrame(ctx) {}

  loadImages(arr) {
    arr.forEach((path) => {
      let img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  drawWithDirection(ctx) {
    if (!this.otherDirection) {
      this.draw(ctx);
      this.drawFrame(ctx);
      this.drawDebugHitboxes(ctx, this.x, this.y);
      return;
    }
    ctx.save();
    // Mirror around the object's right edge without mutating world coords
    ctx.translate(this.x + this.width, 0);
    ctx.scale(-1, 1);
    this.drawAt(ctx, 0, this.y);
    this.drawFrame(ctx);
    this.drawDebugHitboxes(ctx, 0, this.y);
    ctx.restore();
  }

  // Generic sprite-sheet helpers for enemies and other objects
  // sheet: { path, cols, rows, frameW?, frameH?, count? }
  setSheetFrameAuto(sheet, index) {
    const img = this.imageCache?.[sheet.path] || this.img;
    if (!img) return;
    // If only count is known, default to a single row with 'count' columns
    const inferredCols = sheet.cols || (sheet.count ? sheet.count : 1);
    const cols = Math.max(1, inferredCols);
    const rows = Math.max(1, sheet.rows || 1);
    const fullW = img.naturalWidth || img.width || 0;
    const fullH = img.naturalHeight || img.height || 0;
    // Try to infer spacing between frames to get integer frame sizes
    const pickSpacing = (full, n) => {
      if (typeof n !== 'number' || n < 1 || !full) return 0;
      for (let s = 0; s <= 3; s++) {
        const size = (full - s * (n - 1)) / n;
        if (Math.abs(size - Math.round(size)) < 1e-6) return s; // integer frame size
      }
      return 0;
    };
    const spacingX = pickSpacing(fullW, cols);
    const spacingY = pickSpacing(fullH, rows);
    const fw = sheet.frameW || (fullW ? Math.round((fullW - spacingX * (cols - 1)) / cols) : 128);
    const fh = sheet.frameH || (fullH ? Math.round((fullH - spacingY * (rows - 1)) / rows) : 128);

    // Compute symmetric outer margins if any
    const usedW = cols * fw + (cols - 1) * spacingX;
    const usedH = rows * fh + (rows - 1) * spacingY;
    const marginX = Math.max(0, Math.floor((fullW - usedW) / 2));
    const marginY = Math.max(0, Math.floor((fullH - usedH) / 2));
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    // Position considering margins and spacing (handles gutters)
    let sx = marginX + col * (fw + spacingX);
    let sy = marginY + row * (fh + spacingY);
    this.currentFrameRect = { sx, sy, sw: fw, sh: fh };
  }

  getSheetCountAuto(sheet) {
    if (sheet.count) return sheet.count;
    const cols = Math.max(1, sheet.cols || 1);
    const rows = Math.max(1, sheet.rows || 1);
    return cols * rows;
  }

  // Extract number of sprites from filenames like: .../1_idle_6_sprites.png
  getSpriteCountFromFilename(path) {
    if (!path) return null;
    const m = String(path).match(/_(\d+)_sprites\.png$/i);
    if (m && m[1]) return parseInt(m[1], 10) || null;
    return null;
  }

  // Debug overlay: draw sprite bounds (blue) and collision bounds (red) when enabled via window.DEBUG_HITBOX
  drawDebugHitboxes(ctx, dx, dy) {
    try {
      if (typeof window === 'undefined' || !window.DEBUG_HITBOX) return;
      ctx.save();
      // Sprite draw rectangle
      ctx.strokeStyle = 'rgba(0,128,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx, dy, this.width, this.height);
      // Collision rectangle with offset
      const o = this.offset || { top: 0, right: 0, bottom: 0, left: 0 };
      const cx = dx + o.left;
      const cy = dy + o.top;
      const cw = Math.max(0, this.width - (o.left + o.right));
      const ch = Math.max(0, this.height - (o.top + o.bottom));
      ctx.strokeStyle = 'rgba(255,0,0,0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.restore();
    } catch (_) {}
  }
}
