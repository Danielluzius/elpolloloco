/**
 * Extends the CharacterPlayer class to handle jumping and related actions.
 */
class CharacterPlayerJump extends CharacterPlayer {
  /**
   * Handles the jump key input and triggers appropriate actions.
   */
  handleJumpKey() {
    const grounded = !this.isAboveGround();
    const clear =
      grounded &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.knockbackActive &&
      !this.isBlocking;

    if ((this.world.keyboard.UP || this.world.keyboard.SPACE) && clear) {
      return this.startJump();
    }
    if (this.world.keyboard.S && clear) {
      return this.startSpecialAttack();
    }
    if (this.world.keyboard.A && clear) {
      return this.startAttack();
    }
  }

  /**
   * Starts the jump action for the character.
   */
  startJump() {
    const now = Date.now();
    this.isJumping = true;
    this.speedY = this.JUMP_INIT_VY;
    this.jumpVX = 0;
    this.jumpFrameIndex = 0;
    this.lastJumpFrameTime = now;
    this.animKey = 'jump';
    this.setJumpImage();
    this.playJumpSound();
    this.markActivity();
  }

  /**
   * Sets the jump image for the character.
   */
  setJumpImage() {
    const img = this.imageCache[this.JUMP_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.JUMP_SHEET, 0);
    }
  }

  /**
   * Plays the jump sound effect.
   */
  playJumpSound() {
    try {
      window.sound?.play('jump_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Updates the jump state, resetting it if the character is grounded.
   */
  updateJump() {
    if (this.isJumping && !this.isAboveGround()) {
      this.isJumping = false;
      this.jumpVX = 0;
    }
  }

  /**
   * Sets the current jump frame based on the animation timing.
   * @param {number} now - The current timestamp.
   */
  setJumpFrame(now) {
    const img = this.imageCache[this.JUMP_SHEET.path];
    const cnt = this.getSheetCount(this.JUMP_SHEET, img) || 1;
    if (
      this.jumpFrameIndex < cnt - 1 &&
      now - this.lastJumpFrameTime >= this.JUMP_FRAME_DELAY
    ) {
      this.jumpFrameIndex++;
      this.lastJumpFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.jumpFrameIndex, cnt - 1));
    this.animKey = 'jump';
  }
}
