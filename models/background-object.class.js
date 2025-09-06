class BackgroundObject extends MoveableObject {
  width = 720;
  height = 480;
  parallaxFactor = 1;
  driftSpeed = 0; // px per second, positive -> move to the right, negative -> left

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
    // Exact factors per design
    if (p.includes('1_layer')) return 1.0; // main_world
    if (p.includes('2_layer')) return 0.4; // bg_mid
    if (p.includes('cloud_layer')) return 0.4; // treat clouds as mid
    if (p.includes('3_layer')) return 0.1; // bg_far
    if (p.includes('bird_layer')) return 0.6; // optional: birds in between
    return 1.0;
  }

  static computeDriftSpeed(path) {
    const p = String(path || '');
    if (p.includes('cloud_layer')) return -6; // slow drift right->left
    if (p.includes('bird_layer')) return 8; // slow drift left->right
    return 0;
  }

  static computeTileStep(path) {
    const p = String(path || '');
    // Use a 1px overlap for cloud_layer to avoid visible seams
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
