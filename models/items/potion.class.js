class Potion extends MoveableObject {
  constructor(x, options = {}) {
    super();
    this.disableGravity = true;
    this.loadImage('assets/img/6_potions/heart_potion.png');
    this.width = options.width ?? 36;
    this.height = options.height ?? 36;
    // Place on ground baseline similar to rocks
    const groundBottom = 440;
    this.y = options.y ?? groundBottom - this.height;
    this._baseY = this.y;
    this.x = x;
    // Slightly smaller collision box
    this.offset = options.offset ?? { top: 4, right: 4, bottom: 2, left: 4 };
    this._spawnAt =
      performance && performance.now ? performance.now() : Date.now();
  }
  // Override drawAt for a subtle hover/pulse effect
  drawAt(ctx, dx, dy) {
    const t =
      ((performance && performance.now ? performance.now() : Date.now()) -
        this._spawnAt) /
      1000;
    const hover = Math.sin(t * 2) * 6; // 6px vertical hover
    const pulse = 1 + Math.sin(t * 4) * 0.05; // 5% scale pulse
    const w = this.width * pulse;
    const h = this.height * pulse;
    const cx = dx + this.width / 2;
    const cy = (this._baseY ?? dy) + hover + this.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }
}
