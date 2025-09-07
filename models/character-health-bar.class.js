class CharacterHealthBar extends DrawableObject {
  // Paths for full/empty segments
  LEFT_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_left.png';
  MID_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_middle.png';
  RIGHT_FULL = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_full_right.png';
  LEFT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';
  MID_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';
  RIGHT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  segments = 3; // 0..3 (left, middle, right in that fill order)

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
    this.width = 210; // 3 equal segments, no gaps
    this.height = 40;
  }

  setSegments(n) {
    this.segments = Math.max(0, Math.min(3, Math.floor(n)));
  }

  // Determine which image to use for each slot
  getSlotPath(slotIndex) {
    // slotIndex: 0=left, 1=middle, 2=right
    const isFull = this.segments > slotIndex; // 3=>all, 2=>L+M, 1=>L
    if (slotIndex === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (slotIndex === 1) return isFull ? this.MID_FULL : this.MID_EMPTY;
    return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
  }

  // Override drawAt to render 3 adjacent segments with no gap
  drawAt(ctx, dx, dy) {
    const segW = Math.floor(this.width / 3);
    const segH = this.height;
    for (let i = 0; i < 3; i++) {
      const path = this.getSlotPath(i);
      const img = this.imageCache?.[path];
      if (!img) continue;
      const x = dx + i * segW;
      ctx.drawImage(img, x, dy, segW, segH);
    }
  }
}
