class CoinStatusBar extends StatusBar {
  IMAGES = [
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/0.png',
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/20.png',
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/40.png',
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/60.png',
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/80.png',
    'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/100.png',
  ];

  constructor() {
    super();
    // override images for coin bar
    this.IMAGES = [
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/0.png',
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/20.png',
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/40.png',
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/60.png',
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/80.png',
      'assets/img/7_statusbars/1_statusbar/1_statusbar_coin/green/100.png',
    ];
    this.loadImages(this.IMAGES);
    // HUD placement under health bar
    this.x = 40;
    this.y = 65;
    this.setPercentage(0);
  }
  // inherits setPercentage/resolveImageIndex/draw from StatusBar
}
