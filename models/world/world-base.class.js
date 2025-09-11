/**
 * Represents the base class for the game world.
 */
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

  /**
   * Creates a new WorldBase instance.
   * @param {HTMLCanvasElement} canvas - The canvas element for rendering.
   * @param {object} keyboard - The keyboard input handler.
   */
  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard;
  }

  /**
   * Starts the game loop.
   * @param {Function} tickFn - The function to execute on each tick.
   */
  startGameLoop(tickFn) {
    this._gameLoop = setInterval(() => tickFn(), 1000 / 60);
  }

  /**
   * Starts the HUD update loop.
   * @param {Function} hudFn - The function to execute for HUD updates.
   */
  startHudLoop(hudFn) {
    this._hudLoop = setInterval(() => hudFn(), 200);
  }

  /**
   * Stops all active loops.
   */
  stopLoops() {
    this.clearIntervalSafely('_gameLoop');
    this.clearIntervalSafely('_hudLoop');
  }

  /**
   * Safely clears an interval by name.
   * @param {string} loopName - The name of the interval to clear.
   */
  clearIntervalSafely(loopName) {
    try {
      if (this[loopName]) clearInterval(this[loopName]);
    } catch (_) {}
  }

  /**
   * Requests a draw loop.
   * @param {Function} loopFn - The function to execute for drawing.
   */
  requestDraw(loopFn) {
    this._drawReqId = requestAnimationFrame(loopFn);
  }

  /**
   * Cancels the current draw loop.
   */
  clearDraw() {
    if (this._drawReqId) cancelAnimationFrame(this._drawReqId);
  }

  /**
   * Draws an object at the specified position.
   * @param {object} obj - The object to draw.
   * @param {number} sx - The x-coordinate.
   * @param {number} sy - The y-coordinate.
   */
  drawObjectAt(obj, sx, sy) {
    if (!obj) return;
    if (!obj.otherDirection) return this.drawNormal(obj, sx, sy);
    this.drawFlipped(obj, sx, sy);
  }

  /**
   * Draws an object normally.
   * @param {object} obj - The object to draw.
   * @param {number} sx - The x-coordinate.
   * @param {number} sy - The y-coordinate.
   */
  drawNormal(obj, sx, sy) {
    obj.drawAt(this.ctx, sx, sy);
    obj.drawFrame?.(this.ctx);
    obj.drawDebugHitboxes?.(this.ctx, sx, sy);
  }

  /**
   * Draws an object flipped horizontally.
   * @param {object} obj - The object to draw.
   * @param {number} sx - The x-coordinate.
   * @param {number} sy - The y-coordinate.
   */
  drawFlipped(obj, sx, sy) {
    this.ctx.save();
    this.ctx.translate(sx + obj.width, 0);
    this.ctx.scale(-1, 1);
    obj.drawAt(this.ctx, 0, sy);
    obj.drawFrame?.(this.ctx);
    obj.drawDebugHitboxes?.(this.ctx, 0, sy);
    this.ctx.restore();
  }

  /**
   * Animates the camera from one position to another.
   * @param {number} from - The starting position.
   * @param {number} to - The target position.
   * @param {number} durationMs - The duration of the animation in milliseconds.
   * @param {Function} onDone - The callback to execute when the animation is complete.
   * @param {Function} assignFn - The function to assign the camera position.
   */
  animateCamera(from, to, durationMs, onDone, assignFn) {
    const start = Date.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const timerName = '_camTimer';
    this.clearTimer(timerName);
    this[timerName] = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      assignFn(from + (to - from) * ease(t));
      if (t >= 1) {
        this.clearTimer(timerName);
        onDone?.();
      }
    }, 1000 / 60);
  }

  /**
   * Clears a timer by name.
   * @param {string} name - The name of the timer to clear.
   * @param {boolean} [timeout=false] - Whether the timer is a timeout.
   */
  clearTimer(name, timeout = false) {
    try {
      const id = this[name];
      if (!id) return;
      timeout ? clearTimeout(id) : clearInterval(id);
      this[name] = null;
    } catch (_) {}
  }
}
