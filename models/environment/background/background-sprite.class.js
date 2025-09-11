/**
 * Represents a background sprite in the game, extending the BackgroundObject class.
 */
class BackgroundSprite extends BackgroundObject {
  /**
   * Creates a new background sprite.
   * @param {string} imagePath - The path to the image of the background sprite.
   * @param {number} x - The x-coordinate of the background sprite.
   * @param {number} y - The y-coordinate of the background sprite.
   * @param {Object} [options={}] - Additional options for the background sprite.
   * @param {number} [options.width] - The width of the background sprite.
   * @param {number} [options.height] - The height of the background sprite.
   * @param {number} [options.parallaxFactor] - The parallax factor for the background sprite.
   * @param {boolean} [options.single] - Whether the sprite is a single image.
   * @param {boolean} [options.useAbsoluteY] - Whether to use an absolute y-coordinate.
   */
  constructor(imagePath, x, y, options = {}) {
    super(imagePath, x, 0);

    if (options.width) this.width = options.width;
    if (options.height) this.height = options.height;
    if (typeof options.parallaxFactor === 'number')
      this.parallaxFactor = options.parallaxFactor;

    this._single = !!options.single || this.width < 720;

    if (options.useAbsoluteY) {
      this.y = y;
    } else {
      this.y = 480 - this.height + y;
    }
  }

  /**
   * Gets the tile step size for the background sprite.
   * @returns {number} The tile step size, or 0 if the sprite is a single image.
   */
  getTileStep() {
    return this._single ? 0 : super.getTileStep();
  }
}
