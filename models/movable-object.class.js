class MoveableObject extends DrawableObject {
  speed = 0.15;
  otherDirection = false;
  speedY = 0;
  acceleration = 3;
  energy = 100;
  lastHit = 0;
  offset = { top: 0, right: 0, bottom: 0, left: 0 };

  applyGravity() {
    setInterval(() => {
      if (typeof this.isDead === 'function' && this.isDead()) return;
      if (this.disableGravity) return;
      if (this.isAboveGround() || this.speedY > 0) {
        this.y -= this.speedY;
        this.speedY -= this.acceleration;
      }
    }, 1000 / 25);
  }

  isAboveGround() {
    if (this instanceof ThrowableObject) {
      return true;
    } else {
      return this.y < 120;
    }
  }

  isColliding(mo) {
    const a = this.getBoundsWithOffset(this);
    const b = this.getBoundsWithOffset(mo);
    return this.aabbIntersect(a, b);
  }

  getBoundsWithOffset(obj) {
    const o = obj.offset || { top: 0, right: 0, bottom: 0, left: 0 };
    return {
      left: obj.x + o.left,
      right: obj.x + obj.width - o.right,
      top: obj.y + o.top,
      bottom: obj.y + obj.height - o.bottom,
    };
  }

  aabbIntersect(a, b) {
    return a.right > b.left && a.bottom > b.top && a.left < b.right && a.top < b.bottom;
  }

  hit() {
    this.energy -= 20;
    if (this.energy < 0) {
      this.energy = 0;
    } else {
      this.lastHit = new Date().getTime();
    }
  }

  isHurt() {
    let timepassed = new Date().getTime() - this.lastHit;
    timepassed = timepassed / 1000;
    return timepassed < 1.0;
  }

  isDead() {
    return this.energy == 0;
  }

  playAnimation(images) {
    let i = this.currentImage % images.length;
    let path = images[i];
    this.img = this.imageCache[path];
    this.currentImage++;
  }

  moveRight() {
    this.x += this.speed;
  }

  moveLeft() {
    this.x -= this.speed;
  }

  jump() {
    this.speedY = 30;
  }
}
