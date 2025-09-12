/**
 * Adds basic instance methods to CharacterPlayer via prototype extension.
 * Keeps the main class file lean without changing runtime behavior.
 * These methods are simple helpers used across segments (input, anim, etc.).
 */

/**
 * Preloads assets required for the character.
 */
CharacterPlayer.prototype.preloadAssets = function preloadAssets() {
  this.SPECIAL_EFFECT_PATHS.forEach((p) => this.loadImage(p));
};

/**
 * Computes the order of idle animation frames.
 */
CharacterPlayer.prototype.computeIdleOrder = function computeIdleOrder() {
  const img = this.imageCache[this.IDLE_SHEET?.path];
  const cnt = this.getSheetCount?.(this.IDLE_SHEET, img) || 1;
  let order = Array.from({ length: cnt }, (_, i) => i);
  if (order.length > 1) order = order.slice(0, order.length - 1);
  this.IDLE_FRAME_ORDER = order.length ? order : [0];
};

/**
 * Initializes the input and animation loops for the character.
 */
CharacterPlayer.prototype.initLoops = function initLoops() {
  this.applyGravity?.();
  this.startInputLoop();
  this.startAnimLoop();
};

/**
 * Starts the input processing loop.
 */
CharacterPlayer.prototype.startInputLoop = function startInputLoop() {
  setInterval(() => this.processInputTick?.(), 1000 / 60);
};

/**
 * Starts the animation processing loop.
 */
CharacterPlayer.prototype.startAnimLoop = function startAnimLoop() {
  setInterval(() => this.animTick?.(), 50);
};

/**
 * Processes input ticks for character actions.
 */
CharacterPlayer.prototype.processInputTick = function processInputTick() {};

/**
 * Handles animation ticks for the character.
 */
CharacterPlayer.prototype.animTick = function animTick() {};

/**
 * Draws the current frame of the character.
 */
CharacterPlayer.prototype.drawFrame = function drawFrame() {};

/**
 * Marks the character as active by updating the last activity timestamp.
 */
CharacterPlayer.prototype.markActivity = function markActivity() {
  this.lastActivityAt = Date.now();
};

/**
 * Updates the block state of the character.
 */
CharacterPlayer.prototype.updateBlockState = function updateBlockState() {};

/**
 * Starts the hurt animation and sound effect for the character.
 */
CharacterPlayer.prototype.startHurt = function startHurt() {
  this.hurtEndAt = Date.now() + 600;
  try {
    window.sound?.play('player_hurt_sound', { channel: 'sfx' });
  } catch (_) {}
};

/**
 * Checks if the character is currently hurt.
 * @returns {boolean} True if the character is hurt, otherwise false.
 */
CharacterPlayer.prototype.isHurt = function isHurt() {
  return this.hurtEndAt && Date.now() < this.hurtEndAt;
};
