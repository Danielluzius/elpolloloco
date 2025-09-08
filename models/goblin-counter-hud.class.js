class GoblinCounterHUD extends DrawableObject {
  constructor() {
    super();
    // Render-only HUD: uses canvas size to center; x/width not used for layout
    this.y = 6; // top padding
    this.xOffset = 0; // shift from exact center (positive -> right, negative -> left)
    this.kills = 0;
    this.total = 0;
    this.title = 'Goblins';
  }

  setTotals(total, kills = this.kills) {
    this.total = Math.max(0, Math.floor(total || 0));
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  setKills(kills) {
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  drawAt(ctx, dx, dy) {
    // Center text horizontally within the canvas; ignore dx for centering
    const baseCenter = Math.floor(ctx?.canvas?.width ? ctx.canvas.width / 2 : (dx || 0) + (this.width || 0) / 2);
    const centerX = baseCenter + (this.xOffset || 0);
    const topY = dy ?? this.y ?? 6;

    const remaining = Math.max(0, (this.total || 0) - (this.kills || 0));
    const title = String(this.title || 'Goblins');
    const line2 = `${this.kills || 0} • ${remaining} übrig`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    // Title
    ctx.font = 'bold 20px Arial';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeText(title, centerX, topY);
    ctx.fillText(title, centerX, topY);

    // Counter line under the title
    const lineY = topY + 22; // spacing below title
    ctx.font = '16px Arial';
    ctx.lineWidth = 3;
    ctx.strokeText(line2, centerX, lineY);
    ctx.fillText(line2, centerX, lineY);

    ctx.restore();
  }
}
