/**
 * Represents the block bar HUD element for the character.
 * Extends the DrawableObject class.
 */
class CharacterBlockBar extends DrawableObject {
  /**
   * Path to the left segment image when full.
   * @type {string}
   */
  LEFT_FULL =
    'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_left.png';

  /**
   * Path to the middle segment image when full.
   * @type {string}
   */
  MID_FULL =
    'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_middle.png';

  /**
   * Path to the right segment image when full.
   * @type {string}
   */
  RIGHT_FULL =
    'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_right.png';

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
   * Maximum number of segments in the block bar.
   * @type {number}
   */
  maxSegments = 5;

  /**
   * Current number of active segments in the block bar.
   * @type {number}
   */
  segments = 5;

  /**
   * Width of the block bar.
   * @type {number}
   */
  width = 210;

  /**
   * Height of the block bar.
   * @type {number}
   */
  height = 20;

  /**
   * X position of the block bar.
   * @type {number}
   */
  x = 40;

  /**
   * Y position of the block bar.
   * @type {number}
   */
  y = 60;

  /**
   * Initializes a new instance of the CharacterBlockBar class.
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
   * Sets the number of active segments in the block bar.
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
   * Draws the block bar at the specified position on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The X position to draw the block bar.
   * @param {number} dy - The Y position to draw the block bar.
   */
  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
    for (let i = 0; i < count; i++) {
      const path = this.getSlotPath(i);
      const img = this.imageCache?.[path];
      if (!img || !(img.complete && img.naturalWidth > 0)) continue;
      const isLast = i === count - 1;
      const segW = isLast ? this.width - baseW * (count - 1) : baseW;
      const x = dx + i * baseW;
      ctx.drawImage(img, x, dy, segW, segH);
    }
  }
}
