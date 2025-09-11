/**
 * Cacht Overlay-Elemente (Start, GameOver, Win).
 * @function cacheOverlays
 */
function cacheOverlays() {
  ui.startOverlay = document.getElementById('startOverlay');
  ui.gameOverOverlay = document.getElementById('gameOverOverlay');
  ui.winOverlay = document.getElementById('winOverlay');
}

/**
 * Cacht allgemeine UI-Buttons und Touch-Container.
 * @function cacheButtons
 */
function cacheButtons() {
  ui.startBtn = document.getElementById('startBtn');
  ui.retryBtns = Array.from(document.querySelectorAll('.retryBtn'));
  ui.backToStartBtns = Array.from(document.querySelectorAll('.backToStartBtn'));
  ui.fullscreenBtn = document.getElementById('fullscreenBtn');
  ui.muteBtn = document.getElementById('muteBtn');
  ui.restartBtn = document.getElementById('restartBtn');
  ui.exitBtn = document.getElementById('exitBtn');
  ui.controlsToggleBtn = document.getElementById('controlsToggleBtn');
  ui.touchControls = document.getElementById('touchControls');
}

/**
 * Cacht HowTo- und Impressum-Elemente.
 * @function cacheHowToImprint
 */
function cacheHowToImprint() {
  ui.howToBtn = document.getElementById('howToBtn');
  ui.howToModal = document.getElementById('howToModal');
  ui.howToCloseBtn = document.getElementById('howToCloseBtn');
  ui.imprintBtn = document.getElementById('imprintBtn');
  ui.imprintModal = document.getElementById('imprintModal');
  ui.imprintCloseBtn = document.getElementById('imprintCloseBtn');
}

/**
 * Cacht die Elemente der Todes-Buttons.
 * @function cacheDeathButtons
 */
function cacheDeathButtons() {
  ui.deathBtnContainer = document.getElementById('deathButtons');
  ui.deathRetryBtn = document.getElementById('deathRetryBtn');
  ui.deathBackBtn = document.getElementById('deathBackBtn');
}

/**
 * Bindet Start/Retry/Back, Fullscreen/Mute, HowTo und Impressum.
 * @function bindPrimaryUi
 */
function bindPrimaryUi() {
  bindStartRetryBack();
  bindFullscreenMute();
  bindHowTo();
  bindImprint();
}

/**
 * Bindet Start-, Retry- und Zurück-Buttons.
 * @function bindStartRetryBack
 */
function bindStartRetryBack() {
  ui.startBtn?.addEventListener('click', startGame);
  ui.retryBtns?.forEach((b) => b.addEventListener('click', restartGame));
  ui.backToStartBtns?.forEach((b) => b.addEventListener('click', backToStart));
}

/**
 * Bindet Vollbild- und Ton-Umschalter.
 * @function bindFullscreenMute
 */
function bindFullscreenMute() {
  ui.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  ui.muteBtn?.addEventListener('click', toggleMute);
}

/**
 * Bindet Öffnen und Schließen des HowTo-Dialogs.
 * @function bindHowTo
 */
function bindHowTo() {
  ui.howToBtn?.addEventListener('click', openHowTo);
  ui.howToCloseBtn?.addEventListener('click', () => {
    if (ui.howToModal) closeHowTo();
  });
}

/**
 * Bindet Öffnen und Schließen des Impressums.
 * @function bindImprint
 */
function bindImprint() {
  ui.imprintBtn?.addEventListener('click', openImprint);
  ui.imprintCloseBtn?.addEventListener('click', closeImprint);
}

/**
 * Bindet Restart, Exit und Control-Mode-Umschalter im Spiel.
 * @function bindGameUi
 */
function bindGameUi() {
  ui.restartBtn?.addEventListener('click', () => {
    if (gameState === 'running') restartGame();
  });
  ui.exitBtn?.addEventListener('click', () => {
    if (gameState === 'running') backToStart();
  });
  ui.controlsToggleBtn?.addEventListener('click', toggleControlMode);
}

