/**
 * Represents the HUD for displaying potion count.
 * @extends DrawableObject
 */
class PotionHUD extends DrawableObject {
  /**
   * Creates a new PotionHUD instance.
   */
  constructor() {
    super();
    this.iconPath = 'assets/img/6_potions/heart_potion.png';
    this.loadImage(this.iconPath);
    this.x = 260;
    this.y = 10;
    this.width = 28;
    this.height = 28;
    this.count = 0;
  }

  /**
   * Sets the count of potions.
   * @param {number} n - The count to set.
   */
  setCount(n) {
    this.count = Math.max(0, Math.min(3, Math.floor(n)));
  }

  /**
   * Draws the potion HUD on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate offset.
   * @param {number} dy - The y-coordinate offset.
   */
  drawAt(ctx, dx, dy) {
    super.drawAt(ctx, dx, dy);
    this.drawPotionCount(ctx, dx, dy);
  }

  /**
   * Draws the potion count text on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate offset.
   * @param {number} dy - The y-coordinate offset.
   */
  drawPotionCount(ctx, dx, dy) {
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
