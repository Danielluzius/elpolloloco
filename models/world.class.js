class World {
  character = new Character();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  bossStatusBar = new BossStatusBar();
  bossBarrier = null;
  bossBarrierWidth = 4;
  bossBarrierMargin = 1;
  _gameLoop = null;
  _hudLoop = null;
  _barrierLoop = null;
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
    this.startBarrierLoop();
    this.initBossHealth();
  }

  setWorld() {
    this.character.world = this;
  }

  startGameLoop() {
    this._gameLoop = setInterval(() => {
      if (this.character.isDead()) return;
      this.checkCollisions();
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

  startBarrierLoop() {
    this._barrierLoop = setInterval(() => {
      const boss = this.level.enemies.find((e) => e instanceof Endboss);
      if (!boss || !boss.awake) return (this.bossBarrier = null);
      this.updateBossBarrier(boss);
      this.enforceBossBarrier();
    }, 1000 / 60);
  }

  updateBossBarrier(boss) {
    this.bossBarrier = boss.getBarrierRect(this.bossBarrierMargin, this.bossBarrierWidth);
  }

  enforceBossBarrier() {
    if (!this.bossBarrier) return;
    if (this.character.isColliding(this.bossBarrier)) {
      const targetX = this.bossBarrier.x - this.character.width - this.bossBarrierMargin;
      if (this.character.x > targetX) this.character.x = targetX;
    }
  }

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
      if (enemy.dead) return true;
      if (!this.character.isColliding(enemy)) return true;
      // No stomping kill anymore; apply damage + knockback
      if (!(enemy instanceof Endboss)) {
        this.damageCharacterIfNeeded();
        if (typeof this.character.applyKnockbackFrom === 'function') {
          this.character.applyKnockbackFrom(enemy);
        }
      }
      return true;
    });
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
      if (this._barrierLoop) clearInterval(this._barrierLoop);
      if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
    } catch (e) {}
  }
}
