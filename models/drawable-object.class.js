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
      return;
    }
    ctx.save();
    ctx.translate(this.width, 0);
    ctx.scale(-1, 1);
    this.x = this.x * -1;
    this.draw(ctx);
    this.drawFrame(ctx);
    this.x = this.x * -1;
    ctx.restore();
  }
}
