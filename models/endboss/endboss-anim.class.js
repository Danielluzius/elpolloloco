/**
 * Handles the animations for the end boss, including state transitions and frame updates.
 */
class EndbossAnim extends EndbossBase {
  /**
   * Initializes all animation-related images and sets the initial idle frame.
   */
  initImages() {
    this._loadAllSheets();
    this._ensureAllSheetMeta();
    this._setInitialIdleFrame();
  }

  /**
   * Loads all sprite sheets required for the end boss animations.
   */
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

  /**
   * Ensures metadata for all sprite sheets is properly initialized.
   */
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

  /**
   * Sets the initial frame for the idle animation.
   */
  _setInitialIdleFrame() {
    const img = this.imageCache[this.SHEET_IDLE.path];
    if (!img) return;
    this.img = img;
    this.setSheetFrameAuto(this.SHEET_IDLE, 0);
  }

  /**
   * Initializes animation loops for state and walking animations.
   */
  initLoops() {
    this.startStateAnimLoop();
    this.startWalkLoop();
  }

  /**
   * Starts the loop for state-based animations.
   */
  startStateAnimLoop() {
    setInterval(() => this._stateAnimTick(), 50);
  }

  /**
   * Handles the animation tick for the current state.
   */
  _stateAnimTick() {
    if (this._handleCharDeadAnim()) return;
    const now = Date.now();
    const { sheet, delay } = this.pickAnim();
    this.advanceFrameIfDue(now, delay);
    const len = this.getSheetCountAutoWithFallback(sheet);
    this.applyTransitions(len);
    this.setCurrentSheetFrame(sheet);
  }

  /**
   * Handles the animation when the character is dead.
   * @returns {boolean} True if the character is dead, otherwise false.
   */
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

  /**
   * Advances the animation frame if the delay has passed.
   * @param {number} now - The current timestamp.
   * @param {number} delay - The delay between frames.
   */
  advanceFrameIfDue(now, delay) {
    if (now - this.lastFrameTime >= delay) {
      this.frameIndex++;
      this.lastFrameTime = now;
    }
  }

  /**
   * Picks the appropriate animation based on the current state.
   * @returns {Object} The sprite sheet and delay for the current animation.
   */
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

  /**
   * Applies transitions between animation states.
   * @param {number} length - The total number of frames in the current animation.
   */
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

  /**
   * Clamps the frame index to the last frame when the state is 'dead'.
   * @param {number} length - The total number of frames in the animation.
   */
  clampOnDead(length) {
    this.frameIndex = Math.min(this.frameIndex, length - 1);
  }

  /**
   * Handles the transition when the alert animation is done.
   */
  onAlertDone() {
    this.alertPlayed = true;
    this.state = 'walk';
    this.frameIndex = 0;
  }

  /**
   * Handles the transition when the attack animation is done.
   */
  onAttackDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  /**
   * Handles the transition when the hurt animation is done.
   */
  onHurtDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  /**
   * Loops the animation back to the first frame.
   */
  loopFrame() {
    this.frameIndex = 0;
  }

  /**
   * Sets the current frame of the sprite sheet for rendering.
   * @param {Object} sheet - The sprite sheet configuration.
   */
  setCurrentSheetFrame(sheet) {
    this.ensureSheetMeta(sheet);
    const img = this.imageCache[sheet.path];
    if (img) this.img = img;
    const idx = this.safeFrameIndex(sheet);
    this.setSheetFrameAuto(sheet, idx);
  }
}
