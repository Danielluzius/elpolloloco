// Combat (attack + damage) logic for Endboss.
class EndbossCombat extends EndbossAnim {
  wakeIfNear(character) {
    const dx = Math.abs(
      character.x + character.width / 2 - (this.x + this.width / 2)
    );
    if (dx > this.detectionRadius) return;
    this.awake = true;
    if (this.healthSteps == null) {
      this.maxHealthSteps = 10;
      this.healthSteps = 10;
    }
    if (!this.alertPlayed && this.state === 'idle') {
      this.state = 'alert';
      this.frameIndex = 0;
      this.lastFrameTime = Date.now();
    }
  }

  checkAndStartAttack(world) {
    if (!this._canAttemptAttack(world) || this._attackWindupTimer) return;
    this._attackWindupTimer = setTimeout(
      () => this._executeAttackStart(world),
      this.attackWindupMs
    );
  }

  _canAttemptAttack(world) {
    if (!this.awake || this.dead || world.character.isDead()) return false;
    const dx = Math.abs(
      world.character.x + world.character.width / 2 - (this.x + this.width / 2)
    );
    if (dx > this.attackRange) return false;
    if (Date.now() - (this.lastAttackAt || 0) < this.attackCooldown)
      return false;
    return !['attack', 'hurt'].includes(this.state);
  }

  _executeAttackStart(world) {
    this._attackWindupTimer = null;
    if (this.dead || !this._stillCanAttack(world)) return;
    const now = Date.now();
    this.state = 'attack';
    this.frameIndex = 0;
    this.lastFrameTime = now;
    this.lastAttackAt = now;
    this.scheduleAttackHitCheck(world);
  }

  _stillCanAttack(world) {
    const cx = world.character.x + world.character.width / 2;
    const bx = this.x + this.width / 2;
    const inRange = Math.abs(cx - bx) <= this.attackRange;
    const cooled = Date.now() - (this.lastAttackAt || 0) >= this.attackCooldown;
    return inRange && cooled && !this.dead;
  }

  scheduleAttackHitCheck(world) {
    setTimeout(() => this._attackHitWindow(world), 3 * this.ATTACK_DELAY);
  }

  _attackHitWindow(world) {
    if (this.state !== 'attack' || this.dead) return;
    this.tryApplyBossAttackDamage(world);
  }

  tryApplyBossAttackDamage(world) {
    const ch = world?.character;
    if (!ch || ch.isDead?.()) return;
    if (!this._isPlayerVerticallyInRange(ch)) return;
    if (this._attemptBlockResponse(ch)) return;
    world.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  _isPlayerVerticallyInRange(ch) {
    const cx = ch.x + ch.width / 2;
    const bx = this.x + this.width / 2;
    if (Math.abs(cx - bx) > this.attackRange + 10) return false;
    const a = this.getBoundsWithOffset?.(this) || {
      top: this.y,
      bottom: this.y + this.height,
    };
    const b = ch.getBoundsWithOffset?.(ch) || {
      top: ch.y,
      bottom: ch.y + ch.height,
    };
    return a.bottom > b.top && a.top < b.bottom;
  }
  _attemptBlockResponse(ch) {
    if (!ch.isBlocking) return false;
    const bossOnRight = this.x > ch.x;
    const facingRight = !ch.otherDirection;
    const cover =
      (bossOnRight && facingRight) || (!bossOnRight && ch.otherDirection);
    if (!cover) return false;
    ch.triggerBlock?.();
    this._startBlockKnockback(bossOnRight ? 1 : -1);
    this.lastAttackAt = Date.now();
    return true;
  }

  _startBlockKnockback(dir) {
    this.speedY = 0;
    this._blockKnockbackEndAt = Date.now() + 220;
    this._blockKnockbackVX = dir * 8;
    if (!this._blockKbLoop) this._startBlockKbLoop();
  }

  _startBlockKbLoop() {
    this._blockKbLoop = setInterval(() => this._blockKbTick(), 1000 / 60);
  }

  _blockKbTick() {
    const t = Date.now();
    if (t >= (this._blockKnockbackEndAt || 0)) return this._endBlockKb();
    if (!this._blockKnockbackVX) return;
    this.x += this._blockKnockbackVX;
    this._blockKnockbackVX *= 0.9;
  }

  _endBlockKb() {
    this._blockKnockbackVX = 0;
    clearInterval(this._blockKbLoop);
    this._blockKbLoop = null;
  }

  applyHit(
    amount = 1,
    now = Date.now(),
    defaultMaxSteps = null,
    attackId = null
  ) {
    if (!this.awake || this.dead) return false;
    if (attackId != null && this._lastAttackIdHit === attackId) return false;
    if (this.lastHitAt && now - this.lastHitAt < (this.hitCooldownMs ?? 200))
      return false;
    if (this.maxHealthSteps == null)
      this.maxHealthSteps = defaultMaxSteps ?? 10;
    if (this.healthSteps == null) this.healthSteps = this.maxHealthSteps;
    const next = Math.max(0, this.healthSteps - 1);
    this.healthSteps = next;
    this.lastHitAt = now;
    if (attackId != null) this._lastAttackIdHit = attackId;
    if (this.healthSteps === 0) {
      this.dead = true;
      this.speed = 0;
      this.state = 'dead';
      this.frameIndex = 0;
    } else if (!['hurt', 'attack'].includes(this.state)) {
      this.state = 'hurt';
      this.frameIndex = 0;
      this.lastFrameTime = now;
    }
    return true;
  }
}
