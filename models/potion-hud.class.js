class PotionHUD extends DrawableObject {
  constructor() {
    super();
    this.iconPath = 'assets/img/6_potions/heart_potion.png';
    this.loadImage(this.iconPath);
    this.x = 260; // to the right of health + block bars
    this.y = 10;
    this.width = 28;
    this.height = 28;
    this.count = 0; // 0 or 1 (one-slot system)
  }

  setCount(n) {
    this.count = Math.max(0, Math.min(3, Math.floor(n)));
  }

  drawAt(ctx, dx, dy) {
    // Draw icon
    super.drawAt(ctx, dx, dy);
    // Draw count text next to it
    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const txt = String(this.count || 0);
    const tx = dx + this.width + 6;
    const ty = dy + Math.floor(this.height * 0.7);
    ctx.strokeText(txt, tx, ty);
    ctx.fillText(txt, tx, ty);
    ctx.restore();
  }
}
