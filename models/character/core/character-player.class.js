/**
 * Represents the main character controlled by the player.
 * Extends the base Character class.
 */
class CharacterPlayer extends Character {
  /**
   * Indicates whether the intro sequence is active.
   * @type {boolean}
   */
  introActive = false;

  /**
   * Starting X position for the intro sequence.
   * @type {number}
   */
  introStartX = 0;

  /**
   * Target X position for the intro sequence.
   * @type {number}
   */
  introTargetX = 0;

  /**
   * Speed of the character during the intro sequence.
   * @type {number}
   */
  introSpeed = 3.5;

  /**
   * Index of the current intro animation frame.
   * @type {number}
   */
  introFrameIndex = 0;

  /**
   * Timestamp of the last intro frame update.
   * @type {number}
   */
  lastIntroFrameTime = 0;

  /**
   * Delay between intro animation frames in milliseconds.
   * @type {number}
   */
  INTRO_FRAME_DELAY = 80;

  /**
   * Indicates whether the character is currently jumping.
   * @type {boolean}
   */
  isJumping = false;

  /**
   * Index of the current jump animation frame.
   * @type {number}
   */
  jumpFrameIndex = 0;

  /**
   * Timestamp of the last jump frame update.
   * @type {number}
   */
  lastJumpFrameTime = 0;

  /**
   * Delay between jump animation frames in milliseconds.
   * @type {number}
   */
  JUMP_FRAME_DELAY = 80;

  /**
   * Horizontal velocity during the jump.
   * @type {number}
   */
  jumpVX = 0;

  /**
   * Forward velocity at the start of the jump.
   * @type {number}
   */
  JUMP_FORWARD_VX = 0;

  /**
   * Initial vertical velocity for the jump.
   * @type {number}
   */
  JUMP_INIT_VY = 26;

  /**
   * Indicates whether the character is performing a special attack.
   * @type {boolean}
   */
  isSpecialAttacking = false;

  /**
   * Index of the current special attack animation frame.
   * @type {number}
   */
  specialFrameIndex = 0;

  /**
   * Timestamp of the last special frame update.
   * @type {number}
   */
  lastSpecialFrameTime = 0;

  /**
   * Delay between special attack animation frames in milliseconds.
   * @type {number}
   */
  SPECIAL_FRAME_DELAY = 90;

  /**
   * Index of the current effect animation frame.
   * @type {number}
   */
  effectFrameIndex = 0;

  /**
   * Timestamp of the last effect frame update.
   * @type {number}
   */
  lastEffectFrameTime = 0;

  /**
   * Delay between effect animation frames in milliseconds.
   * @type {number}
   */
  EFFECT_FRAME_DELAY = 50;

  /**
   * Time at which the special attack animation ends.
   * @type {number}
   */
  specialEndAt = 0;

  /**
   * Width of the special attack effect.
   * @type {number}
   */
  SPECIAL_EFFECT_W = 200;

  /**
   * Height of the special attack effect.
   * @type {number}
   */
  SPECIAL_EFFECT_H = 200;

  /**
   * Feet offset for the special attack effect.
   * @type {number}
   */
  SPECIAL_EFFECT_FEET_OFFSET = 60;

  /**
   * Step size for moving the effect.
   * @type {number}
   */
  EFFECT_MOVE_STEP = 26;

  /**
   * Speed of the wind push effect.
   * @type {number}
   */
  WIND_PUSH_SPEED = 36;

  /**
   * Index of the current idle animation frame.
   * @type {number}
   */
  idleFrameIndex = 0;

  /**
   * Timestamp of the last idle frame update.
   * @type {number}
   */
  lastIdleFrameTime = 0;

  /**
   * Delay between idle animation frames in milliseconds.
   * @type {number}
   */
  IDLE_FRAME_DELAY = 220;

  /**
   * Order of frames for the idle animation.
   * @type {Array<number>}
   */
  IDLE_FRAME_ORDER = null;

  /**
   * Index of the current long idle animation frame.
   * @type {number}
   */
  longIdleFrameIndex = 0;

  /**
   * Timestamp of the last long idle frame update.
   * @type {number}
   */
  lastLongIdleFrameTime = 0;

  /**
   * Delay between long idle animation frames in milliseconds.
   * @type {number}
   */
  LONG_IDLE_FRAME_DELAY = 200;

  /**
   * Index of the current hurt animation frame.
   * @type {number}
   */
  hurtFrameIndex = 0;

  /**
   * Timestamp of the last hurt frame update.
   * @type {number}
   */
  lastHurtFrameTime = 0;

