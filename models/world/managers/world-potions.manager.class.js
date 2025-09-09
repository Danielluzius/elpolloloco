class WorldPotionsManager {
  constructor(world) {
    this.w = world;
  }
  getPotionCount() {
    return this.w.potionHud.getCount?.() ?? this.w.potionHud.count ?? 0;
  }
  getBlockPotionCount() {
    return this.w.blockPotionHud.getCount?.() ?? this.w.blockPotionHud.count ?? 0;
  }
  pickupPotion(p) {
    if (this.getPotionCount() >= 3) return;
    const w = this.w;
    w.level.potions = w.level.potions.filter((o) => o !== p);
    w.potionHud.addPotion?.(p) ?? (w.potionHud.count = this.getPotionCount() + 1);
  }
  pickupBlockPotion(bp) {
    if (this.getBlockPotionCount() >= 3) return;
    const w = this.w;
    w.level.blockPotions = w.level.blockPotions.filter((o) => o !== bp);
    w.blockPotionHud.addPotion?.(bp) ?? (w.blockPotionHud.count = this.getBlockPotionCount() + 1);
  }
  usePotion() {
    const w = this.w;
    if (this.getPotionCount() <= 0) return false;
    const bar = w.characterHealthBar;
    const maxSeg = bar?.maxSegments || 5;
    const cur = w.character.healthSegments ?? bar?.segments ?? maxSeg;
    if (cur >= maxSeg) return false;
    const next = Math.min(maxSeg, cur + 1);
    w.character.healthSegments = next;
    w.character.healthSegments = Math.max(0, Math.min(maxSeg, next));
    bar.setSegments(next);
    w.potionHud.consume?.() ?? (w.potionHud.count = this.getPotionCount() - 1);
    return true;
  }
  useBlockPotion() {
    const w = this.w;
    if (this.getBlockPotionCount() <= 0) return false;
    const bar = w.characterBlockBar;
    const maxSeg = bar?.maxSegments || 5;
    const cur = w.character.blockSegments ?? bar?.segments ?? maxSeg;
    if (cur >= maxSeg) return false;
    const next = Math.min(maxSeg, cur + 1);
    w.character.blockSegments = next;
    bar.setSegments(next);
    w.blockPotionHud.consume?.() ?? (w.blockPotionHud.count = this.getBlockPotionCount() - 1);
    return true;
  }
}
