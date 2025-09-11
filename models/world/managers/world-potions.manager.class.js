/**
 * Manages potions in the game world.
 */
class WorldPotionsManager {
  /**
   * Creates a new WorldPotionsManager instance.
   * @param {object} world - The game world instance.
   */
  constructor(world) {
    this.w = world;
  }

  /**
   * Gets the current count of health potions.
   * @returns {number} The number of health potions.
   */
  getPotionCount() {
    return this.w.potionHud.getCount?.() ?? this.w.potionHud.count ?? 0;
  }

  /**
   * Gets the current count of block potions.
   * @returns {number} The number of block potions.
   */
  getBlockPotionCount() {
    return (
      this.w.blockPotionHud.getCount?.() ?? this.w.blockPotionHud.count ?? 0
    );
  }

  /**
   * Picks up a health potion and updates the HUD.
   * @param {object} p - The potion object to pick up.
   */
  pickupPotion(p) {
    if (this.getPotionCount() >= 3) return;
    const w = this.w;
    w.level.potions = w.level.potions.filter((o) => o !== p);
    this.addPotionToHud(p);
  }

  /**
   * Adds a health potion to the HUD.
   * @param {object} p - The potion object to add.
   */
  addPotionToHud(p) {
    const w = this.w;
    w.potionHud.addPotion?.(p) ??
      (w.potionHud.count = this.getPotionCount() + 1);
  }

  /**
   * Picks up a block potion and updates the HUD.
   * @param {object} bp - The block potion object to pick up.
   */
  pickupBlockPotion(bp) {
    if (this.getBlockPotionCount() >= 3) return;
    const w = this.w;
    w.level.blockPotions = w.level.blockPotions.filter((o) => o !== bp);
    this.addBlockPotionToHud(bp);
  }

  /**
   * Adds a block potion to the HUD.
   * @param {object} bp - The block potion object to add.
   */
  addBlockPotionToHud(bp) {
    const w = this.w;
    w.blockPotionHud.addPotion?.(bp) ??
      (w.blockPotionHud.count = this.getBlockPotionCount() + 1);
  }

  /**
   * Uses a health potion to restore health.
   * @returns {boolean} True if the potion was used, false otherwise.
   */
  usePotion() {
    const w = this.w;
    if (this.getPotionCount() <= 0) return false;
    const bar = w.characterHealthBar;
    const maxSeg = bar?.maxSegments || 5;
    const cur = w.character.healthSegments ?? bar?.segments ?? maxSeg;
    if (cur >= maxSeg) return false;
    this.updateHealthSegments(bar, cur, maxSeg);
    this.consumePotion();
    return true;
  }

  /**
   * Updates the health segments of the character.
   * @param {object} bar - The health bar object.
   * @param {number} cur - The current health segments.
   * @param {number} maxSeg - The maximum health segments.
   */
  updateHealthSegments(bar, cur, maxSeg) {
    const w = this.w;
    const next = Math.min(maxSeg, cur + 1);
    w.character.healthSegments = next;
    bar.setSegments(next);
  }

  /**
   * Consumes a health potion and updates the HUD.
   */
  consumePotion() {
    const w = this.w;
    w.potionHud.consume?.() ?? (w.potionHud.count = this.getPotionCount() - 1);
  }

  /**
   * Uses a block potion to restore block segments.
   * @returns {boolean} True if the potion was used, false otherwise.
   */
  useBlockPotion() {
    const w = this.w;
    if (this.getBlockPotionCount() <= 0) return false;
    const bar = w.characterBlockBar;
    const maxSeg = bar?.maxSegments || 5;
    const cur = w.character.blockSegments ?? bar?.segments ?? maxSeg;
    if (cur >= maxSeg) return false;
    this.updateBlockSegments(bar, cur, maxSeg);
    this.consumeBlockPotion();
    return true;
  }

  /**
   * Updates the block segments of the character.
   * @param {object} bar - The block bar object.
   * @param {number} cur - The current block segments.
   * @param {number} maxSeg - The maximum block segments.
   */
  updateBlockSegments(bar, cur, maxSeg) {
    const w = this.w;
    const next = Math.min(maxSeg, cur + 1);
    w.character.blockSegments = next;
    bar.setSegments(next);
  }

  /**
   * Consumes a block potion and updates the HUD.
   */
  consumeBlockPotion() {
    const w = this.w;
    w.blockPotionHud.consume?.() ??
      (w.blockPotionHud.count = this.getBlockPotionCount() - 1);
  }
}
