class Level {
  enemies;
  clouds;
  backgroundObjects;
  rocks;
  // Objects drawn above the character and enemies
  foregroundObjects;
  level_end_x = 4400;

  constructor(enemies, clouds, backgroundObjects, rocks = [], foregroundObjects = []) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.backgroundObjects = backgroundObjects;
    this.rocks = rocks;
    this.foregroundObjects = foregroundObjects;
  }
}
