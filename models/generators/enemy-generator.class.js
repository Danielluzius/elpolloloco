class EnemyGenerator {
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 18;
    this.startX = settings.startX ?? 700;
    this.endX = settings.endX ?? 4200;
    // no small/normal split anymore; we spawn goblins (1..3)
    this.goblinTypes = [1, 2, 3];
    this._typeBag = [];
  }

  generate() {
    const res = [];
    const step = (this.endX - this.startX) / this.amount;
    for (let i = 0; i < this.amount; i++) {
      const mid = this.startX + step * i + step / 2;
      const x = Math.max(this.startX + 20, Math.min(this.endX - 20, mid + this.rng.int(-60, 60)));
      const t = this.drawTypeFromBag();
      res.push(new Goblin(t, x));
    }
    return res;
  }

  // Rotating bag to avoid same type repeating too often
  drawTypeFromBag() {
    if (!this._typeBag || this._typeBag.length === 0) {
      this._typeBag = [...this.goblinTypes];
      // simple Fisher-Yates shuffle
      for (let i = this._typeBag.length - 1; i > 0; i--) {
        const j = this.rng.int(0, i);
        [this._typeBag[i], this._typeBag[j]] = [this._typeBag[j], this._typeBag[i]];
      }
    }
    return this._typeBag.pop();
  }
}
