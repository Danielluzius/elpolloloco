/**
 * Extends the CharacterPlayer class to add attack functionality.
 */
class CharacterPlayerAttack extends CharacterPlayer {
  /**
   * Starts the attack sequence if conditions are met.
   */
  startAttack() {
    const now = Date.now();
    if (now < (this.nextAttackAt || 0)) return;
    if (this.isSpecialAttacking || this.isBlocking || this.isHurt?.()) return;
    this.initAttackState(now);
    this.loadAttackSprite();
    this.animKey = 'attack';
    this.playAttackSound();
    this.markActivity();
  }

  /**
   * Initializes the attack state.
   * @param {number} now - The current timestamp.
   */
  initAttackState(now) {
    this.attackId = ++this._attackSeq;
    this.isAttacking = true;
    this.attackFrameIndex = 0;
    this.lastAttackFrameTime = now;
    const frames =
      this.getSheetCount(
        this.ATTACK_SHEET,
        this.imageCache[this.ATTACK_SHEET.path]
      ) || 3;
    this.attackEndAt = now + frames * this.ATTACK_FRAME_DELAY;
  }

  /**
   * Loads the attack sprite for the character.
   */
  loadAttackSprite() {
    const img = this.imageCache[this.ATTACK_SHEET.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrame(this.ATTACK_SHEET, 0);
  }

  /**
   * Plays the attack sound effect.
   */
  playAttackSound() {
    try {
      window.sound?.play('attack_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Updates the attack state, ending it if necessary.
   */
  updateAttack() {
    if (!this.isAttacking) return;
    const now = Date.now();
    if (now >= this.attackEndAt) {
      this.isAttacking = false;
      this.attackFrameIndex = 0;
      this.nextAttackAt = now + this.ATTACK_COOLDOWN_MS;
    }
  }

  /**
   * Sets the current attack frame based on the animation timing.
   * @param {number} now - The current timestamp.
   */
  setAttackFrame(now) {
    const img = this.imageCache[this.ATTACK_SHEET.path];
    const cnt = this.getSheetCount(this.ATTACK_SHEET, img) || 3;
    if (
      this.attackFrameIndex < cnt - 1 &&
      now - this.lastAttackFrameTime >= this.ATTACK_FRAME_DELAY
    ) {
      this.attackFrameIndex++;
      this.lastAttackFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(
      this.ATTACK_SHEET,
      Math.min(this.attackFrameIndex, cnt - 1)
    );
    this.animKey = 'attack';
  }

  /**
   * Checks if the attack is in its active window.
   * @returns {boolean} True if the attack is active, otherwise false.
   */
  isAttackActiveWindow() {
    return (
      this.isAttacking &&
      this.attackFrameIndex >= this.ATTACK_ACTIVE_START_FRAME
    );
  }

  /**
   * Gets the hitbox rectangle for the attack.
   * @returns {Object} The hitbox rectangle with left, right, top, and bottom properties.
   */
  getAttackHitboxRect() {
    const b = this.getBoundsWithOffset(this);
    const range = this.ATTACK_RANGE_X;
    return this.otherDirection
      ? { left: b.left - range, right: b.left, top: b.top, bottom: b.bottom }
      : { left: b.right, right: b.right + range, top: b.top, bottom: b.bottom };
  }
}
