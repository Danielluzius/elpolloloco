/**
 * Represents a background object in the game, supporting parallax and drift effects.
 */
class BackgroundObject extends MoveableObject {
  /** @type {number} The width of the background object. */
  width = 720;

  /** @type {number} The height of the background object. */
  height = 480;

  /** @type {number} The parallax factor for the background object. */
  parallaxFactor = 1;

  /** @type {number} The drift speed of the background object. */
  driftSpeed = 0;

  /**
   * Creates a new background object.
   * @param {string} imagePath - The path to the image of the background object.
   * @param {number} x - The x-coordinate of the background object.
   * @param {number} y - The y-coordinate offset of the background object.
   */
  constructor(imagePath, x, y) {
    super();
    this.loadImage(imagePath);
    this.imagePath = imagePath;
    this.parallaxFactor = BackgroundObject.computeParallaxFactor(imagePath);
    this.driftSpeed = BackgroundObject.computeDriftSpeed(imagePath);
    this.x = x;
    this.y = 480 - this.height + y;
  }

  /**
   * Computes the parallax factor based on the image path.
   * @param {string} path - The path to the image.
   * @returns {number} The parallax factor.
   */
  static computeParallaxFactor(path) {
    const p = String(path || '');
    if (p.includes('0_layer')) return 1.0;
    if (p.includes('1_layer')) return 1.0;
    if (p.includes('2_layer')) return 0.4;
    if (p.includes('cloud_layer')) return 0.4;
    if (p.includes('3_layer')) return 0.1;
    if (p.includes('bird_layer')) return 0.6;
    return 1.0;
  }

  /**
   * Computes the drift speed based on the image path.
   * @param {string} path - The path to the image.
   * @returns {number} The drift speed.
   */
  static computeDriftSpeed(path) {
    const p = String(path || '');
    if (p.includes('cloud_layer')) return -6;
    if (p.includes('bird_layer')) return 8;
    return 0;
  }

  /**
   * Computes the tile step size based on the image path.
   * @param {string} path - The path to the image.
   * @returns {number} The tile step size.
   */
  static computeTileStep(path) {
    const p = String(path || '');
    if (p.includes('cloud_layer')) return 719;
    return 720;
  }

  /**
   * Gets the parallax factor of the background object.
   * @returns {number} The parallax factor.
   */
  getParallaxFactor() {
    return typeof this.parallaxFactor === 'number' ? this.parallaxFactor : 1.0;
  }

  /**
   * Gets the drift speed of the background object.
   * @returns {number} The drift speed.
   */
  getDriftSpeed() {
    return typeof this.driftSpeed === 'number' ? this.driftSpeed : 0;
  }

  /**
   * Gets the tile step size of the background object.
   * @returns {number} The tile step size.
   */
  getTileStep() {
    return BackgroundObject.computeTileStep(this.imagePath);
  }
}
