let canvas;
let world;
let keyboard = new Keyboard();

function init() {
  canvas = document.getElementById('canvas');
  world = new World(canvas, keyboard);
}

const KEY_MAP = {
  39: 'RIGHT',
  37: 'LEFT',
  38: 'UP',
  40: 'DOWN',
  32: 'SPACE',
  68: 'D',
};

window.addEventListener('keydown', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) keyboard[key] = true;
});

window.addEventListener('keyup', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) keyboard[key] = false;
});
