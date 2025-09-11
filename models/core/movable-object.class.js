/**
 * Represents a moveable object in the game, extending the DrawableObject class.
 */
class MoveableObject extends DrawableObject {
  /** @type {number} The horizontal speed of the object. */
  speed = 0.15;

  /** @type {boolean} Indicates if the object is facing the opposite direction. */
  otherDirection = false;

  /** @type {number} The vertical speed of the object. */
  speedY = 0;

  /** @type {number} The acceleration applied to the object. */
  acceleration = 3;

  /** @type {number} The energy level of the object. */
  energy = 100;

  /** @type {number} The timestamp of the last hit. */
  lastHit = 0;

  /** @type {Object} The offset for collision detection. */
  offset = { top: 0, right: 0, bottom: 0, left: 0 };

  /**
   * Applies gravity to the object, updating its vertical position over time.
   */
  applyGravity() {
    setInterval(() => {
      if (typeof this.isDead === 'function' && this.isDead()) return;
      if (this.disableGravity) return;

      if (this.isAboveGround() || this.speedY > 0) {
        this.y -= this.speedY;
        this.speedY -= this.acceleration;

        const gy = typeof this.groundY === 'number' ? this.groundY : 120;

        if (this.y > gy) {
          this.y = gy;
          this.speedY = 0;
        }
      }
    }, 1000 / 25);
  }

  /**
   * Checks if the object is above the ground.
   * @returns {boolean} True if the object is above the ground, otherwise false.
   */
  isAboveGround() {
    const gy = typeof this.groundY === 'number' ? this.groundY : 120;
    return this.y < gy;
  }

  /**
   * Checks if the object is colliding with another moveable object.
   * @param {MoveableObject} mo - The other moveable object to check collision with.
   * @returns {boolean} True if the objects are colliding, otherwise false.
   */
  isColliding(mo) {
    const a = this.getBoundsWithOffset(this);
    const b = this.getBoundsWithOffset(mo);
    return this.aabbIntersect(a, b);
  }

  /**
   * Gets the bounding box of an object, including its offset.
   * @param {MoveableObject} obj - The object to get the bounds for.
   * @returns {Object} The bounding box with offset.
   */
  getBoundsWithOffset(obj) {
    const o = obj.offset || { top: 0, right: 0, bottom: 0, left: 0 };

    return {
      left: obj.x + o.left,
      right: obj.x + obj.width - o.right,
      top: obj.y + o.top,
      bottom: obj.y + obj.height - o.bottom,
    };
  }

  /**
   * Checks if two bounding boxes intersect.
   * @param {Object} a - The first bounding box.
   * @param {Object} b - The second bounding box.
   * @returns {boolean} True if the bounding boxes intersect, otherwise false.
   */
  aabbIntersect(a, b) {
    return (
      a.right > b.left &&
      a.bottom > b.top &&
      a.left < b.right &&
      a.top < b.bottom
    );
  }

  /**
   * Reduces the object's energy when hit and updates the last hit timestamp.
   */
  hit() {
    this.energy -= 20;

    if (this.energy < 0) {
      this.energy = 0;
    } else {
      this.lastHit = new Date().getTime();
    }
  }

  /**
   * Checks if the object is currently hurt.
   * @returns {boolean} True if the object is hurt, otherwise false.
   */
  isHurt() {
    let timepassed = new Date().getTime() - this.lastHit;
    timepassed /= 1000;
    return timepassed < 1.0;
  }

  /**
   * Checks if the object is dead.
   * @returns {boolean} True if the object is dead, otherwise false.
   */
  isDead() {
    return this.energy === 0;
  }

  /**
   * Plays an animation by cycling through a list of images.
   * @param {string[]} images - The list of image paths for the animation.
   */
  playAnimation(images) {
    const i = this.currentImage % images.length;
    const path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  /**
   * Moves the object to the right by its speed.
   */
  moveRight() {
    this.x += this.speed;
  }

  /**
   * Moves the object to the left by its speed.
   */
  moveLeft() {
    this.x -= this.speed;
  }

  /**
   * Makes the object jump by setting its vertical speed.
   */
  jump() {
    this.speedY = 30;
  }
}
