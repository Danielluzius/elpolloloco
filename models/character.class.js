class Character extends MoveableObject {
  height = 320;
  width = 180;
  y = 120;
  speed = 10;
  IMAGES_IDLE = [
    'assets/img/2_character_pepe/1_idle/idle/I-1.png',
    'assets/img/2_character_pepe/1_idle/idle/I-2.png',
    'assets/img/2_character_pepe/1_idle/idle/I-3.png',
    'assets/img/2_character_pepe/1_idle/idle/I-4.png',
    'assets/img/2_character_pepe/1_idle/idle/I-5.png',
    'assets/img/2_character_pepe/1_idle/idle/I-6.png',
    'assets/img/2_character_pepe/1_idle/idle/I-7.png',
    'assets/img/2_character_pepe/1_idle/idle/I-8.png',
    'assets/img/2_character_pepe/1_idle/idle/I-9.png',
    'assets/img/2_character_pepe/1_idle/idle/I-10.png',
  ];
  IMAGES_LONG_IDLE = [
    'assets/img/2_character_pepe/1_idle/long_idle/I-11.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-12.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-13.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-14.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-15.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-16.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-17.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-18.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-19.png',
    'assets/img/2_character_pepe/1_idle/long_idle/I-20.png',
  ];
  IMAGES_WALKING = [
    'assets/img/2_character_pepe/2_walk/W-21.png',
    'assets/img/2_character_pepe/2_walk/W-22.png',
    'assets/img/2_character_pepe/2_walk/W-23.png',
    'assets/img/2_character_pepe/2_walk/W-24.png',
    'assets/img/2_character_pepe/2_walk/W-25.png',
    'assets/img/2_character_pepe/2_walk/W-26.png',
  ];
  IMAGES_JUMPING = [
    'assets/img/2_character_pepe/3_jump/J-31.png',
    'assets/img/2_character_pepe/3_jump/J-32.png',
    'assets/img/2_character_pepe/3_jump/J-33.png',
    'assets/img/2_character_pepe/3_jump/J-34.png',
    'assets/img/2_character_pepe/3_jump/J-35.png',
    'assets/img/2_character_pepe/3_jump/J-36.png',
    'assets/img/2_character_pepe/3_jump/J-37.png',
    'assets/img/2_character_pepe/3_jump/J-38.png',
    'assets/img/2_character_pepe/3_jump/J-39.png',
  ];
  IMAGES_HURT = [
    'assets/img/2_character_pepe/4_hurt/H-41.png',
    'assets/img/2_character_pepe/4_hurt/H-42.png',
    'assets/img/2_character_pepe/4_hurt/H-43.png',
  ];
  IMAGES_DEAD = [
    'assets/img/2_character_pepe/5_dead/D-51.png',
    'assets/img/2_character_pepe/5_dead/D-52.png',
    'assets/img/2_character_pepe/5_dead/D-53.png',
    'assets/img/2_character_pepe/5_dead/D-54.png',
    'assets/img/2_character_pepe/5_dead/D-55.png',
    'assets/img/2_character_pepe/5_dead/D-56.png',
    'assets/img/2_character_pepe/5_dead/D-57.png',
  ];
  jumpFrameIndex = 0;
  lastJumpFrameTime = 0;
  JUMP_FRAME_DELAY = 80;
  isJumping = false;
  lastActivityAt = Date.now();
  IDLE_AFTER_MS = 1500;
  LONG_IDLE_AFTER_MS = 6000;
  animKey = 'stand';
  idleFrameIndex = 0;
  lastIdleFrameTime = 0;
  IDLE_FRAME_DELAY = 150;
  longIdleFrameIndex = 0;
  lastLongIdleFrameTime = 0;
  LONG_IDLE_FRAME_DELAY = 200;

  constructor() {
    super();
    this.offset = { top: 40, right: 35, bottom: 0, left: 35 };
    this.loadImage('assets/img/2_character_pepe/1_idle/idle/I-1.png');
    this.loadImages(this.IMAGES_IDLE);
    this.loadImages(this.IMAGES_LONG_IDLE);
    this.loadImages(this.IMAGES_WALKING);
    this.loadImages(this.IMAGES_JUMPING);
    this.loadImages(this.IMAGES_HURT);
    this.loadImages(this.IMAGES_DEAD);
    this.applyGravity();
    this.animate();
  }

  animate() {
    setInterval(() => {
      if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
        this.moveRight();
        this.otherDirection = false;
        this.lastActivityAt = Date.now();
      }

      if (this.world.keyboard.LEFT && this.x > 0) {
        this.moveLeft();
        this.otherDirection = true;
        this.lastActivityAt = Date.now();
      }
      this.world.camera_x = -this.x + 100;

      if (this.world.keyboard.SPACE && !this.isJumping && !this.isAboveGround()) {
        this.jump();
        this.isJumping = true;
        this.jumpFrameIndex = 0;
        this.currentImage = 0;
        this.lastJumpFrameTime = Date.now();
        this.lastActivityAt = this.lastJumpFrameTime;
      }

      if (this.world.keyboard.D) {
        this.lastActivityAt = Date.now();
      }
    }, 1000 / 60);

    setInterval(() => {
      const now = Date.now();
      if (this.isDead()) {
        this.playAnimation(this.IMAGES_DEAD);
        this.animKey = 'dead';
      } else if (this.isHurt()) {
        this.playAnimation(this.IMAGES_HURT);
        this.animKey = 'hurt';
      } else if (this.isAboveGround()) {
        if (this.jumpFrameIndex < this.IMAGES_JUMPING.length - 1) {
          if (now - this.lastJumpFrameTime >= this.JUMP_FRAME_DELAY) {
            this.jumpFrameIndex++;
            this.lastJumpFrameTime = now;
          }
        }
        const path = this.IMAGES_JUMPING[this.jumpFrameIndex];
        this.img = this.imageCache[path];
        this.animKey = 'jump';
      } else {
        if (this.isJumping) {
          this.currentImage = 0;
        }
        this.jumpFrameIndex = 0;
        this.isJumping = false;
        const moving = this.world.keyboard.RIGHT || this.world.keyboard.LEFT;
        const inactiveMs = now - this.lastActivityAt;
        if (moving) {
          if (this.animKey !== 'walk') this.currentImage = 0;
          this.playAnimation(this.IMAGES_WALKING);
          this.animKey = 'walk';
          this.idleFrameIndex = 0;
          this.longIdleFrameIndex = 0;
        } else if (inactiveMs >= this.LONG_IDLE_AFTER_MS) {
          if (this.animKey !== 'long_idle') {
            this.currentImage = 0;
            this.longIdleFrameIndex = 0;
            this.lastLongIdleFrameTime = now;
          }
          if (now - this.lastLongIdleFrameTime >= this.LONG_IDLE_FRAME_DELAY) {
            this.longIdleFrameIndex = (this.longIdleFrameIndex + 1) % this.IMAGES_LONG_IDLE.length;
            this.lastLongIdleFrameTime = now;
          }
          const path = this.IMAGES_LONG_IDLE[this.longIdleFrameIndex];
          this.img = this.imageCache[path];
          this.animKey = 'long_idle';
          this.idleFrameIndex = 0;
        } else if (inactiveMs >= this.IDLE_AFTER_MS) {
          if (this.animKey !== 'idle') {
            this.currentImage = 0;
            this.idleFrameIndex = 0;
            this.lastIdleFrameTime = now;
          }
          if (now - this.lastIdleFrameTime >= this.IDLE_FRAME_DELAY) {
            this.idleFrameIndex = (this.idleFrameIndex + 1) % this.IMAGES_IDLE.length;
            this.lastIdleFrameTime = now;
          }
          const path = this.IMAGES_IDLE[this.idleFrameIndex];
          this.img = this.imageCache[path];
          this.animKey = 'idle';
          this.longIdleFrameIndex = 0;
        } else {
          const path = this.IMAGES_IDLE[0] || this.IMAGES_WALKING[0];
          this.img = this.imageCache[path];
          this.animKey = 'stand';
          this.idleFrameIndex = 0;
          this.longIdleFrameIndex = 0;
        }
      }
    }, 50);
  }
}
