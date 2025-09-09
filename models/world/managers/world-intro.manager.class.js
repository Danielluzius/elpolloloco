class WorldIntroManager {
  constructor(world) {
    this.w = world;
  }
  trigger(boss) {
    try {
      this.prepare();
      this.panToBoss(boss);
    } catch (_) {
      this.finish();
    }
  }
  prepare() {
    const w = this.w;
    w.bossIntroActive = true;
    w._savedKeyboardRef = w.keyboard;
    w.keyboard = {};
  }
  panToBoss(boss) {
    const w = this.w;
    const from = w.camera_x || 0;
    const center = (w.canvas?.width || 720) / 2;
    const target = Math.round(
      center + (w.bossIntroCamOffsetX || 0) - (boss.x + (boss.width || 0) / 2)
    );
    w.animateCamera(from, target, 1200, () => this.startBossWalk(boss));
  }
  startBossWalk(boss) {
    const w = this.w;
    this.scheduleHudObjective();
    boss.state = 'walk';
    boss.frameIndex = 0;
    boss.otherDirection = true;
    const targetX = boss.x - 220;
    const speed = 2.0;
    w._bossIntroWalkTimer = setInterval(() => {
      if (!w.bossIntroActive) return this.clearWalk();
      boss.x = Math.max(targetX, boss.x - speed);
      boss.otherDirection = true;
      if (boss.x <= targetX + 0.5) {
        this.clearWalk();
        this.finishBossWalk(boss);
      }
    }, 1000 / 60);
  }
  finishBossWalk(boss) {
    boss.state = 'idle';
    boss.frameIndex = 0;
    setTimeout(() => this.w.returnCameraToCharacter(), 500);
  }
  scheduleHudObjective() {
    const w = this.w;
    try {
      if (w._bossIntroHudSwitchTimer) clearTimeout(w._bossIntroHudSwitchTimer);
      w._bossIntroHudSwitchTimer = setTimeout(() => {
        w._bossIntroHudSwitchTimer = null;
        w.goblinCounter?.enableObjectiveMode?.('DEFEAT THE', 'GOBLIN KING');
      }, 1000);
    } catch (_) {}
  }
  clearWalk() {
    const w = this.w;
    try {
      if (w._bossIntroWalkTimer) clearInterval(w._bossIntroWalkTimer);
    } catch (_) {}
    w._bossIntroWalkTimer = null;
  }
  finish() {
    const w = this.w;
    if (w._savedKeyboardRef) w.keyboard = w._savedKeyboardRef;
    w._savedKeyboardRef = null;
    w.bossIntroActive = false;
    w.bossIntroDone = true;
    w.introCamX = undefined;
    try {
      if (w._bossIntroHudSwitchTimer) clearTimeout(w._bossIntroHudSwitchTimer);
    } catch (_) {}
    w._bossIntroHudSwitchTimer = null;
  }
}
