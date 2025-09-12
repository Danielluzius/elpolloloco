/**
 * Represents the HUD for tracking goblin kills.
 * @extends DrawableObject
 */
class GoblinCounterHUD extends DrawableObject {
  constructor() {
    super();
    this.y = 6;
    this.xOffset = 0;
    this.kills = 0;
    this.total = 0;
    this.title = 'Goblins';
    this.mode = 'counter';
    this.objectiveSmall = '';
    this.objectiveBig = '';
  }

  /**
   * Sets the total and current kills for the HUD.
   * @param {number} total - The total number of goblins.
   * @param {number} [kills=this.kills] - The current number of kills.
   */
  setTotals(total, kills = this.kills) {
    this.total = Math.max(0, Math.floor(total || 0));
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  /**
   * Sets the current number of kills.
   * @param {number} kills - The current number of kills.
   */
  setKills(kills) {
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  /**
   * Enables the objective mode for the HUD.
   * @param {string} [smallText='DEFEAT THE'] - The small text to display.
   * @param {string} [bigText='GOBLIN KING'] - The big text to display.
   */
  enableObjectiveMode(smallText = 'DEFEAT THE', bigText = 'GOBLIN KING') {
    this.mode = 'objective';
    this.objectiveSmall = String(smallText || '');
    this.objectiveBig = String(bigText || '');
  }

  /**
   * Draws the HUD at the specified position.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate to draw at.
   * @param {number} dy - The y-coordinate to draw at.
   */
  drawAt(ctx, dx, dy) {
    const centerX = this.calculateCenterX(ctx, dx);
    const topY = dy ?? this.y ?? 6;
    this._beginHudContext(ctx);
    this._drawByMode(ctx, centerX, topY);
    this._endHudContext(ctx);
  }

  /**
   * Calculates the center X position for the HUD.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate offset.
   * @returns {number} The calculated center X position.
   */
  calculateCenterX(ctx, dx) {
    const baseCenter = Math.floor(
      ctx?.canvas?.width
        ? ctx.canvas.width / 2
        : (dx || 0) + (this.width || 0) / 2
    );
    return baseCenter + (this.xOffset || 0);
  }

  /**
   * Draws the HUD in objective mode.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} centerX - The center X position.
   * @param {number} topY - The top Y position.
   */
  drawObjectiveMode(ctx, centerX, topY) {
    const small = this.objectiveSmall || 'DEFEAT THE';
    ctx.font = 'bold 14px Arial';
    ctx.strokeText(small, centerX, topY);
    ctx.fillText(small, centerX, topY);
    const bigY = topY + 24;
    const big = this.objectiveBig || 'GOBLIN KING';
    ctx.font = 'bold 24px Arial';
    ctx.lineWidth = 4;
    ctx.strokeText(big, centerX, bigY);
    ctx.fillText(big, centerX, bigY);
  }

  /**
   * Draws the HUD in counter mode.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} centerX - The center X position.
   * @param {number} topY - The top Y position.
   */
  drawCounterMode(ctx, centerX, topY) {
    const bigY = this._drawCounterHeader(ctx, centerX, topY);
    this._drawCounterNumbers(ctx, centerX, bigY + 22);
  }

  /**
   * Begins HUD drawing context with common styles.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @private
   */
  _beginHudContext(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 4;
  }

  /**
   * Ends HUD drawing context.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @private
   */
  _endHudContext(ctx) {
    ctx.restore();
  }

  /**
   * Dispatches drawing by current HUD mode.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} centerX - Center x coordinate.
   * @param {number} topY - Top y coordinate.
   * @private
   */
  _drawByMode(ctx, centerX, topY) {
    if (this.mode === 'objective') this.drawObjectiveMode(ctx, centerX, topY);
    else this.drawCounterMode(ctx, centerX, topY);
  }

  /**
   * Draws the counter header lines and returns the y for the next line.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} centerX - Center x coordinate.
   * @param {number} topY - Top y coordinate.
   * @returns {number} The y position after the header.
   * @private
   */
  _drawCounterHeader(ctx, centerX, topY) {
    const small = 'DEFEAT THE';
    ctx.font = 'bold 14px Arial';
    ctx.strokeText(small, centerX, topY);
    ctx.fillText(small, centerX, topY);
    const bigTitle = (this.title || 'Goblins').toUpperCase();
    const bigY = topY + 24;
    ctx.font = 'bold 24px Arial';
    ctx.lineWidth = 4;
    ctx.strokeText(bigTitle, centerX, bigY);
    ctx.fillText(bigTitle, centerX, bigY);
    return bigY;
  }

  /**
   * Draws the counter numbers line (kills and remaining).
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} centerX - Center x coordinate.
   * @param {number} countY - Y coordinate for the numbers line.
   * @private
   */
  _drawCounterNumbers(ctx, centerX, countY) {
    const remaining = Math.max(0, (this.total || 0) - (this.kills || 0));
    const line2 = `${this.kills || 0} • ${remaining} left`;
    ctx.font = '16px Arial';
    ctx.lineWidth = 3;
    ctx.strokeText(line2, centerX, countY);
    ctx.fillText(line2, centerX, countY);
  }
}
