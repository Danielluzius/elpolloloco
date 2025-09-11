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
 * @function init
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
 * @function cacheUi
 */
function cacheUi() {
  cacheOverlays();
  cacheButtons();
  cacheHowToImprint();
  cacheDeathButtons();
}

/**
 * Bindet alle UI-Events, Death-UI, Context-Menü und Touch-Controls.
 * @function bindUi
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
 * @function startGame
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
 * @function restartGame
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
 * @function backToStart
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
 * @function _rebindStartBtn
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
 * Zeigt den Neustart-Button an.
 * @function showRestartBtn
 */
function showRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-restart-btn--visible'));
}

/**
 * Verbirgt den Neustart-Button.
 * @function hideRestartBtn
 */
function hideRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.classList.remove('stage-restart-btn--visible');
  b.style.display = 'none';
}

/**
 * Zeigt den Exit-Button an.
 * @function showExitBtn
 */
function showExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-exit-btn--visible'));
}

/**
 * Verbirgt den Exit-Button.
 * @function hideExitBtn
 */
function hideExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.classList.remove('stage-exit-btn--visible');
  b.style.display = 'none';
}

/**
 * Zeigt den Steuerungs-Umschalter und aktualisiert dessen Darstellung.
 * @function showControlsToggleBtn
 */
function showControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  updateControlsToggleVisuals();
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-controls-btn--visible'));
}

/**
 * Verbirgt den Steuerungs-Umschalter.
 * @function hideControlsToggleBtn
 */
function hideControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  b.classList.remove('stage-controls-btn--visible');
  b.style.display = 'none';
}

/**
 * Blendet alle Overlays aus und zeigt den Startbildschirm.
 * @function showStart
 */
function showStart() {
  hideAllOverlays();
  ui.startOverlay?.classList.remove('hidden');
  ui.imprintBtn?.classList.remove('hidden');
}

/**
 * Zeigt das Game-Over-Overlay und die Todes-Buttons.
 * @function showGameOver
 */
function showGameOver() {
  gameState = 'lose';
  ui.gameOverOverlay?.classList.remove('hidden');
  hideRestartBtn();
  showDeathButtons();
  try {
    window.sound?.playMusic('player_lost_music', { loop: false, volume: 0.4 });
  } catch (_) {}
}

/**
 * Zeigt das Win-Overlay und die Todes-Buttons.
 * @function showWin
 */
function showWin() {
  gameState = 'win';
  ui.winOverlay?.classList.remove('hidden');
  hideRestartBtn();
  showDeathButtons();
  try {
    window.sound?.playMusic('player_won_music', { loop: false, volume: 0.4 });
  } catch (_) {}
}

/**
 * Verbirgt alle Overlays und Todes-Buttons.
 * @function hideAllOverlays
 */
function hideAllOverlays() {
  ui.startOverlay?.classList.add('hidden');
  ui.gameOverOverlay?.classList.add('hidden');
  ui.winOverlay?.classList.add('hidden');
  ui.howToModal?.classList.add('hidden');
  ui.imprintModal?.classList.add('hidden');
  hideDeathButtons();
}

/**
 * Startet die periodische Prüfung auf Sieg oder Niederlage.
 * @function hookWinLose
 */
function hookWinLose() {
  let id;
  id = setInterval(() => evalWinLose(id), 200);
}

/**
 * Prüft Sieg/Niederlage und zeigt das passende Overlay.
 * @function evalWinLose
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

/**
 * Blendet die Todes-Buttons ein und fokussiert den Zurück-Button.
 * @function showDeathButtons
 */
function showDeathButtons() {
  const c = ui.deathBtnContainer;
  if (!c) return;
  c.removeAttribute('aria-hidden');
  c.removeAttribute('inert');
  c.classList.remove('hidden');
  requestAnimationFrame(() => {
    c.classList.add('death-btns--visible');
    ui.deathBackBtn?.focus?.();
  });
}

