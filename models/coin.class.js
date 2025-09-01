class Coin extends MoveableObject {
  width = 120;
  height = 120;
  IMAGES = ['assets/img/8_coin/coin_1.png', 'assets/img/8_coin/coin_2.png'];

  constructor(x, y) {
    super();
    this.loadImage(this.IMAGES[0]);
    this.loadImages(this.IMAGES);
    this.x = x ?? 200 + Math.random() * 2000;
    this.y = y ?? 150 + Math.random() * 220;
    this.animate();
  }

  animate() {
    setInterval(() => {
      this.playAnimation(this.IMAGES);
    }, 200);
  }
}
