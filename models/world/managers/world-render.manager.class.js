/**
 * Manages rendering for the game world.
 */
class WorldRenderManager {
  /**
   * Creates a new WorldRenderManager instance.
   * @param {object} world - The game world instance.
   */
  constructor(world) {
    this.w = world;
    this.preloadImages();
  }

  /**
   * Preloads game over and win images.
   */
  preloadImages() {
    this._gameOverImg = new Image();
    this._gameOverImg.src =
      'assets/img/9_intro_outro_screens/game_over/lost.png';
    this._gameWinImg = new Image();
    this._gameWinImg.src = 'assets/img/9_intro_outro_screens/game_over/won.png';
  }

  /**
   * Draws the game world.
   */
  draw() {
    const w = this.w;
    if (w._stopped) return;
    w.ctx.clearRect(0, 0, w.canvas.width, w.canvas.height);
    this.drawBackground();
    this.drawHud();
    this.drawEntities();
    this.drawGameOverOrWinOverlay();
    w._drawReqId = requestAnimationFrame(() => this.draw());
  }

  /**
   * Draws the background objects.
   */
  drawBackground() {
    const w = this.w;
    const objs = w.level.backgroundObjects || [];
    const now = (performance?.now ? performance.now() : Date.now()) / 1000;
    const viewW = w.canvas.width;
    for (const obj of objs) this.drawBackgroundObject(obj, now, viewW);
  }

  /**
   * Draws a single background object.
   * @param {object} obj - The background object.
   * @param {number} now - The current timestamp in seconds.
   * @param {number} viewW - The width of the canvas view.
   */
  drawBackgroundObject(obj, now, viewW) {
    const w = this.w;
    const factor = (obj.getParallaxFactor?.() ?? 1) * w.bgSpeedScale;
    const drift = obj.getDriftSpeed?.() ?? 0;
    const tileW = obj.getTileStep?.() ?? 720;
    const baseX = Math.round(obj.x + w.camera_x * factor + drift * now);
    const y = Math.round(obj.y);
    if (!tileW) return w.drawObjectAt(obj, baseX, y);
    const first = Math.floor(-baseX / tileW) - 1;
    const need = Math.ceil(viewW / tileW) + 3;
    for (let i = 0; i < need; i++)
      w.drawObjectAt(obj, baseX + (first + i) * tileW, y);
  }

  /**
   * Draws the HUD elements.
   */
  drawHud() {
    const w = this.w;
    this.drawHudElement(w.characterHealthBar);
    this.drawHudElement(w.characterBlockBar);
    this.drawHudElement(w.characterChargeBar);
    this.drawHudElement(w.potionHud);
    this.drawHudElement(w.blockPotionHud);
    this.drawHudElement(w.goblinCounter, 0, w.goblinCounter.y || 6);
  }

  /**
   * Draws a single HUD element.
   * @param {object} element - The HUD element to draw.
   * @param {number} [x=element.x] - The x-coordinate.
   * @param {number} [y=element.y] - The y-coordinate.
   */
  drawHudElement(element, x = element.x, y = element.y) {
    const w = this.w;
    w.drawObjectAt(element, x | 0, y | 0);
  }

  /**
   * Draws all game entities.
   */
  drawEntities() {
    this.drawMainEntities();
    this.drawConsumables();
    this.drawForegroundObjects();
    this.drawBossHealthBar();
  }

  /**
   * Draws the main game entities like the character, barriers, rocks, and enemies.
   */
  drawMainEntities() {
    const w = this.w;
    const f = 1.0;
    this.drawEntity(w.character, f);
    for (const b of w.level.barriers || []) this.drawEntity(b, f);
    for (const r of w.level.rocks || []) this.drawEntity(r, f);
    for (const e of w.level.enemies || []) this.drawEntity(e, f);
  }

  /**
   * Draws consumable items like potions and block potions.
   */
  drawConsumables() {
    const w = this.w;
    const f = 1.0;
    for (const p of w.level.potions || []) this.drawEntity(p, f);
    for (const bp of w.level.blockPotions || []) this.drawEntity(bp, f);
  }

  /**
   * Draws foreground objects.
   */
  drawForegroundObjects() {
    const w = this.w;
    const f = 1.0;
    for (const fo of w.level.foregroundObjects || []) this.drawEntity(fo, f);
  }

  /**
   * Draws the boss health bar if the boss is active.
   */
  drawBossHealthBar() {
    const w = this.w;
    const boss = w.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || boss.dead || !boss.awake) return;
    if (
      w.bossSegBar.updateFromBoss(boss) &&
      typeof boss.healthSteps === 'number'
    )
      w.bossSegBar.setByStep(boss.healthSteps);
    this.drawEntity(w.bossSegBar, 1.0);
  }

  /**
   * Draws a single game entity.
   * @param {object} entity - The game entity to draw.
   * @param {number} factor - The parallax factor.
   */
  drawEntity(entity, factor) {
    const w = this.w;
    w.drawObjectAt(entity, (entity.x + w.camera_x * factor) | 0, entity.y | 0);
  }

  /**
   * Draws the game over or win overlay if applicable.
   */
  drawGameOverOrWinOverlay() {
    const w = this.w;
    try {
      if (this.shouldDrawGameOver()) {
        this.drawOverlay(this._gameOverImg);
      } else if (this.shouldDrawWinOverlay()) {
        this.drawOverlay(this._gameWinImg);
      }
    } catch (_) {}
  }

  /**
   * Determines if the game over overlay should be drawn.
   * @returns {boolean} True if the game over overlay should be drawn, false otherwise.
   */
  shouldDrawGameOver() {
    const w = this.w;
    return w.character?.isDead?.() && this._gameOverImg?.complete;
  }

  /**
   * Determines if the win overlay should be drawn.
   * @returns {boolean} True if the win overlay should be drawn, false otherwise.
   */
  shouldDrawWinOverlay() {
    const w = this.w;
    return (
      (w._won ||
        (w.level?.enemies || []).some((e) => e instanceof Endboss && e.dead)) &&
      this._gameWinImg?.complete
    );
  }

  /**
   * Draws an overlay image centered on the canvas.
   * @param {HTMLImageElement} img - The overlay image to draw.
   */
  drawOverlay(img) {
    const w = this.w;
    const cw = w.canvas.width;
    const ch = w.canvas.height;
    const targetMaxW = cw * 0.5;
    const targetMaxH = ch * 0.5;
    const iw = img.naturalWidth || img.width || targetMaxW;
    const ih = img.naturalHeight || img.height || targetMaxH;
    const scale = Math.min(targetMaxW / iw, targetMaxH / ih, 1);
    const dw = Math.round(iw * scale);
    const dh = Math.round(ih * scale);
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);
    w.ctx.drawImage(img, dx, dy, dw, dh);
  }
}
