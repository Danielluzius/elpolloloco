class Goblin extends MoveableObject {
  // All goblins share character-like size
  height = 260;
  width = 210;
  y = 180; // align to same ground line as Character
  groundY = 180;
  // enemy heart overlay
  heartPaths = {
    1: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart1.png',
    2: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart2.png',
    3: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart3.png',
    4: 'assets/img/7_statusbars/2_enemie_hearts/monster_heart4.png',
  };
  heartW = 20;
  heartH = 20;
  heartYOffset = -140; // how much space above the head
  // idle anim
  animDelay = 220;
  idleSheet = null; // { path, cols, rows, count }
  idleOrder = null; // display order of frames (skip bad ones)
  _idleIdx = 0;
  _lastFrameAt = 0;
  // walk anim
  walkSheet = null; // { path, cols, rows, count }
  walkFrameIdx = 0;
  walkLastAt = 0;
  WALK_DELAY = 110;
  // attack anim
  attackSheet = null; // { path, cols, rows, count }
  attackFrameIdx = 0;
  attackLastAt = 0;
  ATTACK_FRAME_DELAY = 60;
  ATTACK_WINDUP_MS = 120;
  attackWindupEndAt = 0;
  attackCooldownEndAt = 0;
  appliedAttackDamage = false;
  isAttacking = false;
  _attackReady = false;
  // run anim (for chase)
  runSheet = null; // { path, cols, rows, count }
  runFrameIdx = 0;
  runLastAt = 0;
  RUN_DELAY = 70;
  _runReady = false;
  // hurt anim (3 frames per assets)
  hurtSheet = null; // { path, cols:3, rows:1, count:3 }
  hurtFrameIdx = 0;
  hurtLastAt = 0;
  HURT_DELAY = 110;
  hurtActive = false;
  hurtEndAt = 0;
  MIN_HURT_TIME = 500; // ensure visible even if image loads late
  _hurtReady = false;
  // death anim (5 frames per assets)
  deathSheet = null; // { path, cols:5, rows:1, count:5 }
  deathFrameIdx = 0;
  deathLastAt = 0;
  DEATH_DELAY = 140;
  DEAD_LINGER_MS = 800;
  dying = false;
  dead = false; // used by world collision logic to ignore
  _deathReady = false;
  _despawnAt = 0;
  // gameplay
  hitCount = 0;
  // patrol
  spawnX = 0;
  patrolRadius = 240;
  PATROL_SPEED = 2.0; // base; we'll bias toward slower effective speeds
  patrolSpeed = 2.0; // effective per-instance speed
  PAUSE_DURATION = 400; // legacy default; actual per-pause randomized
  PAUSE_MIN_MS = 800;
  PAUSE_MAX_MS = 2200;
  SEGMENT_MIN_FRAC = 0.1; // 10% des Radius
  SEGMENT_MAX_FRAC = 0.35; // 35% des Radius (kürzere Laufphasen)
  IDLE_BIAS_PROB = 0.65; // Wahrscheinlichkeit, nach einer Pause direkt wieder zu idlen
  patrolDir = -1; // -1: left, 1: right
  isPaused = false;
  pauseEndAt = 0;
  _moving = false;
  segmentTargetX = undefined;
  // aggro/chase
  detectionRadius = 320;
  aware = false;
  CHASE_SPEED_FACTOR = 2.7; // increased for faster chase base
  AWARE_SPEED_MULT = 1.55; // increased multiplier while aware
  chaseSpeed = 3.7; // nominal fallback when patrolSpeed is very low
  ATTACK_RANGE_X = 60;
  // knockback
  knockbackVX = 0;
  knockbackEndAt = 0;
  KNOCKBACK_DURATION = 300;
  KNOCKBACK_SPEED_X = 12;
  KNOCKBACK_SPEED_Y = 12;
  recentlyHitAt = 0; // debounce repeated hits

  /**
   * type: 1 | 2 | 3 maps to assets/img/3_enemies_goblins/goblin_{type}/3_idle/1_idle_6_sprites.png
   * x: spawn x position
   */
  constructor(type = 1, x = 800) {
    super();
    const clampedType = Math.max(1, Math.min(3, Math.floor(type)));
    const idlePath = `assets/img/3_enemies_goblins/goblin_${clampedType}/3_idle/1_idle_6_sprites.png`;
    const idleCount = this.getSpriteCountFromFilename(idlePath) || 6;
    this.idleSheet = { path: idlePath, cols: idleCount, rows: 1, count: idleCount };
    // Build frame order but skip index 1 (2nd sprite), which glitches
    this.idleOrder = Array.from({ length: idleCount }, (_, i) => i).filter((i) => i !== 1);
    // Hurt sheet (always 3 sprites)
    const hurtPath = `assets/img/3_enemies_goblins/goblin_${clampedType}/4_hurt/1_hurt_3_sprites.png`;
    this.hurtSheet = { path: hurtPath, cols: 3, rows: 1, count: 3 };
    // Death sheet (varies by type: g1=5, g2=6, g3=4 sprites)
    const deathCountByType = { 1: 5, 2: 6, 3: 4 };
    const dCount = deathCountByType[clampedType] || 5;
    const deadPath = `assets/img/3_enemies_goblins/goblin_${clampedType}/5_dead/1_dead_${dCount}_sprites.png`;
    // prefer explicit count, also keep ability to infer from filename if pattern changes
    const inferred = this.getSpriteCountFromFilename(deadPath) || dCount;
    this.deathSheet = { path: deadPath, cols: inferred, rows: 1, count: inferred };

    // preload
    this.loadImage(idlePath);
    this.loadImage(hurtPath);
    // mark when hurt sheet is ready so we can guarantee showing it
    const hImg = this.imageCache[hurtPath];
    if (hImg) {
      this._hurtReady = !!hImg.complete;
      try {
        hImg.addEventListener && hImg.addEventListener('load', () => (this._hurtReady = true), { once: true });
      } catch (_) {}
    }
    // preload death sheet and track readiness
    this.loadImage(deadPath);
    // Walk sheet (g1: 8, g2/g3: 9)
    const walkCountByType = { 1: 8, 2: 9, 3: 9 };
    const wCount = walkCountByType[clampedType] || 8;
    const walkPath = `assets/img/3_enemies_goblins/goblin_${clampedType}/1_walk/1_walk_${wCount}_sprites.png`;
    this.walkSheet = { path: walkPath, cols: wCount, rows: 1, count: wCount };
    this.loadImage(walkPath);
    // Run sheet: load the exact available sprite count per type to avoid 404s
    const runCountByType = { 1: 8, 2: 8, 3: 7 };
    const rCount = runCountByType[clampedType] || 8;
    const runPath = `assets/img/3_enemies_goblins/goblin_${clampedType}/6_run/1_run_${rCount}_sprites.png`;
    this.runSheet = { path: runPath, cols: rCount, rows: 1, count: rCount };
    this.loadImage(runPath);
    const rImg = this.imageCache[runPath];
    if (rImg) {
      this._runReady = !!rImg.complete;
      try {
        rImg.addEventListener && rImg.addEventListener('load', () => (this._runReady = true), { once: true });
      } catch (_) {}
    }
    // Attack sheet (g1,g2: 5; g3: 6)
    const attackCountByType = { 1: 5, 2: 5, 3: 6 };
    const aCount = attackCountByType[clampedType] || 5;
    const attackPath = `assets/img/3_enemies_goblins/goblin_${clampedType}/2_attack/1_attack_${aCount}_sprites.png`;
    this.attackSheet = { path: attackPath, cols: aCount, rows: 1, count: aCount };
    this.loadImage(attackPath);
    const aImg = this.imageCache[attackPath];
    if (aImg) {
      this._attackReady = !!aImg.complete;
      try {
        aImg.addEventListener && aImg.addEventListener('load', () => (this._attackReady = true), { once: true });
      } catch (_) {}
    }
    const dImg = this.imageCache[deadPath];
    if (dImg) {
      this._deathReady = !!dImg.complete;
      try {
        dImg.addEventListener && dImg.addEventListener('load', () => (this._deathReady = true), { once: true });
      } catch (_) {}
    }
    // ensure initial image
    this.img = this.imageCache[idlePath];
    this.setSheetFrameAuto(this.idleSheet, this.idleOrder[0] || 0);

    // Tighter collision bounds to avoid oversized hitbox
    // Reduce width and height overlap area significantly
    this.offset = { top: 150, right: 80, bottom: 0, left: 80 };

    this.x = typeof x === 'number' ? x : 800;
    this.spawnX = this.x;
    this.speed = 0; // stays idle for now
    // Face left by default (sprites face right natively)
    this.otherDirection = true;
    // Randomize movement characteristics per goblin
    this.patrolSpeed = this.PATROL_SPEED * this.randBetween(0.8, 1.1);
    this.chaseSpeed = Math.max(2.2, this.patrolSpeed * this.CHASE_SPEED_FACTOR);
    // Randomize initial direction and a tiny initial pause so they don't start synchronized
    this.patrolDir = Math.random() < 0.5 ? -1 : 1;
    this.isPaused = true;
    this.pauseEndAt = Date.now() + this.randBetween(this.PAUSE_MIN_MS, this.PAUSE_MAX_MS);

    this.applyGravity();
    this.animate();

    // Preload heart images for overlay without changing current sprite
    try {
      this.loadImages(Object.values(this.heartPaths));
    } catch (_) {}
  }

  animate() {
    setInterval(() => {
      const now = Date.now();
      // If the character is dead, force goblin into idle and keep playing idle animation
      const chDead = this.world?.character?.isDead?.();
      if (chDead) {
        // reset behavior flags
        this.aware = false;
        this.isAttacking = false;
        this.hurtActive = false;
        this.knockbackVX = 0;
        this._moving = false;
        this.isPaused = true;
        this.pauseEndAt = Date.now() + 60 * 60 * 1000; // effectively freeze patrol
        // show and advance idle animation
        if (now - this._lastFrameAt >= this.animDelay) {
          const order = this.idleOrder && this.idleOrder.length ? this.idleOrder : [0];
          this._idleIdx = (this._idleIdx + 1) % order.length;
          const frame = order[this._idleIdx] ?? 0;
          this.img = this.imageCache[this.idleSheet.path] || this.img;
          this.setSheetFrameAuto(this.idleSheet, frame);
          this._lastFrameAt = now;
        }
        return;
      }
      // update knockback motion
      this.updateKnockback(now);

      // death animation has highest priority
      if (this.dying) {
        const sheet = this.deathSheet;
        const dCount = sheet?.count || 5;
        if (now - this.deathLastAt >= this.DEATH_DELAY) {
          const maxIdx = dCount - 1;
          if (this.deathFrameIdx < maxIdx) this.deathFrameIdx++;
          this.deathLastAt = now;
        }
        const dImg2 = this.imageCache[sheet.path];
        if (this._deathReady && dImg2) {
          this.img = dImg2;
          this.setSheetFrameAuto(sheet, this.deathFrameIdx);
        }
        // once time passed, allow despawn
        if (this._despawnAt && now >= this._despawnAt) {
          // nothing else, world will remove via shouldDespawn()
        }
        return;
      }

      // awareness + chase logic
      this.updateAggroAndChase(now);
      // if not aware or attacking, continue patrol
      if (!this.aware && !this.isAttacking) this.updatePatrol(now);

      if (this.hurtActive) {
        // advance hurt frames without looping
        if (now - this.hurtLastAt >= this.HURT_DELAY) {
          this.hurtFrameIdx = Math.min((this.hurtFrameIdx || 0) + 1, (this.hurtSheet.count || 3) - 1);
          this.hurtLastAt = now;
        }
        // swap to hurt sheet once it's ready; until then, keep idle but extend duration a bit
        const hImg2 = this.imageCache[this.hurtSheet.path];
        if (this._hurtReady && hImg2) {
          this.img = hImg2;
          this.setSheetFrameAuto(this.hurtSheet, this.hurtFrameIdx || 0);
        }
        // auto-end after both knockback and minimum show time elapsed
        if (now >= Math.max(this.knockbackEndAt || 0, this.hurtEndAt || 0)) this.hurtActive = false;
        return;
      }

      // Attack animation if attacking
      if (this.isAttacking) {
        this.animateAttack(now);
        return;
      }

      // Choose animation based on movement
      if (this._moving && this.aware && this._runReady && this.runSheet) {
        if (now - this.runLastAt >= this.RUN_DELAY) {
          const cnt = this.runSheet?.count || 1;
          this.runFrameIdx = (this.runFrameIdx + 1) % cnt;
          this.runLastAt = now;
        }
        const rImg = this.imageCache[this.runSheet.path];
        if (rImg) {
          this.img = rImg;
          this.setSheetFrameAuto(this.runSheet, this.runFrameIdx);
        }
      } else if (this._moving) {
        if (now - this.walkLastAt >= this.WALK_DELAY) {
          const cnt = this.walkSheet?.count || 1;
          this.walkFrameIdx = (this.walkFrameIdx + 1) % cnt;
          this.walkLastAt = now;
        }
        const wImg = this.imageCache[this.walkSheet.path];
        if (wImg) {
          this.img = wImg;
          this.setSheetFrameAuto(this.walkSheet, this.walkFrameIdx);
        }
      } else {
        if (now - this._lastFrameAt >= this.animDelay) {
          const order = this.idleOrder && this.idleOrder.length ? this.idleOrder : [0];
          this._idleIdx = (this._idleIdx + 1) % order.length;
          const frame = order[this._idleIdx] ?? 0;
          this.img = this.imageCache[this.idleSheet.path] || this.img;
          this.setSheetFrameAuto(this.idleSheet, frame);
          this._lastFrameAt = now;
        }
      }
    }, 50);
  }

  updateKnockback(now) {
    // Ignore any knockback while dying/dead
    if (this.dying || this.dead) {
      this.knockbackVX = 0;
      return;
    }
    if (!this.knockbackEndAt || now < this.knockbackEndAt) {
      // apply horizontal knockback when active
      if (this.knockbackVX) {
        this.x += this.knockbackVX;
        this.knockbackVX *= 0.9; // damping
      }
    } else {
      this.knockbackVX = 0;
    }
  }

  onHitByAttack(attacker) {
    // Ignore further hits/knockback if already dying or dead
    if (this.dying || this.dead) return;
    const now = Date.now();
    // debounce frequent hits
    if (now - (this.recentlyHitAt || 0) < 200) return;
    this.recentlyHitAt = now;
    // increase hit count and check for death
    this.hitCount = (this.hitCount || 0) + 1;
    if (this.hitCount >= 3 && !this.dying) {
      this.startDeath(now);
      return;
    }
    // set hurt state
    this.hurtActive = true;
    this.hurtFrameIdx = 0;
    this.hurtLastAt = now;
    this.hurtEndAt = now + this.MIN_HURT_TIME;
    // knockback away from attacker
    const dir = attacker?.x > this.x ? -1 : 1;
    this.knockbackVX = dir * this.KNOCKBACK_SPEED_X;
    this.speedY = this.KNOCKBACK_SPEED_Y; // small pop upwards with gravity loop
    this.knockbackEndAt = now + this.KNOCKBACK_DURATION;
  }

  startDeath(now = Date.now()) {
    this.dying = true;
    this.dead = true; // so world ignores collisions/damage
    this.hurtActive = false;
    // freeze motion on death
    this.knockbackVX = 0;
    this.speedY = 0;
    // reset animation counters
    this.deathFrameIdx = 0;
    this.deathLastAt = now;
    // compute despawn moment after full animation + linger using dynamic count
    const frames = this.deathSheet?.count || 5;
    this._despawnAt = now + frames * this.DEATH_DELAY + this.DEAD_LINGER_MS;
  }

  shouldDespawn() {
    return !!(this._despawnAt && Date.now() >= this._despawnAt);
  }

  updatePatrol(now) {
    // reset moving flag each tick
    this._moving = false;
    // no patrol while dying/hurt/knockback
    if (this.dying || this.hurtActive || (this.knockbackVX && Math.abs(this.knockbackVX) > 0.1)) return;
    // handle pause
    if (this.isPaused) {
      if (now >= (this.pauseEndAt || 0)) {
        // Pause ist vorbei, mit starker Idle-Neigung ggf. direkt erneut pausieren
        if (Math.random() < this.IDLE_BIAS_PROB) {
          this.startPause(now);
          return;
        }
        this.isPaused = false;
      } else {
        return; // stay idle during pause
      }
    }
    // bounds
    const leftBound = this.spawnX - this.patrolRadius;
    const rightBound = this.spawnX + this.patrolRadius;
    // clamp into bounds if drifted (e.g., knockback)
    if (this.x < leftBound) this.x = leftBound;
    if (this.x > rightBound) this.x = rightBound;

    // ensure we have a segment target; pick a random short one within bounds
    if (typeof this.segmentTargetX !== 'number') {
      this.segmentTargetX = this.pickNextSegmentTarget(leftBound, rightBound);
    }

    // determine movement direction toward target
    const dir = Math.sign(this.segmentTargetX - this.x) || this.patrolDir || -1;
    const step = this.patrolSpeed;

    // if would cross bounds this tick, clamp and pause + flip
    if (dir < 0 && this.x <= leftBound) {
      this.x = leftBound;
      this.startPause(now);
      this.patrolDir = 1;
      this.segmentTargetX = undefined;
      this.otherDirection = false;
      return;
    }
    if (dir > 0 && this.x >= rightBound) {
      this.x = rightBound;
      this.startPause(now);
      this.patrolDir = -1;
      this.segmentTargetX = undefined;
      this.otherDirection = true;
      return;
    }

    // move toward target with possible overshoot handling
    const nextX = this.x + dir * step;
    const reached = (dir < 0 && nextX <= this.segmentTargetX) || (dir > 0 && nextX >= this.segmentTargetX);
    if (reached) {
      this.x = this.segmentTargetX;
      this._moving = true;
      this.otherDirection = dir < 0;
      this.startPause(now);
      // flip direction for the next leg and clear target
      this.patrolDir = -dir;
      this.segmentTargetX = undefined;
      return;
    }
    // regular step
    this.x = nextX;
    this._moving = true;
    this.otherDirection = dir < 0;
  }

  startPause(now) {
    this.isPaused = true;
    // randomize pause duration within bounds
    const pmin = Math.max(100, this.PAUSE_MIN_MS);
    const pmax = Math.max(pmin + 50, this.PAUSE_MAX_MS);
    this.pauseEndAt = now + this.randBetween(pmin, pmax);
    this._moving = false;
  }

  pickNextSegmentTarget(leftBound, rightBound) {
    const radius = this.patrolRadius;
    const minLen = Math.max(20, radius * this.SEGMENT_MIN_FRAC);
    const maxLen = Math.max(minLen + 10, radius * this.SEGMENT_MAX_FRAC);
    const len = this.randBetween(minLen, maxLen);
    const dir = this.patrolDir || -1;
    const rawTarget = this.x + dir * len;
    // clamp into bounds
    return Math.max(leftBound, Math.min(rightBound, rawTarget));
  }

  randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  // Awareness + chase + attack
  updateAggroAndChase(now) {
    this._moving = this._moving || false; // preserve patrol move flag if set
    if (this.dying || this.hurtActive) return;
    const ch = this.world?.character;
    if (!ch) return;
    if (ch.isDead?.()) return; // do nothing when the character is dead
    const leftBound = this.spawnX - this.patrolRadius;
    const rightBound = this.spawnX + this.patrolRadius;
    const dx = ch.x - this.x;
    const distX = Math.abs(dx);
    // detect
    if (!this.aware && distX <= this.detectionRadius) this.aware = true;
    if (!this.aware) return;

    // if in cooldown or currently attacking, don't move
    if (this.isAttacking) return;
    if (now < (this.attackCooldownEndAt || 0)) return;

    // choose direction toward character
    const dir = dx === 0 ? (this.otherDirection ? -1 : 1) : Math.sign(dx);
    // start attack if in range
    if (distX <= this.ATTACK_RANGE_X) {
      this.beginAttack(now, ch);
      return;
    }
    // speed up when aware
    const speed = this.chaseSpeed * this.AWARE_SPEED_MULT;
    // chase move toward character without patrol bounds constraint
    const nextX = this.x + dir * speed;
    this._moving = nextX !== this.x;
    this.otherDirection = dir < 0;
    this.x = nextX;
  }

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

  animateAttack(now) {
    const sheet = this.attackSheet;
    const aImg = this.imageCache[sheet.path];
    if (this._attackReady && aImg) {
      this.img = aImg;
    }
    // windup period shows first frame
    if (now < this.attackWindupEndAt) {
      this.setSheetFrameAuto(sheet, 0);
      return;
    }
    // advance frames
    if (now - this.attackLastAt >= this.ATTACK_FRAME_DELAY) {
      this.attackFrameIdx = Math.min(this.attackFrameIdx + 1, (sheet.count || 1) - 1);
      this.attackLastAt = now;
    }
    this.setSheetFrameAuto(sheet, this.attackFrameIdx);
    // apply damage once mid-animation
    const hitFrame = Math.floor((sheet.count || 1) / 2);
    if (!this.appliedAttackDamage && this.attackFrameIdx >= hitFrame) {
      this.tryApplyAttackDamage();
      this.appliedAttackDamage = true;
    }
    // end of attack
    if (this.attackFrameIdx >= (sheet.count || 1) - 1) {
      this.isAttacking = false;
      this.attackCooldownEndAt = now + 380; // even shorter cooldown for more pressure
      this.attackFrameIdx = 0;
    }
  }

  tryApplyAttackDamage() {
    const world = this.world;
    const ch = world?.character;
    if (!ch || !world) return;
    // Check if still in reach at hit moment
    const distX = Math.abs(ch.x - this.x);
    if (distX > this.ATTACK_RANGE_X + 10) return;
    // vertical overlap check (rough)
    const a = this.getBoundsWithOffset(this);
    const b = ch.getBoundsWithOffset?.(ch) || { top: ch.y, bottom: ch.y + ch.height };
    const vOverlap = a.bottom > b.top && a.top < b.bottom;
    if (!vOverlap) return;
    // Block check: if character is blocking and facing toward the goblin, negate damage
    if (ch.isBlocking) {
      const goblinOnRight = this.x > ch.x;
      const facingRight = !ch.otherDirection;
      const blockCovers = (goblinOnRight && facingRight) || (!goblinOnRight && ch.otherDirection);
      if (blockCovers) {
        ch.triggerBlock?.();
        // small penalty cooldown so goblin doesn't immediately re-hit
        const now = Date.now();
        this.attackCooldownEndAt = now + 350;
        // apply a horizontal knockback to attacker away from the character
        const dir = goblinOnRight ? 1 : -1; // push further away from the character
        this.knockbackVX = dir * (this.KNOCKBACK_SPEED_X || 10);
        this.knockbackEndAt = now + (this.KNOCKBACK_DURATION || 300);
        return;
      }
    }
    // apply damage via world helper (respects isHurt timing)
    world.damageCharacterIfNeeded();
    // knockback the character from goblin
    ch.applyKnockbackFrom?.(this);
  }

  // Draw overlay elements (called after main sprite). This draws the heart above the head
  // while the goblin has aggro (aware) or during the death sequence.
  drawFrame(ctx) {
    try {
      // Only visible during aggro or death sequence
      const show = (!!this.aware && !this.dead) || this.dying;
      if (!show) return;
      // Pick heart state: 1 (aggro, 0 hits), 2 (after 1 hit), 3 (after 2 hits), 4 (death)
      let state = 1;
      if (this.dying) state = 4;
      else state = Math.min(3, 1 + (this.hitCount || 0));
      const path = this.heartPaths[state];
      const img = this.imageCache?.[path];
      if (!img) return;
      const cam = this.world?.camera_x || 0;
      // Compute base draw origin consistent with World.drawObjectAt mirroring
      const baseX = this.otherDirection ? 0 : Math.round(this.x + cam);
      const baseY = Math.round(this.y);
      const dx = Math.round(baseX + (this.width - this.heartW) / 2);
      const dy = Math.round(baseY - this.heartH - this.heartYOffset);
      ctx.drawImage(img, dx, dy, this.heartW, this.heartH);
    } catch (_) {}
  }
}
