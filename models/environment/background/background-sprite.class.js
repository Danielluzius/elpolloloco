// BackgroundSprite for both large tiling layers and single background props (e.g. background rocks)
// Options:
//   width/height: override intrinsic 720x480
//   parallaxFactor: override parallax
//   single: true -> do NOT tile (getTileStep() = 0)
//   useAbsoluteY: true -> y argument is the final top coordinate (no 480-height adjustment)
class BackgroundSprite extends BackgroundObject {
  constructor(imagePath, x, y, options = {}) {
    // Call parent with neutral y (0); we'll assign y after size decisions
    super(imagePath, x, 0);
    if (options.width) this.width = options.width;
    if (options.height) this.height = options.height;
    if (typeof options.parallaxFactor === 'number') this.parallaxFactor = options.parallaxFactor;
    this._single = !!options.single || this.width < 720; // auto mark small assets as single
    if (options.useAbsoluteY) {
      this.y = y; // treat provided y as final top
    } else {
      // Original BackgroundObject behavior: align bottom on (480 - height + y)
      this.y = 480 - this.height + y;
    }
  }
  getTileStep() {
    return this._single ? 0 : super.getTileStep();
  }
}
