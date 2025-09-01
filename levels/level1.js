const level1 = new Level(
  [...generateEnemies(), new Endboss()],
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
  generateCoins(),
  generateBottles()
);

function generateEnemies() {
  const result = [];
  const count = 18;
  const fromX = 700;
  const toX = 4200;
  const rng = mulberry32(4242);
  let attempts = 0;
  while (result.length < count && attempts < 3000) {
    attempts++;
    const x = Math.floor(fromX + rng() * (toX - fromX));
    const gap = 180 + Math.floor(rng() * 220);
    if (result.every((c) => Math.abs(c.x - x) >= gap)) {
      const t = (x - fromX) / (toX - fromX);
      const base = 0.22 + t * 0.18 + rng() * 0.18;
      const isSmall = rng() < 0.45;
      const speed = isSmall ? base + 0.08 : base;
      result.push(isSmall ? new ChickenSmall(x, speed) : new Chicken(x, speed));
    }
  }
  result.sort((a, b) => a.x - b.x);
  return result;
}
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

function generateBottles() {
  const bottles = [];
  const count = 8;
  const seed = 2025;
  const rng = mulberry32(seed);
  const minX = 700;
  const maxX = 4200;
  const minGap = 320;
  const y = 360;

  let attempts = 0;
  while (bottles.length < count && attempts < 1200) {
    attempts++;
    const x = Math.floor(minX + rng() * (maxX - minX));
    if (bottles.every((b) => Math.abs(b.x - x) >= minGap)) {
      bottles.push(new Bottle(x, y));
    }
  }
  return bottles;
}

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
