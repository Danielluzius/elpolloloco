class Goblin extends MoveableObject {
  // All goblins share character-like size
  height = 260;
  width = 210;
  y = 180; // align to same ground line as Character
  groundY = 180;
  // idle anim
  animDelay = 220;
  idleSheet = null; // { path, cols, rows, count }
  idleOrder = null; // display order of frames (skip bad ones)
  _idleIdx = 0;
  _lastFrameAt = 0;
  // hurt anim (3 frames per assets)
  hurtSheet = null; // { path, cols:3, rows:1, count:3 }
  hurtFrameIdx = 0;
  hurtLastAt = 0;
  HURT_DELAY = 110;
  hurtActive = false;
  hurtEndAt = 0;
  MIN_HURT_TIME = 500; // ensure visible even if image loads late
  _hurtReady = false;
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
    // ensure initial image
    this.img = this.imageCache[idlePath];
    this.setSheetFrameAuto(this.idleSheet, this.idleOrder[0] || 0);

    // Tighter collision bounds to avoid oversized hitbox
    // Reduce width and height overlap area significantly
    this.offset = { top: 150, right: 80, bottom: 0, left: 80 };

    this.x = typeof x === 'number' ? x : 800;
    this.speed = 0; // stays idle for now
    // Face left by default (sprites face right natively)
    this.otherDirection = true;

    this.applyGravity();
    this.animate();
  }

  animate() {
    setInterval(() => {
      const now = Date.now();
      // update knockback motion
      this.updateKnockback(now);

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

      // Idle animation
      if (now - this._lastFrameAt >= this.animDelay) {
        const order = this.idleOrder && this.idleOrder.length ? this.idleOrder : [0];
        this._idleIdx = (this._idleIdx + 1) % order.length;
        const frame = order[this._idleIdx] ?? 0;
        this.img = this.imageCache[this.idleSheet.path] || this.img;
        this.setSheetFrameAuto(this.idleSheet, frame);
        this._lastFrameAt = now;
      }
    }, 50);
  }

  updateKnockback(now) {
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
    const now = Date.now();
    // debounce frequent hits
    if (now - (this.recentlyHitAt || 0) < 200) return;
    this.recentlyHitAt = now;
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
}
