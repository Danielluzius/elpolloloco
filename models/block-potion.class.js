class BlockPotion extends MoveableObject {
  constructor(x, options = {}) {
    super();
    this.disableGravity = true;
    this.loadImage('assets/img/6_potions/block_potion.png');
    this.width = options.width ?? 36;
    this.height = options.height ?? 36;
    // Default to vertical center if y provided; otherwise ground baseline like rocks
    const groundBottom = 440;
    this.y = options.y ?? groundBottom - this.height;
    this.x = x;
    this.offset = options.offset ?? { top: 4, right: 4, bottom: 2, left: 4 };
  }
}
