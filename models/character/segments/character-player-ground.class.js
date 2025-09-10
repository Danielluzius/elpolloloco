class CharacterPlayerGround extends CharacterPlayer {
  setGroundedFrame(now) {
    if (this.world?._won) return; // keep last frame on win
    this.resetJumpStateIfNeeded();
    const moving = this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
    const inactive = now - this.lastActivityAt;
    if (moving && !this.isBlocking) return this.setWalkFrame();
    if (inactive >= this.LONG_IDLE_AFTER_MS) return this.setLongIdleFrame(now);
    if (inactive >= this.IDLE_AFTER_MS) return this.setIdleFrame(now);
    this.setDefaultStandFrame();
  }

  resetJumpStateIfNeeded() {
    if (!this.isJumping) return;
    this.currentImage = 0;
    this.jumpFrameIndex = 0;
    this.isJumping = false;
  }

  setDefaultStandFrame() {
    const img = this.imageCache[this.IDLE_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.IDLE_SHEET, 0);
      this.animKey = 'stand';
    }
    this.idleFrameIndex = 0;
    this.longIdleFrameIndex = 0;
  }

  setWalkFrame() {
    if (this.animKey !== 'walk') this.currentImage = 0;
    const img = this.imageCache[this.WALK_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.WALK_SHEET, img) || 1;
    const idx = this.currentImage % cnt;
    this.setSheetFrame(this.WALK_SHEET, idx);
    this.currentImage++;
    this.animKey = 'walk';
    this.idleFrameIndex = 0;
    this.longIdleFrameIndex = 0;
  }

  setLongIdleFrame(now) {
    this.ensureLongIdleState(now);
    this.advanceLongIdleFrame(now);
    const img = this.imageCache[this.LONG_IDLE_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, img) || 1;
    const idx = Math.min(this.longIdleFrameIndex, cnt - 1);
    this.setSheetFrame(this.LONG_IDLE_SHEET, idx);
    this.animKey = 'long_idle';
    this.idleFrameIndex = 0;
  }

  ensureLongIdleState(now) {
    if (this.animKey === 'long_idle') return;
    this.currentImage = 0;
    this.longIdleFrameIndex = 0;
    this.lastLongIdleFrameTime = now;
  }

  advanceLongIdleFrame(now) {
    if (now - this.lastLongIdleFrameTime < this.LONG_IDLE_FRAME_DELAY) return;
    const img = this.imageCache?.[this.LONG_IDLE_SHEET.path];
    const cnt = this.getSheetCount(this.LONG_IDLE_SHEET, img) || 1;
    this.longIdleFrameIndex = Math.min(cnt - 1, this.longIdleFrameIndex + 1);
    this.lastLongIdleFrameTime = now;
  }

  setIdleFrame(now) {
    this.ensureIdleState(now);
    this.advanceIdleFrame(now);
    const img = this.imageCache[this.IDLE_SHEET.path];
    this.img = img;
    const order = this.IDLE_FRAME_ORDER?.length ? this.IDLE_FRAME_ORDER : [0];
    const frame = order[this.idleFrameIndex % order.length];
    this.setSheetFrame(this.IDLE_SHEET, frame);
    this.animKey = 'idle';
    this.longIdleFrameIndex = 0;
  }

  ensureIdleState(now) {
    if (this.animKey === 'idle') return;
    this.currentImage = 0;
    this.idleFrameIndex = 0;
    this.lastIdleFrameTime = now;
  }

  advanceIdleFrame(now) {
    if (now - this.lastIdleFrameTime < this.IDLE_FRAME_DELAY) return;
    const order = this.IDLE_FRAME_ORDER?.length ? this.IDLE_FRAME_ORDER : [0];
    this.idleFrameIndex = (this.idleFrameIndex + 1) % order.length;
    this.lastIdleFrameTime = now;
  }
}
