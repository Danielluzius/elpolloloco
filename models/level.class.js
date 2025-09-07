class Level {
  enemies;
  clouds;
  backgroundObjects;
  rocks;
  level_end_x = 4400;

  constructor(enemies, clouds, backgroundObjects, rocks = []) {
    this.enemies = enemies;
    this.clouds = clouds;
    this.backgroundObjects = backgroundObjects;
    this.rocks = rocks;
  }
}
