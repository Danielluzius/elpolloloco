/**
 * Represents a foreground rock in the game, extending the MoveableObject class.
 */
class ForegroundRock extends MoveableObject {
  /**
   * Creates a new foreground rock.
   * @param {number} x - The x-coordinate of the rock.
   * @param {number} y - The y-coordinate of the rock.
   * @param {number} [width=360] - The width of the rock.
   * @param {number} [height=280] - The height of the rock.
   * @param {Object} [options={}] - Additional options for the rock.
   * @param {string} [options.path='assets/img/5_background/rocks/rock_1.png'] - The path to the rock image.
   * @param {Object} [options.offset={ top: 10, right: 20, bottom: 0, left: 20 }] - The collision offset for the rock.
   */
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
