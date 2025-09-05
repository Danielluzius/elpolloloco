class World {
  character = new Character();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  coinStatusBar = new CoinStatusBar();
  bottleStatusBar = new BottleStatusBar();
  bossStatusBar = new BossStatusBar();
  throwableObjects = [];
  coinsCollected = 0;
  coinsTotal = 0;
  bottlesCollected = 0;
  bottlesTotal = 0;
  lastThrowAt = 0;
  throwCooldownMs = 300;
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
    this.coinsTotal = this.level.coins && this.level.coins.length ? this.level.coins.length : 0;
    this.bottlesTotal = this.level.bottles && this.level.bottles.length ? this.level.bottles.length : 0;
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
      this.checkThrowableObjects();
      this.checkCoinCollection();
      this.checkBottleCollection();
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
    const p = this.coinsTotal > 0 ? (this.coinsCollected / this.coinsTotal) * 100 : 0;
    this.coinStatusBar.setPercentage(p);
    const bp = this.bottlesTotal > 0 ? (this.bottlesCollected / this.bottlesTotal) * 100 : 0;
    this.bottleStatusBar.setPercentage(bp);
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

  checkCoinCollection() {
    this.level.coins = this.level.coins.filter((coin) => {
      if (this.character.isColliding(coin)) {
        this.coinsCollected++;
        return false;
      }
      return true;
    });
  }

  checkBottleCollection() {
    this.level.bottles = this.level.bottles.filter((bottle) => {
      if (this.character.isColliding(bottle)) {
        this.bottlesCollected++;
        return false;
      }
      return true;
    });
  }

  checkThrowableObjects() {
    const now = Date.now();
    this.handleThrowInput(now);
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss && this.throwableObjects.length) this.updateProjectiles(boss);
  }

  handleThrowInput(now) {
    const canThrow = this.character.shouldThrow(now, this.throwCooldownMs, this.lastThrowAt, this.bottlesCollected);
    if (!canThrow) return;
    const bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
    this.throwableObjects.push(bottle);
    this.bottlesCollected = Math.max(0, this.bottlesCollected - 1);
    this.lastThrowAt = now;
  }

  updateProjectiles(boss) {
    this.throwableObjects = this.throwableObjects.filter((b) => {
      if (b.intersects(boss) && !b.hitted) {
        b.onHitBoss(this, boss);
        return false;
      }
      return !b.shouldDespawn(this.level);
    });
  }

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
    this.addToMap(this.coinStatusBar);
    this.addToMap(this.bottleStatusBar);
    this.drawHudCounts();
  }

  drawHudCounts() {
    const layout = this.computeHudLayout();
    this.drawHudIconsAndText(layout);
  }

  computeHudLayout() {
    const csb = this.coinStatusBar;
    const bsb = this.bottleStatusBar;
    return {
      coinText: `${this.coinsCollected}/${this.coinsTotal}`,
      bottleText: `${this.bottlesCollected}`,
      coinBaseX: (csb.x || 40) + (csb.width || 200) + 24,
      coinCenterY: (csb.y || 45) + (csb.height || 60) / 2,
      bottleBaseX: (bsb.x || 40) + (bsb.width || 200) + 24,
      bottleCenterY: (bsb.y || 85) + (bsb.height || 60) / 2,
    };
  }

  drawHudIconsAndText(l) {
    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    const coinIcon = this.getHudIcon('assets/img/7_statusbars/3_icons/icon_coin.png');
    const bottleIcon = this.getHudIcon('assets/img/7_statusbars/3_icons/icon_salsa_bottle.png');
    if (coinIcon?.complete) this.ctx.drawImage(coinIcon, l.coinBaseX, l.coinCenterY - 11, 22, 22);
    if (bottleIcon?.complete) this.ctx.drawImage(bottleIcon, l.bottleBaseX, l.bottleCenterY - 11, 22, 22);
    this.ctx.fillText(l.coinText, l.coinBaseX + 28, l.coinCenterY + 7);
    this.ctx.fillText(l.bottleText, l.bottleBaseX + 28, l.bottleCenterY + 7);
    this.ctx.restore();
  }

  getHudIcon(path) {
    if (!this._hudIcons) this._hudIcons = {};
    if (!this._hudIcons[path]) {
      const img = new Image();
      img.src = path;
      this._hudIcons[path] = img;
    }
    return this._hudIcons[path];
  }

  drawEntities() {
    this.ctx.translate(this.camera_x, 0);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.addObjectsToMap(this.level.coins);
    this.addObjectsToMap(this.level.bottles);
    this.addObjectsToMap(this.throwableObjects);
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
