class CharacterPlayerComposed extends CharacterPlayer {
  constructor() {
    super();
  }
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

  processInputTick() {
    if (this.isDead()) return;
    if (this.introActive) return this.tickIntro?.();
    if (this.canProcessHorizontal?.()) this.handleHorizontalMove?.();
    this.updateAllStateTicks?.();
    if (!this.knockbackActive) this.handleJumpKey?.();
    this.markActivityOnAction?.();
  }
}

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

(function composePlayer() {
  const targetProto = CharacterPlayerComposed.prototype;
  const skip = new Set(Object.getOwnPropertyNames(targetProto));
  for (const cls of __PLAYER_SEGMENTS) {
    const src = cls.prototype;
    for (const name of Object.getOwnPropertyNames(src)) {
      if (name === 'constructor') continue;
      if (skip.has(name)) continue; // don't override base / previously set explicit methods
      const desc = Object.getOwnPropertyDescriptor(src, name);
      if (desc) Object.defineProperty(targetProto, name, desc);
    }
  }
})();
