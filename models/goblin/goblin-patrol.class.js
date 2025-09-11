class GoblinPatrol extends GoblinCombat {
  /**
   * Updates the patrol behavior of the goblin.
   * @param {number} now - The current timestamp.
   */
  updatePatrol(now) {
    this._moving = false;
    if (this.dying || this.hurtActive || Math.abs(this.knockbackVX) > 0.1)
      return;
    if (this.handlePatrolPause(now)) return;
    const l = this.spawnX - this.patrolRadius;
    const r = this.spawnX + this.patrolRadius;
    this.clampInside(l, r);
    this.ensureSegmentTarget(l, r);
    this.advancePatrolSegment(now, l, r);
  }

  /**
   * Handles the patrol pause logic.
   * @param {number} now - The current timestamp.
   * @returns {boolean} True if the goblin is paused, false otherwise.
   */
  handlePatrolPause(now) {
    if (!this.isPaused) return false;
    if (now < (this.pauseEndAt || 0)) return true;
    if (Math.random() < this.IDLE_BIAS_PROB) {
      this.startPause(now);
      return true;
    }
    this.isPaused = false;
    return false;
  }

  /**
   * Ensures the goblin stays within the patrol boundaries.
   * @param {number} l - The left boundary.
   * @param {number} r - The right boundary.
   */
  clampInside(l, r) {
    if (this.x < l) this.x = l;
    if (this.x > r) this.x = r;
  }

  /**
   * Ensures the goblin has a target for the current patrol segment.
   * @param {number} l - The left boundary.
   * @param {number} r - The right boundary.
   */
  ensureSegmentTarget(l, r) {
    if (typeof this.segmentTargetX !== 'number')
      this.segmentTargetX = this.pickNextSegmentTarget(l, r);
  }

  /**
   * Advances the goblin along the current patrol segment.
   * @param {number} now - The current timestamp.
   * @param {number} l - The left boundary.
   * @param {number} r - The right boundary.
   */
  advancePatrolSegment(now, l, r) {
    const dir = Math.sign(this.segmentTargetX - this.x) || this.patrolDir || -1;
    if (this.hitPatrolEdge(dir, l, r)) return this.flipAtEdge(now, dir);
    const nextX = this.x + dir * this.patrolSpeed;
    const reached =
      (dir < 0 && nextX <= this.segmentTargetX) ||
      (dir > 0 && nextX >= this.segmentTargetX);
    if (reached) return this.finishSegment(now, dir);
    this.x = nextX;
    this._moving = true;
    this.otherDirection = dir < 0;
  }

  /**
   * Checks if the goblin has hit the patrol edge.
   * @param {number} dir - The direction of movement.
   * @param {number} l - The left boundary.
   * @param {number} r - The right boundary.
   * @returns {boolean} True if the goblin hit the edge, false otherwise.
   */
  hitPatrolEdge(dir, l, r) {
    return (dir < 0 && this.x <= l) || (dir > 0 && this.x >= r);
  }

  /**
   * Flips the goblin's direction at the patrol edge.
   * @param {number} now - The current timestamp.
   * @param {number} dir - The direction of movement.
   */
  flipAtEdge(now, dir) {
    const l = this.spawnX - this.patrolRadius;
    const r = this.spawnX + this.patrolRadius;
    this.x = dir < 0 ? l : r;
    this.startPause(now);
    this.patrolDir = -dir;
    this.segmentTargetX = undefined;
    this.otherDirection = dir > 0;
  }

  /**
   * Finishes the current patrol segment.
   * @param {number} now - The current timestamp.
   * @param {number} dir - The direction of movement.
   */
  finishSegment(now, dir) {
    this.x = this.segmentTargetX;
    this._moving = true;
    this.otherDirection = dir < 0;
    this.startPause(now);
    this.patrolDir = -dir;
    this.segmentTargetX = undefined;
  }

  /**
   * Starts a pause in the patrol.
   * @param {number} now - The current timestamp.
   */
  startPause(now) {
    this.isPaused = true;
    const pmin = Math.max(100, this.PAUSE_MIN_MS);
    const pmax = Math.max(pmin + 50, this.PAUSE_MAX_MS);
    this.pauseEndAt = now + this.randBetween(pmin, pmax);
    this._moving = false;
  }

  /**
   * Picks the next target for the patrol segment.
   * @param {number} l - The left boundary.
   * @param {number} r - The right boundary.
   * @returns {number} The next segment target X-coordinate.
   */
  pickNextSegmentTarget(l, r) {
    const radius = this.patrolRadius;
    const minLen = Math.max(20, radius * this.SEGMENT_MIN_FRAC);
    const maxLen = Math.max(minLen + 10, radius * this.SEGMENT_MAX_FRAC);
    const raw =
      this.x + (this.patrolDir || -1) * this.randBetween(minLen, maxLen);
    return Math.max(l, Math.min(r, raw));
  }
}
