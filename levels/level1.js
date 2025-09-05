function createLevel1() {
  const rng = new Randomizer();
  const enemyGen = new EnemyGenerator(rng, { amount: 18, startX: 700, endX: 4200 });
  const coinGen = new CoinGenerator(rng, { amount: 20, startX: 700, endX: 4200, tiersY: [160, 240, 320] });
  const bottleGen = new BottleGenerator(rng, { amount: 10, startX: 700, endX: 4200, fixedY: 360 });

  // Tile nature layers across the level in the order: 3_layer, cloud_layer, 2_layer, 1_layer, bird_layer
  const segW = 719; // BackgroundObject draws at width 720; we start with -719 like before for seamless wrap
  const xs = [-segW, 0, segW, segW * 2, segW * 3, segW * 4, segW * 5, segW * 6, segW * 7];
  const L3 = 'assets/img/5_background/nature/3_layer.png';
  const LCloud = 'assets/img/5_background/nature/cloud_layer.png';
  const L2 = 'assets/img/5_background/nature/2_layer.png';
  const L1 = 'assets/img/5_background/nature/1_layer.png';
  const LBird = 'assets/img/5_background/nature/bird_layer.png';
  const bg = [];
  xs.forEach((x) => {
    bg.push(new BackgroundObject(L3, x, 0));
    bg.push(new BackgroundObject(LCloud, x, 0));
    bg.push(new BackgroundObject(L2, x, 0));
    bg.push(new BackgroundObject(L1, x, 0));
    bg.push(new BackgroundObject(LBird, x, 0));
  });

  return new Level(
    [...enemyGen.generate(), new Endboss()],
    [], // clouds handled by cloud_layer background
    bg,
    coinGen.generate(),
    bottleGen.generate()
  );
}

// Optional: initial instance for backward compatibility
const level1 = createLevel1();
