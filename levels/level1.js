function createLevel1() {
  const rng = new Randomizer();
  const enemyGen = new EnemyGenerator(rng, { amount: 18, startX: 700, endX: 4200, smallChance: 0.45 });
  const coinGen = new CoinGenerator(rng, { amount: 20, startX: 700, endX: 4200, tiersY: [160, 240, 320] });
  const bottleGen = new BottleGenerator(rng, { amount: 10, startX: 700, endX: 4200, fixedY: 360 });

  return new Level(
    [...enemyGen.generate(), new Endboss()],
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

      new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 4, 0),
      new BackgroundObject('assets/img/5_background/layers/3_third_layer/1.png', 719 * 4, 0),
      new BackgroundObject('assets/img/5_background/layers/2_second_layer/1.png', 719 * 4, 0),
      new BackgroundObject('assets/img/5_background/layers/1_first_layer/1.png', 719 * 4, 0),
      new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 5, 0),
      new BackgroundObject('assets/img/5_background/layers/3_third_layer/2.png', 719 * 5, 0),
      new BackgroundObject('assets/img/5_background/layers/2_second_layer/2.png', 719 * 5, 0),
      new BackgroundObject('assets/img/5_background/layers/1_first_layer/2.png', 719 * 5, 0),
      new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 6, 0),
      new BackgroundObject('assets/img/5_background/layers/3_third_layer/1.png', 719 * 6, 0),
      new BackgroundObject('assets/img/5_background/layers/2_second_layer/1.png', 719 * 6, 0),
      new BackgroundObject('assets/img/5_background/layers/1_first_layer/1.png', 719 * 6, 0),
      new BackgroundObject('assets/img/5_background/layers/air.png', 719 * 7, 0),
      new BackgroundObject('assets/img/5_background/layers/3_third_layer/2.png', 719 * 7, 0),
      new BackgroundObject('assets/img/5_background/layers/2_second_layer/2.png', 719 * 7, 0),
      new BackgroundObject('assets/img/5_background/layers/1_first_layer/2.png', 719 * 7, 0),
    ],
    coinGen.generate(),
    bottleGen.generate()
  );
}

// Optional: initial instance for backward compatibility
const level1 = createLevel1();
