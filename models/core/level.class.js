/**
 * Represents a level in the game, containing enemies, objects, and boundaries.
 */
class Level {
  /** @type {Array} The enemies present in the level. */
  enemies;

  /** @type {Array} The background objects in the level. */
  backgroundObjects;

  /** @type {Array} The rocks present in the level. */
  rocks;

  /** @type {Array} The foreground objects in the level. */
  foregroundObjects;

  /** @type {Array} The potions available in the level. */
  potions;

  /** @type {Array} The block potions available in the level. */
  blockPotions;

  /** @type {number} The x-coordinate where the level ends. */
  level_end_x = 4400;

  /**
   * Creates a new level instance.
   * @param {Array} enemies - The enemies present in the level.
   * @param {Array} backgroundObjects - The background objects in the level.
   * @param {Array} [rocks=[]] - The rocks present in the level.
   * @param {Array} [foregroundObjects=[]] - The foreground objects in the level.
   * @param {Array} [potions=[]] - The potions available in the level.
   * @param {Array} [blockPotions=[]] - The block potions available in the level.
   */
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
