class CharacterHealthBar extends DrawableObject {
  // Paths for full/empty segments
  LEFT_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_left.png';
  MID_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_middle.png';
  RIGHT_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_right.png';
  LEFT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';
  MID_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';
  RIGHT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  // Config: 5 segments total (left cap + 3 middle + right cap)
  maxSegments = 5;
  segments = 5; // 0..5

  constructor() {
    super();
    // Preload all assets
    this.loadImages([
      this.LEFT_FULL,
      this.MID_FULL,
      this.RIGHT_FULL,
      this.LEFT_EMPTY,
      this.MID_EMPTY,
      this.RIGHT_EMPTY,
    ]);
    this.x = 40;
    // Position: move a bit further down from the top
    this.y = 35;
    // Size: keep width, reduce height (vertical squash)
    this.width = 210; // keep total width; 5 segments squeezed in
    this.height = 20;
  }

  setSegments(n) {
    const max = this.maxSegments || 5;
    this.segments = Math.max(0, Math.min(max, Math.floor(n)));
  }

  // Determine which image to use for each slot
  getSlotPath(slotIndex) {
    // 0 = left cap, max-1 = right cap, in-between = middle
    const max = this.maxSegments || 5;
    const isFull = this.segments > slotIndex; // fills from left to right; empties right to left
    if (slotIndex === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (slotIndex === max - 1) return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

  // Override drawAt to render 3 adjacent segments with no gap
  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
    // distribute remainder to last segment to avoid gaps
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
