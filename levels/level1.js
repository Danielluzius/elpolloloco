/**
 * Creates the first level of the game.
 * Splits construction into small helpers to keep functions concise.
 * @returns {Level} The configured level instance.
 */
function createLevel1() {
  const rng = new Randomizer();
  const enemyGen = createEnemyGen(rng);
  const rockGen = createRockGen(rng);
  const { bg, fgL0 } = createBackgroundLayers(rng);
  const rocks = rockGen.generate();
  const foreground = createForeground(fgL0);
  const { potions, blockPotions } = createItems();
  return assembleLevel(enemyGen, bg, rocks, foreground, potions, blockPotions);
}

/**
 * Construct parallax backgrounds and ground tiles.
 * @param {Randomizer} rng Random source instance.
 * @returns {{bg: DrawableObject[], fgL0: BackgroundObject[]}}
 */
function createBackgroundLayers(rng) {
  const xs = computeSegmentXs(719);
  const { paths, arrs, L0_OFFSET } = initBackgroundLayers();
  populateBackgroundArrays(xs, paths, arrs, L0_OFFSET);
  const bgRocks = createBgRockGen(rng).generate();
  const bg = assembleBackground(bgRocks, arrs);
  return { bg, fgL0: arrs.fgL0 };
}

/**
 * Build enemy generator for level 1.
 * @param {Randomizer} rng Random source instance.
 * @returns {EnemyGenerator} Configured enemy generator.
 */
function createEnemyGen(rng) {
  return new EnemyGenerator(rng, {
    amount: 18,
    startX: 700,
    endX: 4200,
  });
}

/**
 * Build foreground rock generator for level 1.
 * @param {Randomizer} rng Random source instance.
 * @returns {RockGenerator} Configured rock generator.
 */
