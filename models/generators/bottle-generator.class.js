class BottleGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 8;
    this.startX = settings.startX ?? 700;
    this.endX = settings.endX ?? 4200;
    this.fixedY = settings.fixedY ?? 360;
  }

  generate() {
    const res = [];
    const step = (this.endX - this.startX) / this.amount;
    for (let i = 0; i < this.amount; i++) {
      const mid = this.startX + step * i + step / 2;
      const x = Math.max(this.startX + 20, Math.min(this.endX - 20, mid + this.rng.int(-100, 100)));
      res.push(new Bottle(x, this.fixedY));
    }
    return res;
  }
}
