// Jump handling segment
class CharacterPlayerJump extends CharacterPlayer {
  handleJumpKey() {
    const grounded = !this.isAboveGround();
    const clear =
      grounded && !this.isSpecialAttacking && !this.isAttacking && !this.knockbackActive && !this.isBlocking;
    // Jump only on UP or SPACE (original mapping)
    if ((this.world.keyboard.UP || this.world.keyboard.SPACE) && clear) return this.startJump();
    if (this.world.keyboard.S && clear) return this.startSpecialAttack();
    if (this.world.keyboard.A && clear) return this.startAttack();
  }

  startJump() {
    const now = Date.now();
    this.isJumping = true;
    this.speedY = this.JUMP_INIT_VY;
    this.jumpVX = 0;
    this.jumpFrameIndex = 0;
    this.lastJumpFrameTime = now;
    this.animKey = 'jump';
    const img = this.imageCache[this.JUMP_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.JUMP_SHEET, 0);
    }
    this.markActivity();
  }

  updateJump() {
    if (this.isJumping && !this.isAboveGround()) {
      this.isJumping = false;
      this.jumpVX = 0;
    }
  }

  setJumpFrame(now) {
    const img = this.imageCache[this.JUMP_SHEET.path];
    const cnt = this.getSheetCount(this.JUMP_SHEET, img) || 1;
    if (this.jumpFrameIndex < cnt - 1 && now - this.lastJumpFrameTime >= this.JUMP_FRAME_DELAY) {
      this.jumpFrameIndex++;
      this.lastJumpFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(this.JUMP_SHEET, Math.min(this.jumpFrameIndex, cnt - 1));
    this.animKey = 'jump';
  }
}
