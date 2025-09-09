class World extends WorldBase {
  // Core world state & managers
  character = new CharacterPlayerComposed();
  level = typeof createLevel1 === 'function' ? createLevel1() : level1;
  characterHealthBar = new CharacterHealthBar();
  characterBlockBar = new CharacterBlockBar();
  characterChargeBar = new CharacterChargeBar();
  potionHud = new PotionHUD();
  blockPotionHud = new BlockPotionHUD();
  bossSegBar = new BossSegmentHealthBar();
  goblinCounter = new GoblinCounterHUD();
  bossIntroActive = false;
  bossIntroDone = false;
  _bossIntroCamTimer = null;
  _bossIntroWalkTimer = null;
  _bossIntroReturnCamTimer = null;
  _bossIntroHudSwitchTimer = null;
  _savedKeyboardRef = null;
  introCamX = undefined;
  bossIntroCamOffsetX = 200;
  _introMgr = null;
  _renderMgr = null;
  _potionsMgr = null;
  _collisionMgr = null;

  constructor(canvas, keyboard) {
    super(canvas, keyboard);
    this._introMgr = new WorldIntroManager(this);
    this._renderMgr = new WorldRenderManager(this);
    this._potionsMgr = new WorldPotionsManager(this);
    this._collisionMgr = new WorldCollisionManager(this);
    this._renderMgr.draw();
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
    const tick = () => {
      if (this.character.isDead()) return;
      this.checkBossIntroTrigger();
      this.checkCollisions();
      this.checkEndbossWake();
      this.checkEndbossAlertAndAttack();
      this.checkPotionPickup();
      this.checkPotionUse();
      this.checkBlockPotionPickup();
      this.checkBlockPotionUse();
    };
    super.startGameLoop(tick);
  }

  startHudLoop() {
    super.startHudLoop(() => {
      this.updateHudBars();
      this.updateBossHud();
      this.updateGoblinCounter();
    });
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
    this._introMgr?.trigger(boss);
  }
  // Boss intro flow delegated to WorldIntroManager

  animateCamera(from, to, durationMs, onDone) {
    super.animateCamera(from, to, durationMs, onDone, (x) => {
      this.introCamX = x;
      this.camera_x = x;
    });
  }

  returnCameraToCharacter() {
    const target = -this.character.x + 100;
    this.animateCamera(this.camera_x || 0, target, 1000, () => this.finishBossIntro());
  }

  finishBossIntro() {
    this._introMgr?.finish();
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
    this._collisionMgr.tick();
  }

  // Backward compatibility for Goblin.tryApplyAttackDamage()
  damageCharacterIfNeeded() {
    if (this.character.isHurt?.()) return;
    this.character.applySegmentHit?.();
    this.characterHealthBar.setSegments(this.character.healthSegments || 0);
  }
  // Rendering handled by WorldRenderManager

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
    super.stopLoops();
    super.clearDraw?.();
    ['_bossIntroCamTimer', '_bossIntroWalkTimer', '_bossIntroReturnCamTimer'].forEach((t) => this._clearTimer(t));
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
    return this._potionsMgr.getPotionCount();
  }

  checkPotionPickup() {
    if (!this.level?.potions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.potions = this.level.potions.filter((p) => {
      const pb = p.getBoundsWithOffset?.(p);
      const ov = pb.right > charB.left && pb.left < charB.right && pb.bottom > charB.top && pb.top < charB.bottom;
      if (!ov) return true;
      this._potionsMgr.pickupPotion(p);
      return false;
    });
  }

  // pickup handled inline

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
    this._potionsMgr.usePotion();
  }

  getBlockPotionCount() {
    return this._potionsMgr.getBlockPotionCount();
  }

  checkBlockPotionPickup() {
    if (!this.level?.blockPotions?.length) return;
    const charB = this.character.getBoundsWithOffset?.(this.character);
    this.level.blockPotions = this.level.blockPotions.filter((bp) => {
      const bb = bp.getBoundsWithOffset?.(bp);
      const ov = bb.right > charB.left && bb.left < charB.right && bb.bottom > charB.top && bb.top < charB.bottom;
      if (!ov) return true;
      this._potionsMgr.pickupBlockPotion(bp);
      return false;
    });
  }

  // block potion pickup handled inline

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
    this._potionsMgr.useBlockPotion();
  }
}

// Backward compatible draw() entry point
World.prototype.draw = function () {
  this._renderMgr.draw();
};
// end of world.class.js
