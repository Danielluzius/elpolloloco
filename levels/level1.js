const level1 = new Level(
  [
    new Chicken(700, 0.25),
    new Chicken(900, 0.3),
    new Chicken(1100, 0.35),
    new Chicken(1300, 0.28),
    new Chicken(1500, 0.4),
    new Chicken(1700, 0.32),
    new Chicken(1900, 0.45),
    new Chicken(2100, 0.38),
    new Chicken(2300, 0.5),
    new Chicken(2500, 0.35),
    new Chicken(2700, 0.42),
    new Chicken(2900, 0.33),
    new Chicken(3100, 0.48),
    new Chicken(3300, 0.37),
    new Chicken(3500, 0.5),
    new Chicken(3700, 0.4),
    new Endboss(),
  ],
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
  generateCoins()
);

function generateCoins() {
  const coins = [];
  const count = 10;
  const seed = 1337;
  const rng = mulberry32(seed);
  const minX = 700;
  const maxX = 4200;
  const minGap = 260;
  const yTiers = [160, 240, 320];

  let attempts = 0;
  while (coins.length < count && attempts < 1000) {
    attempts++;
    const x = Math.floor(minX + rng() * (maxX - minX));
    const tier = yTiers[Math.floor(rng() * yTiers.length)];
    const y = tier + Math.floor((rng() - 0.5) * 30);

    if (coins.every((c) => Math.abs(c.x - x) >= minGap)) {
      coins.push(new Coin(x, y));
    }
  }
  return coins;
}

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
