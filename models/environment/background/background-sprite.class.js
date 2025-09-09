class BackgroundSprite extends BackgroundObject {
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

  getTileStep() {
    return this._single ? 0 : super.getTileStep();
  }
}
