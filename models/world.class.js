class World {
  character = new Character();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  bossStatusBar = new BossStatusBar();
  _gameLoop = null;
  _hudLoop = null;
  _drawReqId = null;
  _stopped = false;
  bgSpeedScale = 0.6; // slow down background movement globally (0..1)

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard;
    this._stopped = false;
    this.draw();
    this.setWorld();
    this.startGameLoop();
    this.startHudLoop();
    this.initBossHealth();
  }

  setWorld() {
    this.character.world = this;
    // inject world reference into all enemies (for goblin AI)
    (this.level.enemies || []).forEach((e) => (e.world = this));
  }

  startGameLoop() {
    this._gameLoop = setInterval(() => {
      if (this.character.isDead()) return;
      this.checkCollisions();
      this.checkAttackHits();
      this.checkEndbossWake();
      this.checkEndbossAlertAndAttack();
    }, 1000 / 60);
  }

  startHudLoop() {
    this._hudLoop = setInterval(() => {
      this.updateHudBars();
      this.updateBossHud();
    }, 200);
  }

  updateHudBars() {
    this.statusBar.setPercentage(this.character.energy);
  }

  updateBossHud() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss && typeof boss.healthSteps === 'number') {
      this.bossStatusBar.setByStep(boss.healthSteps);
    }
  }

  // Boss barrier removed; rely on level_end_x boundary in Character movement

  // Coins, bottles, and projectiles removed

  initBossHealth() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss) boss.initHealth(this.bossStatusBar.getMaxSteps());
  }

  damageBossIfNeeded(boss) {
    const now = Date.now();
    const applied = boss.applyHit(1, now, this.bossStatusBar.getMaxSteps());
    if (applied) this.bossStatusBar.setByStep(boss.healthSteps);
  }

  checkCollisions() {
    this.level.enemies = this.level.enemies.filter((enemy) => {
      if (enemy.shouldDespawn?.()) return false;
      if (enemy.dead) return true;
      if (!this.character.isColliding(enemy)) return true;
      // Let goblin attacks control damage; avoid auto damage on mere contact
      return true;
    });
  }

  // Character melee attack vs goblins and endboss
  checkAttackHits() {
    if (!this.character.isAttackActiveWindow?.()) return;
    const hitbox = this.character.getAttackHitboxRect?.();
    if (!hitbox) return;
    for (const enemy of this.level.enemies) {
      if (!(enemy instanceof Goblin) && !(enemy instanceof Endboss)) continue;
      if (enemy.dying || enemy.dead) continue;
      // simple AABB vs rectangle
      const eb = enemy.getBoundsWithOffset?.(enemy) || {
        left: enemy.x,
        right: enemy.x + enemy.width,
        top: enemy.y,
        bottom: enemy.y + enemy.height,
      };
      const overlap =
        eb.right > hitbox.left && eb.left < hitbox.right && eb.bottom > hitbox.top && eb.top < hitbox.bottom;
      if (!overlap) continue;
      if (typeof enemy.onHitByAttack === 'function') enemy.onHitByAttack(this.character);
      else if (typeof enemy.applyHit === 'function') this.damageBossIfNeeded(enemy);
    }
  }

  stomp(enemy) {
    if (typeof enemy.killByStomp === 'function') enemy.killByStomp();
    this.character.placeOnTopOf(enemy);
    this.character.bounceAfterStomp();
    this.scheduleEnemyRemoval(enemy);
  }

  scheduleEnemyRemoval(enemy) {
    setTimeout(() => {
      this.level.enemies = this.level.enemies.filter((e) => e !== enemy);
    }, 800);
  }

  damageCharacterIfNeeded() {
    if (!this.character.isHurt()) {
      this.character.hit();
      this.statusBar.setPercentage(this.character.energy);
    }
  }

  draw() {
    if (this._stopped) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawHud();
    this.drawEntities();
    this.ctx.translate(-this.camera_x, 0);
    this._drawReqId = requestAnimationFrame(() => this.draw());
  }

  drawBackground() {
    // Draw each background object with its own parallax factor and optional drift.
    // Also ensure tiling so no images are clipped when moving left of start.
    const objs = this.level.backgroundObjects || [];
    const now = (performance && performance.now ? performance.now() : Date.now()) / 1000; // seconds
    const viewW = this.canvas.width;
    for (const obj of objs) {
      const factor = (typeof obj.getParallaxFactor === 'function' ? obj.getParallaxFactor() : 1.0) * this.bgSpeedScale;
      const drift = typeof obj.getDriftSpeed === 'function' ? obj.getDriftSpeed() : 0; // px/s
      const tileW = typeof obj.getTileStep === 'function' ? obj.getTileStep() : 720; // per-layer step
      // world-space x with camera parallax
      const camOffset = this.camera_x * factor;
      // drift accumulates over time in screen space (independent movement)
      const driftOffset = drift * now;

      // Base draw position
      const baseX = obj.x + camOffset + driftOffset;

      // Compute how many tiles we need to cover viewport
      // Draw at baseX plus neighbors to left and right to prevent gaps
      const firstTileOffset = Math.floor(-baseX / tileW) - 1; // start one tile before
      const tilesNeeded = Math.ceil(viewW / tileW) + 3; // extra margins left/right

      for (let i = 0; i < tilesNeeded; i++) {
        const dx = (firstTileOffset + i) * tileW;
        this.ctx.save();
        this.ctx.translate(dx, 0);
        // Temporarily shift obj.x to baseX for draw, without mutating permanently
        const prevX = obj.x;
        obj.x = baseX;
        this.addToMap(obj);
        obj.x = prevX;
        this.ctx.restore();
      }
    }
  }

  drawHud() {
    this.addToMap(this.statusBar);
  }
  // Removed coin/bottle HUD and icon helpers

  drawEntities() {
    this.ctx.translate(this.camera_x, 0);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.drawBossBarIfAny();
  }

  drawBossBarIfAny() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (this.bossStatusBar.updateFromBoss(boss)) this.addToMap(this.bossStatusBar);
  }

  addObjectsToMap(objects) {
    objects.forEach((obj) => {
      this.addToMap(obj);
    });
  }

  addToMap(mo) {
    mo.drawWithDirection(this.ctx);
  }

  checkEndbossWake() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    boss.wakeIfNear(this.character);
  }

  checkEndbossAlertAndAttack() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    boss.checkAndStartAttack(this);
  }

  stop() {
    this._stopped = true;
    try {
      if (this._gameLoop) clearInterval(this._gameLoop);
      if (this._hudLoop) clearInterval(this._hudLoop);
      if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
    } catch (e) {}
  }
}
