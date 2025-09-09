class Rock extends MoveableObject {
  constructor(x, options = {}) {
    super();

    const defaultPath = 'assets/img/5_background/rocks/rock_5.png';
    const path = options.path || defaultPath;
    this.loadImage(path);

    const defaults = {
      'assets/img/5_background/rocks/rock_5.png': { w: 82, h: 60 },
      'assets/img/5_background/rocks/rock_4.png': { w: 96, h: 68 },
    };

    const d = defaults[path] || defaults[defaultPath];
    this.width = options.width ?? d.w;
    this.height = options.height ?? d.h;

    const groundBottom = 440;
    this.y = options.y ?? groundBottom - this.height;
    this.x = x;

    this.offset = options.offset ?? { top: 6, right: 6, bottom: 0, left: 6 };
    this.disableGravity = true;
  }
}
