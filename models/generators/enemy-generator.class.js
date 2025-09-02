class EnemyGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 18;
    this.startX = settings.startX ?? 700;
    this.endX = settings.endX ?? 4200;
    this.smallChance = settings.smallChance ?? 0.45;
  }

  generate() {
    const res = [];
    const step = (this.endX - this.startX) / this.amount;
    for (let i = 0; i < this.amount; i++) {
      const mid = this.startX + step * i + step / 2;
      const x = Math.max(this.startX + 20, Math.min(this.endX - 20, mid + this.rng.int(-60, 60)));
      const small = this.rng.chance(this.smallChance);
      const speed = small ? 0.3 + this.rng.next() * 0.2 : 0.2 + this.rng.next() * 0.2;
      res.push(small ? new ChickenSmall(x, speed) : new Chicken(x, speed));
    }
    return res;
  }
}
