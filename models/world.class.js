class World {
  character = new Character();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  statusBar = new StatusBar();
  characterHealthBar = new CharacterHealthBar();
  characterBlockBar = new CharacterBlockBar();
  potionHud = new PotionHUD();
  blockPotionHud = new BlockPotionHUD();
  bossSegBar = new BossSegmentHealthBar();
  bossStatusBar = new BossStatusBar();
  _gameLoop = null;
  _hudLoop = null;
  _drawReqId = null;
  _stopped = false;
  bgSpeedScale = 1.0; // exact parallax factors without global scaling

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
    this.initCharacterHealth();
    // Start intro animation: character walks in from left edge to its default start X
    try {
      const targetX = this.character.defaultStartX || 0;
      const startX = -Math.max(100, this.character.width); // off-screen left
      if (typeof this.character.startIntroWalk === 'function') {
        this.character.startIntroWalk(startX, targetX);
      }
    } catch (_) {}
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
      this.checkPotionPickup();
      this.checkPotionUse();
      this.checkBlockPotionPickup();
      this.checkBlockPotionUse();
    }, 1000 / 60);
  }

  startHudLoop() {
    this._hudLoop = setInterval(() => {
      this.updateHudBars();
      this.updateBossHud();
    }, 200);
  }

  updateHudBars() {
    // Keep legacy percentage bar in sync (if used elsewhere)
    this.statusBar.setPercentage(this.character.energy);
    // Update 3-segment character bar immediately
    if (typeof this.character.healthSegments === 'number') {
      this.characterHealthBar.setSegments(this.character.healthSegments);
    }
    // Update block bar
    if (typeof this.character.blockSegments === 'number') {
      this.characterBlockBar.setSegments(this.character.blockSegments);
    }
    // Update potion HUD (0 or 1)
    const count = this.getPotionCount();
    this.potionHud.setCount(count);
    // Update block potion HUD (0 or 1)
    this.blockPotionHud.setCount(this.getBlockPotionCount());
  }

  updateBossHud() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || boss.dead || !boss.awake) return;
    // Ensure segmented bar matches boss position and visibility
    if (this.bossSegBar.updateFromBoss(boss)) {
      const steps = typeof boss.healthSteps === 'number' ? boss.healthSteps : this.bossSegBar.getMaxSteps();
      this.bossSegBar.setByStep(steps);
    }
  }

  // Boss barrier removed; rely on level_end_x boundary in Character movement

  // Coins, bottles, and projectiles removed

  initBossHealth() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (boss) boss.initHealth(10); // Exact 10 HP (10 segments)
  }

  initCharacterHealth() {
    this.character.healthSegments = 5;
    this.character.energy = 100; // compatibility with code that reads energy
    this.characterHealthBar.setSegments(5);
    // Init block bar (5 blocks)
    this.character.blockSegments = 5;
    // Align block bar size/position to health bar
    this.characterBlockBar.width = this.characterHealthBar.width;
    this.characterBlockBar.height = this.characterHealthBar.height;
    this.characterBlockBar.x = this.characterHealthBar.x;
    this.characterBlockBar.y = (this.characterHealthBar.y || 0) + (this.characterHealthBar.height || 20) + 4;
    this.characterBlockBar.setSegments(this.character.blockSegments);
    // Align potion HUD next to health bar
    this.potionHud.x = this.characterHealthBar.x + this.characterHealthBar.width + 12;
    this.potionHud.y =
      this.characterHealthBar.y + Math.floor((this.characterHealthBar.height - this.potionHud.height) / 2);
    // Place block potion HUD to the right of heart potion HUD
    this.blockPotionHud.x = this.potionHud.x + this.potionHud.width + 36;
    this.blockPotionHud.y = this.potionHud.y;
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
    // Rock collisions: block horizontal movement if colliding and not clearly above the rock
    for (const rock of this.level.rocks || []) {
      const a = this.character.getBoundsWithOffset?.(this.character) || {
        left: this.character.x,
        right: this.character.x + this.character.width,
        top: this.character.y,
        bottom: this.character.y + this.character.height,
      };
      const b = rock.getBoundsWithOffset?.(rock) || {
        left: rock.x,
        right: rock.x + rock.width,
        top: rock.y,
        bottom: rock.y + rock.height,
      };
      const overlap = a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
      if (!overlap) continue;
      // If the character's feet are at or above the rock top (jumping over), allow pass-through
      const feetAboveTop = a.bottom <= b.top + 4;
      if (feetAboveTop) continue;
      // Resolve horizontal penetration by the minimal push
      const pushLeft = a.right - b.left; // push character left by this
      const pushRight = b.right - a.left; // push character right by this
      if (pushLeft < pushRight) {
        this.character.x -= pushLeft;
      } else {
        this.character.x += pushRight;
      }
    }
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
      if (typeof enemy.onHitByAttack === 'function') {
        enemy.onHitByAttack(this.character);
      } else if (enemy instanceof Endboss && typeof enemy.applyHit === 'function') {
        const atkId = this.character.attackId ?? null;
        const now = Date.now();
        enemy.applyHit(1, now, 10, atkId);
      } else if (typeof enemy.applyHit === 'function') {
        this.damageBossIfNeeded(enemy);
      }
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
      const died = this.character.applySegmentHit?.();
      // Immediate HUD updates after each hit
      this.characterHealthBar.setSegments(this.character.healthSegments || 0);
      this.statusBar.setPercentage(this.character.energy);
    }
  }

  draw() {
    if (this._stopped) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawHud();
    this.drawEntities();
    this._drawReqId = requestAnimationFrame(() => this.draw());
  }

  drawBackground() {
    // Draw background in screen space with parallax factors, no world mutation
    const objs = this.level.backgroundObjects || [];
    const now = (performance && performance.now ? performance.now() : Date.now()) / 1000; // seconds
    const viewW = this.canvas.width;
    for (const obj of objs) {
      const factor = (typeof obj.getParallaxFactor === 'function' ? obj.getParallaxFactor() : 1.0) * this.bgSpeedScale;
      const drift = typeof obj.getDriftSpeed === 'function' ? obj.getDriftSpeed() : 0; // px/s
      const tileW = typeof obj.getTileStep === 'function' ? obj.getTileStep() : 720; // per-layer step
      const baseX = Math.round(obj.x + this.camera_x * factor + drift * now);
      const y = Math.round(obj.y);
      if (tileW && tileW > 0) {
        const firstTileOffset = Math.floor(-baseX / tileW) - 1;
        const tilesNeeded = Math.ceil(viewW / tileW) + 3;
        for (let i = 0; i < tilesNeeded; i++) {
          const dx = baseX + (firstTileOffset + i) * tileW;
          this.drawObjectAt(obj, dx, y);
        }
      } else {
        // Non-tiled background sprite
        this.drawObjectAt(obj, baseX, y);
      }
    }
  }

  drawHud() {
    // HUD/UI stays absolute: factor 0
    this.drawObjectAt(
      this.characterHealthBar,
      Math.round(this.characterHealthBar.x),
      Math.round(this.characterHealthBar.y)
    );
    // Draw block bar under health bar
    this.drawObjectAt(
      this.characterBlockBar,
      Math.round(this.characterBlockBar.x),
      Math.round(this.characterBlockBar.y)
    );
    // Draw potion icon + count
    this.drawObjectAt(this.potionHud, Math.round(this.potionHud.x), Math.round(this.potionHud.y));
    // Draw block potion icon + count
    this.drawObjectAt(this.blockPotionHud, Math.round(this.blockPotionHud.x), Math.round(this.blockPotionHud.y));
  }
  // Removed coin/bottle HUD and icon helpers

  drawEntities() {
    // main world (1.0)
    const f = 1.0;
    this.drawObjectAt(this.character, Math.round(this.character.x + this.camera_x * f), Math.round(this.character.y));
    // Barriers before enemies if any
    for (const b of this.level.barriers || []) {
      this.drawObjectAt(b, Math.round(b.x + this.camera_x * f), Math.round(b.y));
    }
    // Static rocks (obstacles to jump over)
    for (const r of this.level.rocks || []) {
      this.drawObjectAt(r, Math.round(r.x + this.camera_x * f), Math.round(r.y));
    }
    // Enemies
    for (const e of this.level.enemies || []) {
      this.drawObjectAt(e, Math.round(e.x + this.camera_x * f), Math.round(e.y));
    }
    // Potions in world
    for (const p of this.level.potions || []) {
      this.drawObjectAt(p, Math.round(p.x + this.camera_x * f), Math.round(p.y));
    }
    // Block potions in world
    for (const bp of this.level.blockPotions || []) {
      this.drawObjectAt(bp, Math.round(bp.x + this.camera_x * f), Math.round(bp.y));
    }
    // Clouds as mid layer (0.4)
    const fMid = 0.4;
    for (const c of this.level.clouds || []) {
      this.drawObjectAt(c, Math.round(c.x + this.camera_x * fMid), Math.round(c.y));
    }
    // Foreground overlays: always drawn last so they appear above character and enemies
    for (const fo of this.level.foregroundObjects || []) {
      this.drawObjectAt(fo, Math.round(fo.x + this.camera_x * f), Math.round(fo.y));
    }
    this.drawBossBarIfAny();
  }

  drawBossBarIfAny() {
    // Draw boss segmented bar above the boss in world space
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || boss.dead || !boss.awake) return;
    // Update bar dimensions/position from boss and sync steps
    if (this.bossSegBar.updateFromBoss(boss)) {
      if (typeof boss.healthSteps === 'number') this.bossSegBar.setByStep(boss.healthSteps);
    }
    const f = 1.0; // same world parallax as entities
    const sx = Math.round(this.bossSegBar.x + this.camera_x * f);
    const sy = Math.round(this.bossSegBar.y);
    this.drawObjectAt(this.bossSegBar, sx, sy);
  }

  // Helper: draw object with optional mirroring at a specific screen position
  drawObjectAt(obj, sx, sy) {
    if (!obj) return;
    if (!obj.otherDirection) {
      obj.drawAt(this.ctx, sx, sy);
      obj.drawFrame?.(this.ctx);
      obj.drawDebugHitboxes?.(this.ctx, sx, sy);
      return;
    }
    this.ctx.save();
    this.ctx.translate(sx + obj.width, 0);
    this.ctx.scale(-1, 1);
    obj.drawAt(this.ctx, 0, sy);
    obj.drawFrame?.(this.ctx);
    obj.drawDebugHitboxes?.(this.ctx, 0, sy);
    this.ctx.restore();
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

  // Potion helpers
  getPotionCount() {
    // One-slot system: 1 if any picked up and not used yet
    return this._hasPotion ? 1 : 0;
  }

  checkPotionPickup() {
    if (!this.level?.potions?.length) return;
    // simple AABB collision with character
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.potions = this.level.potions.filter((p) => {
      const pb = p.getBoundsWithOffset?.(p);
      const overlap = pb.right > charB.left && pb.left < charB.right && pb.bottom > charB.top && pb.top < charB.bottom;
      if (!overlap) return true;
      // If already carrying one, keep potion in the world
      if (this._hasPotion) return true;
      // Otherwise pick up and remove from world
      this._hasPotion = true;
      return false;
    });
  }

  checkPotionUse() {
    if (!this._hasPotion) return;
    if (!this.keyboard?.ONE) return;
    // Use potion only once per key press
    if (this._usePotionLatch) return;
    this._usePotionLatch = true;
    try {
      this.usePotion();
    } finally {
      // unlock after short delay to avoid auto-repeat
      setTimeout(() => (this._usePotionLatch = false), 200);
    }
  }

  usePotion() {
    if (!this._hasPotion) return;
    const maxSeg = this.characterHealthBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.healthSegments ?? maxSeg));
    if (cur >= maxSeg) return; // already full, don't consume
    const next = Math.min(maxSeg, cur + 1);
    this.character.healthSegments = next;
    // Map to energy for legacy bar
    const segToEnergy = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 };
    this.character.energy = segToEnergy[next] ?? Math.round((next / maxSeg) * 100);
    this._hasPotion = false;
    // Immediate HUD update
    this.characterHealthBar.setSegments(next);
    this.statusBar.setPercentage(this.character.energy);
    this.potionHud.setCount(0);
  }

  // Block potion helpers
  getBlockPotionCount() {
    return this._hasBlockPotion ? 1 : 0;
  }

  checkBlockPotionPickup() {
    if (!this.level?.blockPotions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.blockPotions = this.level.blockPotions.filter((bp) => {
      const bb = bp.getBoundsWithOffset?.(bp);
      const overlap = bb.right > charB.left && bb.left < charB.right && bb.bottom > charB.top && bb.top < charB.bottom;
      if (!overlap) return true;
      if (this._hasBlockPotion) return true; // already carrying one
      this._hasBlockPotion = true;
      return false;
    });
  }

  checkBlockPotionUse() {
    if (!this._hasBlockPotion) return;
    if (!this.keyboard?.TWO) return;
    if (this._useBlockPotionLatch) return;
    this._useBlockPotionLatch = true;
    try {
      this.useBlockPotion();
    } finally {
      setTimeout(() => (this._useBlockPotionLatch = false), 200);
    }
  }

  useBlockPotion() {
    if (!this._hasBlockPotion) return;
    const maxSeg = this.characterBlockBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.blockSegments ?? maxSeg));
    if (cur >= maxSeg) return; // already full, don't consume
    const next = Math.min(maxSeg, cur + 1);
    this.character.blockSegments = next;
    this._hasBlockPotion = false;
    // Immediate HUD update
    this.characterBlockBar.setSegments(next);
    this.blockPotionHud.setCount(0);
  }
}
