class StatusBar extends DrawableObject {
  IMAGES = [
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/20.png',
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/40.png',
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
    'assets/img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png',
  ];

  percentage = 100;
  stepIndex = null; // optional: when controlling by steps

  constructor() {
    super();
    this.loadImages(this.IMAGES);
    this.x = 40;
    this.y = 0;
    this.width = 200;
    this.height = 60;

    this.setPercentage(100);
  }

  setPercentage(percentage) {
    this.percentage = percentage;
    let path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  resolveImageIndex() {
    const p = Math.max(0, Math.min(100, this.percentage));
    if (p >= 100) {
      return 5;
    } else if (p >= 80) {
      return 4;
    } else if (p >= 60) {
      return 3;
    } else if (p >= 40) {
      return 2;
    } else if (p >= 20) {
      return 1;
    } else {
      return 0;
    }
  }

  // New: control status bar by discrete step index instead of percentage
  // stepIndex: 0 .. maxSteps (where maxSteps = IMAGES.length - 1)
  setByStep(stepIndex) {
    const maxIdx = this.IMAGES.length - 1;
    const idx = Math.max(0, Math.min(maxIdx, stepIndex));
    this.stepIndex = idx;
    const path = this.IMAGES[idx];
    this.img = this.imageCache[path];
  }

  getMaxSteps() {
    return Math.max(0, this.IMAGES.length - 1);
  }
}
