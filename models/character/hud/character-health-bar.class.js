class CharacterHealthBar extends DrawableObject {
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

  maxSegments = 5;
  segments = 5;

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

  setSegments(n) {
    const max = this.maxSegments || 5;
    this.segments = Math.max(0, Math.min(max, Math.floor(n)));
  }

  getSlotPath(slotIndex) {
    const max = this.maxSegments || 5;
    const isFull = this.segments > slotIndex;
    if (slotIndex === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (slotIndex === max - 1)
      return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
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
}