function createRockGen(rng) {
  return new RockGenerator(rng, {
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
}

/**
 * Compute background segment x positions for tiling.
 * @param {number} segW Segment width in pixels.
 * @returns {number[]} X coordinates to place tiles.
 */
function computeSegmentXs(segW) {
  const xs = [];
  for (let i = -1; i <= 7; i++) xs.push(i * segW);
  return xs;
}

/**
 * Get all background image paths used in the level.
 * @returns {{L3:string,LCloud:string,L2:string,L1:string,L0:string,LBird:string}}
 */
function getBackgroundPaths() {
  return {
    L3: 'assets/img/5_background/nature/3_layer.png',
    LCloud: 'assets/img/5_background/nature/cloud_layer.png',
    L2: 'assets/img/5_background/nature/2_layer.png',
    L1: 'assets/img/5_background/nature/1_layer.png',
    L0: 'assets/img/5_background/nature/0_layer.png',
    LBird: 'assets/img/5_background/nature/bird_layer.png',
  };
}

/**
 * Create empty arrays for background layers.
 * @returns {{bgL3:BackgroundObject[],bgCloud:BackgroundObject[],bgL2:BackgroundObject[],bgL1:BackgroundObject[],bgBird:BackgroundObject[],fgL0:BackgroundObject[]}}
 */
function createBackgroundArrays() {
  return {
    bgL3: [],
    bgCloud: [],
    bgL2: [],
    bgL1: [],
    bgBird: [],
    fgL0: [],
  };
}

/**
 * Compute horizontal offset for the foremost ground layer.
 * @param {string} imgPath Path to the L0 image tile.
 * @returns {number} Pixel offset to center the tiling.
 */
function computeL0Offset(imgPath) {
  const step = BackgroundObject.computeTileStep?.(imgPath) || 720;
  return -Math.floor(step * 0.5);
}

/**
 * Initialize background layers: paths, arrays, and offset.
 * @returns {{paths: ReturnType<typeof getBackgroundPaths>, arrs: ReturnType<typeof createBackgroundArrays>, L0_OFFSET:number}}
 */
function initBackgroundLayers() {
  const paths = getBackgroundPaths();
  const arrs = createBackgroundArrays();
  const L0_OFFSET = computeL0Offset(paths.L0);
  return { paths, arrs, L0_OFFSET };
}

/**
 * Populate background arrays with tiled objects.
 * @param {number[]} xs Tile x positions.
 * @param {{L3:string,LCloud:string,L2:string,L1:string,L0:string,LBird:string}} paths
 * @param {{bgL3:BackgroundObject[],bgCloud:BackgroundObject[],bgL2:BackgroundObject[],bgL1:BackgroundObject[],bgBird:BackgroundObject[],fgL0:BackgroundObject[]}} arrs
 * @param {number} L0_OFFSET Foreground ground offset.
 */
function populateBackgroundArrays(xs, paths, arrs, L0_OFFSET) {
  xs.forEach((x) => {
    arrs.bgL3.push(new BackgroundObject(paths.L3, x, 0));
    arrs.bgCloud.push(new BackgroundObject(paths.LCloud, x, 0));
    arrs.bgL2.push(new BackgroundObject(paths.L2, x, 0));
    arrs.bgL1.push(new BackgroundObject(paths.L1, x, 0));
    arrs.bgBird.push(new BackgroundObject(paths.LBird, x, 0));
    arrs.fgL0.push(new BackgroundObject(paths.L0, x + L0_OFFSET, 0));
  });
}

/**
 * Build parallax background rock generator.
 * @param {Randomizer} rng Random source instance.
 * @returns {BackgroundRockGenerator} Configured background rock generator.
 */
function createBgRockGen(rng) {
  return new BackgroundRockGenerator(rng, {
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
}

/**
 * Merge background layers and generated parallax rocks.
 * @param {DrawableObject[]} bgRocks Background rocks.
 * @param {{bgL3:BackgroundObject[],bgCloud:BackgroundObject[],bgL2:BackgroundObject[],bgL1:BackgroundObject[],bgBird:BackgroundObject[]}} arrs
 * @returns {DrawableObject[]} Flattened background drawables.
 */
function assembleBackground(bgRocks, arrs) {
  return [
    ...arrs.bgL3,
    ...arrs.bgCloud,
    ...arrs.bgL2,
    ...bgRocks,
    ...arrs.bgL1,
    ...arrs.bgBird,
  ];
}

/**
 * Assemble and return the Level instance.
 * @param {EnemyGenerator} enemyGen Enemy generator used for this level.
 * @param {DrawableObject[]} bg Background drawables.
 * @param {DrawableObject[]} rocks Foreground rocks.
 * @param {DrawableObject[]} foreground Foreground elements.
 * @param {Potion[]} potions Standard potions.
 * @param {BlockPotion[]} blockPotions Block potions.
 * @returns {Level} The fully configured level.
 */
function assembleLevel(enemyGen, bg, rocks, foreground, potions, blockPotions) {
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
 * Create foreground elements including blocking rocks.
 * @param {BackgroundObject[]} fgL0 Foreground ground tiles.
 * @returns {DrawableObject[]} Foreground elements.
 */
function createForeground(fgL0) {
  return [
    new ForegroundRock(-200, 200, 360, 280),
    new ForegroundRock(4500, 200, 360, 280),
    ...fgL0,
  ];
}

/**
 * Create consumable items and compute vertical placement.
 * @returns {{potions:Potion[], blockPotions:BlockPotion[]}} Items for the level.
 */
function createItems() {
  const canvasH = 480;
  const potionH = 36;
  const y = Math.round(canvasH / 2 - potionH / 2);
  const potions = [1100, 2100, 3200].map((x) => new Potion(x, { y }));
  const blockPotions = [1500, 2600, 3800].map((x) => new BlockPotion(x, { y }));
  return { potions, blockPotions };
}

/**
 * Initial instance of level 1 for backward compatibility.
 * @type {Level}
 */
const level1 = createLevel1();
