class Level {
  enemies;
  backgroundObjects;
  rocks;
  foregroundObjects;
  potions;
  blockPotions;
  level_end_x = 4400;

  constructor(
    enemies,
    backgroundObjects,
    rocks = [],
    foregroundObjects = [],
    potions = [],
    blockPotions = []
  ) {
    this.enemies = enemies;
    this.backgroundObjects = backgroundObjects;
    this.rocks = rocks;
    this.foregroundObjects = foregroundObjects;
    this.potions = potions;
    this.blockPotions = blockPotions;
  }
}
