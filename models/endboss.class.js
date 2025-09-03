class Endboss extends MoveableObject {
  height = 400;
  width = 250;
  y = 60;
  speed = 1.0;
  awake = false;
  state = 'idle';
  frameIndex = 0;
  lastFrameTime = 0;
  ALERT_DELAY = 130;
  ATTACK_DELAY = 110;
  WALK_DELAY = 200;
  alertPlayed = false;
  lastAttackAt = 0;
  attackCooldown = 1200;
  DEAD_DELAY = 220;

  IMAGES_WALKING = [
    'assets/img/4_enemie_boss_chicken/1_walk/G1.png',
    'assets/img/4_enemie_boss_chicken/1_walk/G2.png',
    'assets/img/4_enemie_boss_chicken/1_walk/G3.png',
    'assets/img/4_enemie_boss_chicken/1_walk/G4.png',
  ];
  IMAGES_ALERT = [
    'assets/img/4_enemie_boss_chicken/2_alert/G5.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G6.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G7.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G8.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G9.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G10.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G11.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G12.png',
  ];
  IMAGES_ATTACK = [
    'assets/img/4_enemie_boss_chicken/3_attack/G13.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G14.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G15.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G16.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G17.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G18.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G19.png',
    'assets/img/4_enemie_boss_chicken/3_attack/G20.png',
  ];
  IMAGES_HURT = [
    'assets/img/4_enemie_boss_chicken/4_hurt/G21.png',
    'assets/img/4_enemie_boss_chicken/4_hurt/G22.png',
    'assets/img/4_enemie_boss_chicken/4_hurt/G23.png',
  ];
  IMAGES_DEAD = [
    'assets/img/4_enemie_boss_chicken/5_dead/G24.png',
    'assets/img/4_enemie_boss_chicken/5_dead/G25.png',
    'assets/img/4_enemie_boss_chicken/5_dead/G26.png',
  ];

  constructor() {
    super();
    this.initImages();
    this.x = 4550;
    this.initLoops();
  }

  initImages() {
    this.loadImage(this.IMAGES_ALERT[0]);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_ALERT);
    this.loadImages(this.IMAGES_ATTACK);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
  }

  initLoops() {
    this.startStateAnimLoop();
    this.startWalkLoop();
  }

  wakeIfNear(character) {
    const dx = Math.abs(character.x + character.width / 2 - (this.x + this.width / 2));
    if (dx < 500) {
      this.awake = true;
      if (!this.alertPlayed && this.state === 'idle') {
        this.state = 'alert';
        this.frameIndex = 0;
        this.lastFrameTime = Date.now();
      }
    }
  }

  checkAndStartAttack(world) {
    if (!this.awake || world.character.isDead()) return;
    const now = Date.now();
    const dx = Math.abs(world.character.x + world.character.width / 2 - (this.x + this.width / 2));
    const inRange = dx < 140;
    const cooled = now - (this.lastAttackAt || 0) >= this.attackCooldown;
    if (!(inRange && cooled) || this.state === 'attack') return;
    this.state = 'attack';
    this.frameIndex = 0;
    this.lastFrameTime = now;
    this.lastAttackAt = now;
    this.scheduleAttackHitCheck(world);
  }

  scheduleAttackHitCheck(world) {
    const hitWindowStart = 3;
    setTimeout(() => {
      if (this.state !== 'attack') return;
      const cx = world.character.x + world.character.width / 2;
      const bx = this.x + this.width / 2;
      const closeNow = Math.abs(cx - bx) < 150;
      if (closeNow && !world.character.isHurt()) {
        world.character.hit();
        world.statusBar.setPercentage(world.character.energy);
      }
    }, hitWindowStart * this.ATTACK_DELAY);
  }

  startStateAnimLoop() {
    setInterval(() => {
      const now = Date.now();
      const { images, delay } = this.pickAnim();
      this.advanceFrameIfDue(now, delay);
      this.applyTransitions(images.length);
      this.setCurrentImage(images);
    }, 50);
  }

  advanceFrameIfDue(now, delay) {
    if (now - this.lastFrameTime >= delay) {
      this.frameIndex++;
      this.lastFrameTime = now;
    }
  }

  pickAnim() {
    if (this.state === 'dead' || this.dead) return { images: this.IMAGES_DEAD, delay: this.DEAD_DELAY };
    if (this.state === 'attack') return { images: this.IMAGES_ATTACK, delay: this.ATTACK_DELAY };
    if (this.isUnderHalfHealth()) return { images: this.IMAGES_HURT, delay: this.WALK_DELAY };
    if (this.state === 'walk') return { images: this.IMAGES_WALKING, delay: this.WALK_DELAY };
    return { images: this.IMAGES_ALERT, delay: this.ALERT_DELAY };
  }

  isUnderHalfHealth() {
    const max = this.maxHealthSteps ?? null;
    const cur = this.healthSteps ?? null;
    return max !== null && cur !== null && cur > 0 && cur <= Math.floor(max / 2);
  }

  applyTransitions(length) {
    if (this.state === 'dead') return this.clampOnDead(length);
    if (this.state === 'alert' && this.frameIndex >= length) return this.onAlertDone();
    if (this.state === 'attack' && this.frameIndex >= length) return this.onAttackDone();
    if (this.state === 'walk' && this.frameIndex >= length) return this.loopFrame(length);
    if (this.frameIndex >= length) this.loopFrame(length);
  }

  clampOnDead(length) {
    this.frameIndex = Math.min(this.frameIndex, length - 1);
  }

  onAlertDone() {
    this.alertPlayed = true;
    this.state = 'walk';
    this.frameIndex = 0;
  }

  onAttackDone() {
    this.state = 'walk';
    this.frameIndex = 0;
  }

  loopFrame(length) {
    this.frameIndex = 0;
  }

  setCurrentImage(images) {
    const idx = Math.min(this.frameIndex, images.length - 1);
    const path = images[idx];
    this.img = this.imageCache[path];
  }

  startWalkLoop() {
    setInterval(() => {
      if (this.dead) {
        this.speedY = Math.min(this.speedY + 1, 30);
        this.y += this.speedY * 0.5;
        return;
      }
      if (this.awake && this.state === 'walk') this.moveLeft();
    }, 1000 / 60);
  }

  isAlive() {
    return !this.dead;
  }
  isAwake() {
    return !!this.awake;
  }
  getHealthStep() {
    return this.healthSteps;
  }

  applyHit(amount = 1, now = Date.now(), defaultMaxSteps = null) {
    const cooldown = this.hitCooldownMs ?? 250;
    if (!this.lastHitAt || now - this.lastHitAt >= cooldown) {
      if (this.maxHealthSteps == null && defaultMaxSteps != null) this.maxHealthSteps = defaultMaxSteps;
      const max = this.maxHealthSteps ?? defaultMaxSteps ?? 0;
      const current = this.healthSteps ?? max;
      this.healthSteps = Math.max(0, current - amount);
      this.lastHitAt = now;
      if (this.healthSteps === 0) {
        this.dead = true;
        this.speed = 0;
        this.state = 'dead';
        this.frameIndex = 0;
      }
      return true;
    }
    return false;
  }

  initHealth(maxSteps) {
    this.healthSteps = maxSteps;
    this.maxHealthSteps = maxSteps;
    this.lastHitAt = 0;
    this.hitCooldownMs = this.hitCooldownMs ?? 250;
  }

  getBarrierRect(margin, width) {
    const x = this.x + this.width - margin;
    return { x, y: -1000, width, height: 3000, offset: { top: 0, right: 0, bottom: 0, left: 0 } };
  }
}
