class Bottle extends MoveableObject {
  width = 80;
  height = 80;
  IMAGES = [
    'assets/img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
    'assets/img/6_salsa_bottle/2_salsa_bottle_on_ground.png',
  ];

  constructor(x, y) {
    super();
    this.loadImage(this.IMAGES[0]);
    this.loadImages(this.IMAGES);
    this.offset = { top: 18, right: 18, bottom: 18, left: 18 };
    this.x = typeof x === 'number' ? x : 200 + Math.random() * 2000;
    this.y = typeof y === 'number' ? y : 360;
    this.animate();
  }

  animate() {
    setInterval(() => {
      this.playAnimation(this.IMAGES);
    }, 300);
  }
}
