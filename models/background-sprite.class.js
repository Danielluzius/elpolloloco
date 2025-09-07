class BackgroundSprite extends DrawableObject {
  parallaxFactor = 0.9; // slightly behind 1_layer (1.0)
  driftSpeed = 0;
  constructor(imagePath, x, y, options = {}) {
    super();
    this.loadImage(imagePath);
    this.x = x;
    this.y = y;
    if (typeof options.parallaxFactor === 'number') this.parallaxFactor = options.parallaxFactor;
    if (typeof options.driftSpeed === 'number') this.driftSpeed = options.driftSpeed;
    if (typeof options.width === 'number') this.width = options.width;
    if (typeof options.height === 'number') this.height = options.height;
    if (options.otherDirection) this.otherDirection = true;
  }

  getParallaxFactor() {
    return this.parallaxFactor;
  }
  getDriftSpeed() {
    return this.driftSpeed;
  }
  // Returning 0 indicates to world that this is non-tiled
  getTileStep() {
    return 0;
  }
}
