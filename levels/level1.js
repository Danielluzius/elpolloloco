function createLevel1() {
  const rng = new Randomizer();
  const enemyGen = new EnemyGenerator(rng, { amount: 18, startX: 700, endX: 4200 });
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
  // Coins and bottles removed

  // Tile nature layers across the level in the order: 3_layer, cloud_layer, 2_layer, 1_layer, bird_layer
  const segW = 719; // BackgroundObject draws at width 720; we start with -719 like before for seamless wrap
  const xs = [-segW, 0, segW, segW * 2, segW * 3, segW * 4, segW * 5, segW * 6, segW * 7];
  const L3 = 'assets/img/5_background/nature/3_layer.png';
  const LCloud = 'assets/img/5_background/nature/cloud_layer.png';
  const L2 = 'assets/img/5_background/nature/2_layer.png';
  const L1 = 'assets/img/5_background/nature/1_layer.png';
  // Topmost overlay layer under nature
  const L0 = 'assets/img/5_background/nature/0_layer.png';
  const LBird = 'assets/img/5_background/nature/bird_layer.png';
  const bgL3 = [],
    bgCloud = [],
    bgL2 = [],
    bgL1 = [],
    bgBird = [],
    fgL0 = [];
  // Shift 0_layer half a tile (50%) to the left for visual alignment
  const L0_OFFSET = -Math.floor((BackgroundObject.computeTileStep?.(L0) || 720) * 0.5);
  xs.forEach((x) => {
    bgL3.push(new BackgroundObject(L3, x, 0));
    bgCloud.push(new BackgroundObject(LCloud, x, 0));
    bgL2.push(new BackgroundObject(L2, x, 0));
    bgL1.push(new BackgroundObject(L1, x, 0));
    bgBird.push(new BackgroundObject(LBird, x, 0));
    // 0_layer should be drawn above the character -> add to foreground list, shifted left by 50%
    fgL0.push(new BackgroundObject(L0, x + L0_OFFSET, 0));
  });
  // Insert background rocks behind 1_layer: parallax ~0.9 (slightly behind foreground)
  const bgRockGen = new BackgroundRockGenerator(rng, {
    startX: 700,
    endX: 4200,
    amount: 10,
    parallaxFactor: 0.9,
    // Baseline at lower 15% of 480px canvas -> 480 * 0.85 ≈ 408
    yBase: 408,
    yJitter: 20,
    minGap: 380,
    maxExtraGap: 420,
    jitter: 160,
    minScale: 1.05, // larger
    maxScale: 1.3,
    mirrorChance: 0.35,
  });
  const bgRocks = bgRockGen.generate();
  const bg = [...bgL3, ...bgCloud, ...bgL2, ...bgRocks, ...bgL1, ...bgBird];

  const rocks = rockGen.generate();
  // Example: foreground rock placed near the start. Adjust x, y, width, height as desired.
  const foreground = [
    new ForegroundRock(-200, 200, 360, 280), // Barriere am Anfang
    new ForegroundRock(4500, 200, 360, 280), // Barriere am Ende
    ...fgL0,
  ];
  // Vertical center of canvas (480px) for potions
  const canvasH = 480;
  const potionH = 36; // default
  const yCenter = Math.round(canvasH / 2 - potionH / 2);
  // Place 3 heart potions along the path (centered vertically)
  const potions = [
    new Potion(1100, { y: yCenter }),
    new Potion(2100, { y: yCenter }),
    new Potion(3200, { y: yCenter }),
  ];
  // Place 3 block potions along the path (centered vertically)
  const blockPotions = [
    new BlockPotion(1500, { y: yCenter }),
    new BlockPotion(2600, { y: yCenter }),
    new BlockPotion(3800, { y: yCenter }),
  ];
  return new Level([...enemyGen.generate(), new Endboss()], [], bg, rocks, foreground, potions, blockPotions);
}

// Optional: initial instance for backward compatibility
const level1 = createLevel1();
