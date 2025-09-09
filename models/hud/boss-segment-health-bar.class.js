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

  // 10 segments: left cap, 8 middles, right cap
  maxSegments = 10;
  segmentsFull = 10; // 10..0
  // Visual scale relative to the character bar segments (narrower and slightly shorter)
  scaleX = 0.4; // 40% of character segment width
  scaleY = 0.6; // 60% of character bar height
  // Optional IDs for reference/testing
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
    // Default size; will be aligned to character bar scale when updating from boss
    this.width = 700; // 10 x 70px segments by default
    this.height = 40; // same vertical scale as character bar
    this.x = 0;
    this.y = 0;
  }

  getMaxSteps() {
    return this.maxSegments;
  }

  setByStep(stepIndex) {
    const max = this.maxSegments;
    this.segmentsFull = Math.max(0, Math.min(max, Math.floor(stepIndex)));
  }

  updateFromBoss(boss) {
    if (!boss || boss.dead || !boss.awake) return false;
    // Match segment width/height to the character bar for consistent look
    try {
      const chBar = boss.world?.characterHealthBar;
      if (chBar) {
        const baseSegW = (chBar.width || 210) / 3;
        const segW = Math.max(5, Math.round(baseSegW * this.scaleX)); // narrower than character bar
        this.width = segW * this.maxSegments;
        this.height = Math.max(
          6,
          Math.round((chBar.height || 40) * this.scaleY)
        );
      }
    } catch (_) {}
    // Anchor directly above the boss (small gap)
    this.x = boss.x + boss.width / 2 - this.width / 2;
    this.y = boss.y - (this.height + 8);
    return true;
  }

  drawAt(ctx, dx, dy) {
    // Pixel-snapping ensured by world; double-snap here for safety
    const baseX = Math.round(dx);
    const baseY = Math.round(dy);
    const segW = Math.floor(this.width / this.maxSegments);
    const segH = this.height;
    for (let i = 0; i < this.maxSegments; i++) {
      const isFull = i < this.segmentsFull; // empties from right as segmentsFull decreases
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
