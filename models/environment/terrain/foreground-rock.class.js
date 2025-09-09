class ForegroundRock extends MoveableObject {
  constructor(x, y, width = 360, height = 280, options = {}) {
    super();

    const path = options.path || 'assets/img/5_background/rocks/rock_1.png';
    this.loadImage(path);

    this.width = width;
    this.height = height;
    this.y = y;
    this.x = x;
    this.disableGravity = true;
    this.offset = options.offset || { top: 10, right: 20, bottom: 0, left: 20 };
  }
}
