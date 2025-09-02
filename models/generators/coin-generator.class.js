class CoinGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 10;
    this.startX = settings.startX ?? 700;
    this.endX = settings.endX ?? 4200;
    this.tiersY = Array.isArray(settings.tiersY) ? settings.tiersY : [160, 240, 320];
  }
  generate() {
    const res = [];
    const step = (this.endX - this.startX) / this.amount;
    for (let i = 0; i < this.amount; i++) {
      const mid = this.startX + step * i + step / 2;
      const x = Math.max(this.startX + 20, Math.min(this.endX - 20, mid + this.rng.int(-80, 80)));
      const idx = Math.floor(this.rng.next() * this.tiersY.length);
      const baseY = this.tiersY[idx];
      const y = baseY + this.rng.int(-15, 15);
      res.push(new Coin(x, y));
    }
    return res;
  }
}
