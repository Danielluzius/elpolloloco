class RockGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.minAmount = settings.minAmount ?? 7;
    this.maxAmount = settings.maxAmount ?? 12;
    this.amount =
      settings.amount ?? this.rng.int(this.minAmount, this.maxAmount);
    this.startX = settings.startX ?? 1000;
    this.endX = settings.endX ?? 5900;
    this.minGap = settings.minGap ?? 530; // base spacing (further apart)
    this.maxExtraGap = settings.maxExtraGap ?? 320; // add randomness to spacing
    this.jitter = settings.jitter ?? 140; // per-rock positional jitter
    this.minScale = settings.minScale ?? 0.6; // overall smaller
    this.maxScale = settings.maxScale ?? 0.85;
    this.mirrorChance = settings.mirrorChance ?? 0.5; // 50% mirrored
  }

  generate() {
    const rocks = [];
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    let x = this.startX + this.rng.int(80, 200);
    for (let i = 0; i < this.amount; i++) {
      const gap = this.minGap + this.rng.int(0, this.maxExtraGap);
      const rx = clamp(
        x + this.rng.int(-this.jitter, this.jitter),
        this.startX + 60,
        this.endX - 60
      );
      // Choose sprite and random size scale
      const useRock4 = this.rng.next() < 0.4; // 40% chance of slightly larger rock_4
      const path = useRock4
        ? 'assets/img/5_background/rocks/rock_4.png'
        : 'assets/img/5_background/rocks/rock_5.png';
      const baseW = useRock4 ? 96 : 82;
      const baseH = useRock4 ? 68 : 60;
      const scale =
        this.minScale + (this.maxScale - this.minScale) * this.rng.next();
      const width = Math.max(42, Math.round(baseW * scale));
      const height = Math.max(30, Math.round(baseH * scale));
      const rock = new Rock(rx, { width, height, path });
      // Random mirroring
      if (this.rng.next() < this.mirrorChance) rock.otherDirection = true;
      rocks.push(rock);
      x += gap;
      if (x > this.endX - 80) break;
    }
    return rocks;
  }
}
