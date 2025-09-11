/**
 * Extends the CharacterPlayer class to handle player input and related actions.
 */
class CharacterPlayerInput extends CharacterPlayer {
  /**
   * Processes input ticks to handle character actions and state updates.
   */
  processInputTick() {
    if (this.isDead() || this.world?._won) return;
    if (this.introActive) return this.tickIntro();
    if (this.canProcessHorizontal()) this.handleHorizontalMove();
    this.updateAllStateTicks();
    if (!this.knockbackActive) this.handleJumpKey();
    this.markActivityOnAction();
  }

  /**
   * Handles the intro sequence ticks.
   */
  tickIntro() {
    this.updateIntro();
    this.updateCamera();
  }

  /**
   * Checks if horizontal movement can be processed.
   * @returns {boolean} True if horizontal movement can be processed, otherwise false.
   */
  canProcessHorizontal() {
    return (
      !this.knockbackActive &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.isBlocking
    );
  }

  /**
   * Updates all state-related ticks for the character.
   */
  updateAllStateTicks() {
    this.updateKnockback();
    this.updateJump();
    this.updateSpecialAttack();
    this.updateAttack();
    this.updateBlockState();
    this.updateCamera();
  }

  /**
   * Handles horizontal movement based on keyboard input.
   */
  handleHorizontalMove() {
    if (this.world?._won) return;
    if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
      this.moveRight();
      this.otherDirection = false;
      this.markActivity();
    }
    if (this.world.keyboard.LEFT && this.x > 0) {
      this.moveLeft();
      this.otherDirection = true;
      this.markActivity();
    }
  }

  /**
   * Updates the camera position based on the character's position.
   */
  updateCamera() {
    const w = this.world;
    if (!w) return;
    const intro = w.introActive || w.bossIntroActive;
    w.camera_x = intro
      ? typeof w.introCamX === 'number'
        ? w.introCamX
        : -this.x + 100
      : -this.x + 100;
  }

  /**
   * Marks the character as active if certain actions are performed.
   */
  markActivityOnAction() {
    if (this.world?._won) return;
    const k = this.world.keyboard;
    if (k.S || k.A || k.UP || k.SPACE) this.markActivity();
  }
}
