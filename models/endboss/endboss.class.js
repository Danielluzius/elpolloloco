/**
 * Represents the end boss in the game, combining movement, combat, and animation logic.
 */
class Endboss extends EndbossMove {
  /**
   * Initializes the end boss with its starting position and behaviors.
   */
  constructor() {
    super();
    this.x = 4550;
    this.initImages();
    this.initLoops();
  }
}
