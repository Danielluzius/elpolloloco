/**
 * Extends the CharacterPlayer class to handle the intro sequence.
 */
class CharacterPlayerIntro extends CharacterPlayer {
  /**
   * Starts the intro walk sequence for the character.
   * @param {number} startX - The starting X position.
   * @param {number} targetX - The target X position.
   */
  startIntroWalk(startX, targetX) {
    this.introActive = true;
    this.introStartX = startX;
    this.introTargetX = targetX;
    this.x = startX;
    this.otherDirection = false;
    this.currentImage = 0;
    this.introFrameIndex = 0;
    this.lastIntroFrameTime = Date.now();
    this.setIntroWalkImage();
    this.initializeWorldIntro(targetX);
  }

  /**
   * Sets the intro walk image for the character.
   */
  setIntroWalkImage() {
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    if (img) {
      this.img = img;
      this.setSheetFrame(this.WALK_INTRO_SHEET, 0);
    }
  }

  /**
   * Initializes the world state for the intro sequence.
   * @param {number} targetX - The target X position.
   */
  initializeWorldIntro(targetX) {
    if (this.world) {
      this.world.introActive = true;
      this.world.introCamX = -targetX + 100;
      this.world.camera_x = this.world.introCamX;
    }
  }

  /**
   * Updates the intro sequence, moving the character towards the target position.
   */
  updateIntro() {
    const dx = this.introTargetX - this.x;
    if (dx > 0) {
      this.x += Math.min(this.introSpeed, dx);
    }
    if (this.x >= this.introTargetX) {
      this.finalizeIntroSequence();
    }
  }

  /**
   * Finalizes the intro sequence, resetting states and marking activity.
   */
  finalizeIntroSequence() {
    this.x = this.introTargetX;
    this.introActive = false;
    if (this.world) {
      this.world.introActive = false;
      delete this.world.introCamX;
    }
    this.setDefaultStandFrame();
    this.markActivity();
  }

  /**
   * Sets the frame for the intro walk animation.
   */
  setIntroWalkFrame() {
    const now = Date.now();
    this.initializeIntroWalkFrame(now);
    const img = this.imageCache[this.WALK_INTRO_SHEET.path];
    this.img = img;
    this.updateIntroWalkFrame(now, img);
    this.animKey = 'intro_walk';
  }

  /**
   * Initializes the intro walk frame if not already set.
   * @param {number} now - The current timestamp.
   */
  initializeIntroWalkFrame(now) {
    if (this.animKey !== 'intro_walk') {
      this.currentImage = 0;
      this.introFrameIndex = 0;
      this.lastIntroFrameTime = now;
    }
  }

  /**
   * Updates the intro walk animation frame based on timing.
   * @param {number} now - The current timestamp.
   * @param {HTMLImageElement} img - The image for the intro walk animation.
   */
  updateIntroWalkFrame(now, img) {
    const cnt = this.getSheetCount(this.WALK_INTRO_SHEET, img) || 9;
    if (now - this.lastIntroFrameTime >= this.INTRO_FRAME_DELAY) {
      this.introFrameIndex = (this.introFrameIndex + 1) % cnt;
      this.lastIntroFrameTime = now;
    }
    this.setSheetFrame(this.WALK_INTRO_SHEET, this.introFrameIndex % cnt);
  }
}
