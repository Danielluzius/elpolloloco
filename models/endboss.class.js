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
    if (this.state === 'attack') return { images: this.IMAGES_ATTACK, delay: this.ATTACK_DELAY };
    if (this.state === 'walk') return { images: this.IMAGES_WALKING, delay: this.WALK_DELAY };
    return { images: this.IMAGES_ALERT, delay: this.ALERT_DELAY };
  }

  applyTransitions(length) {
    if (this.state === 'alert' && this.frameIndex >= length) {
      this.alertPlayed = true;
      this.state = 'walk';
      this.frameIndex = 0;
    } else if (this.state === 'attack' && this.frameIndex >= length) {
      this.state = 'walk';
      this.frameIndex = 0;
    } else if (this.state === 'walk' && this.frameIndex >= length) {
      this.frameIndex = 0;
    }
  }

  startWalkLoop() {
    setInterval(() => {
      if (this.awake && this.state === 'walk') this.moveLeft();
    }, 1000 / 60);
  }
}
