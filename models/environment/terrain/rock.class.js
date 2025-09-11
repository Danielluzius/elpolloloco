/**
 * Represents a rock in the game, extending the MoveableObject class.
 */
class Rock extends MoveableObject {
  /**
   * Creates a new rock.
   * @param {number} x - The x-coordinate of the rock.
   * @param {Object} [options={}] - Additional options for the rock.
   * @param {string} [options.path='assets/img/5_background/rocks/rock_5.png'] - The path to the rock image.
   * @param {number} [options.width] - The width of the rock.
   * @param {number} [options.height] - The height of the rock.
   * @param {number} [options.y] - The y-coordinate of the rock.
   * @param {Object} [options.offset={ top: 6, right: 6, bottom: 0, left: 6 }] - The collision offset for the rock.
   */
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
