class BackgroundObject extends MoveableObject {
  width = 720;
  height = 480;
  parallaxFactor = 1;
  driftSpeed = 0;

  constructor(imagePath, x, y) {
    super();
    this.loadImage(imagePath);
    this.imagePath = imagePath;
    this.parallaxFactor = BackgroundObject.computeParallaxFactor(imagePath);
    this.driftSpeed = BackgroundObject.computeDriftSpeed(imagePath);
    this.x = x;
    this.y = 480 - this.height + y;
  }

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

  static computeDriftSpeed(path) {
    const p = String(path || '');
    if (p.includes('cloud_layer')) return -6;
    if (p.includes('bird_layer')) return 8;
    return 0;
  }

  static computeTileStep(path) {
    const p = String(path || '');
    if (p.includes('cloud_layer')) return 719;
    return 720;
  }

  getParallaxFactor() {
    return typeof this.parallaxFactor === 'number' ? this.parallaxFactor : 1.0;
  }

  getDriftSpeed() {
    return typeof this.driftSpeed === 'number' ? this.driftSpeed : 0;
  }

  getTileStep() {
    return BackgroundObject.computeTileStep(this.imagePath);
  }
}
