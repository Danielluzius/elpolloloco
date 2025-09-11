/**
 * A class for generating random numbers with an optional seed.
 */
class Randomizer {
  /**
   * Creates an instance of Randomizer.
   * @param {number|null} [seed] - The seed for the random number generator. If null or undefined, Math.random() is used.
   */
  constructor(seed) {
    this.useMath = seed === undefined || seed === null;
    this.state = (seed || 0) >>> 0;
    this.mod = 4294967296;
  }

  /**
   * Generates the next random number in the sequence.
   * @returns {number} A random number between 0 (inclusive) and 1 (exclusive).
   */
  next() {
    if (this.useMath) return Math.random();
    this.state = (this.state * 1664525 + 1013904223) % this.mod;
    return this.state / this.mod;
  }

  /**
   * Generates a random integer within a specified range.
   * @param {number} min - The minimum value (inclusive).
   * @param {number} max - The maximum value (inclusive).
   * @returns {number} A random integer between min and max.
   */
  int(min, max) {
    const r = this.next();
    return Math.floor(r * (max - min + 1)) + min;
  }

  /**
   * Determines whether an event occurs based on a given probability.
   * @param {number} prob - The probability of the event occurring (0 to 1).
   * @returns {boolean} True if the event occurs, false otherwise.
   */
  chance(prob) {
    return this.next() < prob;
  }
}
