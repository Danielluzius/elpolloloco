class Rock extends MoveableObject {
  constructor(x, options = {}) {
    super();
    // Visuals (support rock_4 and rock_5)
    const defaultPath = 'assets/img/5_background/rocks/rock_5.png';
    const path = options.path || defaultPath;
    this.loadImage(path);
    // Dimensions: compact obstacle with per-sprite sensible defaults
    const defaults = {
      'assets/img/5_background/rocks/rock_5.png': { w: 82, h: 60 },
      'assets/img/5_background/rocks/rock_4.png': { w: 96, h: 68 }, // a bit larger than rock_5
    };
    const d = defaults[path] || defaults[defaultPath];
    this.width = options.width ?? d.w;
    this.height = options.height ?? d.h;
    // Align bottom to ground line (~440px baseline used by character/goblins)
    const groundBottom = 440;
    this.y = options.y ?? groundBottom - this.height;
    this.x = x;
    // Tighter collision than sprite edges
    this.offset = options.offset ?? { top: 6, right: 6, bottom: 0, left: 6 };
    // Static: no gravity, no movement
    this.disableGravity = true;
  }
}
