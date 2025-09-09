class WorldBase {
  canvas;
  ctx;
  keyboard;
  camera_x = 0;
  bgSpeedScale = 1.0;
  _stopped = false;
  _gameLoop = null;
  _hudLoop = null;
  _drawReqId = null;

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard;
  }

  startGameLoop(tickFn) {
    this._gameLoop = setInterval(() => tickFn(), 1000 / 60);
  }

  startHudLoop(hudFn) {
    this._hudLoop = setInterval(() => hudFn(), 200);
  }

  stopLoops() {
    try {
      if (this._gameLoop) clearInterval(this._gameLoop);
    } catch (_) {}
    try {
      if (this._hudLoop) clearInterval(this._hudLoop);
    } catch (_) {}
  }

  requestDraw(loopFn) {
    this._drawReqId = requestAnimationFrame(loopFn);
  }

  clearDraw() {
    if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
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

  animateCamera(from, to, durationMs, onDone, assignFn) {
    const start = Date.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const timerName = '_camTimer';
    this._clearTimer(timerName);
    this[timerName] = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      assignFn(from + (to - from) * ease(t));
      if (t >= 1) {
        this._clearTimer(timerName);
        onDone?.();
      }
    }, 1000 / 60);
  }

  _clearTimer(name, timeout = false) {
    try {
      const id = this[name];
      if (!id) return;
      timeout ? clearTimeout(id) : clearInterval(id);
      this[name] = null;
    } catch (_) {}
  }
}

// Export global for existing code expecting World symbol later
// (World will extend this) if modules not used
