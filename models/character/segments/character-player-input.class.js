class CharacterPlayerInput extends CharacterPlayer {
  processInputTick() {
    if (this.isDead() || this.world?._won) return; // freeze on death or win
    if (this.introActive) return this.tickIntro();
    if (this.canProcessHorizontal()) this.handleHorizontalMove();
    this.updateAllStateTicks();
    if (!this.knockbackActive) this.handleJumpKey();
    this.markActivityOnAction();
  }

  tickIntro() {
    this.updateIntro();
    this.updateCamera();
  }

  canProcessHorizontal() {
    return (
      !this.knockbackActive &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.isBlocking
    );
  }

  updateAllStateTicks() {
    this.updateKnockback();
    this.updateJump();
    this.updateSpecialAttack();
    this.updateAttack();
    this.updateBlockState();
    this.updateCamera();
  }

  handleHorizontalMove() {
    if (this.world?._won) return; // no movement after win
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

  markActivityOnAction() {
    if (this.world?._won) return;
    const k = this.world.keyboard;
    if (k.S || k.A || k.UP || k.SPACE) this.markActivity();
  }
}
