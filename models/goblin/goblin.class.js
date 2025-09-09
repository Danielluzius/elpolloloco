class Goblin extends GoblinAggro {
  constructor(type = 1, x = 800) {
    super(type, x);
    this.animate();
  }

  drawFrame(ctx) {
    try {
      if (!((this.aware && !this.dead) || this.dying)) return;
      const state = this.dying ? 4 : Math.min(3, 1 + (this.hitCount || 0));
      const img = this.imageCache?.[this.heartPaths[state]];
      if (!img) return;
      const cam = this.world?.camera_x || 0;
      const baseX = this.otherDirection ? 0 : Math.round(this.x + cam);
      const baseY = Math.round(this.y);
      const dx = Math.round(baseX + (this.width - this.heartW) / 2);
      const dy = Math.round(baseY - this.heartH - this.heartYOffset);
      ctx.drawImage(img, dx, dy, this.heartW, this.heartH);
    } catch (_) {}
  }
}
