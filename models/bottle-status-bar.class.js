class BottleStatusBar extends StatusBar {
  IMAGES = [
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/0.png',
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/20.png',
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/40.png',
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/60.png',
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/80.png',
    'assets/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/100.png',
  ];

  constructor() {
    super();
    this.loadImages(this.IMAGES);
    this.x = 40;
    this.y = 130;
    this.setPercentage(0);
  }
}
