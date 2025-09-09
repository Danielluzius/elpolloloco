class WorldRenderManager {
  constructor(world) {
    this.w = world;
  }

  draw() {
    const w = this.w;
    if (w._stopped) return;
    w.ctx.clearRect(0, 0, w.canvas.width, w.canvas.height);
    this.drawBackground();
    this.drawHud();
    this.drawEntities();
    w._drawReqId = requestAnimationFrame(() => this.draw());
  }

  drawBackground() {
    const w = this.w;
    const objs = w.level.backgroundObjects || [];
    const now = (performance?.now ? performance.now() : Date.now()) / 1000;
    const viewW = w.canvas.width;
    for (const obj of objs) this._bg(obj, now, viewW);
  }

  _bg(obj, now, viewW) {
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

  drawHud() {
    const w = this.w;
    w.drawObjectAt(
      w.characterHealthBar,
      w.characterHealthBar.x | 0,
      w.characterHealthBar.y | 0
    );
    w.drawObjectAt(
      w.characterBlockBar,
      w.characterBlockBar.x | 0,
      w.characterBlockBar.y | 0
    );
    w.drawObjectAt(
      w.characterChargeBar,
      w.characterChargeBar.x | 0,
      w.characterChargeBar.y | 0
    );
    w.drawObjectAt(w.potionHud, w.potionHud.x | 0, w.potionHud.y | 0);
    w.drawObjectAt(
      w.blockPotionHud,
      w.blockPotionHud.x | 0,
      w.blockPotionHud.y | 0
    );
    w.drawObjectAt(w.goblinCounter, 0, (w.goblinCounter.y || 6) | 0);
  }

  drawEntities() {
    const w = this.w;
    this._main();
    this._cons();
    this._fg();
    this._bossBar();
  }

  _main() {
    const w = this.w;
    const f = 1.0;
    w.drawObjectAt(
      w.character,
      (w.character.x + w.camera_x * f) | 0,
      w.character.y | 0
    );
    for (const b of w.level.barriers || [])
      w.drawObjectAt(b, (b.x + w.camera_x * f) | 0, b.y | 0);
    for (const r of w.level.rocks || [])
      w.drawObjectAt(r, (r.x + w.camera_x * f) | 0, r.y | 0);
    for (const e of w.level.enemies || [])
      w.drawObjectAt(e, (e.x + w.camera_x * f) | 0, e.y | 0);
  }

  _cons() {
    const w = this.w;
    const f = 1.0;
    for (const p of w.level.potions || [])
      w.drawObjectAt(p, (p.x + w.camera_x * f) | 0, p.y | 0);
    for (const bp of w.level.blockPotions || [])
      w.drawObjectAt(bp, (bp.x + w.camera_x * f) | 0, bp.y | 0);
  }

  _fg() {
    const w = this.w;
    const f = 1.0;
    for (const fo of w.level.foregroundObjects || [])
      w.drawObjectAt(fo, (fo.x + w.camera_x * f) | 0, fo.y | 0);
  }

  _bossBar() {
    const w = this.w;
    const boss = w.level.enemies.find((e) => e instanceof Endboss);
    if (!boss || boss.dead || !boss.awake) return;
    if (
      w.bossSegBar.updateFromBoss(boss) &&
      typeof boss.healthSteps === 'number'
    )
      w.bossSegBar.setByStep(boss.healthSteps);
    const f = 1.0;
    const sx = (w.bossSegBar.x + w.camera_x * f) | 0;
    const sy = w.bossSegBar.y | 0;
    w.drawObjectAt(w.bossSegBar, sx, sy);
  }
}
