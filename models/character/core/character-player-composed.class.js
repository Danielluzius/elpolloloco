/**
 * Represents a composed character player with extended functionality.
 * Inherits from CharacterPlayer.
 */
class CharacterPlayerComposed extends CharacterPlayer {
  /**
   * Handles animation ticks based on the character's current state.
   */
  animTick() {
    const now = Date.now();
    if (this.isDead()) return this.setDeadFrame?.();
    if (this.introActive) return this.setIntroWalkFrame?.();
    if (this.isSpecialAttacking) return this.setSpecialFrame?.(now);
    if (this.isHurt?.() && this.setHurtFrame) return this.setHurtFrame();
    if (this.isAttacking) return this.setAttackFrame?.(now);
    if (this.isAboveGround() || this.isJumping) return this.setJumpFrame?.(now);
    if (this.isBlocking) return this.setBlockFrame?.(now);
    this.setGroundedFrame?.(now);
  }

  /**
   * Processes input ticks to handle character actions and state updates.
   */
  processInputTick() {
    if (this.isDead()) return;
    if (this.introActive) return this.tickIntro?.();
    if (this.canProcessHorizontal?.()) this.handleHorizontalMove?.();
    this.updateAllStateTicks?.();
    if (!this.knockbackActive) this.handleJumpKey?.();
    this.markActivityOnAction?.();
  }
}

/**
 * List of character player segments to be composed into the main class.
 * @type {Array<Function>}
 */
const __PLAYER_SEGMENTS = [
  CharacterPlayerInput,
  CharacterPlayerJump,
  CharacterPlayerSpecial,
  CharacterPlayerIntro,
  CharacterPlayerDeath,
  CharacterPlayerHurt,
  CharacterPlayerAttack,
  CharacterPlayerGround,
  CharacterPlayerBlockStomp,
  CharacterPlayerDamage,
];

/**
 * Composes the CharacterPlayerComposed class by merging methods from segments.
 */
(function composePlayer() {
  const targetProto = CharacterPlayerComposed.prototype;
  const skip = new Set(Object.getOwnPropertyNames(targetProto));
  for (const cls of __PLAYER_SEGMENTS) {
    const src = cls.prototype;
    for (const name of Object.getOwnPropertyNames(src)) {
      if (name === 'constructor') continue;
      if (skip.has(name)) continue; // Avoid overriding base or explicitly set methods
      const desc = Object.getOwnPropertyDescriptor(src, name);
      if (desc) Object.defineProperty(targetProto, name, desc);
    }
  }
})();