  /**
   * Delay between hurt animation frames in milliseconds.
   * @type {number}
   */
  HURT_FRAME_DELAY = 90;

  /**
   * Time at which the hurt animation ends.
   * @type {number}
   */
  hurtEndAt = 0;

  /**
   * Start time of the hurt animation.
   * @type {number}
   */
  _hurtAnimStartAt = 0;

  /**
   * Indicates whether knockback is active.
   * @type {boolean}
   */
  knockbackActive = false;

  /**
   * Time at which the knockback effect ends.
   * @type {number}
   */
  knockbackEndAt = 0;

  /**
   * Horizontal velocity during the knockback.
   * @type {number}
   */
  knockbackVX = 0;

  /**
   * Speed of the knockback effect in the X direction.
   * @type {number}
   */
  KNOCKBACK_SPEED_X = 10;

  /**
   * Duration of the knockback effect in milliseconds.
   * @type {number}
   */
  KNOCKBACK_DURATION = 350;

  /**
   * Indicates whether the character is currently blocking.
   * @type {boolean}
   */
  isBlocking = false;

  /**
   * Index of the current block animation frame.
   * @type {number}
   */
  blockFrameIndex = 0;

  /**
   * Timestamp of the last block frame update.
   * @type {number}
   */
  lastBlockFrameTime = 0;

  /**
   * Delay between block animation frames in milliseconds.
   * @type {number}
   */
  BLOCK_FRAME_DELAY = 100;

  /**
   * Duration of the block effect in milliseconds.
   * @type {number}
   */
  BLOCK_DURATION_MS = 800;

  /**
   * Time to remain idle before switching to long idle in milliseconds.
   * @type {number}
   */
  IDLE_AFTER_MS = 1200;

  /**
   * Time to remain in long idle state in milliseconds.
   * @type {number}
   */
  LONG_IDLE_AFTER_MS = 4000;

  /**
   * Delay between stomp animation frames in milliseconds.
   * @type {number}
   */
  STOMP_FRAME_DELAY = 90;

  /**
   * Amount of health restored by the heart potion.
   * @type {number}
   */
  HEART_POTION_HEAL = 2;

  /**
   * Range of the character's attack in the X direction.
   * @type {number}
   */
  ATTACK_RANGE_X = 120;

  /**
   * Frame at which the attack becomes active.
   * @type {number}
   */
  ATTACK_ACTIVE_START_FRAME = 1;

  /**
   * Number of segments in the block animation.
   * @type {number}
   */
  blockSegments = 5;

  /**
   * Indicates whether the character is currently attacking.
   * @type {boolean}
   */
  isAttacking = false;

  /**
   * Index of the current attack animation frame.
   * @type {number}
   */
  attackFrameIndex = 0;

  /**
   * Timestamp of the last attack frame update.
   * @type {number}
   */
  lastAttackFrameTime = 0;

  /**
   * Delay between attack animation frames in milliseconds.
   * @type {number}
   */
  ATTACK_FRAME_DELAY = 90;

  /**
   * Time at which the attack animation ends.
   * @type {number}
   */
  attackEndAt = 0;

  /**
   * Cooldown duration between attacks in milliseconds.
   * @type {number}
   */
  ATTACK_COOLDOWN_MS = 500;

  /**
   * Time at which the next attack can occur.
   * @type {number}
   */
  nextAttackAt = 0;

  /**
   * Attack sequence number.
   * @type {number}
   */
  _attackSeq = 0;

  /**
   * Delay between death animation frames in milliseconds.
   * @type {number}
   */
  DEAD_FRAME_DELAY = 200;

  /**
   * Time at which the death animation started.
   * @type {number}
   */
  deadStartedAt = 0;

  /**
   * Initial vertical velocity for the death animation.
   * @type {number}
   */
  DEATH_INIT_VY = 24;

  /**
   * Acceleration during the death animation.
   * @type {number}
   */
  DEATH_ACCEL = 3;

  /**
   * Indicates whether the death arc animation has been initialized.
   * @type {boolean}
   */
  deathArcInit = false;

  /**
   * Indicates whether the last frame of the death animation is locked.
   * @type {boolean}
   */
  deathLastFrameLocked = false;

  /**
   * Paths to the special attack effect images.
   * @type {Array<string>}
   */
  SPECIAL_EFFECT_PATHS = Array.from(
    { length: 10 },
    (_, i) => `assets/img/2_character_man/11_special_attack/${i + 1}.png`
  );

  /**
   * Initializes a new instance of the CharacterPlayer class.
   */
  constructor() {
    super();
    this.preloadAssets();
    this.computeIdleOrder();
    this.initLoops();
  }
}
