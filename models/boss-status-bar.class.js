class BossStatusBar extends StatusBar {
  IMAGES = [
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange0.png',
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange20.png',
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange40.png',
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange60.png',
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange80.png',
    'assets/img/7_statusbars/2_statusbar_endboss/orange/orange100.png',
  ];

  constructor() {
    super();
    this.loadImages(this.IMAGES);
    this.width = 220;
    this.height = 60;
    // position will be set relative to boss in world.draw()
    this.setByStep(this.getMaxSteps());
  }
}
