let canvas;
let world;
let keyboard = new Keyboard();
let gameState = 'idle';
let ui = {};
let isMuted = false;
let controlMode = 'keyboard';
try {
  controlMode = localStorage.getItem('controlMode') || 'keyboard';
} catch (_) {}

/**
 * Initializes canvas and UI, binds events and shows the start screen.
 * @returns {void}
 */
function init() {
  canvas = document.getElementById('canvas');
  cacheUi();
  bindUi();
  try {
    if (window.SoundHub) {
      isMuted = !!window.SoundHub.get().isMuted();
      if (ui.muteBtn) updateMuteBtn(ui.muteBtn, !isMuted);
    }
  } catch (_) {}
  showStart();
}

/**
 * Caches UI references via specialized cache functions.
 * @returns {void}
 */
function cacheUi() {
  cacheOverlays();
  cacheButtons();
  cacheHowToImprint();
  cacheDeathButtons();
}

/**
 * Binds all UI events, Death UI, context menu and touch controls.
 * @returns {void}
 */
function bindUi() {
  bindPrimaryUi();
  bindGameUi();
  bindDeathUi();
  bindStageContextMenu();
  bindTouchButtons();
}

/**
 * Starts the game, fades out hero and initializes world and UI.
 * @returns {void}
 */
function startGame() {
  ensureInitIfMissing();
  if (alreadyRunning()) return;
  try {
  } catch (_) {}
  fadeOutHero();
  ui.imprintBtn?.classList.add('hidden');
  setTimeout(setupGameAfterStart, 350);
}

/**
 * Restarts the world, replaces the canvas and sets the game UI.
 * @returns {void}
 */
function restartGame() {
  hideAllOverlays();
  stopWorldSafe();
  try {
  } catch (_) {}
  const stage = document.getElementById('stage');
  const oldCanvas = document.getElementById('canvas');
  if (!stage || !oldCanvas) return quickStartNewWorld();
  canvas = createAndSwapCanvas(stage, oldCanvas);
  gameState = 'running';
  startWorld();
  postStartUi();
}

/**
 * Ends the game and restores the start screen and UI status.
 * @returns {void}
 */
function backToStart() {
  stopWorldSafe();
  try {
    window.sound?.stopAll?.();
  } catch (_) {}
  softResetToIdle();
  showHeroIdle();
  showStageButtonsOnStart();
  hideUiForIdle();
  world = null;
  _rebindStartBtn();
  try {
    window.sound?.playMusic('intro_music', { loop: true, volume: 0.4 });
  } catch (_) {}
}

/**
 * Replaces the start button node and binds a fresh click handler.
 * @returns {void}
 */
function _rebindStartBtn() {
  const startBtn = document.getElementById('startGameBtn');
  if (!startBtn) return;
  const clone = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(clone, startBtn);
  clone.style.display = 'inline-flex';
  clone.classList.add('stage-start-btn--visible');
  clone.addEventListener('click', () => onStartBtnClick(clone), { once: true });
}

/**
 * Starts periodic checking for win or loss.
 * @returns {void}
 */
function hookWinLose() {
  let id;
  id = setInterval(() => evalWinLose(id), 200);
}

/**
 * Checks win/loss and shows the appropriate overlay.
 * @param {number} id - Interval ID.
 * @returns {void}
 */
function evalWinLose(id) {
  const w = world;
  if (!w) return;
  const charDead = w.character?.isDead?.();
  const boss = w.level?.enemies?.find?.((e) => e instanceof Endboss);
  const bossDead = boss ? boss.dead : false;
  if (charDead && gameState === 'running') {
    clearInterval(id);
    showGameOver();
  } else if (bossDead && gameState === 'running') {
    clearInterval(id);
    w && (w._won = true);
    showWin();
  }
}

// Note: UI-Overlay and Death-Button functions are in scripts/game-ui.js

/**
 * Mapping from keyCode to Keyboard flags.
 * @type {Record<number, keyof Keyboard>}
 */
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

/**
 * Binds keyboard events and sets the keyboard flags.
 * @returns {void}
 */
window.addEventListener('keydown', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) {
    keyboard[key] = true;
    e.preventDefault?.();
  }
});

/**
 * Places the keyboard key up event listener to update the keyboard flags.
 * @returns {void}
 */
window.addEventListener('keyup', (e) => {
  const key = KEY_MAP[e.keyCode];
  if (key) {
    keyboard[key] = false;
    e.preventDefault?.();
  }
});
