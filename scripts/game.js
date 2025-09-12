/**
 * Zentrale Spiel-Initialisierung und Tastaturbindung.
 *
 * Dieses File hält den minimalen orchestrierenden Code für
 * Start/Restart/Back und Keyboard-Events. UI-/Overlay-/Touch-
 * Funktionen sind in scripts/game-ui.js ausgelagert, allgemeine
 * Helpers in scripts/game-helpers.js.
 */

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
 * Initialisiert Canvas und UI, bindet Events und zeigt den Startbildschirm.
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
 * Cacht UI-Referenzen über spezialisierte Cache-Funktionen.
 * @returns {void}
 */
function cacheUi() {
  cacheOverlays();
  cacheButtons();
  cacheHowToImprint();
  cacheDeathButtons();
}

/**
 * Bindet alle UI-Events, Death-UI, Context-Menü und Touch-Controls.
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
 * Startet das Spiel, blendet Hero aus und initialisiert Welt und UI.
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
 * Startet die Welt neu, ersetzt das Canvas und setzt die Spiel-UI.
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
 * Beendet das Spiel und stellt den Startbildschirm und UI-Status wieder her.
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
 * Ersetzt den Start-Button-Knoten und bindet einen frischen Click-Handler.
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
 * Startet die periodische Prüfung auf Sieg oder Niederlage.
 * @returns {void}
 */
function hookWinLose() {
  let id;
  id = setInterval(() => evalWinLose(id), 200);
}

/**
 * Prüft Sieg/Niederlage und zeigt das passende Overlay.
 * @param {number} id - Interval-ID.
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

// Hinweis: UI-Overlay- und Death-Button-Funktionen sind in scripts/game-ui.js

/**
 * Mapping von keyCode zu Keyboard-Flags.
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
 * Is bindet Keyboard-Events und setzt die keyboard-Flags.
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
