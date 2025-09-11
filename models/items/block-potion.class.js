/**
 * Represents a block potion item in the game.
 * @extends MoveableObject
 */
class BlockPotion extends MoveableObject {
  /**
   * Creates a new BlockPotion instance.
   * @param {number} x - The x-coordinate of the block potion.
   * @param {object} [options={}] - Additional options for the block potion.
   */
  constructor(x, options = {}) {
    super();
    this.disableGravity = true;
    this.loadImage('assets/img/6_potions/block_potion.png');
    this.width = options.width ?? 36;
    this.height = options.height ?? 36;
    const groundBottom = 440;
    this.y = options.y ?? groundBottom - this.height;
    this._baseY = this.y;
    this.x = x;
    this.offset = options.offset ?? { top: 4, right: 4, bottom: 2, left: 4 };
    this._spawnAt =
      performance && performance.now ? performance.now() : Date.now();
  }

  /**
   * Draws the block potion on the canvas with hover and pulse effects.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate offset.
   * @param {number} dy - The y-coordinate offset.
   */
  drawAt(ctx, dx, dy) {
    const t = this.calculateElapsedTime();
    const hover = this.calculateHoverEffect(t);
    const pulse = this.calculatePulseEffect(t);
    this.drawWithEffects(ctx, dx, dy, hover, pulse);
  }

  /**
   * Calculates the elapsed time since the block potion was spawned.
   * @returns {number} The elapsed time in seconds.
   */
  calculateElapsedTime() {
    return (
      ((performance && performance.now ? performance.now() : Date.now()) -
        this._spawnAt) /
      1000
    );
  }

  /**
   * Calculates the hover effect for the block potion.
   * @param {number} t - The elapsed time in seconds.
   * @returns {number} The hover offset.
   */
  calculateHoverEffect(t) {
    return Math.sin(t * 2) * 6;
  }

  /**
   * Calculates the pulse effect for the block potion.
   * @param {number} t - The elapsed time in seconds.
   * @returns {number} The pulse scale factor.
   */
  calculatePulseEffect(t) {
    return 1 + Math.sin(t * 4) * 0.05;
  }

  /**
   * Draws the block potion with hover and pulse effects.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate offset.
   * @param {number} dy - The y-coordinate offset.
   * @param {number} hover - The hover offset.
   * @param {number} pulse - The pulse scale factor.
   */
  drawWithEffects(ctx, dx, dy, hover, pulse) {
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
