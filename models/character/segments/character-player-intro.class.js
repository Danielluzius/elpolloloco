class CharacterPlayerIntro extends CharacterPlayer {
  startIntroWalk(startX, targetX) {
    this.introActive = true;
    this.introStartX = startX;
    this.introTargetX = targetX;
    this.x = startX;
    this.otherDirection = false;
    this.currentImage = 0;
    this.introFrameIndex = 0;
    this.lastIntroFrameTime = Date.now();
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.WALK_INTRO_SHEET, 0);
    }
    if (this.world) {
      this.world.introActive = true;
      this.world.introCamX = -targetX + 100;
      this.world.camera_x = this.world.introCamX;
    }
  }

  updateIntro() {
    const dx = this.introTargetX - this.x;
    if (dx > 0) this.x += Math.min(this.introSpeed, dx);
    if (this.x >= this.introTargetX) {
      this.x = this.introTargetX;
      this.introActive = false;
      if (this.world) {
        this.world.introActive = false;
        delete this.world.introCamX;
      }
      this.setDefaultStandFrame();
      this.markActivity();
    }
  }

  setIntroWalkFrame() {
    const now = Date.now();
    if (this.animKey !== 'intro_walk') {
      this.currentImage = 0;
      this.introFrameIndex = 0;
      this.lastIntroFrameTime = now;
    }
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    this.img = img;
    const cnt = this.getSheetCount(this.WALK_INTRO_SHEET, img) || 9;
    if (now - this.lastIntroFrameTime >= this.INTRO_FRAME_DELAY) {
      this.introFrameIndex = (this.introFrameIndex + 1) % cnt;
      this.lastIntroFrameTime = now;
    }
    this.setSheetFrame(this.WALK_INTRO_SHEET, this.introFrameIndex % cnt);
    this.animKey = 'intro_walk';
  }
}
