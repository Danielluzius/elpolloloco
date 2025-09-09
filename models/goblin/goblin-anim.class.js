class GoblinAnim extends GoblinBase {
  animate() {
    setInterval(() => this.tick(), 50);
  }

  tick() {
    const now = Date.now();
    if (this.handleCharacterDead(now)) return;
    this.updateKnockback(now);
    if (this.handleDeath(now)) return;
    this.updateAggroAndChase(now);
    if (!this.aware && !this.isAttacking) this.updatePatrol(now);
    if (this.processHurt(now)) return;
    if (this.isAttacking) return this.animateAttack(now);
    this.updateMovementAnim(now);
  }

  handleCharacterDead(now) {
    const dead = this.world?.character?.isDead?.();
    if (!dead) return false;
    this.resetForPlayerDeath();
    if (now - this._lastFrameAt >= this.animDelay) this.advanceIdle(now);
    return true;
  }

  resetForPlayerDeath() {
    this.aware = false;
    this.isAttacking = false;
    this.hurtActive = false;
    this.knockbackVX = 0;
    this._moving = false;
    this.isPaused = true;
    this.pauseEndAt = Date.now() + 3_600_000;
  }

  advanceIdle(now) {
    const order = this.idleOrder?.length ? this.idleOrder : [0];
    this._idleIdx = (this._idleIdx + 1) % order.length;
    this.img = this.imageCache[this.idleSheet.path] || this.img;
    this.setSheetFrameAuto(this.idleSheet, order[this._idleIdx] ?? 0);
    this._lastFrameAt = now;
  }

  handleDeath(now) {
    if (!this.dying) return false;
    if (now - this.deathLastAt >= this.DEATH_DELAY) this.advanceDeathFrame(now);
    const img = this.imageCache[this.deathSheet.path];
    if (this._deathReady && img) {
      this.img = img;
      this.setSheetFrameAuto(this.deathSheet, this.deathFrameIdx);
    }
    return true;
  }

  advanceDeathFrame(now) {
    const maxIdx = (this.deathSheet?.count || 1) - 1;
    if (this.deathFrameIdx < maxIdx) this.deathFrameIdx++;
    this.deathLastAt = now;
  }

  processHurt(now) {
    if (!this.hurtActive) return false;
    if (now - this.hurtLastAt >= this.HURT_DELAY) this.advanceHurtFrame(now);
    const img = this.imageCache[this.hurtSheet.path];
    if (this._hurtReady && img) {
      this.img = img;
      this.setSheetFrameAuto(this.hurtSheet, this.hurtFrameIdx);
    }
    if (now >= Math.max(this.knockbackEndAt || 0, this.hurtEndAt || 0))
      this.hurtActive = false;
    return true;
  }

  advanceHurtFrame(now) {
    this.hurtFrameIdx = Math.min(
      (this.hurtFrameIdx || 0) + 1,
      (this.hurtSheet.count || 3) - 1
    );
    this.hurtLastAt = now;
  }

  updateMovementAnim(now) {
    if (this._moving && this.aware && this._runReady) return this.runAnim(now);
    if (this._moving) return this.walkAnim(now);
    if (now - this._lastFrameAt >= this.animDelay) this.advanceIdle(now);
  }

  runAnim(now) {
    if (now - this.runLastAt >= this.RUN_DELAY) {
      this.runFrameIdx = (this.runFrameIdx + 1) % (this.runSheet?.count || 1);
      this.runLastAt = now;
    }
    const img = this.imageCache[this.runSheet.path];
    if (img) {
      this.img = img;
      this.setSheetFrameAuto(this.runSheet, this.runFrameIdx);
    }
  }

  walkAnim(now) {
    if (now - this.walkLastAt >= this.WALK_DELAY) {
      this.walkFrameIdx =
        (this.walkFrameIdx + 1) % (this.walkSheet?.count || 1);
      this.walkLastAt = now;
    }
    const img = this.imageCache[this.walkSheet.path];
    if (img) {
      this.img = img;
      this.setSheetFrameAuto(this.walkSheet, this.walkFrameIdx);
    }
  }
}
