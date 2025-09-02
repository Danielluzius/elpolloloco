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
    const aLeft = this.x + (this.offset?.left || 0);
    const aRight = this.x + this.width - (this.offset?.right || 0);
    const aTop = this.y + (this.offset?.top || 0);
    const aBottom = this.y + this.height - (this.offset?.bottom || 0);

    const bLeft = mo.x + (mo.offset?.left || 0);
    const bRight = mo.x + mo.width - (mo.offset?.right || 0);
    const bTop = mo.y + (mo.offset?.top || 0);
    const bBottom = mo.y + mo.height - (mo.offset?.bottom || 0);

    return aRight > bLeft && aBottom > bTop && aLeft < bRight && aTop < bBottom;
  }

  hit() {
    // Reduce in 20% steps so total hits until death match status bar frames (100,80,60,40,20,0)
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
