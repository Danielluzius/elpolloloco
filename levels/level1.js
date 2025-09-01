const level1 = new Level(
  [new Chicken(), new Chicken(), new Chicken(), new Endboss()],
  [new Cloud()],
  [
    new BackgroundObject('assets/img/5_background/layers/air.png', -719, 0),
    new BackgroundObject('assets/img/5_background/layers/3_third_layer/2.png', -719, 0),
    new BackgroundObject('assets/img/5_background/layers/2_second_layer/2.png', -719, 0),
    new BackgroundObject('assets/img/5_background/layers/1_first_layer/2.png', -719, 0),

    new BackgroundObject('assets/img/5_background/layers/air.png', 0, 0),
    new BackgroundObject('assets/img/5_background/layers/3_third_layer/1.png', 0, 0),
    new BackgroundObject('assets/img/5_background/layers/2_second_layer/1.png', 0, 0),
    new BackgroundObject('assets/img/5_background/layers/1_first_layer/1.png', 0, 0),
    new BackgroundObject('assets/img/5_background/layers/air.png', 719, 0),
    new BackgroundObject('assets/img/5_background/layers/3_third_layer/2.png', 719, 0),
    new BackgroundObject('assets/img/5_background/layers/2_second_layer/2.png', 719, 0),
    new BackgroundObject('assets/img/5_background/layers/1_first_layer/2.png', 719, 0),

    new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 2, 0),
    new BackgroundObject('assets/img/5_background/layers/3_third_layer/1.png', 719 * 2, 0),
    new BackgroundObject('assets/img/5_background/layers/2_second_layer/1.png', 719 * 2, 0),
    new BackgroundObject('assets/img/5_background/layers/1_first_layer/1.png', 719 * 2, 0),
    new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 3, 0),
    new BackgroundObject('assets/img/5_background/layers/3_third_layer/2.png', 719 * 3, 0),
    new BackgroundObject('assets/img/5_background/layers/2_second_layer/2.png', 719 * 3, 0),
    new BackgroundObject('assets/img/5_background/layers/1_first_layer/2.png', 719 * 3, 0),
  ],
  [
    new Coin(300, 320),
    new Coin(600, 310),
    new Coin(900, 300),
    new Coin(1200, 290),
    new Coin(1500, 280),
    new Coin(1800, 270),
    new Coin(2100, 260),
  ]
);
