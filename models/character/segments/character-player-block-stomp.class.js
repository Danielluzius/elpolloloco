/**
 * Extends the CharacterPlayer class to add block and stomp functionality.
 */
class CharacterPlayerBlockStomp extends CharacterPlayer {
  /**
   * Updates the block state based on user input and conditions.
   */
  updateBlockState() {
    const now = Date.now();
    const kb = this.world?.keyboard;
    const wantsBlock = !!kb?.D;
    const canBlock =
      (this.blockSegments || 0) > 0 &&
      !this.isSpecialAttacking &&
      !this.isAttacking &&
      !this.isHurt();

    if (this.shouldStartBlock(wantsBlock, canBlock)) {
      this.startBlock(now);
    }

    if (this.isBlocking) {
      this.handleBlockEnd(now, wantsBlock);
    }
  }

  /**
   * Determines if the block should start.
   * @param {boolean} wantsBlock - Whether the user wants to block.
   * @param {boolean} canBlock - Whether blocking is allowed.
   * @returns {boolean} True if the block should start, otherwise false.
   */
  shouldStartBlock(wantsBlock, canBlock) {
    return !this.isBlocking && wantsBlock && canBlock;
  }

  /**
   * Starts the block state.
   * @param {number} now - The current timestamp.
   */
  startBlock(now) {
    this.isBlocking = true;
    this.blockEndAt = now + this.BLOCK_DURATION_MS;
    this.blockFrameIndex = 0;
    this.lastBlockFrameTime = now;
    this.markActivity();
  }

  /**
   * Handles the end of the block state.
   * @param {number} now - The current timestamp.
   * @param {boolean} wantsBlock - Whether the user wants to continue blocking.
   */
  handleBlockEnd(now, wantsBlock) {
    if (now >= this.blockEndAt) {
      this.blockSegments = Math.max(0, (this.blockSegments || 0) - 1);
      this.blockEndAt =
        this.blockSegments > 0 ? now + this.BLOCK_DURATION_MS : now;
    }
    if (!wantsBlock || this.blockSegments <= 0) this.endBlock();
  }

  /**
   * Ends the block state.
   */
  endBlock() {
    this.isBlocking = false;
    this.blockFrameIndex = 0;
  }

  /**
   * Sets the current block frame based on the animation timing.
   * @param {number} now - The current timestamp.
   */
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

  /**
   * Handles the stomp state during gameplay.
   * @param {number} now - The current timestamp.
   */
  handleStomp(now) {
    if (!this.isStomping) return;
    if (!this.stompStartedAt) this.stompStartedAt = now;
    this.updateStompFrame(now);
  }

  /**
   * Attempts to start the stomp state if conditions are met.
   * @param {number} now - The current timestamp.
   */
  tryStartStomp(now) {
    if (!this.canInitiateStomp()) return;
    if (!(this.world.keyboard.DOWN && this.isJumping)) return;
    this.isStomping = true;
    this.stompStartedAt = now;
    this.stompFrameIndex = 0;
    this.currentImage = 0;
  }

  /**
   * Checks if the stomp can be initiated.
   * @returns {boolean} True if the stomp can be initiated, otherwise false.
   */
  canInitiateStomp() {
    return (
      !this.isStomping && this.onPlatforms.length === 0 && !this.isBlocking
    );
  }

  /**
   * Updates the stomp animation frame based on the timing.
   * @param {number} now - The current timestamp.
   */
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

  /**
   * Ends the stomp state.
   */
  endStomp() {
    this.isStomping = false;
    this.stompFrameIndex = 0;
  }
}
