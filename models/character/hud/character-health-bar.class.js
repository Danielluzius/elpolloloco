/**
 * Represents the health bar HUD element for the character.
 * Extends the DrawableObject class.
 */
class CharacterHealthBar extends DrawableObject {
  /**
   * Path to the left segment image when full.
   * @type {string}
   */
  LEFT_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_left.png';

  /**
   * Path to the middle segment image when full.
   * @type {string}
   */
  MID_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_middle.png';

  /**
   * Path to the right segment image when full.
   * @type {string}
   */
  RIGHT_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_right.png';

  /**
   * Path to the left segment image when empty.
   * @type {string}
   */
  LEFT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';

  /**
   * Path to the middle segment image when empty.
   * @type {string}
   */
  MID_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';

  /**
   * Path to the right segment image when empty.
   * @type {string}
   */
  RIGHT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  /**
   * Maximum number of segments in the health bar.
   * @type {number}
   */
  maxSegments = 5;

  /**
   * Current number of active segments in the health bar.
   * @type {number}
   */
  segments = 5;

  /**
   * Initializes a new instance of the CharacterHealthBar class.
   */
  constructor() {
    super();
    this.loadImages([
      this.LEFT_FULL,
      this.MID_FULL,
      this.RIGHT_FULL,
      this.LEFT_EMPTY,
      this.MID_EMPTY,
      this.RIGHT_EMPTY,
    ]);
    this.x = 40;
    this.y = 35;
    this.width = 210;
    this.height = 20;
  }

  /**
   * Sets the number of active segments in the health bar.
   * @param {number} n - The number of segments to set.
   */
  setSegments(n) {
    const max = this.maxSegments || 5;
    this.segments = Math.max(0, Math.min(max, Math.floor(n)));
  }

  /**
   * Gets the image path for a specific segment slot.
   * @param {number} slotIndex - The index of the segment slot.
   * @returns {string} The image path for the segment slot.
   */
  getSlotPath(slotIndex) {
    const max = this.maxSegments || 5;
    const isFull = this.segments > slotIndex;
    if (slotIndex === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (slotIndex === max - 1)
      return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

  /**
   * Draws the health bar at the specified position on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the health bar.
   * @param {number} dy - The Y position to draw the health bar.
   */
  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
    this.drawEmptySegments(ctx, dx, dy, count, baseW, segH);
    this.drawFullSegments(ctx, dx, dy, count, baseW, segH);
  }

  /**
   * Draws the empty segments of the health bar.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the health bar.
   * @param {number} dy - The Y position to draw the health bar.
   * @param {number} count - The total number of segments.
   * @param {number} baseW - The base width of each segment.
   * @param {number} segH - The height of each segment.
   */
  drawEmptySegments(ctx, dx, dy, count, baseW, segH) {
    for (let i = 0; i < count; i++) {
      const path = this.getSlotPath(i);
      const img = this.imageCache?.[path];
      if (!img) continue;
      const isLast = i === count - 1;
      const segW = isLast ? this.width - baseW * (count - 1) : baseW;
      const x = dx + i * baseW;
      ctx.drawImage(img, x, dy, segW, segH);
    }
  }

  /**
   * Draws the full segments of the health bar.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the health bar.
   * @param {number} dy - The Y position to draw the health bar.
   * @param {number} count - The total number of segments.
   * @param {number} baseW - The base width of each segment.
   * @param {number} segH - The height of each segment.
   */
  drawFullSegments(ctx, dx, dy, count, baseW, segH) {
    for (let i = 0; i < this.segments; i++) {
      const path = this.getSlotPath(i);
      const img = this.imageCache?.[path];
      if (!img) continue;
      const isLast = i === count - 1;
      const segW = isLast ? this.width - baseW * (count - 1) : baseW;
      const x = dx + i * baseW;
      ctx.drawImage(img, x, dy, segW, segH);
    }
  }
}
