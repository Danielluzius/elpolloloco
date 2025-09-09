// Block and stomp segment
class CharacterPlayerBlockStomp extends CharacterPlayer {
  updateBlockState() {
    const now = Date.now();
    const kb = this.world?.keyboard;
    const wantsBlock = !!kb?.D; // only D triggers block (restore original mapping)
    const canBlock =
      (this.blockSegments || 0) > 0 &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.isHurt();
    if (!this.isBlocking && wantsBlock && canBlock) {
      this.isBlocking = true;
      this.blockEndAt = now + this.BLOCK_DURATION_MS;
      this.blockFrameIndex = 0;
      this.lastBlockFrameTime = now;
      this.markActivity();
    }
    if (this.isBlocking) {
      if (now >= this.blockEndAt) {
        this.blockSegments = Math.max(0, (this.blockSegments || 0) - 1);
        this.blockEndAt =
          this.blockSegments > 0 ? now + this.BLOCK_DURATION_MS : now;
      }
      if (!wantsBlock || this.blockSegments <= 0) this.endBlock();
    }
  }

  endBlock() {
    this.isBlocking = false;
    this.blockFrameIndex = 0;
  }

  setBlockFrame(now) {
    const img = this.imageCache[this.BLOCK_SHEET.path];
    const cnt = this.getSheetCount(this.BLOCK_SHEET, img) || 1;
    const holdIdx = Math.max(0, cnt - 1);
    if (
      cnt > 1 &&
      now - this.lastBlockFrameTime >= this.BLOCK_FRAME_DELAY &&
      this.blockFrameIndex < holdIdx
    ) {
      this.blockFrameIndex = Math.min(this.blockFrameIndex + 1, holdIdx);
      this.lastBlockFrameTime = now;
    }
    const idx = Math.min(Math.max(0, this.blockFrameIndex), holdIdx);
    if (img) {
      this.img = img;
      this.setSheetFrame(this.BLOCK_SHEET, idx);
      this.animKey = 'block';
    }
  }

  handleStomp(now) {
    if (!this.isStomping) return;
    if (!this.stompStartedAt) this.stompStartedAt = now;
    this.updateStompFrame(now);
  }

  tryStartStomp(now) {
    if (!this.canInitiateStomp()) return;
    if (!(this.world.keyboard.DOWN && this.isJumping)) return;
    this.isStomping = true;
    this.stompStartedAt = now;
    this.stompFrameIndex = 0;
    this.currentImage = 0;
  }

  canInitiateStomp() {
    return (
      !this.isStomping && this.onPlatforms.length === 0 && !this.isBlocking
    );
  }

  updateStompFrame(now) {
    if (now - this.stompLastFrameTime < this.STOMP_FRAME_DELAY) return;
    const img = this.imageCache[this.STOMP_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.STOMP_SHEET, img) || 1;
    const idx = Math.min(cnt - 1, this.stompFrameIndex);
    this.setSheetFrame(this.STOMP_SHEET, idx);
    this.animKey = 'stomp';
    this.stompFrameIndex = Math.min(cnt - 1, this.stompFrameIndex + 1);
    this.stompLastFrameTime = now;
  }

  endStomp() {
    this.isStomping = false;
    this.stompFrameIndex = 0;
  }
}
