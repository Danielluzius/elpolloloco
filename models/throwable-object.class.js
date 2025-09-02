class ThrowableObject extends MoveableObject {
  constructor(x, y) {
    super();
    this.loadImage('assets/img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png');
    this.IMAGES_ROTATE = [
      'assets/img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
      'assets/img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
      'assets/img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
      'assets/img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png',
    ];
    this.IMAGES_SPLASH = [
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
      'assets/img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png',
    ];
    this.loadImages(this.IMAGES_ROTATE);
    this.loadImages(this.IMAGES_SPLASH);
    this.x = x;
    this.y = y;
    this.height = 70;
    this.width = 60;
    this.throw();
  }

  throw() {
    this.speedY = 30;
    this.applyGravity();
    this.rotateInterval = setInterval(() => {
      this.x += 10;
      this.playAnimation(this.IMAGES_ROTATE);
      if (this.y > 1000) {
        clearInterval(this.rotateInterval);
      }
    }, 50);
  }

  splashAndRemove(world) {
    if (this.rotateInterval) clearInterval(this.rotateInterval);
    let idx = 0;
    const splashTimer = setInterval(() => {
      const path = this.IMAGES_SPLASH[Math.min(idx, this.IMAGES_SPLASH.length - 1)];
      this.img = this.imageCache[path];
      idx++;
      if (idx >= this.IMAGES_SPLASH.length) {
        clearInterval(splashTimer);
      }
    }, 50);
  }

  intersects(obj) {
    return this.isColliding(obj);
  }

  shouldDespawn(level) {
    return !(this.x < level.level_end_x + 500 && this.y < 1000 && this.y > -500);
  }

  onHitBoss(world, boss) {
    if (typeof this.splashAndRemove === 'function') this.splashAndRemove(world);
    world.damageBossIfNeeded(boss);
    this.hitted = true;
  }
}
