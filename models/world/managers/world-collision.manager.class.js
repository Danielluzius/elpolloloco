class WorldCollisionManager {
  constructor(world) {
    this.w = world;
  }
  tick() {
    this.filterEnemies();
    this.resolveRocks();
    this.checkAttackHits();
  }
  filterEnemies() {
    const w = this.w;
    w.level.enemies = w.level.enemies.filter((e) => {
      if (e.shouldDespawn?.()) return false;
      if (e.dead) return true;
      if (!w.character.isColliding(e)) return true;
      if (
        e instanceof Goblin &&
        this.isGoblinAttackFrame(e) &&
        w.character.applySegmentHit
      )
        this.damageCharacterIfNeeded();
      return true;
    });
  }
  resolveRocks() {
    const w = this.w;
    const a = w.character.getBoundsWithOffset?.(w.character) || {
      left: w.character.x,
      right: w.character.x + w.character.width,
      top: w.character.y,
      bottom: w.character.y + w.character.height,
    };
    for (const rock of w.level.rocks || []) {
      const b = rock.getBoundsWithOffset?.(rock) || {
        left: rock.x,
        right: rock.x + rock.width,
        top: rock.y,
        bottom: rock.y + rock.height,
      };
      const overlap =
        a.right > b.left &&
        a.left < b.right &&
        a.bottom > b.top &&
        a.top < b.bottom;
      if (!overlap) continue;
      if (a.bottom <= b.top + 4) continue;
      const pushLeft = a.right - b.left,
        pushRight = b.right - a.left;
      if (pushLeft < pushRight) w.character.x -= pushLeft;
      else w.character.x += pushRight;
    }
  }
  isGoblinAttackFrame(g) {
    if (!g.isAttacking) return false;
    const cnt = g.attackSheet?.count || 1;
    const hf = Math.floor(cnt / 2);
    return g.attackFrameIdx === hf && !g.appliedAttackDamage;
  }
  checkAttackHits() {
    const w = this.w;
    if (!w.character.isAttackActiveWindow?.()) return;
    const hitbox = w.character.getAttackHitboxRect?.();
    if (!hitbox) return;
    for (const enemy of w.level.enemies) this.processAttackHit(enemy, hitbox);
  }
  processAttackHit(enemy, hitbox) {
    if (!(enemy instanceof Goblin) && !(enemy instanceof Endboss)) return;
    if (enemy.dying || enemy.dead) return;
    const eb = enemy.getBoundsWithOffset?.(enemy) || {
      left: enemy.x,
      right: enemy.x + enemy.width,
      top: enemy.y,
      bottom: enemy.y + enemy.height,
    };
    const overlap =
      eb.right > hitbox.left &&
      eb.left < hitbox.right &&
      eb.bottom > hitbox.top &&
      eb.top < hitbox.bottom;
    if (!overlap) return;
    const w = this.w;
    if (typeof enemy.onHitByAttack === 'function')
      enemy.onHitByAttack(w.character);
    else if (enemy instanceof Endboss && enemy.applyHit) {
      const applied = enemy.applyHit(
        1,
        Date.now(),
        10,
        w.character.attackId ?? null
      );
      if (applied) w.awardCharge(1);
    } else if (enemy.applyHit) this.damageBossIfNeeded(enemy);
  }
  damageBossIfNeeded(boss) {
    boss.applyHit(1, Date.now(), this.w.bossSegBar.getMaxSteps());
  }
  damageCharacterIfNeeded() {
    const w = this.w;
    if (w.character.isHurt()) return;
    w.character.applySegmentHit?.();
    w.characterHealthBar.setSegments(w.character.healthSegments || 0);
  }
}
