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
    this.setByStep(this.getMaxSteps());
  }

  updateFromBoss(boss) {
    if (!boss || boss.dead || !boss.awake) return false;
    this.x = boss.x + boss.width / 2 - this.width / 2;
    this.y = boss.y - 30;
    if (typeof boss.healthSteps === 'number') this.setByStep(boss.healthSteps);
    return true;
  }
}
