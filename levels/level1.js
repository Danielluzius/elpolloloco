/**
 * Creates the first level of the game.
 * @returns {Level} The configured level instance.
 */
function createLevel1() {
  const rng = new Randomizer();
  const enemyGen = new EnemyGenerator(rng, {
    amount: 18,
    startX: 700,
    endX: 4200,
  });
  const rockGen = new RockGenerator(rng, {
    startX: 900,
    endX: 4500,
    minAmount: 4,
    maxAmount: 7,
    minGap: 330,
    maxExtraGap: 320,
    jitter: 140,
    minScale: 0.7,
    maxScale: 0.9,
    mirrorChance: 0.5,
  });

  const segW = 719;
  const xs = [
    -segW,
    0,
    segW,
    segW * 2,
    segW * 3,
    segW * 4,
    segW * 5,
    segW * 6,
    segW * 7,
  ];
  const L3 = 'assets/img/5_background/nature/3_layer.png';
  const LCloud = 'assets/img/5_background/nature/cloud_layer.png';
  const L2 = 'assets/img/5_background/nature/2_layer.png';
  const L1 = 'assets/img/5_background/nature/1_layer.png';
  const L0 = 'assets/img/5_background/nature/0_layer.png';
  const LBird = 'assets/img/5_background/nature/bird_layer.png';
  const bgL3 = [],
    bgCloud = [],
    bgL2 = [],
    bgL1 = [],
    bgBird = [],
    fgL0 = [];
  const L0_OFFSET = -Math.floor(
    (BackgroundObject.computeTileStep?.(L0) || 720) * 0.5
  );
  xs.forEach((x) => {
    bgL3.push(new BackgroundObject(L3, x, 0));
    bgCloud.push(new BackgroundObject(LCloud, x, 0));
    bgL2.push(new BackgroundObject(L2, x, 0));
    bgL1.push(new BackgroundObject(L1, x, 0));
    bgBird.push(new BackgroundObject(LBird, x, 0));
    fgL0.push(new BackgroundObject(L0, x + L0_OFFSET, 0));
  });

  const bgRockGen = new BackgroundRockGenerator(rng, {
    startX: 700,
    endX: 4200,
    amount: 10,
    parallaxFactor: 0.9,
    yBase: 408,
    yJitter: 20,
    minGap: 380,
    maxExtraGap: 420,
    jitter: 160,
    minScale: 1.05,
    maxScale: 1.3,
    mirrorChance: 0.35,
  });
  const bgRocks = bgRockGen.generate();
  const bg = [...bgL3, ...bgCloud, ...bgL2, ...bgRocks, ...bgL1, ...bgBird];

  const rocks = rockGen.generate();
  const foreground = [
    new ForegroundRock(-200, 200, 360, 280),
    new ForegroundRock(4500, 200, 360, 280),
    ...fgL0,
  ];

  const canvasH = 480;
  const potionH = 36;
  const yCenter = Math.round(canvasH / 2 - potionH / 2);

  const potions = [
    new Potion(1100, { y: yCenter }),
    new Potion(2100, { y: yCenter }),
    new Potion(3200, { y: yCenter }),
  ];

  const blockPotions = [
    new BlockPotion(1500, { y: yCenter }),
    new BlockPotion(2600, { y: yCenter }),
    new BlockPotion(3800, { y: yCenter }),
  ];

  return new Level(
    [...enemyGen.generate(), new Endboss()],
    bg,
    rocks,
    foreground,
    potions,
    blockPotions
  );
}

/**
 * Initial instance of level 1 for backward compatibility.
 * @type {Level}
 */
const level1 = createLevel1();
