/**
 * Extends the GoblinPatrol class to add aggressive behavior and chasing logic.
 */
class GoblinAggro extends GoblinPatrol {
  /**
   * Updates the goblin's awareness, aggression, and chasing behavior.
   * @param {number} now - The current timestamp.
   */
  updateAggroAndChase(now) {
    if (this._shouldSkipAggro()) return;
    const ch = this.world?.character;
    if (!ch || ch.isDead?.()) return;
    const dx = ch.x - this.x;
    const dist = Math.abs(dx);
    this._updateAwareness(dist);
    if (this._shouldSkipChase(now, dist)) return;
    const dir = this._calculateDirection(dx);
    if (dist <= this.ATTACK_RANGE_X) return this.beginAttack(now, ch);
    this._moveTowardsTarget(dir);
  }

  /**
   * Determines if the goblin should skip aggro updates.
   * @returns {boolean} True if aggro updates should be skipped, otherwise false.
   */
  _shouldSkipAggro() {
    return this.dying || this.hurtActive;
  }

  /**
   * Updates the goblin's awareness based on the distance to the character.
   * @param {number} dist - The distance to the character.
   */
  _updateAwareness(dist) {
    if (!this.aware && dist <= this.detectionRadius) this.aware = true;
  }

  /**
   * Determines if the goblin should skip chasing the character.
   * @param {number} now - The current timestamp.
   * @param {number} dist - The distance to the character.
   * @returns {boolean} True if chasing should be skipped, otherwise false.
   */
  _shouldSkipChase(now, dist) {
    return (
      !this.aware || this.isAttacking || now < (this.attackCooldownEndAt || 0)
    );
  }

  /**
   * Calculates the direction towards the character.
   * @param {number} dx - The difference in x-coordinates between the goblin and the character.
   * @returns {number} The direction (-1 for left, 1 for right).
   */
  _calculateDirection(dx) {
    return dx === 0 ? (this.otherDirection ? -1 : 1) : Math.sign(dx);
  }

  /**
   * Moves the goblin towards the target based on the direction.
   * @param {number} dir - The direction to move (-1 for left, 1 for right).
   */
  _moveTowardsTarget(dir) {
    const speed = this.chaseSpeed * this.AWARE_SPEED_MULT;
    const nextX = this.x + dir * speed;
    this._moving = nextX !== this.x;
    this.otherDirection = dir < 0;
    this.x = nextX;
  }
}
