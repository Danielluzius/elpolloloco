class World {
  character = new CharacterPlayer();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  // Removed legacy StatusBar; only segmented bars remain
  characterHealthBar = new CharacterHealthBar();
  characterBlockBar = new CharacterBlockBar();
  characterChargeBar = new CharacterChargeBar();
  potionHud = new PotionHUD();
  blockPotionHud = new BlockPotionHUD();
  bossSegBar = new BossSegmentHealthBar();
  // Removed BossStatusBar; we draw only the segmented boss bar
  goblinCounter = new GoblinCounterHUD();
  _gameLoop = null;
  _hudLoop = null;
  _drawReqId = null;
  _stopped = false;
  bgSpeedScale = 1.0; // exact parallax factors without global scaling
  // Boss intro cutscene state
  bossIntroActive = false;
  bossIntroDone = false;
  _bossIntroCamTimer = null;
  _bossIntroWalkTimer = null;
  _bossIntroReturnCamTimer = null;
  _bossIntroHudSwitchTimer = null;
  _savedKeyboardRef = null;
  introCamX = undefined;
  // Positive values move the camera further left (boss appears more to the right)
  bossIntroCamOffsetX = 200;

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
    this.initGoblinCounter();
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
      // Trigger boss intro once when all goblins are defeated
      this.checkBossIntroTrigger();
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
      this.updateGoblinCounter();
    }, 200);
  }

  updateHudBars() {
    // Legacy StatusBar removed
    // Update 3-segment character bar immediately
    if (typeof this.character.healthSegments === 'number') {
      this.characterHealthBar.setSegments(this.character.healthSegments);
    }
    // Update block bar
    if (typeof this.character.blockSegments === 'number') {
      this.characterBlockBar.setSegments(this.character.blockSegments);
    }
    // Update charge bar
    if (typeof this.character.chargeSegments === 'number') {
      this.characterChargeBar.setSegments(this.character.chargeSegments);
    }
    // Update potion HUD (0 or 1)
    const count = this.getPotionCount();
    this.potionHud.setCount(count);
    // Update block potion HUD (0 or 1)
    this.blockPotionHud.setCount(this.getBlockPotionCount());
  }

  // Central helper to add charge and update HUD
  awardCharge(amount = 1) {
    const maxSeg = this.characterChargeBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.chargeSegments ?? 0));
    const next = Math.min(maxSeg, cur + Math.max(0, amount | 0));
    if (next !== cur) {
      this.character.chargeSegments = next;
      this.characterChargeBar.setSegments(next);
    }
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

  updateGoblinCounter() {
    try {
      // When in objective mode, keep the text; do not update numeric counter anymore
      if (this.goblinCounter?.mode === 'objective') return;
      const total =
        this._goblinTotal != null
          ? this._goblinTotal
          : this.level?.enemies?.filter?.((e) => e instanceof Goblin)?.length || 0;
      this.goblinCounter.setTotals(total, this._goblinsKilled || 0);
    } catch (_) {}
  }

  // True when the goblin counter is finished (all goblins defeated)
  areAllGoblinsCleared() {
    const total = this._goblinTotal ?? 0;
    const killed = this._goblinsKilled ?? 0;
    if (total <= 0) return false; // no data yet -> treat as not cleared
    return killed >= total;
  }

  // Boss barrier removed; rely on level_end_x boundary in Character movement

  // Cutscene: camera pans to boss, boss walks left briefly, back to idle, then camera returns
  checkBossIntroTrigger() {
    if (this.bossIntroDone || this.bossIntroActive) return;
    if (!this.areAllGoblinsCleared()) return;
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    this.startBossIntro(boss);
  }

  startBossIntro(boss) {
    try {
      this.bossIntroActive = true;
      // Lock player controls
      this._savedKeyboardRef = this.keyboard;
      this.keyboard = {};
      // Lock camera control (Character respects world.introCamX / bossIntroActive)
      const from = this.camera_x || 0;
      // Aim slightly left of center using an offset so we see more space on the right
      const center = (this.canvas?.width || 720) / 2;
      const offset = this.bossIntroCamOffsetX || 0;
      const target = Math.round(center + offset - (boss.x + (boss.width || 0) / 2));
      const dur = 1200;
      this.animateCamera(from, target, dur, () => {
        // Make boss walk a short distance to the left in walk animation
        const walkDist = 220; // pixels
        const walkSpeed = 2.0; // px per frame
        const targetX = boss.x - walkDist;
        // Switch HUD to objective with a 2s delay after the boss starts moving
        try {
          if (this._bossIntroHudSwitchTimer) clearTimeout(this._bossIntroHudSwitchTimer);
          this._bossIntroHudSwitchTimer = setTimeout(() => {
            this._bossIntroHudSwitchTimer = null;
            this.goblinCounter?.enableObjectiveMode?.('DEFEAT THE', 'GOBLIN KING');
          }, 1000);
        } catch (_) {}
        // Force visual state to walk during the scripted move
        boss.state = 'walk';
        boss.frameIndex = 0;
        boss.otherDirection = true; // face left
        this._bossIntroWalkTimer = setInterval(() => {
          // Stop conditions
          if (!this.bossIntroActive) return this.clearBossIntroWalk();
          const nextX = Math.max(targetX, boss.x - walkSpeed);
          boss.x = nextX;
          boss.otherDirection = true;
          if (boss.x <= targetX + 0.5) {
            this.clearBossIntroWalk();
            // Switch back to idle
            boss.state = 'idle';
            boss.frameIndex = 0;
            // Hold camera briefly, then return to character
            setTimeout(() => this.returnCameraToCharacter(), 500);
          }
        }, 1000 / 60);
      });
    } catch (_) {
      // On any error, make sure we resume gameplay
      this.finishBossIntro();
    }
  }

  clearBossIntroWalk() {
    try {
      if (this._bossIntroWalkTimer) clearInterval(this._bossIntroWalkTimer);
    } catch (_) {}
    this._bossIntroWalkTimer = null;
  }

  animateCamera(from, to, durationMs, onDone) {
    const start = Date.now();
    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    if (this._bossIntroCamTimer) {
      try {
        clearInterval(this._bossIntroCamTimer);
      } catch (_) {}
    }
    this._bossIntroCamTimer = setInterval(() => {
      const now = Date.now();
      const t = Math.max(0, Math.min(1, (now - start) / durationMs));
      const k = easeInOutQuad(t);
      this.introCamX = from + (to - from) * k;
      this.camera_x = this.introCamX;
      if (t >= 1) {
        clearInterval(this._bossIntroCamTimer);
        this._bossIntroCamTimer = null;
        if (typeof onDone === 'function') onDone();
      }
    }, 1000 / 60);
  }

  returnCameraToCharacter() {
    const char = this.character;
    const target = -char.x + 100;
    const from = this.camera_x || 0;
    this.animateCamera(from, target, 1000, () => this.finishBossIntro());
  }

  finishBossIntro() {
    // Restore controls and clear flags
    if (this._savedKeyboardRef) this.keyboard = this._savedKeyboardRef;
    this._savedKeyboardRef = null;
    this.bossIntroActive = false;
    this.bossIntroDone = true;
    // Ensure camera lock is released
    this.introCamX = undefined;
    // Cleanup delayed HUD switch if still pending
    try {
      if (this._bossIntroHudSwitchTimer) clearTimeout(this._bossIntroHudSwitchTimer);
    } catch (_) {}
    this._bossIntroHudSwitchTimer = null;
  }

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
    // Init and align charge bar (starts empty)
    this.character.chargeSegments = 0;
    this.characterChargeBar.width = this.characterHealthBar.width;
    this.characterChargeBar.height = this.characterHealthBar.height;
    this.characterChargeBar.x = this.characterHealthBar.x;
    this.characterChargeBar.y = (this.characterBlockBar.y || 0) + (this.characterBlockBar.height || 20) + 4;
    this.characterChargeBar.setSegments(this.character.chargeSegments);
    // Align potion HUD next to health bar
    this.potionHud.x = this.characterHealthBar.x + this.characterHealthBar.width + 12;
    this.potionHud.y =
      this.characterHealthBar.y + Math.floor((this.characterHealthBar.height - this.potionHud.height) / 2);
    // Place block potion HUD below the heart potion HUD
    this.blockPotionHud.x = this.potionHud.x;
    this.blockPotionHud.y = this.potionHud.y + this.potionHud.height + 8;
  }

  initGoblinCounter() {
    // Compute total goblins in the level (exclude endboss)
    const total = this.level?.enemies?.filter?.((e) => e instanceof Goblin)?.length || 0;
    this._goblinTotal = total;
    this._goblinsKilled = 0;
    // Move the counter a bit further down from the very top
    this.goblinCounter.y = 56; // title at ~56px, numbers line at ~78px
    // Shift a bit to the right from absolute center
    this.goblinCounter.xOffset = 140; // further right per request
    this.updateGoblinCounter();
  }

  damageBossIfNeeded(boss) {
    const now = Date.now();
    boss.applyHit(1, now, this.bossSegBar.getMaxSteps());
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
        // Goblin handles gating and will call world.awardCharge()
        enemy.onHitByAttack(this.character);
      } else if (enemy instanceof Endboss && typeof enemy.applyHit === 'function') {
        const atkId = this.character.attackId ?? null;
        const now = Date.now();
        const applied = enemy.applyHit(1, now, 10, atkId);
        if (applied) this.awardCharge(1);
      } else if (typeof enemy.applyHit === 'function') {
        this.damageBossIfNeeded(enemy);
      }
    }
  }

  // Removed legacy stomp/remove helpers (no longer used)

  damageCharacterIfNeeded() {
    if (!this.character.isHurt()) {
      const died = this.character.applySegmentHit?.();
      // Immediate HUD updates after each hit
      this.characterHealthBar.setSegments(this.character.healthSegments || 0);
      // legacy StatusBar removed
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
    // Draw charge bar under block bar
    this.drawObjectAt(
      this.characterChargeBar,
      Math.round(this.characterChargeBar.x),
      Math.round(this.characterChargeBar.y)
    );
    // Draw potion icon + count
    this.drawObjectAt(this.potionHud, Math.round(this.potionHud.x), Math.round(this.potionHud.y));
    // Draw block potion icon + count
    this.drawObjectAt(this.blockPotionHud, Math.round(this.blockPotionHud.x), Math.round(this.blockPotionHud.y));
    // Draw goblin counter at the top center
    this.drawObjectAt(this.goblinCounter, 0, Math.round(this.goblinCounter.y || 6));
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
    // Clouds removed from level; mid-layer handled by background parallax
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
    // Do not wake during the intro cutscene
    if (this.bossIntroActive) return;
    // Prevent any boss awareness before all goblins are cleared
    if (!this.areAllGoblinsCleared()) return;
    boss.wakeIfNear(this.character);
  }

  checkEndbossAlertAndAttack() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    // Pause reactions during the intro cutscene
    if (this.bossIntroActive) return;
    // No reactions/attacks until all goblins are defeated
    if (!this.areAllGoblinsCleared()) return;
    boss.checkAndStartAttack(this);
  }

  stop() {
    this._stopped = true;
    try {
      if (this._gameLoop) clearInterval(this._gameLoop);
      if (this._hudLoop) clearInterval(this._hudLoop);
      if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
      if (this._bossIntroCamTimer) clearInterval(this._bossIntroCamTimer);
      if (this._bossIntroWalkTimer) clearInterval(this._bossIntroWalkTimer);
      if (this._bossIntroReturnCamTimer) clearInterval(this._bossIntroReturnCamTimer);
      if (this._bossIntroHudSwitchTimer) clearTimeout(this._bossIntroHudSwitchTimer);
    } catch (e) {}
  }

  // Potion helpers
  getPotionCount() {
    // Stacking up to 3
    return Math.max(0, Math.min(3, this._potionCount || 0));
  }

  checkPotionPickup() {
    if (!this.level?.potions?.length) return;
    // simple AABB collision with character
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.potions = this.level.potions.filter((p) => {
      const pb = p.getBoundsWithOffset?.(p);
      const overlap = pb.right > charB.left && pb.left < charB.right && pb.bottom > charB.top && pb.top < charB.bottom;
      if (!overlap) return true;
      // If already at cap 3, keep potion in the world
      const cur = this.getPotionCount();
      if (cur >= 3) return true;
      // Otherwise pick up and remove from world
      this._potionCount = cur + 1;
      return false;
    });
  }

  checkPotionUse() {
    if (this.getPotionCount() <= 0) return;
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
    if (this.getPotionCount() <= 0) return;
    const maxSeg = this.characterHealthBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.healthSegments ?? maxSeg));
    if (cur >= maxSeg) return; // already full, don't consume
    const next = Math.min(maxSeg, cur + 1);
    this.character.healthSegments = next;
    // Map to energy for legacy bar
    const segToEnergy = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 };
    this.character.energy = segToEnergy[next] ?? Math.round((next / maxSeg) * 100);
    this._potionCount = Math.max(0, (this._potionCount || 0) - 1);
    // Immediate HUD update
    this.characterHealthBar.setSegments(next);
    // legacy StatusBar removed
    this.potionHud.setCount(this.getPotionCount());
  }

  // Block potion helpers
  getBlockPotionCount() {
    return Math.max(0, Math.min(3, this._blockPotionCount || 0));
  }

  checkBlockPotionPickup() {
    if (!this.level?.blockPotions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.blockPotions = this.level.blockPotions.filter((bp) => {
      const bb = bp.getBoundsWithOffset?.(bp);
      const overlap = bb.right > charB.left && bb.left < charB.right && bb.bottom > charB.top && bb.top < charB.bottom;
      if (!overlap) return true;
      const cur = this.getBlockPotionCount();
      if (cur >= 3) return true; // at cap, keep in world
      this._blockPotionCount = cur + 1;
      return false;
    });
  }

  checkBlockPotionUse() {
    if (this.getBlockPotionCount() <= 0) return;
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
    if (this.getBlockPotionCount() <= 0) return;
    const maxSeg = this.characterBlockBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.blockSegments ?? maxSeg));
    if (cur >= maxSeg) return; // already full, don't consume
    const next = Math.min(maxSeg, cur + 1);
    this.character.blockSegments = next;
    this._blockPotionCount = Math.max(0, (this._blockPotionCount || 0) - 1);
    // Immediate HUD update
    this.characterBlockBar.setSegments(next);
    this.blockPotionHud.setCount(this.getBlockPotionCount());
  }
}
