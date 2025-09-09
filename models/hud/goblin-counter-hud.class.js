class GoblinCounterHUD extends DrawableObject {
  constructor() {
    super();
    // Render-only HUD: uses canvas size to center; x/width not used for layout
    this.y = 6; // top padding
    this.xOffset = 0; // shift from exact center (positive -> right, negative -> left)
    this.kills = 0;
    this.total = 0;
    this.title = 'Goblins';
    // Modes: 'counter' (default) or 'objective'
    this.mode = 'counter';
    this.objectiveSmall = '';
    this.objectiveBig = '';
  }

  setTotals(total, kills = this.kills) {
    this.total = Math.max(0, Math.floor(total || 0));
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  setKills(kills) {
    this.kills = Math.max(0, Math.floor(kills || 0));
  }

  // Switch to boss objective mode with two lines: small on top, bigger below
  enableObjectiveMode(smallText = 'DEFEAT THE', bigText = 'GOBLIN KING') {
    this.mode = 'objective';
    this.objectiveSmall = String(smallText || '');
    this.objectiveBig = String(bigText || '');
  }

  drawAt(ctx, dx, dy) {
    // Center text horizontally within the canvas; ignore dx for centering
    const baseCenter = Math.floor(
      ctx?.canvas?.width
        ? ctx.canvas.width / 2
        : (dx || 0) + (this.width || 0) / 2
    );
    const centerX = baseCenter + (this.xOffset || 0);
    const topY = dy ?? this.y ?? 6;
    const remaining = Math.max(0, (this.total || 0) - (this.kills || 0));
    const title = String(this.title || 'Goblins');
    const line2 = `${this.kills || 0} • ${remaining} left`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 4;

    if (this.mode === 'objective') {
      // Small line on top
      const small = this.objectiveSmall || 'DEFEAT THE';
      ctx.font = 'bold 14px Arial';
      ctx.strokeText(small, centerX, topY);
      ctx.fillText(small, centerX, topY);
      // Bigger line below
      const bigY = topY + 24;
      const big = this.objectiveBig || 'GOBLIN KING';
      ctx.font = 'bold 24px Arial';
      ctx.lineWidth = 4;
      ctx.strokeText(big, centerX, bigY);
      ctx.fillText(big, centerX, bigY);
    } else {
      // Counter mode styled like objective:
      // 1) small top instruction
      const small = 'DEFEAT THE';
      ctx.font = 'bold 14px Arial';
      ctx.strokeText(small, centerX, topY);
      ctx.fillText(small, centerX, topY);
      // 2) big entity name (title uppercased)
      const bigY = topY + 24;
      const bigTitle = (this.title || 'Goblins').toUpperCase();
      ctx.font = 'bold 24px Arial';
      ctx.lineWidth = 4;
      ctx.strokeText(bigTitle, centerX, bigY);
      ctx.fillText(bigTitle, centerX, bigY);
      // 3) counter line below
      const countY = bigY + 22;
      ctx.font = '16px Arial';
      ctx.lineWidth = 3;
      ctx.strokeText(line2, centerX, countY);
      ctx.fillText(line2, centerX, countY);
    }

    ctx.restore();
  }
}
