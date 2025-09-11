/**
 * Extends the CharacterPlayer class to handle hurt animations and knockback effects.
 */
class CharacterPlayerHurt extends CharacterPlayer {
  /**
   * Sets the frame for the hurt state of the character.
   */
  setHurtFrame() {
    const now = Date.now();
    this.initHurtAnimIfNeeded(now);
    const img = this.imageCache[this.HURT_SHEET.path];
    if (img) this.updateHurtAnimation(img, now);
    this.animKey = 'hurt';
  }

  /**
   * Initializes the hurt animation if it hasn't started yet.
   * @param {number} now - The current timestamp.
   */
  initHurtAnimIfNeeded(now) {
    if (this.animKey === 'hurt') return;
    this.hurtFrameIndex = 0;
    this.lastHurtFrameTime = now;
    this._hurtAnimStartAt = now;
  }

  /**
   * Updates the hurt animation frame based on elapsed time.
   * @param {HTMLImageElement} img - The image for the hurt animation.
   * @param {number} now - The current timestamp.
   */
  updateHurtAnimation(img, now) {
    const cnt = this.getSheetCount(this.HURT_SHEET, img) || 1;
    const start = this._hurtAnimStartAt || now;
    const end = this.hurtEndAt || start + this.HURT_FRAME_DELAY * cnt;
    const total = Math.max(1, end - start);
    const elapsed = Math.max(0, Math.min(total, now - start));
    const target = Math.min(cnt - 1, Math.floor((elapsed / total) * cnt));
    this.hurtFrameIndex = Math.max(this.hurtFrameIndex, target);
    this.img = img;
    this.setSheetFrame(this.HURT_SHEET, this.hurtFrameIndex);
  }

  /**
   * Updates the knockback effect on the character.
   */
  updateKnockback() {
    if (!this.knockbackActive) return;
    this.x += this.knockbackVX;
    this.knockbackVX *= 0.9;
    if (Date.now() >= this.knockbackEndAt) {
      this.knockbackActive = false;
      this.knockbackVX = 0;
    }
  }

  /**
   * Applies a knockback effect to the character from an enemy.
   * @param {Object} enemy - The enemy causing the knockback.
   */
  applyKnockbackFrom(enemy) {
    if (this.isSpecialAttacking) return;
    const now = Date.now();
    const dir = enemy?.x > this.x ? -1 : 1;
    this.knockbackActive = true;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = 0;
    this.hurtEndAt = this.knockbackEndAt;
  }

  /**
   * Checks if the character is currently in the hurt state.
   * @returns {boolean} True if the character is hurt, otherwise false.
   */
  isHurt() {
    if (this.hurtEndAt) return Date.now() < this.hurtEndAt;
    return super.isHurt();
  }
}
