class GoblinAggro extends GoblinPatrol {
  updateAggroAndChase(now) {
    if (this.dying || this.hurtActive) return;
    const ch = this.world?.character;
    if (!ch || ch.isDead?.()) return;
    const dx = ch.x - this.x;
    const dist = Math.abs(dx);
    if (!this.aware && dist <= this.detectionRadius) this.aware = true;
    if (
      !this.aware ||
      this.isAttacking ||
      now < (this.attackCooldownEndAt || 0)
    )
      return;
    const dir = dx === 0 ? (this.otherDirection ? -1 : 1) : Math.sign(dx);
    if (dist <= this.ATTACK_RANGE_X) return this.beginAttack(now, ch);
    const speed = this.chaseSpeed * this.AWARE_SPEED_MULT;
    const nextX = this.x + dir * speed;
    this._moving = nextX !== this.x;
    this.otherDirection = dir < 0;
    this.x = nextX;
  }
}
