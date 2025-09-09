// Combat + damage + block interaction for Goblin.
class GoblinCombat extends GoblinAnim {
  // Update knockback physics each tick
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

  // Handle being hit by player attack
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

  // Grant charge to attacker once per attack id
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

  // Enter hurt state with knockback
  enterHurtState(now, attacker) {
    this.hurtActive = true;
    this.hurtFrameIdx = 0;
    this.hurtLastAt = now;
    this.hurtEndAt = now + this.MIN_HURT_TIME;
    const dir = attacker?.x > this.x ? -1 : 1;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = this.KNOCKBACK_SPEED_Y;
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
  }

  // Start death sequence and schedule despawn
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
  }

  // Count kill on world once
  countKill() {
    try {
      this.world && (this.world._goblinsKilled = Math.max(0, (this.world._goblinsKilled || 0) + 1));
      this._countedKill = true;
    } catch (_) {}
  }

  // Determine if ready to despawn
  shouldDespawn() {
    return !!(this._despawnAt && Date.now() >= this._despawnAt);
  }

  // Begin an attack animation
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

  // Advance attack frames & apply damage
  animateAttack(now) {
    const s = this.attackSheet;
    const img = this.imageCache[s.path];
    if (this._attackReady && img) this.img = img;
    if (now < this.attackWindupEndAt) return this.setSheetFrameAuto(s, 0);
    if (now - this.attackLastAt >= this.ATTACK_FRAME_DELAY) {
      this.attackFrameIdx = Math.min(this.attackFrameIdx + 1, (s.count || 1) - 1);
      this.attackLastAt = now;
    }
    this.setSheetFrameAuto(s, this.attackFrameIdx);
    const hitFrame = Math.floor((s.count || 1) / 2);
    if (!this.appliedAttackDamage && this.attackFrameIdx >= hitFrame) {
      this.tryApplyAttackDamage();
      this.appliedAttackDamage = true;
    }
    if (this.attackFrameIdx >= (s.count || 1) - 1) this.finishAttack(now);
  }

  // Finish attack and set cooldown
  finishAttack(now) {
    this.isAttacking = false;
    this.attackCooldownEndAt = now + 380;
    this.attackFrameIdx = 0;
  }

  // Try to apply attack damage to character
  tryApplyAttackDamage() {
    const w = this.world;
    const ch = w?.character;
    if (!ch || !w) return;
    if (Math.abs(ch.x - this.x) > this.ATTACK_RANGE_X + 10) return;
    const a = this.getBoundsWithOffset(this);
    const b = ch.getBoundsWithOffset?.(ch) || { top: ch.y, bottom: ch.y + ch.height };
    const overlap = a.bottom > b.top && a.top < b.bottom;
    if (!overlap) return;
    if (this.tryBlockInteraction(ch)) return;
    w.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  // Attempt block response and knockback
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
