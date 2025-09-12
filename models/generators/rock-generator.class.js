/**
 * A class for generating rocks in the game environment.
 */
class RockGenerator {
  /**
   * Creates an instance of RockGenerator.
   * @param {Randomizer} rng - The random number generator instance.
   * @param {Object} [settings={}] - Configuration settings for the generator.
   * @param {number} [settings.minAmount=7] - The minimum number of rocks to generate.
   * @param {number} [settings.maxAmount=12] - The maximum number of rocks to generate.
   * @param {number} [settings.amount] - The exact number of rocks to generate (overrides min and max).
   * @param {number} [settings.startX=1000] - The starting x-coordinate for rocks.
   * @param {number} [settings.endX=5900] - The ending x-coordinate for rocks.
   * @param {number} [settings.minGap=530] - The minimum gap between rocks.
   * @param {number} [settings.maxExtraGap=320] - The maximum additional gap between rocks.
   * @param {number} [settings.jitter=140] - The maximum x-coordinate jitter for rocks.
   * @param {number} [settings.minScale=0.6] - The minimum scale factor for rocks.
   * @param {number} [settings.maxScale=0.85] - The maximum scale factor for rocks.
   * @param {number} [settings.mirrorChance=0.5] - The chance of mirroring a rock.
   */
  constructor(rng, settings = {}) {
    this.rng = rng || new Randomizer();
    this.minAmount = settings.minAmount ?? 7;
    this.maxAmount = settings.maxAmount ?? 12;
    this.amount =
      settings.amount ?? this.rng.int(this.minAmount, this.maxAmount);
    this.startX = settings.startX ?? 1000;
    this.endX = settings.endX ?? 5900;
    this.minGap = settings.minGap ?? 530;
    this.maxExtraGap = settings.maxExtraGap ?? 320;
    this.jitter = settings.jitter ?? 140;
    this.minScale = settings.minScale ?? 0.6;
    this.maxScale = settings.maxScale ?? 0.85;
    this.mirrorChance = settings.mirrorChance ?? 0.5;
  }

  /**
   * Generates an array of rocks based on the configuration.
   * @returns {Rock[]} An array of generated rocks.
   */
  generate() {
    const rocks = [];
    let x = this._initializeStartX();
    for (let i = 0; i < this.amount; i++) {
      const gap = this._calculateGap();
      const rx = this._calculateRockX(x);
      const rock = this._createRock(rx);
      if (this.rng.next() < this.mirrorChance) rock.otherDirection = true;
      rocks.push(rock);
      x += gap;
      if (x > this.endX - 80) break;
    }
    return rocks;
  }

  /**
   * Initializes the starting x-coordinate for the rocks.
   * @returns {number} The starting x-coordinate.
   */
  _initializeStartX() {
    return this.startX + this.rng.int(80, 200);
  }

  /**
   * Calculates the gap between rocks.
   * @returns {number} The calculated gap.
   */
  _calculateGap() {
    return this.minGap + this.rng.int(0, this.maxExtraGap);
  }

  /**
   * Calculates the x-coordinate for a rock.
   * @param {number} x - The current x-coordinate.
   * @returns {number} The calculated x-coordinate for the rock.
   */
  _calculateRockX(x) {
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    return clamp(
      x + this.rng.int(-this.jitter, this.jitter),
      this.startX + 60,
      this.endX - 60
    );
  }

  /**
   * Creates a rock object with the given x-coordinate.
   * @param {number} rx - The x-coordinate for the rock.
   * @returns {Rock} The created rock object.
   */
  _createRock(rx) {
    const useRock4 = this.rng.next() < 0.4;
    const path = useRock4
      ? 'assets/img/5_background/rocks/rock_4.png'
      : 'assets/img/5_background/rocks/rock_5.png';
    const baseW = useRock4 ? 96 : 82;
    const baseH = useRock4 ? 68 : 60;
    const scale =
      this.minScale + (this.maxScale - this.minScale) * this.rng.next();
    const width = Math.max(42, Math.round(baseW * scale));
    const height = Math.max(30, Math.round(baseH * scale));
    return new Rock(rx, { width, height, path });
  }
}
