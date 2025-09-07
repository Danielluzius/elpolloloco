class CharacterBlockBar extends DrawableObject {
  // Full segments for block bar
  LEFT_FULL = 'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_left.png';
  MID_FULL = 'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_middle.png';
  RIGHT_FULL = 'assets/img/7_statusbars/1_statusbar/2_statusbar_block_character/blockbar_full_right.png';
  // Empty segments reuse healthbar empties
  LEFT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';
  MID_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';
  RIGHT_EMPTY = 'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  maxSegments = 5;
  segments = 5;
  // Default size; will align to character health bar dimensions when drawn
  width = 210;
  height = 20;
  x = 40;
  y = 60; // default below health bar

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

  setSegments(n) {
    const max = this.maxSegments || 5;
    this.segments = Math.max(0, Math.min(max, Math.floor(n)));
  }

  getSlotPath(i) {
    const max = this.maxSegments || 5;
    const isFull = this.segments > i; // fill left->right, empty right->left
    if (i === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (i === max - 1) return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

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
