/**
 * Extends the CharacterPlayer class to handle damage, healing, and potions.
 */
class CharacterPlayerDamage extends CharacterPlayer {
  /**
   * Checks if the character is dead.
   * @returns {boolean} True if the character is dead, otherwise false.
   */
  isDead() {
    return (
      (this.healthSegments != null && this.healthSegments <= 0) ||
      super.isDead?.()
    );
  }

  /**
   * Starts the death sequence for the character.
   */
  startDeath() {
    if (this.deadStartedAt) return;
    this.deadStartedAt = Date.now();
    this.isAttacking = false;
    this.isBlocking = false;
    this.isSpecialAttacking = false;
    this.knockbackActive = false;
    this.playDeathSound();
  }

  /**
   * Plays the death sound effect.
   */
  playDeathSound() {
    try {
      window.sound?.play('player_dead_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Applies damage to the character's health segments.
   * @param {number} [amount=1] - The amount of damage to apply.
   * @returns {boolean} True if the character is dead, otherwise false.
   */
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

  /**
   * Applies damage to the character.
   * @param {number} [dmg=1] - The amount of damage to apply.
   */
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

  /**
   * Heals the character by a specified amount.
   * @param {number} amount - The amount to heal.
   */
  heal(amount) {
    if (this.healthSegments == null) this.healthSegments = 5;
    if (this.healthSegments <= 0) return;
    const max = 5;
    this.healthSegments = Math.min(max, this.healthSegments + (amount || 1));
  }

  /**
   * Adds a block potion to the character's inventory.
   * @param {number} amount - The amount of block potions to add.
   */
  addBlockPotion(amount) {
    this.blockPotions = Math.min(1, (this.blockPotions || 0) + (amount || 1));
  }

  /**
   * Adds a heart potion to the character's inventory.
   * @param {number} amount - The amount of heart potions to add.
   */
  addHeartPotion(amount) {
    this.heartPotions = Math.min(1, (this.heartPotions || 0) + (amount || 1));
  }

  /**
   * Consumes a block potion from the character's inventory.
   * @returns {boolean} True if a block potion was consumed, otherwise false.
   */
  consumeBlockPotion() {
    if (!this.blockPotions) return false;
    this.blockPotions--;
    return true;
  }

  /**
   * Consumes a heart potion from the character's inventory and heals the character.
   * @returns {boolean} True if a heart potion was consumed, otherwise false.
   */
  consumeHeartPotion() {
    if (!this.heartPotions) return false;
    this.heartPotions--;
    this.heal(this.HEART_POTION_HEAL || 1);
    return true;
  }
}
