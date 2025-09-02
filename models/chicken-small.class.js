class ChickenSmall extends MoveableObject {
  height = 60;
  width = 80;
  y = 375;
  IMAGES_WALKING = [
    'assets/img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
    'assets/img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
    'assets/img/3_enemies_chicken/chicken_small/1_walk/3_w.png',
  ];

  constructor(x, speed) {
    super();
    this.loadImage('assets/img/3_enemies_chicken/chicken_small/1_walk/1_w.png');
    this.loadImages(this.IMAGES_WALKING);
    this.offset = { top: 8, right: 12, bottom: 8, left: 12 };
    this.x = typeof x === 'number' ? x : 200 + Math.random() * 500;
    this.speed = typeof speed === 'number' ? speed : 0.25 + Math.random() * 0.35;
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
}
