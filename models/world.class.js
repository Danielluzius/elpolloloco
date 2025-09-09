class World {
  // Field initialisations
  character = new CharacterPlayerComposed();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  characterHealthBar = new CharacterHealthBar();
  characterBlockBar = new CharacterBlockBar();
  characterChargeBar = new CharacterChargeBar();
  potionHud = new PotionHUD();
  blockPotionHud = new BlockPotionHUD();
  bossSegBar = new BossSegmentHealthBar();
  goblinCounter = new GoblinCounterHUD();
  _gameLoop = null;
  _hudLoop = null;
  _drawReqId = null;
  _stopped = false;
  bgSpeedScale = 1.0;
  bossIntroActive = false;
  bossIntroDone = false;
  _bossIntroCamTimer = null;
  _bossIntroWalkTimer = null;
  _bossIntroReturnCamTimer = null;
  _bossIntroHudSwitchTimer = null;
  _savedKeyboardRef = null;
  introCamX = undefined;
  bossIntroCamOffsetX = 200;

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard;
    this.draw();
    this.setWorld();
    this.startGameLoop();
    this.startHudLoop();
    this.initBossHealth();
    this.initCharacterHealth();
    this.initGoblinCounter();
    this._tryStartIntroWalk();
  }

  _tryStartIntroWalk() {
    try {
      const targetX = this.character.defaultStartX || 0;
      const startX = -Math.max(100, this.character.width);
      this.character.startIntroWalk?.(startX, targetX);
    } catch (_) {}
  }

  setWorld() {
    this.character.world = this;
    (this.level.enemies || []).forEach((e) => (e.world = this));
  }

  startGameLoop() {
    this._gameLoop = setInterval(() => {
      if (this.character.isDead()) return;
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
    this._maybeSetSeg(this.characterHealthBar, this.character.healthSegments);
    this._maybeSetSeg(this.characterBlockBar, this.character.blockSegments);
    this._maybeSetSeg(this.characterChargeBar, this.character.chargeSegments);
    this.potionHud.setCount(this.getPotionCount());
    this.blockPotionHud.setCount(this.getBlockPotionCount());
  }

  _maybeSetSeg(bar, val) {
    if (typeof val === 'number') bar.setSegments(val);
  }

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
    if (this.bossSegBar.updateFromBoss(boss)) {
      const steps = typeof boss.healthSteps === 'number' ? boss.healthSteps : this.bossSegBar.getMaxSteps();
      this.bossSegBar.setByStep(steps);
    }
  }

  updateGoblinCounter() {
    try {
      if (this.goblinCounter?.mode === 'objective') return;
      const total = (this._goblinTotal ?? this.level?.enemies?.filter?.((e) => e instanceof Goblin)?.length) || 0;
      this.goblinCounter.setTotals(total, this._goblinsKilled || 0);
    } catch (_) {}
  }

  areAllGoblinsCleared() {
    const total = this._goblinTotal ?? 0;
    const killed = this._goblinsKilled ?? 0;
    if (total <= 0) return false;
    return killed >= total;
  }

  checkBossIntroTrigger() {
    if (this.bossIntroDone || this.bossIntroActive) return;
    if (!this.areAllGoblinsCleared()) return;
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    this.startBossIntro(boss);
  }

  startBossIntro(boss) {
    try {
      this._prepareBossIntro();
      this._panToBoss(boss);
    } catch (_) {
      this.finishBossIntro();
    }
  }

  _prepareBossIntro() {
    this.bossIntroActive = true;
    this._savedKeyboardRef = this.keyboard;
    this.keyboard = {};
  }

  _panToBoss(boss) {
    const from = this.camera_x || 0;
    const center = (this.canvas?.width || 720) / 2;
    const target = Math.round(center + (this.bossIntroCamOffsetX || 0) - (boss.x + (boss.width || 0) / 2));
    this.animateCamera(from, target, 1200, () => this._startBossWalk(boss));
  }

  _startBossWalk(boss) {
    this._scheduleHudObjective();
    boss.state = 'walk';
    boss.frameIndex = 0;
    boss.otherDirection = true;
    const targetX = boss.x - 220;
    const speed = 2.0;
    this._bossIntroWalkTimer = setInterval(() => {
      if (!this.bossIntroActive) return this.clearBossIntroWalk();
      boss.x = Math.max(targetX, boss.x - speed);
      boss.otherDirection = true;
      if (boss.x <= targetX + 0.5) {
        this.clearBossIntroWalk();
        this._finishBossWalk(boss);
      }
    }, 1000 / 60);
  }

  _finishBossWalk(boss) {
    boss.state = 'idle';
    boss.frameIndex = 0;
    setTimeout(() => this.returnCameraToCharacter(), 500);
  }

  _scheduleHudObjective() {
    try {
      if (this._bossIntroHudSwitchTimer) clearTimeout(this._bossIntroHudSwitchTimer);
      this._bossIntroHudSwitchTimer = setTimeout(() => {
        this._bossIntroHudSwitchTimer = null;
        this.goblinCounter?.enableObjectiveMode?.('DEFEAT THE', 'GOBLIN KING');
      }, 1000);
    } catch (_) {}
  }

  clearBossIntroWalk() {
    try {
      if (this._bossIntroWalkTimer) clearInterval(this._bossIntroWalkTimer);
    } catch (_) {}
    this._bossIntroWalkTimer = null;
  }

  animateCamera(from, to, durationMs, onDone) {
    const start = Date.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    this._clearTimer('_bossIntroCamTimer');
    this._bossIntroCamTimer = setInterval(() => {
      const t = Math.max(0, Math.min(1, (Date.now() - start) / durationMs));
      this.introCamX = from + (to - from) * ease(t);
      this.camera_x = this.introCamX;
      if (t >= 1) {
        this._clearTimer('_bossIntroCamTimer');
        onDone?.();
      }
    }, 1000 / 60);
  }

  returnCameraToCharacter() {
    const target = -this.character.x + 100;
    this.animateCamera(this.camera_x || 0, target, 1000, () => this.finishBossIntro());
  }

  finishBossIntro() {
    if (this._savedKeyboardRef) this.keyboard = this._savedKeyboardRef;
    this._savedKeyboardRef = null;
    this.bossIntroActive = false;
    this.bossIntroDone = true;
    this.introCamX = undefined;
    this._clearTimer('_bossIntroHudSwitchTimer', true);
  }

  initBossHealth() {
    this.level.enemies.find((e) => e instanceof Endboss)?.initHealth(10);
  }

  initCharacterHealth() {
    this.character.healthSegments = 5;
    this.character.energy = 100;
    this.characterHealthBar.setSegments(5);
    this.character.blockSegments = 5;
    this._alignBlockBar();
    this._initChargeBar();
    this._placePotionHuds();
  }

  _alignBlockBar() {
    const hb = this.characterHealthBar,
      bb = this.characterBlockBar;
    bb.width = hb.width;
    bb.height = hb.height;
    bb.x = hb.x;
    bb.y = (hb.y || 0) + (hb.height || 20) + 4;
    bb.setSegments(this.character.blockSegments);
  }

  _initChargeBar() {
    const hb = this.characterHealthBar,
      cb = this.characterChargeBar,
      bb = this.characterBlockBar;
    this.character.chargeSegments = 0;
    cb.width = hb.width;
    cb.height = hb.height;
    cb.x = hb.x;
    cb.y = (bb.y || 0) + (bb.height || 20) + 4;
    cb.setSegments(0);
  }

  _placePotionHuds() {
    const hb = this.characterHealthBar;
    this.potionHud.x = hb.x + hb.width + 12;
    this.potionHud.y = hb.y + Math.floor((hb.height - this.potionHud.height) / 2);
    this.blockPotionHud.x = this.potionHud.x;
    this.blockPotionHud.y = this.potionHud.y + this.potionHud.height + 8;
  }

  initGoblinCounter() {
    const total = this.level?.enemies?.filter?.((e) => e instanceof Goblin)?.length || 0;
    this._goblinTotal = total;
    this._goblinsKilled = 0;
    this.goblinCounter.y = 56;
    this.goblinCounter.xOffset = 140;
    this.updateGoblinCounter();
  }

  damageBossIfNeeded(boss) {
    boss.applyHit(1, Date.now(), this.bossSegBar.getMaxSteps());
  }

  checkCollisions() {
    this._filterEnemies();
    this._resolveRocks();
  }

  _filterEnemies() {
    this.level.enemies = this.level.enemies.filter((e) => {
      if (e.shouldDespawn?.()) return false;
      if (e.dead) return true;
      if (!this.character.isColliding(e)) return true;
      if (e instanceof Goblin && this.isGoblinAttackFrame(e) && this.character.applySegmentHit)
        this.damageCharacterIfNeeded();
      return true;
    });
  }

  _resolveRocks() {
    const a = this.character.getBoundsWithOffset?.(this.character) || {
      left: this.character.x,
      right: this.character.x + this.character.width,
      top: this.character.y,
      bottom: this.character.y + this.character.height,
    };
    for (const rock of this.level.rocks || []) {
      const b = rock.getBoundsWithOffset?.(rock) || {
        left: rock.x,
        right: rock.x + rock.width,
        top: rock.y,
        bottom: rock.y + rock.height,
      };
      const overlap = a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
      if (!overlap) continue;
      if (a.bottom <= b.top + 4) continue;
      const pushLeft = a.right - b.left,
        pushRight = b.right - a.left;
      if (pushLeft < pushRight) this.character.x -= pushLeft;
      else this.character.x += pushRight;
    }
  }

  isGoblinAttackFrame(goblin) {
    if (!goblin.isAttacking) return false;
    const cnt = goblin.attackSheet?.count || 1;
    const hitFrame = Math.floor(cnt / 2);
    return goblin.attackFrameIdx === hitFrame && !goblin.appliedAttackDamage;
  }

  checkAttackHits() {
    if (!this.character.isAttackActiveWindow?.()) return;
    const hitbox = this.character.getAttackHitboxRect?.();
    if (!hitbox) return;
    for (const enemy of this.level.enemies) this._processAttackHit(enemy, hitbox);
  }

  _processAttackHit(enemy, hitbox) {
    if (!(enemy instanceof Goblin) && !(enemy instanceof Endboss)) return;
    if (enemy.dying || enemy.dead) return;
    const eb = enemy.getBoundsWithOffset?.(enemy) || {
      left: enemy.x,
      right: enemy.x + enemy.width,
      top: enemy.y,
      bottom: enemy.y + enemy.height,
    };
    const overlap =
      eb.right > hitbox.left && eb.left < hitbox.right && eb.bottom > hitbox.top && eb.top < hitbox.bottom;
    if (!overlap) return;
    if (typeof enemy.onHitByAttack === 'function') enemy.onHitByAttack(this.character);
    else if (enemy instanceof Endboss && enemy.applyHit) {
      const applied = enemy.applyHit(1, Date.now(), 10, this.character.attackId ?? null);
      if (applied) this.awardCharge(1);
    } else if (enemy.applyHit) this.damageBossIfNeeded(enemy);
  }

  damageCharacterIfNeeded() {
    if (this.character.isHurt()) return;
    this.character.applySegmentHit?.();
    this.characterHealthBar.setSegments(this.character.healthSegments || 0);
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
    const objs = this.level.backgroundObjects || [];
    const now = (performance?.now ? performance.now() : Date.now()) / 1000;
    const viewW = this.canvas.width;
    for (const obj of objs) this._drawBgObject(obj, now, viewW);
  }

  _drawBgObject(obj, now, viewW) {
    const factor = (obj.getParallaxFactor?.() ?? 1) * this.bgSpeedScale;
    const drift = obj.getDriftSpeed?.() ?? 0;
    const tileW = obj.getTileStep?.() ?? 720;
    const baseX = Math.round(obj.x + this.camera_x * factor + drift * now);
    const y = Math.round(obj.y);
    if (!tileW) return this.drawObjectAt(obj, baseX, y);
    const first = Math.floor(-baseX / tileW) - 1;
    const need = Math.ceil(viewW / tileW) + 3;
    for (let i = 0; i < need; i++) this.drawObjectAt(obj, baseX + (first + i) * tileW, y);
  }

  drawHud() {
    this.drawObjectAt(this.characterHealthBar, this.characterHealthBar.x | 0, this.characterHealthBar.y | 0);
    this.drawObjectAt(this.characterBlockBar, this.characterBlockBar.x | 0, this.characterBlockBar.y | 0);
    this.drawObjectAt(this.characterChargeBar, this.characterChargeBar.x | 0, this.characterChargeBar.y | 0);
    this.drawObjectAt(this.potionHud, this.potionHud.x | 0, this.potionHud.y | 0);
    this.drawObjectAt(this.blockPotionHud, this.blockPotionHud.x | 0, this.blockPotionHud.y | 0);
    this.drawObjectAt(this.goblinCounter, 0, (this.goblinCounter.y || 6) | 0);
  }

  drawEntities() {
    this._drawMainObjects();
    this._drawConsumables();
    this._drawForeground();
    this.drawBossBarIfAny();
  }

  _drawMainObjects() {
    const f = 1.0;
    this.drawObjectAt(this.character, (this.character.x + this.camera_x * f) | 0, this.character.y | 0);
    for (const b of this.level.barriers || []) this.drawObjectAt(b, (b.x + this.camera_x * f) | 0, b.y | 0);
    for (const r of this.level.rocks || []) this.drawObjectAt(r, (r.x + this.camera_x * f) | 0, r.y | 0);
    for (const e of this.level.enemies || []) this.drawObjectAt(e, (e.x + this.camera_x * f) | 0, e.y | 0);
  }

  _drawConsumables() {
    const f = 1.0;
    for (const p of this.level.potions || []) this.drawObjectAt(p, (p.x + this.camera_x * f) | 0, p.y | 0);
    for (const bp of this.level.blockPotions || []) this.drawObjectAt(bp, (bp.x + this.camera_x * f) | 0, bp.y | 0);
  }

  _drawForeground() {
    const f = 1.0;
    for (const fo of this.level.foregroundObjects || [])
      this.drawObjectAt(fo, (fo.x + this.camera_x * f) | 0, fo.y | 0);
  }

  drawBossBarIfAny() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || boss.dead || !boss.awake) return;
    if (this.bossSegBar.updateFromBoss(boss) && typeof boss.healthSteps === 'number')
      this.bossSegBar.setByStep(boss.healthSteps);
    const f = 1.0;
    const sx = (this.bossSegBar.x + this.camera_x * f) | 0;
    const sy = this.bossSegBar.y | 0;
    this.drawObjectAt(this.bossSegBar, sx, sy);
  }

  drawObjectAt(obj, sx, sy) {
    if (!obj) return;
    if (!obj.otherDirection) return this._drawNormal(obj, sx, sy);
    this.ctx.save();
    this.ctx.translate(sx + obj.width, 0);
    this.ctx.scale(-1, 1);
    obj.drawAt(this.ctx, 0, sy);
    obj.drawFrame?.(this.ctx);
    obj.drawDebugHitboxes?.(this.ctx, 0, sy);
    this.ctx.restore();
  }

  _drawNormal(obj, sx, sy) {
    obj.drawAt(this.ctx, sx, sy);
    obj.drawFrame?.(this.ctx);
    obj.drawDebugHitboxes?.(this.ctx, sx, sy);
  }

  checkEndbossWake() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    if (this.bossIntroActive || !this.areAllGoblinsCleared()) return;
    boss.wakeIfNear(this.character);
  }

  checkEndbossAlertAndAttack() {
    const boss = this.level.enemies.find((e) => e instanceof Endboss);
    if (!boss) return;
    if (this.bossIntroActive || !this.areAllGoblinsCleared()) return;
    boss.checkAndStartAttack(this);
  }

  stop() {
    this._stopped = true;
    this._clearTimer('_gameLoop');
    this._clearTimer('_hudLoop');
    if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
    this._clearTimer('_bossIntroCamTimer');
    this._clearTimer('_bossIntroWalkTimer');
    this._clearTimer('_bossIntroReturnCamTimer');
    this._clearTimer('_bossIntroHudSwitchTimer', true);
  }

  _clearTimer(name, timeout = false) {
    try {
      const id = this[name];
      if (!id) return;
      timeout ? clearTimeout(id) : clearInterval(id);
      this[name] = null;
    } catch (_) {}
  }

  getPotionCount() {
    return Math.max(0, Math.min(3, this._potionCount || 0));
  }

  checkPotionPickup() {
    if (!this.level?.potions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.potions = this.level.potions.filter((p) => this._maybePickupPotion(p, charB));
  }

  _maybePickupPotion(p, charB) {
    const pb = p.getBoundsWithOffset?.(p);
    const overlap = pb.right > charB.left && pb.left < charB.right && pb.bottom > charB.top && pb.top < charB.bottom;
    if (!overlap) return true;
    const cur = this.getPotionCount();
    if (cur >= 3) return true;
    this._potionCount = cur + 1;
    return false;
  }

  checkPotionUse() {
    if (this.getPotionCount() <= 0 || !this.keyboard?.ONE || this._usePotionLatch) return;
    this._usePotionLatch = true;
    try {
      this.usePotion();
    } finally {
      setTimeout(() => (this._usePotionLatch = false), 200);
    }
  }

  usePotion() {
    if (this.getPotionCount() <= 0) return;
    const maxSeg = this.characterHealthBar?.maxSegments || 5;
    const cur = Math.max(0, Math.min(maxSeg, this.character.healthSegments ?? maxSeg));
    if (cur >= maxSeg) return;
    const next = Math.min(maxSeg, cur + 1);
    this.character.healthSegments = next;
    const segToEnergy = { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 };
    this.character.energy = segToEnergy[next] ?? Math.round((next / maxSeg) * 100);
    this._potionCount = Math.max(0, (this._potionCount || 0) - 1);
    this.characterHealthBar.setSegments(next);
    this.potionHud.setCount(this.getPotionCount());
  }

  getBlockPotionCount() {
    return Math.max(0, Math.min(3, this._blockPotionCount || 0));
  }

  checkBlockPotionPickup() {
    if (!this.level?.blockPotions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.blockPotions = this.level.blockPotions.filter((bp) => this._maybePickupBlockPotion(bp, charB));
  }

  _maybePickupBlockPotion(bp, charB) {
    const bb = bp.getBoundsWithOffset?.(bp);
    const overlap = bb.right > charB.left && bb.left < charB.right && bb.bottom > charB.top && bb.top < charB.bottom;
    if (!overlap) return true;
    const cur = this.getBlockPotionCount();
    if (cur >= 3) return true;
    this._blockPotionCount = cur + 1;
    return false;
  }

  checkBlockPotionUse() {
    if (this.getBlockPotionCount() <= 0 || !this.keyboard?.TWO || this._useBlockPotionLatch) return;
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
    if (cur >= maxSeg) return;
    const next = Math.min(maxSeg, cur + 1);
    this.character.blockSegments = next;
    this._blockPotionCount = Math.max(0, (this._blockPotionCount || 0) - 1);
    this.characterBlockBar.setSegments(next);
    this.blockPotionHud.setCount(this.getBlockPotionCount());
  }
}
