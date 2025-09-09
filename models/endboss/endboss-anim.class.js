// Animation + loop logic for Endboss.
class EndbossAnim extends EndbossBase {
  // Preload images + set initial frame.
  initImages() {
    this._loadAllSheets();
    this._ensureAllSheetMeta();
    this._setInitialIdleFrame();
  }
  _loadAllSheets() {
    [
      this.SHEET_IDLE,
      this.SHEET_ALERT,
      this.SHEET_WALK,
      this.SHEET_ATTACK,
      this.SHEET_HURT,
      this.SHEET_DEAD,
    ].forEach((s) => this.loadImage(s.path));
  }
  _ensureAllSheetMeta() {
    [
      this.SHEET_IDLE,
      this.SHEET_ALERT,
      this.SHEET_WALK,
      this.SHEET_ATTACK,
      this.SHEET_HURT,
      this.SHEET_DEAD,
    ].forEach((s) => this.ensureSheetMeta(s));
  }
  _setInitialIdleFrame() {
    const img = this.imageCache[this.SHEET_IDLE.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrameAuto(this.SHEET_IDLE, 0);
  }
  initLoops() {
    this.startStateAnimLoop();
    this.startWalkLoop();
  }
  startStateAnimLoop() {
    setInterval(() => this._stateAnimTick(), 50);
  }
  _stateAnimTick() {
    if (this._handleCharDeadAnim()) return;
    const now = Date.now();
    const { sheet, delay } = this.pickAnim();
    this.advanceFrameIfDue(now, delay);
    const len = this.getSheetCountAutoWithFallback(sheet);
    this.applyTransitions(len);
    this.setCurrentSheetFrame(sheet);
  }
  _handleCharDeadAnim() {
    const chDead = this.world?.character?.isDead?.();
    if (!chDead || this.dead) return false;
    this.awake = false;
    this.alertPlayed = false;
    this.state = 'idle';
    const now = Date.now();
    this.advanceFrameIfDue(now, this.IDLE_DELAY);
    const len = this.getSheetCountAutoWithFallback(this.SHEET_IDLE);
    if (this.frameIndex >= len) this.loopFrame(len);
    this.setCurrentSheetFrame(this.SHEET_IDLE);
    return true;
  }
  advanceFrameIfDue(now, delay) {
    if (now - this.lastFrameTime >= delay) {
      this.frameIndex++;
      this.lastFrameTime = now;
    }
  }
  pickAnim() {
    if (this.state === 'dead' || this.dead)
      return { sheet: this.SHEET_DEAD, delay: this.DEAD_DELAY };
    if (this.state === 'alert')
      return { sheet: this.SHEET_ALERT, delay: this.ALERT_DELAY };
    if (this.state === 'attack')
      return { sheet: this.SHEET_ATTACK, delay: this.ATTACK_DELAY };
    if (this.state === 'hurt')
      return { sheet: this.SHEET_HURT, delay: this.HURT_DELAY };
    if (this.state === 'walk')
      return { sheet: this.SHEET_WALK, delay: this.WALK_DELAY };
    return { sheet: this.SHEET_IDLE, delay: this.IDLE_DELAY };
  }
  applyTransitions(length) {
    if (this.state === 'dead') return this.clampOnDead(length);
    if (
      this.state === 'alert' &&
      this.frameIndex >= this.getSheetCountAutoWithFallback(this.SHEET_ALERT)
    )
      return this.onAlertDone();
    if (this.state === 'attack' && this.frameIndex >= length)
      return this.onAttackDone();
    if (this.state === 'hurt' && this.frameIndex >= length)
      return this.onHurtDone();
    if (this.state === 'walk' && this.frameIndex >= length)
      return this.loopFrame(length);
    if (
      this.state === 'idle' &&
      this.frameIndex >= this.getSheetCountAutoWithFallback(this.SHEET_IDLE)
    )
      this.loopFrame(length);
  }
  clampOnDead(length) {
    this.frameIndex = Math.min(this.frameIndex, length - 1);
  }
  onAlertDone() {
    this.alertPlayed = true;
    this.state = 'walk';
    this.frameIndex = 0;
  }
  onAttackDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }
  onHurtDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }
  loopFrame() {
    this.frameIndex = 0;
  }
  setCurrentSheetFrame(sheet) {
    this.ensureSheetMeta(sheet);
    const img = this.imageCache[sheet.path];
    if (img) this.img = img;
    const idx = this.safeFrameIndex(sheet);
    this.setSheetFrameAuto(sheet, idx);
  }
}
