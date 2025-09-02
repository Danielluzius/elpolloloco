class Randomizer {
  constructor(seed) {
    this.useMath = seed === undefined || seed === null;
    this.state = (seed || 0) >>> 0;
    this.mod = 4294967296;
  }

  next() {
    if (this.useMath) return Math.random();
    this.state = (this.state * 1664525 + 1013904223) % this.mod;
    return this.state / this.mod;
  }

  int(min, max) {
    const r = this.next();
    return Math.floor(r * (max - min + 1)) + min;
  }

  chance(prob) {
    return this.next() < prob;
  }
}
