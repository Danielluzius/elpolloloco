let canvas;
let world;
let keyboard = new Keyboard();
let gameState = 'idle';
let ui = {};
let isMuted = false;
// Persisted control mode: 'keyboard' or 'touch'
let controlMode = 'keyboard';
try {
  controlMode = localStorage.getItem('controlMode') || 'keyboard';
} catch (_) {}

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
  ui.restartBtn = document.getElementById('restartBtn');
  ui.exitBtn = document.getElementById('exitBtn');
  ui.controlsToggleBtn = document.getElementById('controlsToggleBtn');
  ui.touchControls = document.getElementById('touchControls');
  ui.howToBtn = document.getElementById('howToBtn');
  ui.howToModal = document.getElementById('howToModal');
  ui.howToCloseBtn = document.getElementById('howToCloseBtn');
  ui.imprintBtn = document.getElementById('imprintBtn');
  ui.imprintModal = document.getElementById('imprintModal');
  ui.imprintCloseBtn = document.getElementById('imprintCloseBtn');
  // Death buttons (in-canvas)
  ui.deathBtnContainer = document.getElementById('deathButtons');
  ui.deathRetryBtn = document.getElementById('deathRetryBtn');
  ui.deathBackBtn = document.getElementById('deathBackBtn');
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
  ui.restartBtn?.addEventListener('click', () => {
    if (gameState === 'running') restartGame();
  });
  ui.exitBtn?.addEventListener('click', () => {
    if (gameState === 'running') backToStart();
  });
  ui.controlsToggleBtn?.addEventListener('click', toggleControlMode);
  bindTouchButtons();
  ui.deathRetryBtn?.addEventListener('click', () => {
    hideDeathButtons();
    restartGame();
  });
  ui.deathBackBtn?.addEventListener('click', () => {
    hideDeathButtons();
    backToStart();
  });
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
    showRestartBtn();
    showExitBtn();
    showControlsToggleBtn();
    applyControlModeVisuals();
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
  showRestartBtn();
  showExitBtn();
  showControlsToggleBtn();
  applyControlModeVisuals();
}

function backToStart() {
  if (world && typeof world.stop === 'function') {
    try {
      world.stop();
    } catch (e) {}
  }
  // Soft Reset: zurück in einen Zustand wie nach Enter aber vor StartGame
  hideDeathButtons();
  gameState = 'idle';
  // Canvas säubern
  try {
    const ctx = canvas?.getContext?.('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (_) {}
  // Hero wieder anzeigen
  const hero = document.querySelector('#landing .hero');
  if (hero) {
    hero.classList.remove('hero--off');
    hero.classList.add('hero--up');
    hero.style.opacity = '1';
    hero.style.pointerEvents = 'auto';
  }
  // Stage bleibt sichtbar (wie nach Enter)
  const startBtn = document.getElementById('startGameBtn');
  const howToBtn = document.getElementById('howToPlayBtn');
  const imprintBtn = document.getElementById('imprintBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const soundBtn = document.getElementById('muteBtn');
  // Buttons wieder einblenden
  [
    [startBtn, 'stage-start-btn--visible'],
    [howToBtn, 'stage-howto-btn--visible'],
    [imprintBtn, 'stage-imprint-btn--visible'],
    [fullscreenBtn, 'stage-fullscreen-btn--visible'],
    [soundBtn, 'stage-sound-btn--visible'],
  ].forEach(([el, cls]) => {
    if (!el) return;
    el.style.display = 'inline-flex';
    el.classList.add(cls);
  });
  // Restart verstecken im Idle
  hideRestartBtn();
  hideExitBtn();
  hideControlsToggleBtn();
  hideTouchControls();
  // Imprint Button wieder zeigen
  imprintBtn?.classList.remove('hidden');
  // Aktuelle World-Referenz entfernen
  world = null;
  _rebindStartBtn();
}

function _rebindStartBtn() {
  const startBtn = document.getElementById('startGameBtn');
  if (!startBtn) return;
  // Remove existing listeners by cloning (simplest cross-browser way)
  const clone = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(clone, startBtn);
  clone.style.display = 'inline-flex';
  clone.classList.add('stage-start-btn--visible');
  clone.addEventListener(
    'click',
    () => {
      const howToBtn = document.getElementById('howToPlayBtn');
      const imprintBtn = document.getElementById('imprintBtn');
      const fullscreenBtn = document.getElementById('fullscreenBtn');
      const restartBtn = document.getElementById('restartBtn');
      const exitBtn = document.getElementById('exitBtn');
      // Hide buttons (sound stays)
      clone.style.display = 'none';
      howToBtn && (howToBtn.style.display = 'none');
      imprintBtn && (imprintBtn.style.display = 'none');
      fullscreenBtn && (fullscreenBtn.style.display = 'none');
      restartBtn && (restartBtn.style.display = 'none');
      exitBtn && (exitBtn.style.display = 'none');
      const hero = document.querySelector('#landing .hero');
      hero?.classList.add('hero--off');
      startGame();
    },
    { once: true }
  );
}

function showRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-restart-btn--visible'));
}

function hideRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.classList.remove('stage-restart-btn--visible');
  b.style.display = 'none';
}

function showExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-exit-btn--visible'));
}

function hideExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.classList.remove('stage-exit-btn--visible');
  b.style.display = 'none';
}

function showControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  updateControlsToggleVisuals();
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-controls-btn--visible'));
}

function hideControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  b.classList.remove('stage-controls-btn--visible');
  b.style.display = 'none';
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
  hideRestartBtn();
  showDeathButtons();
}

function showWin() {
  gameState = 'win';
  ui.winOverlay?.classList.remove('hidden');
  hideRestartBtn();
  showDeathButtons();
}

function hideAllOverlays() {
  ui.startOverlay?.classList.add('hidden');
  ui.gameOverOverlay?.classList.add('hidden');
  ui.winOverlay?.classList.add('hidden');
  ui.howToModal?.classList.add('hidden');
  ui.imprintModal?.classList.add('hidden');
  hideDeathButtons();
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
      if (world) world._won = true;
      showWin();
    }
  }, 200);
}

function showDeathButtons() {
  const c = ui.deathBtnContainer;
  if (!c) return;
  c.removeAttribute('aria-hidden');
  c.removeAttribute('inert');
  c.classList.remove('hidden');
  requestAnimationFrame(() => {
    c.classList.add('death-btns--visible');
    // Fokus auf ersten Button setzen für Accessibility
    ui.deathBackBtn?.focus?.();
  });
}

function hideDeathButtons() {
  const c = ui.deathBtnContainer;
  if (!c) return;
  // Falls Fokus innerhalb liegt, vorher entfernen um aria-hidden Warnung zu vermeiden
  try {
    if (c.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
  } catch (_) {}
  c.classList.remove('death-btns--visible');
  c.setAttribute('aria-hidden', 'true');
  c.setAttribute('inert', '');
  setTimeout(() => c.classList.add('hidden'), 300);
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

function toggleControlMode() {
  controlMode = controlMode === 'keyboard' ? 'touch' : 'keyboard';
  try {
    localStorage.setItem('controlMode', controlMode);
  } catch (_) {}
  updateControlsToggleVisuals();
  applyControlModeVisuals();
}

function updateControlsToggleVisuals() {
  const btn = ui.controlsToggleBtn;
  if (!btn) return;
  // Only target the main button image, not the small hint image
  const img = btn.querySelector('.btn-image');
  const hint = btn.querySelector('.controls-hint');
  const span = btn.querySelector('.controls-toggle-label');
  const isTouch = controlMode === 'touch';
  // Keep a unified toggle icon regardless of mode
  if (img)
    img.src = './assets/img/logos/touch_button/button_toggle_controls.png';
  // Update the small hint icon to show the action that will happen
  if (hint) {
    hint.src = isTouch
      ? './assets/img/logos/touch_button/button_activate_keyboard.png'
      : './assets/img/logos/touch_button/button_activate_touch.png';
  }
  const label = isTouch
    ? 'Keyboard-Steuerung aktivieren'
    : 'Touch-Steuerung aktivieren';
  if (span) span.textContent = label;
  btn.setAttribute('aria-label', label);
}

function applyControlModeVisuals() {
  if (controlMode === 'touch') showTouchControls();
  else hideTouchControls();
}

function showTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.remove('hidden');
  tc.removeAttribute('aria-hidden');
}

function hideTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.add('hidden');
  tc.setAttribute('aria-hidden', 'true');
  // Release any stuck keys when hiding
  ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'D', 'A', 'S', 'ONE', 'TWO'].forEach(
    (k) => (keyboard[k] = false)
  );
}

function bindTouchButtons() {
  const tc = ui.touchControls;
  if (!tc) return;
  const setKey = (k, v) => {
    keyboard[k] = v;
  };
  const onPress = (e) => {
    const k = e.currentTarget?.dataset?.key;
    if (!k) return;
    setKey(k, true);
    e.preventDefault?.();
    e.stopPropagation?.();
  };
  const onRelease = (e) => {
    const k = e.currentTarget?.dataset?.key;
    if (!k) return;
    setKey(k, false);
    e.preventDefault?.();
    e.stopPropagation?.();
  };
  tc.querySelectorAll('.touch-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', onPress);
    btn.addEventListener('pointerup', onRelease);
    btn.addEventListener('pointercancel', onRelease);
    btn.addEventListener('pointerleave', onRelease);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}

function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
  hideTouchControls();
}

function closeHowTo() {
  ui.howToModal?.classList.add('hidden');
  applyControlModeVisuals();
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
