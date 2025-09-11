/**
 * Represents the health bar for a boss character.
 * @extends DrawableObject
 */
class BossSegmentHealthBar extends DrawableObject {
  LEFT_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_left.png';
  MID_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_middle.png';
  RIGHT_FULL =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_right.png';
  LEFT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';
  MID_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';
  RIGHT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  maxSegments = 10;
  segmentsFull = 10;
  scaleX = 0.4;
  scaleY = 0.6;
  segmentIds = [
    'boss_hp_left',
    'boss_hp_mid1',
    'boss_hp_mid2',
    'boss_hp_mid3',
    'boss_hp_mid4',
    'boss_hp_mid5',
    'boss_hp_mid6',
    'boss_hp_mid7',
    'boss_hp_mid8',
    'boss_hp_right',
  ];

  /**
   * Creates an instance of BossSegmentHealthBar.
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
    this.width = 700;
    this.height = 40;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Gets the maximum number of health bar segments.
   * @returns {number} The maximum number of segments.
   */
  getMaxSteps() {
    return this.maxSegments;
  }

  /**
   * Sets the health bar by the given step index.
   * @param {number} stepIndex - The step index to set.
   */
  setByStep(stepIndex) {
    const max = this.maxSegments;
    this.segmentsFull = Math.max(0, Math.min(max, Math.floor(stepIndex)));
  }

  /**
   * Updates the health bar position and size based on the boss.
   * @param {object} boss - The boss entity.
   * @returns {boolean} True if the update was successful, false otherwise.
   */
  updateFromBoss(boss) {
    if (!boss || boss.dead || !boss.awake) return false;
    try {
      const chBar = boss.world?.characterHealthBar;
      if (chBar) {
        const baseSegW = (chBar.width || 210) / 3;
        const segW = Math.max(5, Math.round(baseSegW * this.scaleX));
        this.width = segW * this.maxSegments;
        this.height = Math.max(
          6,
          Math.round((chBar.height || 40) * this.scaleY)
        );
      }
    } catch (_) {}
    this.x = boss.x + boss.width / 2 - this.width / 2;
    this.y = boss.y - (this.height + 8);
    return true;
  }

  /**
   * Draws the health bar at the specified position.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} dx - The x-coordinate to draw at.
   * @param {number} dy - The y-coordinate to draw at.
   */
  drawAt(ctx, dx, dy) {
    const baseX = Math.round(dx);
    const baseY = Math.round(dy);
    const segW = Math.floor(this.width / this.maxSegments);
    const segH = this.height;
    for (let i = 0; i < this.maxSegments; i++) {
      const isFull = i < this.segmentsFull;
      const isLeft = i === 0;
      const isRight = i === this.maxSegments - 1;
      const path = isLeft
        ? isFull
          ? this.LEFT_FULL
          : this.LEFT_EMPTY
        : isRight
        ? isFull
          ? this.RIGHT_FULL
          : this.RIGHT_EMPTY
        : isFull
        ? this.MID_FULL
        : this.MID_EMPTY;
      const img = this.imageCache?.[path];
      if (!img) continue;
      const x = baseX + i * segW;
      ctx.drawImage(img, x, baseY, segW, segH);
    }
  }
}
