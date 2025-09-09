class DrawableObject {
  x = 120;
  y = 120;
  height = 150;
  width = 100;
  img;
  imageCache = {};
  currentImage = 0;
  currentFrameRect = null;

  loadImage(path) {
    this.img = new Image();
    this.img.src = path;
    this.imageCache[path] = this.img;
  }

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

  drawFrame(ctx) {}

  loadImages(arr) {
    arr.forEach((path) => {
      const img = new Image();
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
    ctx.translate(this.x + this.width, 0);
    ctx.scale(-1, 1);
    this.drawAt(ctx, 0, this.y);
    this.drawFrame(ctx);
    this.drawDebugHitboxes(ctx, 0, this.y);
    ctx.restore();
  }

  setSheetFrameAuto(sheet, index) {
    const img = this.imageCache?.[sheet.path] || this.img;
    if (!img) return;

    const inferredCols = sheet.cols || (sheet.count ? sheet.count : 1);
    const cols = Math.max(1, inferredCols);
    const rows = Math.max(1, sheet.rows || 1);
    const fullW = img.naturalWidth || img.width || 0;
    const fullH = img.naturalHeight || img.height || 0;

    const pickSpacing = (full, n) => {
      if (typeof n !== 'number' || n < 1 || !full) return 0;

      for (let s = 0; s <= 3; s++) {
        const size = (full - s * (n - 1)) / n;
        if (Math.abs(size - Math.round(size)) < 1e-6) return s;
      }

      return 0;
    };

    const spacingX = pickSpacing(fullW, cols);
    const spacingY = pickSpacing(fullH, rows);

    const fw =
      sheet.frameW ||
      (fullW ? Math.round((fullW - spacingX * (cols - 1)) / cols) : 128);
    const fh =
      sheet.frameH ||
      (fullH ? Math.round((fullH - spacingY * (rows - 1)) / rows) : 128);

    const usedW = cols * fw + (cols - 1) * spacingX;
    const usedH = rows * fh + (rows - 1) * spacingY;
    const marginX = Math.max(0, Math.floor((fullW - usedW) / 2));
    const marginY = Math.max(0, Math.floor((fullH - usedH) / 2));

    const col = index % cols;
    const row = Math.floor(index / cols) % rows;

    const sx = marginX + col * (fw + spacingX);
    const sy = marginY + row * (fh + spacingY);

    this.currentFrameRect = { sx, sy, sw: fw, sh: fh };
  }

  getSheetCountAuto(sheet) {
    if (sheet.count) return sheet.count;
    const cols = Math.max(1, sheet.cols || 1);
    const rows = Math.max(1, sheet.rows || 1);
    return cols * rows;
  }

  getSpriteCountFromFilename(path) {
    if (!path) return null;
    const m = String(path).match(/_(\d+)_sprites\.png$/i);
    if (m && m[1]) return parseInt(m[1], 10) || null;
    return null;
  }

  drawDebugHitboxes() {
    return;
  }
}
