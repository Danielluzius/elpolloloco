class BackgroundRockGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 8;
    this.startX = settings.startX ?? 600;
    this.endX = settings.endX ?? 4200;
    this.minGap = settings.minGap ?? 360;
    this.maxExtraGap = settings.maxExtraGap ?? 420;
    this.jitter = settings.jitter ?? 160;
    this.minScale = settings.minScale ?? 0.6;
    this.maxScale = settings.maxScale ?? 1.0;
    this.mirrorChance = settings.mirrorChance ?? 0.4;
    // yBase is treated as the baseline (bottom) Y where rocks sit on the ground
    this.yBase = settings.yBase ?? 160;
    // Allow only downward jitter (bury slightly), to avoid floating rocks when sizes vary
    this.yJitter = settings.yJitter ?? 16;
    this.parallaxFactor = settings.parallaxFactor ?? 0.9; // behind 1_layer (1.0)
  }

  generate() {
    const items = [];
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let x = this.startX + this.rng.int(100, 240);
    for (let i = 0; i < this.amount; i++) {
      const gap = this.minGap + this.rng.int(0, this.maxExtraGap);
      const px = clamp(
        x + this.rng.int(-this.jitter, this.jitter),
        this.startX + 40,
        this.endX - 40
      );
      const useThree = this.rng.next() < 0.5; // mix rock_2 / rock_3
      const path = useThree
        ? 'assets/img/5_background/rocks/rock_3.png'
        : 'assets/img/5_background/rocks/rock_2.png';
      const baseW = useThree ? 120 : 100;
      const baseH = useThree ? 90 : 75;
      const scale =
        this.minScale + (this.maxScale - this.minScale) * this.rng.next();
      const width = Math.round(baseW * scale);
      const height = Math.round(baseH * scale);
      // Anchor by bottom: compute y so bottom aligns to baseline, then optionally bury downwards a bit
      const bury = this.rng.int(0, this.yJitter);
      const py = this.yBase - height + bury;
      const sprite = new BackgroundSprite(path, px, py, {
        width,
        height,
        parallaxFactor: this.parallaxFactor,
        single: true, // prevent tiling
        useAbsoluteY: true, // py already computed as top coordinate (baseline logic handled here)
      });
      if (this.rng.next() < this.mirrorChance) sprite.otherDirection = true;
      items.push(sprite);
      x += gap;
      if (x > this.endX - 80) break;
    }
    return items;
  }
}