/**
 * Blendet die Todes-Buttons aus und deaktiviert Interaktionen.
 * @function hideDeathButtons
 */
function hideDeathButtons() {
  const c = ui.deathBtnContainer;
  if (!c) return;
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

/**
 * Wechselt in bzw. aus dem Vollbildmodus.
 * @function toggleFullscreen
 */
function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

/**
 * Schaltet Ton stumm/aktiv und aktualisiert den Button.
 * @function toggleMute
 */
function toggleMute() {
  isMuted = !isMuted;
  try {
    window.sound?.setMuted(isMuted);
  } catch (_) {}
  const btn = ui.muteBtn;
  if (!btn) return;
  const isOn = !isMuted;
  updateMuteBtn(btn, isOn);
}

/**
 * Wechselt zwischen Touch- und Tastaturmodus und aktualisiert UI.
 * @function toggleControlMode
 */
function toggleControlMode() {
  controlMode = controlMode === 'keyboard' ? 'touch' : 'keyboard';
  try {
    localStorage.setItem('controlMode', controlMode);
  } catch (_) {}
  updateControlsToggleVisuals();
  applyControlModeVisuals();
}

/**
 * Aktualisiert Icons, Label und ARIA des Steuerungs-Umschalters.
 * @function updateControlsToggleVisuals
 */
function updateControlsToggleVisuals() {
  const btn = ui.controlsToggleBtn;
  if (!btn) return;
  const img = btn.querySelector('.btn-image');
  const hint = btn.querySelector('.controls-hint');
  const span = btn.querySelector('.controls-toggle-label');
  const isTouch = controlMode === 'touch';
  if (img)
    img.src = './assets/img/logos/touch_button/button_toggle_controls.png';
  if (hint) {
    hint.src = isTouch
      ? './assets/img/logos/touch_button/button_activate_keyboard.png'
      : './assets/img/logos/touch_button/button_activate_touch.png';
  }
  const label = isTouch ? 'Enable keyboard controls' : 'Enable touch controls';
  if (span) span.textContent = label;
  btn.setAttribute('aria-label', label);
}

/**
 * Zeigt oder versteckt die Touch-Steuerung gemäß aktuellem Modus.
 * @function applyControlModeVisuals
 */
function applyControlModeVisuals() {
  if (controlMode === 'touch') showTouchControls();
  else hideTouchControls();
}

/**
 * Zeigt die Touch-Steuerung an.
 * @function showTouchControls
 */
function showTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.remove('hidden');
  tc.removeAttribute('aria-hidden');
}

/**
 * Verbirgt die Touch-Steuerung und setzt Tasten zurück.
 * @function hideTouchControls
 */
function hideTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.add('hidden');
  tc.setAttribute('aria-hidden', 'true');
  ['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'D', 'A', 'S', 'ONE', 'TWO'].forEach(
    (k) => (keyboard[k] = false)
  );
}

/**
 * Bindet Pointer-Events für die Touch-Buttons.
 * @function bindTouchButtons
 */
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

/**
 * Öffnet das In-Game-HowTo-Overlay und verbirgt Touch-Buttons.
 * @function openHowTo
 */
function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
  hideTouchControls();
}

/**
 * Schließt das In-Game-HowTo-Overlay und stellt Controls wieder her.
 * @function closeHowTo
 */
function closeHowTo() {
  ui.howToModal?.classList.add('hidden');
  if (gameState === 'running') {
    applyControlModeVisuals();
  } else {
    hideTouchControls();
  }
}

/**
 * Öffnet das Impressum-Overlay.
 * @function openImprint
 */
function openImprint() {
  ui.imprintModal?.classList.remove('hidden');
}

/**
 * Schließt das Impressum-Overlay.
 * @function closeImprint
 */
function closeImprint() {
  ui.imprintModal?.classList.add('hidden');
}

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
