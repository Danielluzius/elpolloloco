let canvas;
let world;
let keyboard = new Keyboard();
let gameState = 'idle'; // idle | running | win | lose
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
}

function bindUi() {
  ui.startBtn?.addEventListener('click', startGame);
  ui.retryBtns?.forEach((b) => b.addEventListener('click', restartGame));
  ui.backToStartBtns?.forEach((b) => b.addEventListener('click', backToStart));
  ui.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  ui.muteBtn?.addEventListener('click', toggleMute);
  ui.howToBtn?.addEventListener('click', openHowTo);
  ui.howToCloseBtn?.addEventListener('click', closeHowTo);
}

function startGame() {
  hideAllOverlays();
  gameState = 'running';
  world = new World(canvas, keyboard);
  hookWinLose(world);
}

function restartGame() {
  // Hard reset by reloading level constructs
  hideAllOverlays();
  // Canvas austauschen und World neu erstellen (ohne Seiten-Reload)
  const stage = document.getElementById('stage');
  const oldCanvas = document.getElementById('canvas');
  if (world && typeof world.stop === 'function') {
    try {
      world.stop();
    } catch (e) {}
  }
  if (!stage || !oldCanvas) {
    // Fallback: direkt neu starten
    world = new World(canvas, keyboard);
    hookWinLose(world);
    return;
  }
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'canvas';
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  // Ersetze das Canvas als erstes Kind der Stage
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
}

function hookWinLose(world) {
  // Poll for character death or boss death
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
  ui.muteBtn && (ui.muteBtn.textContent = isMuted ? 'Unmute' : 'Mute');
  // Optional: Hier Audio-Objekte global muten, wenn du welche einbindest
}

function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
}

function closeHowTo() {
  ui.howToModal?.classList.add('hidden');
}

// Initialize when page has loaded
window.addEventListener('load', () => {
  init();
});

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
