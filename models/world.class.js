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
  }

  setWorld() {
    this.character.world = this;
  }

  startGameLoop() {
    setInterval(() => {
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
  }

  drawEntities() {
    this.ctx.translate(this.camera_x, 0);
    this.addToMap(this.character);
    this.addObjectsToMap(this.level.enemies);
    this.addObjectsToMap(this.level.clouds);
    this.addObjectsToMap(this.level.coins);
    this.addObjectsToMap(this.level.bottles);
    this.addObjectsToMap(this.throwableObjects);
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
