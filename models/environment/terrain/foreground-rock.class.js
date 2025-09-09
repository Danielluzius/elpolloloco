class ForegroundRock extends MoveableObject {
  constructor(x, y, width = 360, height = 280, options = {}) {
    super();
    // Use large barrier sprite (original foreground barrier likely rock_1.png)
    const path = options.path || 'assets/img/5_background/rocks/rock_1.png';
    this.loadImage(path);
    this.width = width;
    this.height = height;
    // Foreground rock positioned via explicit y (top coordinate)
    this.y = y;
    this.x = x;
    this.disableGravity = true;
    // Slightly generous collision (can be adjusted)
    this.offset = options.offset || { top: 10, right: 20, bottom: 0, left: 20 };
  }
}
