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
    'assets/img/4_enemie_boss_chicken/2_alert/G5.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G6.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G7.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G8.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G9.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G10.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G11.png',
    'assets/img/4_enemie_boss_chicken/2_alert/G12.png',
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

  startStateAnimLoop() {
    setInterval(() => {
      const now = Date.now();
      const { images, delay } = this.pickAnim();
      if (now - this.lastFrameTime >= delay) {
        this.frameIndex++;
        this.lastFrameTime = now;
      }
      this.applyTransitions(images.length);
      const idx = Math.min(this.frameIndex, images.length - 1);
      const path = images[idx];
      this.img = this.imageCache[path];
    }, 50);
  }

  pickAnim() {
    // Dead overrides everything
    if (this.state === 'dead' || this.dead) return { images: this.IMAGES_DEAD, delay: this.DEAD_DELAY };
    // Attack overrides walking/hurt
    if (this.state === 'attack') return { images: this.IMAGES_ATTACK, delay: this.ATTACK_DELAY };
    // Hurt when under 50% health (if values present)
    const max = this.maxHealthSteps ?? null;
    const cur = this.healthSteps ?? null;
    const underHalf = max !== null && cur !== null && cur > 0 && cur <= Math.floor(max / 2);
    if (underHalf) return { images: this.IMAGES_HURT, delay: this.WALK_DELAY };
    if (this.state === 'walk') return { images: this.IMAGES_WALKING, delay: this.WALK_DELAY };
    return { images: this.IMAGES_ALERT, delay: this.ALERT_DELAY };
  }

  applyTransitions(length) {
    if (this.state === 'dead') {
      // stop at last frame
      this.frameIndex = Math.min(this.frameIndex, length - 1);
    } else if (this.state === 'alert' && this.frameIndex >= length) {
      this.alertPlayed = true;
      this.state = 'walk';
      this.frameIndex = 0;
    } else if (this.state === 'attack' && this.frameIndex >= length) {
      this.state = 'walk';
      this.frameIndex = 0;
    } else if (this.state === 'walk' && this.frameIndex >= length) {
      this.frameIndex = 0;
    } else {
      // For hurt/alert looping
      if (this.frameIndex >= length) this.frameIndex = 0;
    }
  }

  startWalkLoop() {
    setInterval(() => {
      if (this.dead) {
        // fall down when dead
        this.speedY = Math.min(this.speedY + 1, 30);
        this.y += this.speedY * 0.5;
        return;
      }
      if (this.awake && this.state === 'walk') this.moveLeft();
    }, 1000 / 60);
  }
}
