class EndbossMove extends EndbossCombat {
  startWalkLoop() {
    setInterval(() => this._walkTick(), 1000 / 60);
  }

  _walkTick() {
    if (this.dead) return;
    const ch = this.world?.character;
    if (ch?.isDead?.()) return (this.speed = 0);
    if (ch) this.otherDirection = ch.x < this.x;
    if (!this.awake || !['walk', 'attack'].includes(this.state) || !ch) return;
    const dx = ch.x - this.x;
    if (Math.abs(dx) <= 2) return;
    this.speed = this.chaseSpeed;
    dx < 0 ? this.moveLeft() : this.moveRight();
  }
}