/**
 * Bindet die Todes-Buttons für Restart und Zurück.
 * @function bindDeathUi
 */
function bindDeathUi() {
  ui.deathRetryBtn?.addEventListener('click', () => {
    hideDeathButtons();
    restartGame();
  });
  ui.deathBackBtn?.addEventListener('click', () => {
    hideDeathButtons();
    backToStart();
  });
}

/**
 * Unterdrückt das Kontextmenü auf der Stage.
 * @function bindStageContextMenu
 */
function bindStageContextMenu() {
  try {
    const stage = document.getElementById('stage');
    stage?.addEventListener('contextmenu', (e) => e.preventDefault(), {
      passive: false,
    });
  } catch (_) {}
}

/**
 * Initialisiert Canvas und UI bei Bedarf.
 * @function ensureInitIfMissing
 */
function ensureInitIfMissing() {
  if (!canvas || !keyboard) {
    try {
      init();
    } catch (_) {}
  }
}

/**
 * Prüft, ob das Spiel bereits läuft.
 * @function alreadyRunning
 */
function alreadyRunning() {
  return gameState === 'running' && world;
}

/**
 * Blendet den Hero-Bereich aus und deaktiviert Interaktionen.
 * @function fadeOutHero
 */
function fadeOutHero() {
  const hero = document.querySelector('#landing .hero');
  if (!hero) return;
  hero.classList.add('hero--off');
  try {
    hero.style.opacity = '0';
    hero.style.pointerEvents = 'none';
  } catch (_) {}
}

/**
 * Setzt Spielstatus und UI nach dem Start auf aktiv.
 * @function setupGameAfterStart
 */
function setupGameAfterStart() {
  hideAllOverlays();
  gameState = 'running';
  startWorld();
  postStartUi();
}

/**
 * Erzeugt die Spielwelt und startet die Win/Lose-Überwachung.
 * @function startWorld
 */
function startWorld() {
  world = new World(canvas, keyboard);
  hookWinLose(world);
}

/**
 * Zeigt Spiel-Buttons und setzt die Steuerungsdarstellung.
 * @function postStartUi
 */
function postStartUi() {
  showRestartBtn();
  showExitBtn();
  showControlsToggleBtn();
  applyControlModeVisuals();
}

/**
 * Stoppt die Spielwelt, falls vorhanden.
 * @function stopWorldSafe
 */
function stopWorldSafe() {
  if (world && typeof world.stop === 'function') {
    try {
      world.stop();
    } catch (_) {}
  }
}

/**
 * Startet die Spielwelt ohne Canvas-Austausch.
 * @function quickStartNewWorld
 */
function quickStartNewWorld() {
  startWorld();
}

/**
 * Erzeugt ein neues Canvas und ersetzt das alte im DOM.
 * @function createAndSwapCanvas
 */
function createAndSwapCanvas(stage, oldCanvas) {
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'canvas';
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  stage.replaceChild(newCanvas, oldCanvas);
  return newCanvas;
}

/**
 * Setzt Status auf idle und leert das Canvas.
 * @function softResetToIdle
 */
function softResetToIdle() {
  hideDeathButtons();
  gameState = 'idle';
  clearCanvas();
}

/**
 * Löscht den Canvas-Inhalt.
 * @function clearCanvas
 */
