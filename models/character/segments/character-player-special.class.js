/**
 * Extends the CharacterPlayer class to handle special attack functionality.
 */
class CharacterPlayerSpecial extends CharacterPlayer {
  /**
   * Starts the special attack sequence if conditions are met.
   */
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
    this.playSpecialAttackSound();
    this.markActivity();
  }

  /**
   * Prepares the state for the special attack.
   * @param {number} now - The current timestamp.
   */
  prepareSpecialAttackState(now) {
    this.isSpecialAttacking = true;
    this.specialFrameIndex = 0;
    this.effectFrameIndex = 0;
    this.lastSpecialFrameTime = now;
    this.lastEffectFrameTime = now;
  }

  /**
   * Consumes all charge segments for the special attack.
   */
  consumeChargeSegments() {
    if (!this.world) return;
    this.world.character.chargeSegments = 0;
    this.world.characterChargeBar?.setSegments(0);
  }

  /**
   * Applies the initial image for the special attack.
   */
  applyInitialSpecialImage() {
    const img = this.imageCache[this.SPECIAL_SHEET.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrame(this.SPECIAL_SHEET, 0);
    this.animKey = 'special';
  }

  /**
   * Plays the sound effect for the special attack.
   */
  playSpecialAttackSound() {
    try {
      window.sound?.play('special_attack_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Updates the special attack state, including frames and wind push effects.
   */
  updateSpecialAttack() {
    if (!this.isSpecialAttacking) return;
    this.advanceSpecialFrames();
    this.applySpecialWindPush();
    this.finishSpecialIfDone();
  }

  /**
   * Advances the animation frames for the special attack and its effects.
   */
  advanceSpecialFrames() {
    const now = Date.now();
    this.advanceSpecialFrame(now);
    this.advanceEffectFrame(now);
  }

  /**
   * Advances the special attack animation frame.
   * @param {number} now - The current timestamp.
   */
  advanceSpecialFrame(now) {
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
  }

  /**
   * Advances the effect animation frame for the special attack.
   * @param {number} now - The current timestamp.
   */
  advanceEffectFrame(now) {
    const effCnt = this.SPECIAL_EFFECT_PATHS.length;
    if (
      now - this.lastEffectFrameTime >= this.EFFECT_FRAME_DELAY &&
      this.effectFrameIndex < effCnt - 1
    ) {
      this.effectFrameIndex++;
      this.lastEffectFrameTime = now;
    }
  }

  /**
   * Applies the wind push effect of the special attack to nearby enemies.
   */
  applySpecialWindPush() {
    const enemies = this.world?.level?.enemies;
    if (!enemies) return;
    const ctx = this.buildWindContext();
    enemies.forEach((e) => this.tryWindPushEnemy(e, ctx));
  }

  /**
   * Builds the context for the wind push effect.
   * @returns {Object} The wind context.
   */
  buildWindContext() {
    return {
      dir: this.otherDirection ? -1 : 1,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2,
      range: 90 + this.effectFrameIndex * 30,
    };
  }

  /**
   * Attempts to apply the wind push effect to an enemy.
   * @param {Object} enemy - The enemy to push.
   * @param {Object} ctx - The wind context.
   */
  tryWindPushEnemy(enemy, ctx) {
    if (!enemy || enemy.dead || enemy.dying) return;
    if (!this.enemyInWindCone(enemy, ctx)) return;
    const push = ctx.dir * this.WIND_PUSH_SPEED;
    if (typeof enemy.knockbackVX === 'number') {
      this.applyWindKnockback(enemy, push);
    } else {
      enemy.x += push;
    }
  }

  /**
   * Checks if an enemy is within the wind cone of the special attack.
   * @param {Object} enemy - The enemy to check.
   * @param {Object} ctx - The wind context.
   * @returns {boolean} True if the enemy is within the wind cone, otherwise false.
   */
  enemyInWindCone(enemy, ctx) {
    const ex = enemy.x + (enemy.width || 0) / 2;
    const dx = ex - ctx.centerX;
    const inFront =
      ctx.dir > 0 ? dx >= 0 && dx <= ctx.range : dx <= 0 && -dx <= ctx.range;
    if (!inFront) return false;
    const ey = enemy.y + (enemy.height || 0) / 2;
    return Math.abs(ey - ctx.centerY) <= 200;
  }

  /**
   * Applies a knockback effect to an enemy from the wind push.
   * @param {Object} enemy - The enemy to knock back.
   * @param {number} push - The knockback force.
   */
  applyWindKnockback(enemy, push) {
    enemy.knockbackVX = push;
    enemy.knockbackEndAt = Date.now() + 360;
  }

  /**
   * Finishes the special attack if all frames are completed.
   */
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

  /**
   * Sets the current frame for the special attack animation.
   * @param {number} now - The current timestamp.
   */
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

  /**
   * Draws the special attack effect frame on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
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
