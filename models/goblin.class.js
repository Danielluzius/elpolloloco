class Goblin extends MoveableObject {
  // All goblins share character-like size
  height = 260;
  width = 210;
  y = 180; // align to same ground line as Character
  groundY = 180;
  animDelay = 220;
  idleSheet = null; // { path, cols, rows, count }
  idleOrder = null; // display order of frames (skip bad ones)
  _idleIdx = 0;
  _lastFrameAt = 0;

  /**
   * type: 1 | 2 | 3 maps to assets/img/3_enemies_goblins/goblin_{type}/3_idle/1_idle_6_sprites.png
   * x: spawn x position
   */
  constructor(type = 1, x = 800) {
    super();
    const clampedType = Math.max(1, Math.min(3, Math.floor(type)));
    const path = `assets/img/3_enemies_goblins/goblin_${clampedType}/3_idle/1_idle_6_sprites.png`;
    const count = this.getSpriteCountFromFilename(path) || 6;
    this.idleSheet = { path, cols: count, rows: 1, count };
    // Build frame order but skip index 1 (2nd sprite), which glitches
    this.idleOrder = Array.from({ length: count }, (_, i) => i).filter((i) => i !== 1);
    this.loadImage(path);
    // ensure initial image
    this.img = this.imageCache[path];
    this.setSheetFrameAuto(this.idleSheet, this.idleOrder[0] || 0);

    // Tighter collision bounds to avoid oversized hitbox
    // Reduce width and height overlap area significantly
    this.offset = { top: 150, right: 80, bottom: 0, left: 80 };

    this.x = typeof x === 'number' ? x : 800;
    this.speed = 0; // stays idle for now
    // Face left by default (sprites face right natively)
    this.otherDirection = true;

    this.animate();
  }

  animate() {
    // Idle-only animation loop
    setInterval(() => {
      const now = Date.now();
      if (now - this._lastFrameAt >= this.animDelay) {
        const order = this.idleOrder && this.idleOrder.length ? this.idleOrder : [0];
        this._idleIdx = (this._idleIdx + 1) % order.length;
        const frame = order[this._idleIdx] ?? 0;
        this.setSheetFrameAuto(this.idleSheet, frame);
        this._lastFrameAt = now;
      }
    }, 50);
  }
}
