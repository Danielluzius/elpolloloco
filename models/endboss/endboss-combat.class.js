/**
 * Handles the combat logic for the end boss, including attacks, damage, and interactions with the player.
 */
class EndbossCombat extends EndbossAnim {
  /**
   * Wakes the end boss if the player is within the detection radius.
   * @param {Object} character - The player character.
   */
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

  /**
   * Checks if the end boss can attack and starts the attack windup if possible.
   * @param {Object} world - The game world.
   */
  checkAndStartAttack(world) {
    if (!this._canAttemptAttack(world) || this._attackWindupTimer) return;
    this._attackWindupTimer = setTimeout(
      () => this._executeAttackStart(world),
      this.attackWindupMs
    );
  }

  /**
   * Determines if the end boss can attempt an attack.
   * @param {Object} world - The game world.
   * @returns {boolean} True if the end boss can attack, otherwise false.
   */
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

  /**
   * Executes the start of an attack.
   * @param {Object} world - The game world.
   */
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

  /**
   * Checks if the end boss can still attack.
   * @param {Object} world - The game world.
   * @returns {boolean} True if the end boss can still attack, otherwise false.
   */
  _stillCanAttack(world) {
    const cx = world.character.x + world.character.width / 2;
    const bx = this.x + this.width / 2;
    const inRange = Math.abs(cx - bx) <= this.attackRange;
    const cooled = Date.now() - (this.lastAttackAt || 0) >= this.attackCooldown;
    return inRange && cooled && !this.dead;
  }

  /**
   * Schedules a hit check for the attack.
   * @param {Object} world - The game world.
   */
  scheduleAttackHitCheck(world) {
    setTimeout(() => this._attackHitWindow(world), 3 * this.ATTACK_DELAY);
  }

  /**
   * Checks if the attack hits the player.
   * @param {Object} world - The game world.
   */
  _attackHitWindow(world) {
    if (this.state !== 'attack' || this.dead) return;
    this.tryApplyBossAttackDamage(world);
  }

  /**
   * Applies damage to the player if the attack hits.
   * @param {Object} world - The game world.
   */
  tryApplyBossAttackDamage(world) {
    const ch = world?.character;
    if (!ch || ch.isDead?.()) return;
    if (!this._isPlayerVerticallyInRange(ch)) return;
    if (this._attemptBlockResponse(ch)) return;
    world.damageCharacterIfNeeded();
    ch.applyKnockbackFrom?.(this);
  }

  /**
   * Checks if the player is within the vertical range of the attack.
   * @param {Object} ch - The player character.
   * @returns {boolean} True if the player is in range, otherwise false.
   */
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

  /**
   * Attempts to block the attack if the player is blocking.
   * @param {Object} ch - The player character.
   * @returns {boolean} True if the attack was blocked, otherwise false.
   */
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

  /**
   * Starts the knockback effect when the attack is blocked.
   * @param {number} dir - The direction of the knockback.
   */
  _startBlockKnockback(dir) {
    this.speedY = 0;
    this._blockKnockbackEndAt = Date.now() + 220;
    this._blockKnockbackVX = dir * 8;
    if (!this._blockKbLoop) this._startBlockKbLoop();
  }

  /**
   * Starts the loop for the block knockback effect.
   */
  _startBlockKbLoop() {
    this._blockKbLoop = setInterval(() => this._blockKbTick(), 1000 / 60);
  }

  /**
   * Updates the block knockback effect.
   */
  _blockKbTick() {
    const t = Date.now();
    if (t >= (this._blockKnockbackEndAt || 0)) return this._endBlockKb();
    if (!this._blockKnockbackVX) return;
    this.x += this._blockKnockbackVX;
    this._blockKnockbackVX *= 0.9;
  }

  /**
   * Ends the block knockback effect.
   */
  _endBlockKb() {
    this._blockKnockbackVX = 0;
    clearInterval(this._blockKbLoop);
    this._blockKbLoop = null;
  }

  /**
   * Applies damage to the end boss.
   * @param {number} [amount=1] - The amount of damage to apply.
   * @param {number} [now=Date.now()] - The current timestamp.
   * @param {number|null} [defaultMaxSteps=null] - The default maximum health steps.
   * @param {string|null} [attackId=null] - The ID of the attack.
   * @returns {boolean} True if the damage was applied, otherwise false.
   */
  applyHit(
    amount = 1,
    now = Date.now(),
    defaultMaxSteps = null,
    attackId = null
  ) {
    if (!this._canApplyHit(now, attackId)) return false;
    this._ensureHealthInit(defaultMaxSteps);
    this._applyHealthDecrease(amount);
    this._markHitTimestamp(now, attackId);
    if (this.healthSteps === 0) this._handleDeath();
    else this._handleHurt(now);
    return true;
  }

  /**
   * Validates whether a hit can be applied at the current time.
   * @param {number} now - Current timestamp.
   * @param {string|null} attackId - Attack id to de-duplicate hits.
   * @returns {boolean}
   */
  _canApplyHit(now, attackId) {
    if (!this.awake || this.dead) return false;
    if (attackId != null && this._lastAttackIdHit === attackId) return false;
    const cooldown = this.hitCooldownMs ?? 200;
    return !(this.lastHitAt && now - this.lastHitAt < cooldown);
  }

  /**
   * Ensures health-related fields are initialized.
   * @param {number|null} defaultMaxSteps - Default max health steps.
   */
  _ensureHealthInit(defaultMaxSteps) {
    if (this.maxHealthSteps == null)
      this.maxHealthSteps = defaultMaxSteps ?? 10;
    if (this.healthSteps == null) this.healthSteps = this.maxHealthSteps;
  }

  /**
   * Applies a decrease to the boss's health.
   * @param {number} amount - Damage amount (steps).
   */
  _applyHealthDecrease(amount) {
    const next = Math.max(0, (this.healthSteps ?? 0) - (amount ?? 1));
    this.healthSteps = next;
  }

  /**
   * Stores the last-hit timestamp and last attack id.
   * @param {number} now - Current timestamp.
   * @param {string|null} attackId - Attack id reference.
   */
  _markHitTimestamp(now, attackId) {
    this.lastHitAt = now;
    if (attackId != null) this._lastAttackIdHit = attackId;
  }

  /**
   * Handles boss death state and SFX.
   */
  _handleDeath() {
    this.dead = true;
    this.speed = 0;
    this.state = 'dead';
    this.frameIndex = 0;
    this._playSoundSafe('endboss_dead_sound');
  }

  /**
   * Handles hurt state transition and SFX.
   * @param {number} now - Current timestamp for animation timing.
   */
  _handleHurt(now) {
    if (!['hurt', 'attack'].includes(this.state)) {
      this.state = 'hurt';
      this.frameIndex = 0;
      this.lastFrameTime = now;
    }
    this._playSoundSafe('endboss_hurt_sound');
  }

  /**
   * Plays a sound by id, swallowing errors if audio is unavailable.
   * @param {string} soundId - Key of the sound to play.
   */
  _playSoundSafe(soundId) {
    try {
      window.sound?.play(soundId, { channel: 'sfx' });
    } catch (_) {}
  }
}
