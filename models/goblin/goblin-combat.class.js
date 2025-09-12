class GoblinCombat extends GoblinAnim {
  /**
   * Updates the knockback effect on the goblin.
   * @param {number} now - The current timestamp.
   */
  updateKnockback(now) {
    if (this.dying || this.dead) {
      this.knockbackVX = 0;
      return;
    }
    const active = !this.knockbackEndAt || now < this.knockbackEndAt;
    if (active && this.knockbackVX) {
      this.x += this.knockbackVX;
      this.knockbackVX *= 0.9;
    } else if (!active) this.knockbackVX = 0;
  }

  /**
   * Handles the goblin being hit by an attack.
   * @param {object} attacker - The attacking entity.
   */
  onHitByAttack(attacker) {
    if (this.dying || this.dead) return;
    const now = Date.now();
    if (now - (this.recentlyHitAt || 0) < 200) return;
    this.tryAwardCharge(attacker, now);
    this.recentlyHitAt = now;
    this.hitCount = (this.hitCount || 0) + 1;
    if (this.hitCount >= 3) return this.startDeath(now);
    this.enterHurtState(now, attacker);
  }

  /**
   * Awards charge to the attacker if applicable.
   * @param {object} attacker - The attacking entity.
   * @param {number} now - The current timestamp.
   */
  tryAwardCharge(attacker, now) {
    try {
      const id = attacker?.attackId ?? null;
      const key = id != null ? `_lastHitByAttack_${id}` : null;
      if (!key || !this[key]) {
        attacker?.world?.awardCharge?.(1);
        if (key) this[key] = now;
      }
    } catch (_) {}
  }

  /**
   * Puts the goblin into a hurt state.
   * @param {number} now - The current timestamp.
   * @param {object} attacker - The attacking entity.
   */
  enterHurtState(now, attacker) {
    this.hurtActive = true;
    this.hurtFrameIdx = 0;
    this.hurtLastAt = now;
    this.hurtEndAt = now + this.MIN_HURT_TIME;
    const dir = attacker?.x > this.x ? -1 : 1;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = this.KNOCKBACK_SPEED_Y;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
    try {
      window.sound?.play('goblin_hurt_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Initiates the death sequence for the goblin.
   * @param {number} [now=Date.now()] - The current timestamp.
   */
  startDeath(now = Date.now()) {
    this.dying = true;
    this.dead = true;
    this.hurtActive = false;
    this.knockbackVX = 0;
    this.speedY = 0;
    this.deathFrameIdx = 0;
    this.deathLastAt = now;
    const frames = this.deathSheet?.count || 5;
    this._despawnAt = now + frames * this.DEATH_DELAY + this.DEAD_LINGER_MS;
    if (!this._countedKill) this.countKill();
    try {
      window.sound?.play('goblin_dead_sound', { channel: 'sfx' });
    } catch (_) {}
  }

  /**
   * Increments the kill count for the goblin.
   */
  countKill() {
    try {
      this.world &&
        (this.world._goblinsKilled = Math.max(
          0,
          (this.world._goblinsKilled || 0) + 1
        ));
      this._countedKill = true;
    } catch (_) {}
  }

  /**
   * Determines if the goblin should despawn.
   * @returns {boolean} True if the goblin should despawn, false otherwise.
   */
  shouldDespawn() {
    return !!(this._despawnAt && Date.now() >= this._despawnAt);
  }

  /**
   * Begins the attack sequence for the goblin.
   * @param {number} now - The current timestamp.
   * @param {object} target - The target of the attack.
   */
  beginAttack(now, target) {
    this.isPaused = false;
    this.segmentTargetX = undefined;
    this.isAttacking = true;
    this.attackFrameIdx = 0;
    this.attackLastAt = now;
    this.attackWindupEndAt = now + this.ATTACK_WINDUP_MS;
    this.appliedAttackDamage = false;
    this._moving = false;
  }

  /**
   * Animates the attack sequence for the goblin.
   * @param {number} now - The current timestamp.
   */
  animateAttack(now) {
    const s = this.attackSheet;
    this._ensureAttackImageReady();
    if (now < this.attackWindupEndAt) return this.setSheetFrameAuto(s, 0);
    this._advanceAttackFrameIfDue(now);
    this._updateAttackSprite();
    this._maybeApplyAttackHit();
    this._maybeFinishAttack(now);
  }

  /**
   * Ensures the attack image is swapped in when ready.
   */
  _ensureAttackImageReady() {
    const s = this.attackSheet;
    const img = this.imageCache[s.path];
    if (this._attackReady && img) this.img = img;
  }

  /**
   * Advances the attack frame when the frame delay has elapsed.
   * @param {number} now - Current timestamp.
   */
  _advanceAttackFrameIfDue(now) {
    if (now - this.attackLastAt < this.ATTACK_FRAME_DELAY) return;
    const maxIdx = (this.attackSheet.count || 1) - 1;
    this.attackFrameIdx = Math.min(this.attackFrameIdx + 1, maxIdx);
    this.attackLastAt = now;
  }

  /**
   * Updates the displayed sprite frame for the current attack index.
   */
  _updateAttackSprite() {
    this.setSheetFrameAuto(this.attackSheet, this.attackFrameIdx);
  }

  /**
   * Applies attack damage once the hit frame is reached.
   */
  _maybeApplyAttackHit() {
    const s = this.attackSheet;
    const hitFrame = Math.floor((s.count || 1) / 2);
    if (this.appliedAttackDamage || this.attackFrameIdx < hitFrame) return;
    this.tryApplyAttackDamage();
    this.appliedAttackDamage = true;
  }

  /**
   * Finishes the attack when the last frame is reached.
   * @param {number} now - Current timestamp.
   */
  _maybeFinishAttack(now) {
    const lastIdx = (this.attackSheet.count || 1) - 1;
    if (this.attackFrameIdx >= lastIdx) this.finishAttack(now);
  }

  /**
   * Finishes the attack sequence for the goblin.
   * @param {number} now - The current timestamp.
   */
  finishAttack(now) {
    this.isAttacking = false;
    this.attackCooldownEndAt = now + 380;
    this.attackFrameIdx = 0;
  }

  /**
   * Attempts to apply attack damage to the target.
   */
  tryApplyAttackDamage() {
    const w = this.world;
    const ch = w?.character;
    if (!ch || !w) return;
    if (Math.abs(ch.x - this.x) > this.ATTACK_RANGE_X + 10) return;
    const a = this.getBoundsWithOffset(this);
    const b = ch.getBoundsWithOffset?.(ch) || {
      top: ch.y,
      bottom: ch.y + ch.height,
    };
    const overlap = a.bottom > b.top && a.top < b.bottom;
    if (!overlap) return;
    if (this.tryBlockInteraction(ch)) return;
    w.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  /**
   * Handles interaction with a blocking character.
   * @param {object} ch - The character being interacted with.
   * @returns {boolean} True if the interaction was successful, false otherwise.
   */
  tryBlockInteraction(ch) {
    if (!ch.isBlocking) return false;
    const right = this.x > ch.x;
    const facingRight = !ch.otherDirection;
    const covers = (right && facingRight) || (!right && ch.otherDirection);
    if (!covers) return false;
    ch.triggerBlock?.();
    const now = Date.now();
    this.attackCooldownEndAt = now + 350;
    this.knockbackVX = (right ? 1 : -1) * (this.KNOCKBACK_SPEED_X || 10);
    this.knockbackEndAt = now + (this.KNOCKBACK_DURATION || 300);
    return true;
  }
}
