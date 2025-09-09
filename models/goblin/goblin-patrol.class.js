// Patrol & movement AI for Goblin.
class GoblinPatrol extends GoblinCombat {
  // Update patrol logic if not aggro
  updatePatrol(now) {
    this._moving = false;
    if (this.dying || this.hurtActive || Math.abs(this.knockbackVX) > 0.1)
      return;
    if (this.handlePatrolPause(now)) return;
    const l = this.spawnX - this.patrolRadius,
      r = this.spawnX + this.patrolRadius;
    this.clampInside(l, r);
    this.ensureSegmentTarget(l, r);
    this.advancePatrolSegment(now, l, r);
  }

  // Handle pause timing
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

  // Clamp inside patrol radius
  clampInside(l, r) {
    if (this.x < l) this.x = l;
    if (this.x > r) this.x = r;
  }

  // Ensure there is a segment target
  ensureSegmentTarget(l, r) {
    if (typeof this.segmentTargetX !== 'number')
      this.segmentTargetX = this.pickNextSegmentTarget(l, r);
  }

  // Advance along current segment
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

  // Check if edge reached
  hitPatrolEdge(dir, l, r) {
    return (dir < 0 && this.x <= l) || (dir > 0 && this.x >= r);
  }

  // Flip direction at edge and pause
  flipAtEdge(now, dir) {
    const l = this.spawnX - this.patrolRadius,
      r = this.spawnX + this.patrolRadius;
    this.x = dir < 0 ? l : r;
    this.startPause(now);
    this.patrolDir = -dir;
    this.segmentTargetX = undefined;
    this.otherDirection = dir > 0;
  }

  // Finish a segment and pause
  finishSegment(now, dir) {
    this.x = this.segmentTargetX;
    this._moving = true;
    this.otherDirection = dir < 0;
    this.startPause(now);
    this.patrolDir = -dir;
    this.segmentTargetX = undefined;
  }

  // Start a patrol pause
  startPause(now) {
    this.isPaused = true;
    const pmin = Math.max(100, this.PAUSE_MIN_MS);
    const pmax = Math.max(pmin + 50, this.PAUSE_MAX_MS);
    this.pauseEndAt = now + this.randBetween(pmin, pmax);
    this._moving = false;
  }

  // Pick next patrol target inside radius
  pickNextSegmentTarget(l, r) {
    const radius = this.patrolRadius;
    const minLen = Math.max(20, radius * this.SEGMENT_MIN_FRAC);
    const maxLen = Math.max(minLen + 10, radius * this.SEGMENT_MAX_FRAC);
    const raw =
      this.x + (this.patrolDir || -1) * this.randBetween(minLen, maxLen);
    return Math.max(l, Math.min(r, raw));
  }
}
