class World {
  character = new Character();
  level = level1;
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

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard;
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
    setInterval(() => {
  if (this.character.isDead()) return; // pause gameplay when player is dead
      this.checkCollisions();
      this.checkThrowableObjects();
      this.checkCoinCollection();
      this.checkBottleCollection();
      this.checkEndbossWake();
      this.checkEndbossAlertAndAttack();
    }, 1000 / 60);
  }

  startHudLoop() {
    setInterval(() => {
      const p = this.coinsTotal > 0 ? (this.coinsCollected / this.coinsTotal) * 100 : 0;
      this.coinStatusBar.setPercentage(p);
      const bp = this.bottlesTotal > 0 ? (this.bottlesCollected / this.bottlesTotal) * 100 : 0;
      this.bottleStatusBar.setPercentage(bp);
      // Player health bar already uses percentage of energy; keep as-is.
      this.statusBar.setPercentage(this.character.energy);
      // Update boss bar position and step from boss state if awake
      const boss = this.level.enemies.find((e) => e instanceof Endboss);
      if (boss) {
        // Position above boss, but HUD layer is camera-fixed; so we draw boss bar in entity layer aligned to camera.
        // Here we only update step.
        if (typeof boss.healthSteps === 'number') {
          this.bossStatusBar.setByStep(boss.healthSteps);
        }
      }
    }, 200);
  }

  startBarrierLoop() {
    setInterval(() => {
      const boss = this.level.enemies.find((e) => e instanceof Endboss);
      if (!boss || !boss.awake) {
        this.bossBarrier = null;
        return;
      }
      const barrierX = boss.x + boss.width - this.bossBarrierMargin;
      this.bossBarrier = {
        x: barrierX,
        y: -1000,
        width: this.bossBarrierWidth,
        height: 3000,
        offset: { top: 0, right: 0, bottom: 0, left: 0 },
      };
      if (this.character.isColliding(this.bossBarrier)) {
        const targetX = this.bossBarrier.x - this.character.width - this.bossBarrierMargin;
        if (this.character.x > targetX) {
          this.character.x = targetX;
        }
      }
    }, 1000 / 60);
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
    if (this.keyboard.D && this.bottlesCollected > 0 && now - this.lastThrowAt >= this.throwCooldownMs) {
      const bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
      this.throwableObjects.push(bottle);
      this.bottlesCollected = Math.max(0, this.bottlesCollected - 1);
      this.lastThrowAt = now;
    }
    // Bottle vs Endboss collisions
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss && this.throwableObjects.length) {
      this.throwableObjects = this.throwableObjects.filter((b) => {
        if (this.isCollidingBottleWithBoss(b, boss)) {
          if (typeof b.splashAndRemove === 'function') b.splashAndRemove(this);
          this.damageBossIfNeeded(boss);
          return false; // remove bottle after hit
        }
        // remove bottles that leave world bounds to avoid leaks
        return b.x < this.level.level_end_x + 500 && b.y < 1000 && b.y > -500;
      });
    }
  }

  isCollidingBottleWithBoss(bottle, boss) {
    return bottle.isColliding(boss);
  }

  initBossHealth() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss) {
      boss.healthSteps = this.bossStatusBar.getMaxSteps(); // start full
      boss.maxHealthSteps = boss.healthSteps;
      boss.lastHitAt = 0;
      boss.hitCooldownMs = 250; // prevent multi-hit per frame
    }
  }

  damageBossIfNeeded(boss) {
    const now = Date.now();
    if (!boss.lastHitAt || now - boss.lastHitAt >= boss.hitCooldownMs) {
      boss.healthSteps = Math.max(0, (boss.healthSteps ?? this.bossStatusBar.getMaxSteps()) - 1);
      boss.lastHitAt = now;
      if (boss.healthSteps === 0) {
        boss.dead = true;
        boss.speed = 0;
        boss.state = 'dead';
        boss.frameIndex = 0;
      }
    }
  }

  checkCollisions() {
    this.level.enemies = this.level.enemies.filter((enemy) => {
      if (enemy.dead) return true;
      if (!this.character.isColliding(enemy)) return true;
      if (this.canStomp(enemy)) {
        this.stomp(enemy);
        return true;
      }
      this.damageCharacterIfNeeded();
      return true;
    });
  }

  canStomp(enemy) {
    if (!(this.character.speedY < 0)) return false;
    const aBottom = this.character.y + this.character.height - (this.character.offset?.bottom || 0);
    const prevBottom = aBottom + this.character.speedY;
    const bTop = enemy.y + (enemy.offset?.top || 0);
    const bTopExpanded = Math.max(enemy.y, bTop - 8);
    const tolerance = 24;
    return prevBottom <= bTopExpanded + tolerance && !(enemy instanceof Endboss);
  }

  stomp(enemy) {
    enemy.dead = true;
    enemy.speed = 0;
    const path =
      enemy instanceof ChickenSmall
        ? 'assets/img/3_enemies_chicken/chicken_small/2_dead/dead.png'
        : 'assets/img/3_enemies_chicken/chicken_normal/2_dead/dead.png';
    enemy.loadImage(path);
    const enemyTop = enemy.y + (enemy.offset?.top || 0);
    const charBottomOffset = this.character.offset?.bottom || 0;
    this.character.y = enemyTop - (this.character.height - charBottomOffset) - 2;
    this.character.speedY = 18;
    this.character.isJumping = true;
    this.character.jumpFrameIndex = 0;
    this.character.currentImage = 0;
    this.character.lastJumpFrameTime = Date.now();
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawHud();
    this.drawEntities();
    this.ctx.translate(-this.camera_x, 0);
    requestAnimationFrame(() => this.draw());
  }

  drawBackground() {
    this.ctx.translate(this.camera_x, 0);
    this.addObjectsToMap(this.level.backgroundObjects);
    this.ctx.translate(-this.camera_x, 0);
  }

  drawHud() {
    this.addToMap(this.statusBar);
    this.addToMap(this.coinStatusBar);
    this.addToMap(this.bottleStatusBar);
    // Boss bar is drawn with entities to position above boss
    this.drawHudCounts();
  }

  drawHudCounts() {
  // coin and bottle counts with icons, positioned to the right and vertically centered
    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
  const coinText = `${this.coinsCollected}/${this.coinsTotal}`;
  const bottleText = `${this.bottlesCollected}`;
  // Base positions
  const csb = this.coinStatusBar;
  const bsb = this.bottleStatusBar;
  const coinBaseX = (csb.x || 40) + (csb.width || 200) + 24;
  const coinCenterY = (csb.y || 45) + (csb.height || 60) / 2;
  const bottleBaseX = (bsb.x || 40) + (bsb.width || 200) + 24;
  const bottleCenterY = (bsb.y || 85) + (bsb.height || 60) / 2;
  // Icons (a bit further right)
  const coinIcon = this.getHudIcon('assets/img/7_statusbars/3_icons/icon_coin.png');
  const bottleIcon = this.getHudIcon('assets/img/7_statusbars/3_icons/icon_salsa_bottle.png');
  if (coinIcon?.complete) this.ctx.drawImage(coinIcon, coinBaseX, coinCenterY - 11, 22, 22);
  if (bottleIcon?.complete) this.ctx.drawImage(bottleIcon, bottleBaseX, bottleCenterY - 11, 22, 22);
  // Text slightly to the right of the icons; baseline aligned near middle
  this.ctx.fillText(coinText, coinBaseX + 28, coinCenterY + 7);
  this.ctx.fillText(bottleText, bottleBaseX + 28, bottleCenterY + 7);
    this.ctx.restore();
  }

  getHudIcon(path) {
    // cache icons in status bar imageCache via a tiny helper image map
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
    if (!boss || boss.dead || !boss.awake) return;
    // Position boss bar above boss in world space
    this.bossStatusBar.x = boss.x + boss.width / 2 - this.bossStatusBar.width / 2;
    this.bossStatusBar.y = boss.y - 30;
    this.addToMap(this.bossStatusBar);
  }

  addObjectsToMap(objects) {
    objects.forEach((obj) => {
      this.addToMap(obj);
    });
  }

  addToMap(mo) {
    if (mo.otherDirection) {
      this.flipImage(mo);
    }
    mo.draw(this.ctx);
    mo.drawFrame(this.ctx);

    if (mo.otherDirection) {
      this.flipImageBack(mo);
    }
  }

  checkEndbossWake() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    const dx = Math.abs(this.character.x + this.character.width / 2 - (boss.x + boss.width / 2));
    if (dx < 500) {
      boss.awake = true;
      if (!boss.alertPlayed && boss.state === 'idle') {
        boss.state = 'alert';
        boss.frameIndex = 0;
        boss.lastFrameTime = Date.now();
      }
    }
  }

  checkEndbossAlertAndAttack() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || !boss.awake) return;
  if (this.character.isDead()) return;
    const now = Date.now();
    const dx = Math.abs(this.character.x + this.character.width / 2 - (boss.x + boss.width / 2));
    const inRange = dx < 140;
    const cooled = now - (boss.lastAttackAt || 0) >= boss.attackCooldown;
    if (inRange && cooled && boss.state !== 'attack') {
      boss.state = 'attack';
      boss.frameIndex = 0;
      boss.lastFrameTime = now;
      boss.lastAttackAt = now;
      const hitWindowStart = 3;
      setTimeout(() => {
        if (boss.state === 'attack') {
          const closeNow = Math.abs(this.character.x + this.character.width / 2 - (boss.x + boss.width / 2)) < 150;
          if (closeNow && !this.character.isHurt()) {
            this.character.hit();
            this.statusBar.setPercentage(this.character.energy);
          }
        }
      }, hitWindowStart * boss.ATTACK_DELAY);
    }
  }

  flipImage(mo) {
    this.ctx.save();
    this.ctx.translate(mo.width, 0);
    this.ctx.scale(-1, 1);
    mo.x = mo.x * -1;
  }

  flipImageBack(mo) {
    mo.x = mo.x * -1;
    this.ctx.restore();
  }
}
