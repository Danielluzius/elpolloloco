class ForegroundRock extends DrawableObject {
  /**
   * A freely placeable, resizable rock drawn in front of the character.
   * @param {number} x - world x position
   * @param {number} y - world y position
   * @param {number} width - draw width
   * @param {number} height - draw height
   */
  constructor(x = 0, y = 0, width = 300, height = 200) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.loadImage('assets/img/5_background/rocks/rock_1.png');
    // No collisions: purely visual overlay
  }

  // Optional helpers for dynamic adjustments
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
}
