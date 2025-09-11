class CharacterPlayerAttack extends CharacterPlayer {
  startAttack() {
    const now = Date.now();
    if (now < (this.nextAttackAt || 0)) return;
    if (this.isSpecialAttacking || this.isBlocking || this.isHurt?.()) return;
    this.initAttackState(now);
    this.loadAttackSprite();
    this.animKey = 'attack';
    try {
      window.sound?.play('attack_sound', { channel: 'sfx' });
    } catch (_) {}
    this.markActivity();
  }

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

  loadAttackSprite() {
    const img = this.imageCache[this.ATTACK_SHEET.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrame(this.ATTACK_SHEET, 0);
  }

  updateAttack() {
    if (!this.isAttacking) return;
    const now = Date.now();
    if (now >= this.attackEndAt) {
      this.isAttacking = false;
      this.attackFrameIndex = 0;
      this.nextAttackAt = now + this.ATTACK_COOLDOWN_MS;
    }
  }

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

  isAttackActiveWindow() {
    return (
      this.isAttacking &&
      this.attackFrameIndex >= this.ATTACK_ACTIVE_START_FRAME
    );
  }

  getAttackHitboxRect() {
    const b = this.getBoundsWithOffset(this);
    const range = this.ATTACK_RANGE_X;
    return this.otherDirection
      ? { left: b.left - range, right: b.left, top: b.top, bottom: b.bottom }
      : { left: b.right, right: b.right + range, top: b.top, bottom: b.bottom };
  }
}
