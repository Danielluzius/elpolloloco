/**
 * Extends the CharacterPlayer class to handle death animations and states.
 */
class CharacterPlayerDeath extends CharacterPlayer {
  /**
   * Sets the frame for the dead state of the character.
   */
  setDeadFrame() {
    this.updateDeadFrameIndex();
    this.applyDeathSprite();
    this.speedY = 0;
    this.y = this.groundY;
  }

  /**
   * Updates the frame index for the death animation based on elapsed time.
   */
  updateDeadFrameIndex() {
    if (!this.deadStartedAt) this.deadStartedAt = Date.now();
    let idx = Math.floor(
      (Date.now() - this.deadStartedAt) / this.DEAD_FRAME_DELAY
    );
    const img = this.imageCache[this.DEAD_SHEET.path];
    const cnt =
      this.getSheetCount(this.DEAD_SHEET, img) || this.DEAD_SHEET.count || 1;
    if (idx >= cnt) {
      idx = cnt - 1;
      this.deathLastFrameLocked = true;
    }
    this._deadFrameIdx = idx;
  }

  /**
   * Applies the death sprite to the character based on the current frame index.
   */
  applyDeathSprite() {
    const img = this.imageCache[this.DEAD_SHEET.path];
    if (!img) return;
    const cnt = this.getSheetCount(this.DEAD_SHEET, img) || 1;
    const idx = Math.min(this._deadFrameIdx, cnt - 1);
    this.img = img;
    this.setSheetFrame(this.DEAD_SHEET, idx);
    this.animKey = 'dead';
  }
}
