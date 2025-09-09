class CharacterChargeBar extends DrawableObject {
  LEFT_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_left.png';
  MID_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_middle.png';
  RIGHT_FULL =
    'assets/img/7_statusbars/1_statusbar/3_statusbar_charge_character/chargebar_full_right.png';
  LEFT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_left.png';
  MID_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_middle.png';
  RIGHT_EMPTY =
    'assets/img/7_statusbars/1_statusbar/1_statusbar_health_character/healthbar_empty_right.png';

  maxSegments = 5;
  segments = 0;

  width = 210;
  height = 20;
  x = 40;
  y = 84;

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
    const isFull = this.segments > i;
    if (i === 0) return isFull ? this.LEFT_FULL : this.LEFT_EMPTY;
    if (i === max - 1) return isFull ? this.RIGHT_FULL : this.RIGHT_EMPTY;
    return isFull ? this.MID_FULL : this.MID_EMPTY;
  }

  drawAt(ctx, dx, dy) {
    const count = this.maxSegments || 5;
    const baseW = Math.floor(this.width / count);
    const segH = this.height;
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
}