function clearCanvas() {
  try {
    const ctx = canvas?.getContext?.('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (_) {}
}

/**
 * Zeigt den Hero-Bereich für den Startbildschirm an.
 * @function showHeroIdle
 */
function showHeroIdle() {
  const hero = document.querySelector('#landing .hero');
  if (!hero) return;
  hero.classList.remove('hero--off');
  hero.classList.add('hero--up');
  hero.style.opacity = '1';
  hero.style.pointerEvents = 'auto';
}

/**
 * Zeigt die Buttons im Startbildschirm an.
 * @function showStageButtonsOnStart
 */
function showStageButtonsOnStart() {
  const startBtn = document.getElementById('startGameBtn');
  const howToBtn = document.getElementById('howToPlayBtn');
  const imprintBtn = document.getElementById('imprintBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const soundBtn = document.getElementById('muteBtn');
  [
    [startBtn, 'stage-start-btn--visible'],
    [howToBtn, 'stage-howto-btn--visible'],
    [imprintBtn, 'stage-imprint-btn--visible'],
    [fullscreenBtn, 'stage-fullscreen-btn--visible'],
    [soundBtn, 'stage-sound-btn--visible'],
  ].forEach(([el, cls]) => showBtnInline(el, cls));
  imprintBtn?.classList.remove('hidden');
}

/**
 * Setzt Anzeige eines Buttons und fügt die Sichtbarkeitsklasse hinzu.
 * @function showBtnInline
 */
function showBtnInline(el, cls) {
  if (!el) return;
  el.style.display = 'inline-flex';
  el.classList.add(cls);
}

/**
 * Verbirgt Spiel-Buttons und Touch-Steuerung im Idle-Zustand.
 * @function hideUiForIdle
 */
function hideUiForIdle() {
  hideRestartBtn();
  hideExitBtn();
  hideControlsToggleBtn();
  hideTouchControls();
}

/**
 * Reagiert auf Startklick, blendet Buttons aus und startet das Spiel.
 * @function onStartBtnClick
 */
function onStartBtnClick(btn) {
  const howToBtn = document.getElementById('howToPlayBtn');
  const imprintBtn = document.getElementById('imprintBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const restartBtn = document.getElementById('restartBtn');
  const exitBtn = document.getElementById('exitBtn');
  btn.style.display = 'none';
  hideElements([howToBtn, imprintBtn, fullscreenBtn, restartBtn, exitBtn]);
  const hero = document.querySelector('#landing .hero');
  hero?.classList.add('hero--off');
  startGame();
}

/**
 * Versteckt eine Liste von Elementen durch display:none.
 * @function hideElements
 */
function hideElements(arr) {
  arr.forEach((el) => {
    if (el) el.style.display = 'none';
  });
}

/**
 * Aktualisiert Icon, Label und State des Mute-Buttons.
 * @function updateMuteBtn
 */
function updateMuteBtn(btn, isOn) {
  const img = btn.querySelector('img');
  const span = btn.querySelector('.sound-label');
  if (img)
    img.src = isOn
      ? './assets/img/logos/sound_on.png'
      : './assets/img/logos/sound_off.png';
  if (span) span.textContent = isOn ? 'Mute' : 'Unmute';
  btn.setAttribute('aria-label', isOn ? 'Mute' : 'Unmute');
  btn.setAttribute('data-state', isOn ? 'on' : 'off');
}

/**
 * Bindet Pointer-Events für die Touch-Buttons.
 * @function bindTouchButtons
 */
function bindTouchButtons() {
  const tc = ui.touchControls;
  if (!tc) return;
  const btns = tc.querySelectorAll('.touch-btn');
  addTouchListeners(btns, touchOnPress, touchOnRelease);
}

/**
 * Markiert die zugeordnete Taste beim Touch-Button als gedrückt.
 * @function touchOnPress
 */
function touchOnPress(e) {
  const k = e.currentTarget?.dataset?.key;
  if (!k) return;
  keyboard[k] = true;
  e.preventDefault?.();
  e.stopPropagation?.();
}

/**
 * Markiert die zugeordnete Taste beim Touch-Button als losgelassen.
 * @function touchOnRelease
 */
function touchOnRelease(e) {
  const k = e.currentTarget?.dataset?.key;
  if (!k) return;
  keyboard[k] = false;
  e.preventDefault?.();
  e.stopPropagation?.();
}

/**
 * Bindet Pointer-Events an eine Liste von Touch-Buttons.
 * @function addTouchListeners
 */
function addTouchListeners(btns, onPress, onRelease) {
  btns.forEach((btn) => {
    btn.addEventListener('pointerdown', onPress);
    btn.addEventListener('pointerup', onRelease);
    btn.addEventListener('pointercancel', onRelease);
    btn.addEventListener('pointerleave', onRelease);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
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
