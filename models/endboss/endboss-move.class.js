/**
 * Handles the movement logic for the end boss, including walking and chasing the player.
 */
class EndbossMove extends EndbossCombat {
  /**
   * Starts the loop for the walking behavior of the end boss.
   */
  startWalkLoop() {
    setInterval(() => this._walkTick(), 1000 / 60);
  }

  /**
   * Updates the walking behavior of the end boss on each tick.
   */
  _walkTick() {
    if (this.dead) return;
    const ch = this.world?.character;
    if (ch?.isDead?.()) {
      this.speed = 0;
      return;
    }
    if (ch) this.otherDirection = ch.x < this.x;
    if (!this.awake || !['walk', 'attack'].includes(this.state) || !ch) return;
    const dx = ch.x - this.x;
    if (Math.abs(dx) <= 2) return;
    this.speed = this.chaseSpeed;
    dx < 0 ? this.moveLeft() : this.moveRight();
  }
}
