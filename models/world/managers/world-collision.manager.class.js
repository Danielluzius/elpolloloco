/**
 * Manages collision detection and resolution in the game world.
 */
class WorldCollisionManager {
  /**
   * Creates a new WorldCollisionManager instance.
   * @param {object} world - The game world instance.
   */
  constructor(world) {
    this.w = world;
  }

  /**
   * Executes collision-related logic for each game tick.
   */
  tick() {
    this.filterEnemies();
    this.resolveRocks();
    this.checkAttackHits();
  }

  /**
   * Filters enemies based on their state and resolves collisions with the character.
   */
  filterEnemies() {
    const w = this.w;
    w.level.enemies = w.level.enemies.filter((e) => {
      if (e.shouldDespawn?.()) return false;
      if (e.dead) return true;
      if (!w.character.isColliding(e)) return true;
      this.handleEnemyCollision(e);
      return true;
    });
  }

  /**
   * Handles collision logic for an enemy.
   * @param {object} enemy - The enemy instance.
   */
  handleEnemyCollision(enemy) {
    const w = this.w;
    if (
      enemy instanceof Goblin &&
      this.isGoblinAttackFrame(enemy) &&
      w.character.applySegmentHit
    ) {
      this.damageCharacterIfNeeded();
    }
  }

  /**
   * Resolves collisions between the character and rocks.
   */
  resolveRocks() {
    const w = this.w;
    const characterBounds = this.getCharacterBounds();
    for (const rock of w.level.rocks || []) {
      this.handleRockCollision(rock, characterBounds);
    }
  }

  /**
   * Gets the character's bounding box.
   * @returns {object} The character's bounding box.
   */
  getCharacterBounds() {
    const w = this.w;
    return (
      w.character.getBoundsWithOffset?.(w.character) || {
        left: w.character.x,
        right: w.character.x + w.character.width,
        top: w.character.y,
        bottom: w.character.y + w.character.height,
      }
    );
  }

  /**
   * Handles collision logic for a rock.
   * @param {object} rock - The rock instance.
   * @param {object} characterBounds - The character's bounding box.
   */
  handleRockCollision(rock, characterBounds) {
    const rockBounds = this.getRockBounds(rock);
    const overlap = this.checkOverlap(characterBounds, rockBounds);
    if (!overlap || characterBounds.bottom <= rockBounds.top + 4) return;
    this.pushCharacterAwayFromRock(characterBounds, rockBounds);
  }

  /**
   * Gets the bounding box of a rock.
   * @param {object} rock - The rock instance.
   * @returns {object} The rock's bounding box.
   */
  getRockBounds(rock) {
    return (
      rock.getBoundsWithOffset?.(rock) || {
        left: rock.x,
        right: rock.x + rock.width,
        top: rock.y,
        bottom: rock.y + rock.height,
      }
    );
  }

  /**
   * Checks if two bounding boxes overlap.
   * @param {object} a - The first bounding box.
   * @param {object} b - The second bounding box.
   * @returns {boolean} True if the boxes overlap, false otherwise.
   */
  checkOverlap(a, b) {
    return (
      a.right > b.left &&
      a.left < b.right &&
      a.bottom > b.top &&
      a.top < b.bottom
    );
  }

  /**
   * Pushes the character away from a rock based on the collision direction.
   * @param {object} characterBounds - The character's bounding box.
   * @param {object} rockBounds - The rock's bounding box.
   */
  pushCharacterAwayFromRock(characterBounds, rockBounds) {
    const w = this.w;
    const pushLeft = characterBounds.right - rockBounds.left;
    const pushRight = rockBounds.right - characterBounds.left;
    if (pushLeft < pushRight) w.character.x -= pushLeft;
    else w.character.x += pushRight;
  }

  /**
   * Checks if a goblin is in an attack frame.
   * @param {object} g - The goblin instance.
   * @returns {boolean} True if the goblin is in an attack frame, false otherwise.
   */
  isGoblinAttackFrame(g) {
    if (!g.isAttacking) return false;
    const cnt = g.attackSheet?.count || 1;
    const hf = Math.floor(cnt / 2);
    return g.attackFrameIdx === hf && !g.appliedAttackDamage;
  }

  /**
   * Checks for attack hits between the character and enemies.
   */
  checkAttackHits() {
    const w = this.w;
    if (!w.character.isAttackActiveWindow?.()) return;
    const hitbox = w.character.getAttackHitboxRect?.();
    if (!hitbox) return;
    for (const enemy of w.level.enemies) this.processAttackHit(enemy, hitbox);
  }

  /**
   * Processes an attack hit on an enemy.
   * @param {object} enemy - The enemy instance.
   * @param {object} hitbox - The character's attack hitbox.
   */
  processAttackHit(enemy, hitbox) {
    if (!(enemy instanceof Goblin) && !(enemy instanceof Endboss)) return;
    if (enemy.dying || enemy.dead) return;
    const enemyBounds = this.getEnemyBounds(enemy);
    const overlap = this.checkOverlap(enemyBounds, hitbox);
    if (!overlap) return;
    this.applyAttackToEnemy(enemy);
  }

  /**
   * Gets the bounding box of an enemy.
   * @param {object} enemy - The enemy instance.
   * @returns {object} The enemy's bounding box.
   */
  getEnemyBounds(enemy) {
    return (
      enemy.getBoundsWithOffset?.(enemy) || {
        left: enemy.x,
        right: enemy.x + enemy.width,
        top: enemy.y,
        bottom: enemy.y + enemy.height,
      }
    );
  }

  /**
   * Applies an attack to an enemy.
   * @param {object} enemy - The enemy instance.
   */
  applyAttackToEnemy(enemy) {
    const w = this.w;
    if (typeof enemy.onHitByAttack === 'function') {
      enemy.onHitByAttack(w.character);
    } else if (enemy instanceof Endboss && enemy.applyHit) {
      const applied = enemy.applyHit(
        1,
        Date.now(),
        10,
        w.character.attackId ?? null
      );
      if (applied) w.awardCharge(1);
    } else if (enemy.applyHit) {
      this.damageBossIfNeeded(enemy);
    }
  }

  /**
   * Damages a boss if needed.
   * @param {object} boss - The boss instance.
   */
  damageBossIfNeeded(boss) {
    boss.applyHit(1, Date.now(), this.w.bossSegBar.getMaxSteps());
  }

  /**
   * Damages the character if needed.
   */
  damageCharacterIfNeeded() {
    const w = this.w;
    if (w.character.isHurt()) return;
    w.character.applySegmentHit?.();
    w.characterHealthBar.setSegments(w.character.healthSegments || 0);
  }
}
