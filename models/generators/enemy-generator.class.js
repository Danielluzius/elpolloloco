/**
 * Class responsible for generating goblin enemies in the game.
 */
class EnemyGenerator {
  /**
   * Creates an instance of EnemyGenerator.
   * @param {Randomizer} rng - The random number generator instance.
   * @param {Object} [settings={}] - Configuration settings for the generator.
   * @param {number} [settings.amount=18] - The number of goblins to generate.
   * @param {number} [settings.startX=700] - The starting x-coordinate for goblins.
   * @param {number} [settings.endX=4200] - The ending x-coordinate for goblins.
   */
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.amount = settings.amount ?? 18;
    this.startX = settings.startX ?? 700;
    this.endX = settings.endX ?? 4200;
    this.goblinTypes = [1, 2, 3];
    this._typeBag = [];
  }

  /**
   * Generates an array of goblin enemies based on the configuration.
   * @returns {Goblin[]} An array of generated goblin enemies.
   */
  generate() {
    const res = [];
    const step = this._calculateStep();

    for (let i = 0; i < this.amount; i++) {
      const x = this._calculateXCoordinate(i, step);
      const t = this.drawTypeFromBag();
      res.push(new Goblin(t, x));
    }

    return res;
  }

  /**
   * Calculates the step size for enemy placement.
   * @returns {number} The calculated step size.
   */
  _calculateStep() {
    return (this.endX - this.startX) / this.amount;
  }

  /**
   * Calculates the x-coordinate for a goblin.
   * @param {number} index - The index of the goblin.
   * @param {number} step - The step size for placement.
   * @returns {number} The calculated x-coordinate.
   */
  _calculateXCoordinate(index, step) {
    const mid = this.startX + step * index + step / 2;
    return Math.max(
      this.startX + 20,
      Math.min(this.endX - 20, mid + this.rng.int(-60, 60))
    );
  }

  /**
   * Draws a goblin type from the type bag, ensuring a shuffled distribution.
   * @returns {number} The type of goblin drawn.
   */
  drawTypeFromBag() {
    if (!this._typeBag || this._typeBag.length === 0) {
      this._typeBag = [...this.goblinTypes];
      for (let i = this._typeBag.length - 1; i > 0; i--) {
        const j = this.rng.int(0, i);
        [this._typeBag[i], this._typeBag[j]] = [
          this._typeBag[j],
          this._typeBag[i],
        ];
      }
    }

    return this._typeBag.pop();
  }
}
