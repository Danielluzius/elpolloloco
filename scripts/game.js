let canvas;
let world;
let keyboard = new Keyboard();
let gameState = 'idle';
let ui = {};
let isMuted = false;

function init() {
  canvas = document.getElementById('canvas');
  cacheUi();
  bindUi();
  showStart();
}

function cacheUi() {
  ui.startOverlay = document.getElementById('startOverlay');
  ui.gameOverOverlay = document.getElementById('gameOverOverlay');
  ui.winOverlay = document.getElementById('winOverlay');
  ui.startBtn = document.getElementById('startBtn');
  ui.retryBtns = Array.from(document.querySelectorAll('.retryBtn'));
  ui.backToStartBtns = Array.from(document.querySelectorAll('.backToStartBtn'));
  ui.fullscreenBtn = document.getElementById('fullscreenBtn');
  ui.muteBtn = document.getElementById('muteBtn');
  ui.howToBtn = document.getElementById('howToBtn');
  ui.howToModal = document.getElementById('howToModal');
  ui.howToCloseBtn = document.getElementById('howToCloseBtn');
  ui.imprintBtn = document.getElementById('imprintBtn');
  ui.imprintModal = document.getElementById('imprintModal');
  ui.imprintCloseBtn = document.getElementById('imprintCloseBtn');
}

function bindUi() {
  ui.startBtn?.addEventListener('click', startGame);
  ui.retryBtns?.forEach((b) => b.addEventListener('click', restartGame));
  ui.backToStartBtns?.forEach((b) => b.addEventListener('click', backToStart));
  ui.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  ui.muteBtn?.addEventListener('click', toggleMute);
  ui.howToBtn?.addEventListener('click', openHowTo);
  ui.howToCloseBtn?.addEventListener('click', closeHowTo);
  ui.imprintBtn?.addEventListener('click', openImprint);
  ui.imprintCloseBtn?.addEventListener('click', closeImprint);
}

function startGame() {
  // Ensure init ran (in case landing flow was disrupted)
  if (!canvas || !keyboard) {
    try {
      init();
    } catch (e) {
      console.error('Init failed before startGame:', e);
    }
  }
  if (gameState === 'running' && world) {
    console.warn('Game already running – ignoring startGame call');
    return;
  }
  const hero = document.querySelector('#landing .hero');
  if (hero) {
    hero.classList.add('hero--off');
    try {
      hero.style.opacity = '0';
      hero.style.pointerEvents = 'none';
    } catch (_) {}
  }
  // Hide imprint button once the game starts
  ui.imprintBtn?.classList.add('hidden');

  const FADE_OUT_MS = 350;
  setTimeout(() => {
    hideAllOverlays();
    gameState = 'running';
    world = new World(canvas, keyboard);
    hookWinLose(world);
  }, FADE_OUT_MS);
}

function restartGame() {
  hideAllOverlays();
  const stage = document.getElementById('stage');
  const oldCanvas = document.getElementById('canvas');
  if (world && typeof world.stop === 'function') {
    try {
      world.stop();
    } catch (e) {}
  }
  if (!stage || !oldCanvas) {
    world = new World(canvas, keyboard);
    hookWinLose(world);
    return;
  }
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'canvas';
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  stage.replaceChild(newCanvas, oldCanvas);
  canvas = newCanvas;
  gameState = 'running';
  world = new World(canvas, keyboard);
  hookWinLose(world);
}

function backToStart() {
  if (world && typeof world.stop === 'function') {
    try {
      world.stop();
    } catch (e) {}
  }
  showStart();
}

function showStart() {
  hideAllOverlays();
  ui.startOverlay?.classList.remove('hidden');
  // Show imprint button again on start screen
  ui.imprintBtn?.classList.remove('hidden');
}

function showGameOver() {
  gameState = 'lose';
  ui.gameOverOverlay?.classList.remove('hidden');
}

function showWin() {
  gameState = 'win';
  ui.winOverlay?.classList.remove('hidden');
}

function hideAllOverlays() {
  ui.startOverlay?.classList.add('hidden');
  ui.gameOverOverlay?.classList.add('hidden');
  ui.winOverlay?.classList.add('hidden');
  ui.howToModal?.classList.add('hidden');
  ui.imprintModal?.classList.add('hidden');
}

function hookWinLose(world) {
  const checkInterval = setInterval(() => {
    if (!world) return;
    const charDead = world.character?.isDead?.();
    const boss = world.level?.enemies?.find?.((e) => e instanceof Endboss);
    const bossDead = boss ? boss.dead : false;
    if (charDead && gameState === 'running') {
      clearInterval(checkInterval);
      showGameOver();
    } else if (bossDead && gameState === 'running') {
      clearInterval(checkInterval);
      showWin();
    }
  }, 200);
}

function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function toggleMute() {
  isMuted = !isMuted;
  const btn = ui.muteBtn;
  if (!btn) return;
  const img = btn.querySelector('img');
  const span = btn.querySelector('.sound-label');
  const isOn = !isMuted; // isOn means sound is active
  if (img) {
    img.src = isOn
      ? './assets/img/logos/sound_on.png'
      : './assets/img/logos/sound_off.png';
  }
  if (span) {
    span.textContent = isOn ? 'Sound aus' : 'Sound an';
  }
  btn.setAttribute('aria-label', isOn ? 'Sound aus' : 'Sound an');
  btn.setAttribute('data-state', isOn ? 'on' : 'off');
}

function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
}

function closeHowTo() {
  ui.howToModal?.classList.add('hidden');
}

function openImprint() {
  ui.imprintModal?.classList.remove('hidden');
}

function closeImprint() {
  ui.imprintModal?.classList.add('hidden');
}

// Initialization is now triggered by landing.js (ensureInit) when the player enters the game

const KEY_MAP = {
  39: 'RIGHT',
  37: 'LEFT',
  38: 'UP',
  40: 'DOWN',
  32: 'SPACE',
  68: 'D',
  65: 'A',
  83: 'S',
  49: 'ONE',
  97: 'ONE',
  50: 'TWO',
  98: 'TWO',
};

window.addEventListener('keydown', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) {
    keyboard[key] = true;
    e.preventDefault?.();
  }
});

window.addEventListener('keyup', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) {
    keyboard[key] = false;
    e.preventDefault?.();
  }
});
