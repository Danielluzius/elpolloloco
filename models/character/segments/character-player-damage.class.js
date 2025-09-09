// Damage & health segment
class CharacterPlayerDamage extends CharacterPlayer {
  isDead() {
    return (this.healthSegments != null && this.healthSegments <= 0) || super.isDead?.();
  }

  startDeath() {
    if (this.deadStartedAt) return;
    this.deadStartedAt = Date.now();
    this.isAttacking = false;
    this.isBlocking = false;
    this.isSpecialAttacking = false;
    this.knockbackActive = false;
  }
  applySegmentHit(amount = 1) {
    if (this.healthSegments == null) this.healthSegments = 5;
    if (this.healthSegments <= 0) return true;
    if (this.isBlocking) return false; // blocked
    this.healthSegments = Math.max(0, this.healthSegments - amount);
    if (this.healthSegments === 0) {
      this.startDeath();
      return true;
    }
    this.startHurt();
    return false;
  }
  hit(dmg) {
    if (this.isBlocking) return; // blocked fully (could add partial reduction)
    if (this.healthSegments == null) this.healthSegments = 5;
    if (this.healthSegments <= 0) return;
    this.healthSegments = Math.max(0, this.healthSegments - (dmg || 1));
    if (this.healthSegments === 0) {
      this.startDeath();
    } else {
      this.startHurt();
    }
  }

  heal(amount) {
    if (this.healthSegments == null) this.healthSegments = 5;
    if (this.healthSegments <= 0) return;
    const max = 5;
    this.healthSegments = Math.min(max, this.healthSegments + (amount || 1));
  }

  addBlockPotion(amount) {
    this.blockPotions = Math.min(1, (this.blockPotions || 0) + (amount || 1));
  }

  addHeartPotion(amount) {
    this.heartPotions = Math.min(1, (this.heartPotions || 0) + (amount || 1));
  }

  consumeBlockPotion() {
    if (!this.blockPotions) return false;
    this.blockPotions--;
    return true;
  }

  consumeHeartPotion() {
    if (!this.heartPotions) return false;
    this.heartPotions--;
    this.heal(this.HEART_POTION_HEAL || 1);
    return true;
  }
}
