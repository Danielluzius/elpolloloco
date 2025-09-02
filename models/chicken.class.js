class Chicken extends MoveableObject {
  height = 100;
  width = 120;
  y = 335;
  IMAGES_WALKING = [
    'assets/img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
    'assets/img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
    'assets/img/3_enemies_chicken/chicken_normal/1_walk/3_w.png',
  ];

  constructor(x, speed) {
    super();
    this.loadImage('assets/img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);
    this.offset = { top: 10, right: 15, bottom: 10, left: 15 };

    this.x = typeof x === 'number' ? x : 200 + Math.random() * 500;
    this.speed = typeof speed === 'number' ? speed : 0.15 + Math.random() * 0.5;

    this.animate();
  }

  animate() {
    setInterval(() => {
      if (!this.dead) {
        this.moveLeft();
      }
    }, 1000 / 60);

    setInterval(() => {
      if (!this.dead) {
        this.playAnimation(this.IMAGES_WALKING);
      }
    }, 200);
  }

  killByStomp() {
    this.dead = true;
    this.speed = 0;
    this.loadImage('assets/img/3_enemies_chicken/chicken_normal/2_dead/dead.png');
  }
}
