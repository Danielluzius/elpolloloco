/**
 * Represents a goblin entity.
 * @extends GoblinAggro
 */
class Goblin extends GoblinAggro {
  /**
   * Creates a new Goblin instance.
   * @param {number} [type=1] - The type of the goblin.
   * @param {number} [x=800] - The initial x-coordinate of the goblin.
   */
  constructor(type = 1, x = 800) {
    super(type, x);
    this.animate();
  }

  /**
   * Draws the goblin's frame on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
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
