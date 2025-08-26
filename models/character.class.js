class Character extends MoveableObject {
  height = 280;
  y = 155;
  constructor() {
    super().loadImage('assets/img/2_character_pepe/2_walk/W-21.png');
  }

  jump() {
    console.log('Jumping');
  }
}
