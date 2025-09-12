/**
 * Generates background rocks for the game, with configurable properties like spacing, scale, and parallax.
 */
class BackgroundRockGenerator {
  /**
   * Creates a new background rock generator.
   * @param {Object} rng - The randomizer instance to use for generating values.
   * @param {Object} [settings={}] - Configuration settings for the generator.
   * @param {number} [settings.amount=8] - The number of rocks to generate.
   * @param {number} [settings.startX=600] - The starting x-coordinate for the rocks.
   * @param {number} [settings.endX=4200] - The ending x-coordinate for the rocks.
   * @param {number} [settings.minGap=360] - The minimum gap between rocks.
   * @param {number} [settings.maxExtraGap=420] - The maximum additional gap between rocks.
   * @param {number} [settings.jitter=160] - The maximum horizontal jitter for rock placement.
   * @param {number} [settings.minScale=0.6] - The minimum scale factor for rocks.
   * @param {number} [settings.maxScale=1.0] - The maximum scale factor for rocks.
   * @param {number} [settings.mirrorChance=0.4] - The chance of mirroring a rock horizontally.
   * @param {number} [settings.yBase=160] - The base y-coordinate for rock placement.
   * @param {number} [settings.yJitter=16] - The vertical jitter for rock placement.
   * @param {number} [settings.parallaxFactor=0.9] - The parallax factor for the rocks.
   */
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
    this.yBase = settings.yBase ?? 160;
    this.yJitter = settings.yJitter ?? 16;
    this.parallaxFactor = settings.parallaxFactor ?? 0.9;
  }

  /**
   * Generates an array of background rock sprites based on the configuration.
   * @returns {BackgroundSprite[]} An array of generated background rock sprites.
   */
  generate() {
    const items = [];
    let x = this.startX + this.rng.int(100, 240);
    for (let i = 0; i < this.amount; i++) {
      const sprite = this._createRockSprite(x);
      if (!sprite) break;
      items.push(sprite);
      x += this._calculateGap();
    }
    return items;
  }

  /**
   * Creates a single rock sprite based on the current x-coordinate.
   * @param {number} x - The current x-coordinate for the rock.
   * @returns {BackgroundSprite|null} The created rock sprite or null if out of bounds.
   */
  _createRockSprite(x) {
    const px = this._computeRockX(x);
    const { useThree, path } = this._pickRockVariant();
    const { width, height } = this._calculateDimensions(useThree);
    const py = this._computeRockY(height);
    const sprite = this._makeSprite(path, px, py, width, height);
    this._maybeMirror(sprite);
    return px > this.endX - 80 ? null : sprite;
  }

  /**
   * Computes the horizontal position for a rock with jitter and clamping.
   * @param {number} x - Base x position.
   * @returns {number} Clamped x position.
   */
  _computeRockX(x) {
    const j = this.rng.int(-this.jitter, this.jitter);
    return this._clamp(x + j, this.startX + 40, this.endX - 40);
  }

  /**
   * Chooses rock variant and image path.
   * @returns {{useThree:boolean, path:string}}
   */
  _pickRockVariant() {
    const useThree = this.rng.next() < 0.5;
    const path = useThree
      ? 'assets/img/5_background/rocks/rock_3.png'
      : 'assets/img/5_background/rocks/rock_2.png';
    return { useThree, path };
  }

  /**
   * Computes the vertical position based on height and random bury.
   * @param {number} height - Sprite height.
   * @returns {number} Y coordinate for the rock.
   */
  _computeRockY(height) {
    const bury = this.rng.int(0, this.yJitter);
    return this.yBase - height + bury;
  }

  /**
   * Creates a configured BackgroundSprite instance.
   * @param {string} path - Image path.
   * @param {number} px - X position.
   * @param {number} py - Y position.
   * @param {number} width - Width of sprite.
   * @param {number} height - Height of sprite.
   * @returns {BackgroundSprite}
   */
  _makeSprite(path, px, py, width, height) {
    return new BackgroundSprite(path, px, py, {
      width,
      height,
      parallaxFactor: this.parallaxFactor,
      single: true,
      useAbsoluteY: true,
    });
  }

  /**
   * Randomly mirrors the sprite based on mirrorChance.
   * @param {BackgroundSprite} sprite - The sprite to potentially mirror.
   */
  _maybeMirror(sprite) {
    if (this.rng.next() < this.mirrorChance) sprite.otherDirection = true;
  }

  /**
   * Clamps a number into a range.
   * @param {number} v - Value to clamp.
   * @param {number} lo - Minimum value.
   * @param {number} hi - Maximum value.
   * @returns {number}
   */
  _clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /**
   * Calculates the gap between rocks.
   * @returns {number} The calculated gap.
   */
  _calculateGap() {
    return this.minGap + this.rng.int(0, this.maxExtraGap);
  }

  /**
   * Calculates the dimensions of a rock sprite.
   * @param {boolean} useThree - Whether to use the third rock type.
   * @returns {Object} The width and height of the rock.
   */
  _calculateDimensions(useThree) {
    const baseW = useThree ? 120 : 100;
    const baseH = useThree ? 90 : 75;
    const scale =
      this.minScale + (this.maxScale - this.minScale) * this.rng.next();
    return {
      width: Math.round(baseW * scale),
      height: Math.round(baseH * scale),
    };
  }
}
