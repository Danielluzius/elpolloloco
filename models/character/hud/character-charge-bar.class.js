/**
 * Represents the charge bar HUD element for the character.
 * Extends the DrawableObject class.
 */
class CharacterChargeBar extends DrawableObject {
  /**
   * Path to the left segment image when full.
   * @type {string}
   */
  LEFT_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_left.png';

  /**
   * Path to the middle segment image when full.
   * @type {string}
   */
  MID_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_middle.png';

  /**
   * Path to the right segment image when full.
   * @type {string}
   */
  RIGHT_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_right.png';

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
   * Maximum number of segments in the charge bar.
   * @type {number}
   */
  maxSegments = 5;

  /**
   * Current number of active segments in the charge bar.
   * @type {number}
   */
  segments = 0;

  /**
   * Width of the charge bar.
   * @type {number}
   */
  width = 210;

  /**
   * Height of the charge bar.
   * @type {number}
   */
  height = 20;

  /**
   * X position of the charge bar.
   * @type {number}
   */
  x = 40;

  /**
   * Y position of the charge bar.
   * @type {number}
   */
  y = 84;

  /**
   * Initializes a new instance of the CharacterChargeBar class.
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
  }

  /**
   * Sets the number of active segments in the charge bar.
   * @param {number} n - The number of segments to set.
   */
  setSegments(n) {
    const max = this.maxSegments || 5;
    this.segments = Math.max(0, Math.min(max, Math.floor(n)));
  }

  /**
   * Gets the image path for a specific segment slot.
   * @param {number} i - The index of the segment slot.
   * @returns {string} The image path for the segment slot.
   */
  getSlotPath(i) {
    const max = this.maxSegments || 5;
    const isFull = this.segments > i;
    if (i === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (i === max - 1) return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

  /**
   * Draws the empty segments of the charge bar.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the charge bar.
   * @param {number} dy - The Y position to draw the charge bar.
   * @param {number} count - The total number of segments.
   * @param {number} baseW - The base width of each segment.
   * @param {number} segH - The height of each segment.
   */
  drawEmptySegments(ctx, dx, dy, count, baseW, segH) {
    for (let i = 0; i < count; i++) {
      const emptyPath =
        i === 0
          ? this.LEFT_EMPTY
          : i === count - 1
          ? this.RIGHT_EMPTY
          : this.MID_EMPTY;
      const emptyImg = this.imageCache?.[emptyPath];
      if (!emptyImg) continue;
      const isLast = i === count - 1;
      const segW = isLast ? this.width - baseW * (count - 1) : baseW;
      const x = dx + i * baseW;
      ctx.drawImage(emptyImg, x, dy, segW, segH);
    }
  }

  /**
   * Draws the full segments of the charge bar.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the charge bar.
   * @param {number} dy - The Y position to draw the charge bar.
   * @param {number} count - The total number of segments.
   * @param {number} baseW - The base width of each segment.
   * @param {number} segH - The height of each segment.
   */
  drawFullSegments(ctx, dx, dy, count, baseW, segH) {
    const fullCount = Math.max(0, Math.min(count, this.segments || 0));
    for (let i = 0; i < fullCount; i++) {
      const fullPath =
        i === 0
          ? this.LEFT_FULL
          : i === count - 1
          ? this.RIGHT_FULL
          : this.MID_FULL;
      const fullImg = this.imageCache?.[fullPath];
      if (!fullImg) continue;
      const isLast = i === count - 1;
      const segW = isLast ? this.width - baseW * (count - 1) : baseW;
      const x = dx + i * baseW;
      ctx.drawImage(fullImg, x, dy, segW, segH);
    }
  }

  /**
   * Draws the charge bar at the specified position on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the charge bar.
   * @param {number} dy - The Y position to draw the charge bar.
   */
  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
    this.drawEmptySegments(ctx, dx, dy, count, baseW, segH);
    this.drawFullSegments(ctx, dx, dy, count, baseW, segH);
  }
}
