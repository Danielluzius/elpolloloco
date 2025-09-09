class CharacterPlayerSpecial extends CharacterPlayer {
  startSpecialAttack() {
    const maxSeg = this.world?.characterChargeBar?.maxSegments || 5;
    const cur = Math.max(
      0,
      Math.min(maxSeg, this.world?.character?.chargeSegments ?? 0)
    );
    if (cur < maxSeg) return;
    const now = Date.now();
    this.prepareSpecialAttackState(now);
    this.consumeChargeSegments();
    this.applyInitialSpecialImage();
    this.markActivity();
  }

  prepareSpecialAttackState(now) {
    this.isSpecialAttacking = true;
    this.specialFrameIndex = 0;
    this.effectFrameIndex = 0;
    this.lastSpecialFrameTime = now;
    this.lastEffectFrameTime = now;
  }

  consumeChargeSegments() {
    if (!this.world) return;
    this.world.character.chargeSegments = 0;
    this.world.characterChargeBar?.setSegments(0);
  }

  applyInitialSpecialImage() {
    const img = this.imageCache[this.SPECIAL_SHEET.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrame(this.SPECIAL_SHEET, 0);
    this.animKey = 'special';
  }

  updateSpecialAttack() {
    if (!this.isSpecialAttacking) return;
    this.advanceSpecialFrames();
    this.applySpecialWindPush();
    this.finishSpecialIfDone();
  }

  advanceSpecialFrames() {
    const now = Date.now();
    const specCnt =
      this.getSheetCount(
        this.SPECIAL_SHEET,
        this.imageCache[this.SPECIAL_SHEET.path]
      ) || 5;
    if (
      now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY &&
      this.specialFrameIndex < specCnt - 1
    ) {
      this.specialFrameIndex++;
      this.lastSpecialFrameTime = now;
    }
    const effCnt = this.SPECIAL_EFFECT_PATHS.length;
    if (
      now - this.lastEffectFrameTime >= this.EFFECT_FRAME_DELAY &&
      this.effectFrameIndex < effCnt - 1
    ) {
      this.effectFrameIndex++;
      this.lastEffectFrameTime = now;
    }
  }

  applySpecialWindPush() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;
    const ctx = this.buildWindContext();
    enemies.forEach((e) => this.tryWindPushEnemy(e, ctx));
  }

  buildWindContext() {
    return {
      dir: this.otherDirection ? -1 : 1,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2,
      range: 90 + this.effectFrameIndex * 30,
    };
  }

  tryWindPushEnemy(enemy, ctx) {
    if (!enemy || enemy.dead || enemy.dying) return;
    if (!this.enemyInWindCone(enemy, ctx)) return;
    const push = ctx.dir * this.WIND_PUSH_SPEED;
    if (typeof enemy.knockbackVX === 'number')
      this.applyWindKnockback(enemy, push);
    else enemy.x += push;
  }

  enemyInWindCone(enemy, ctx) {
    const ex = enemy.x + (enemy.width || 0) / 2;
    const dx = ex - ctx.centerX;
    const inFront =
      ctx.dir > 0 ? dx >= 0 && dx <= ctx.range : dx <= 0 && -dx <= ctx.range;
    if (!inFront) return false;
    const ey = enemy.y + (enemy.height || 0) / 2;
    return Math.abs(ey - ctx.centerY) <= 200;
  }

  applyWindKnockback(enemy, push) {
    enemy.knockbackVX = push;
    enemy.knockbackEndAt = Date.now() + 360;
  }

  finishSpecialIfDone() {
    const cnt =
      this.getSheetCount(
        this.SPECIAL_SHEET,
        this.imageCache[this.SPECIAL_SHEET.path]
      ) || 5;
    if (
      this.specialFrameIndex >= cnt - 1 &&
      this.effectFrameIndex >= this.SPECIAL_EFFECT_PATHS.length - 1
    ) {
      this.isSpecialAttacking = false;
      this.specialFrameIndex = 0;
      this.effectFrameIndex = 0;
    }
  }

  setSpecialFrame(now) {
    const img = this.imageCache[this.SPECIAL_SHEET.path];
    const cnt = this.getSheetCount(this.SPECIAL_SHEET, img) || 5;
    if (
      this.specialFrameIndex < cnt - 1 &&
      now - this.lastSpecialFrameTime >= this.SPECIAL_FRAME_DELAY
    ) {
      this.specialFrameIndex++;
      this.lastSpecialFrameTime = now;
    }
    this.img = img;
    this.setSheetFrame(
      this.SPECIAL_SHEET,
      Math.min(this.specialFrameIndex, cnt - 1)
    );
    this.animKey = 'special';
  }

  drawFrame(ctx) {
    if (!this.isSpecialAttacking) return;
    const idx = Math.max(
      0,
      Math.min(this.SPECIAL_EFFECT_PATHS.length - 1, this.effectFrameIndex)
    );
    const path = this.SPECIAL_EFFECT_PATHS[idx];
    const img = this.imageCache?.[path];
    if (!img) return;
    const cam = this.world?.camera_x || 0;
    const baseX = this.otherDirection ? 0 : Math.round(this.x + cam);
    const baseY = Math.round(this.y);
    const move = this.effectFrameIndex * this.EFFECT_MOVE_STEP;
    const dx = Math.round(
      baseX + (this.width - this.SPECIAL_EFFECT_W) / 2 + move
    );
    const dy = Math.round(
      baseY +
        this.height -
        this.SPECIAL_EFFECT_H +
        this.SPECIAL_EFFECT_FEET_OFFSET
    );
    ctx.drawImage(img, dx, dy, this.SPECIAL_EFFECT_W, this.SPECIAL_EFFECT_H);
  }
}
