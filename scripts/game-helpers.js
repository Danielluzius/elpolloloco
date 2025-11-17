/**
 * Caches overlay elements (Start, GameOver, Win).
 * @function cacheOverlays
 */
function cacheOverlays() {
  ui.startOverlay = document.getElementById('startOverlay');
  ui.gameOverOverlay = document.getElementById('gameOverOverlay');
  ui.winOverlay = document.getElementById('winOverlay');
}

/**
 * Caches general UI buttons and touch container.
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
 * Caches HowTo and Imprint elements.
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
 * Caches death button elements.
 * @function cacheDeathButtons
 */
function cacheDeathButtons() {
  ui.deathBtnContainer = document.getElementById('deathButtons');
  ui.deathRetryBtn = document.getElementById('deathRetryBtn');
  ui.deathBackBtn = document.getElementById('deathBackBtn');
}

/**
 * Binds Start/Retry/Back, Fullscreen/Mute, HowTo and Imprint.
 * @function bindPrimaryUi
 */
function bindPrimaryUi() {
  bindStartRetryBack();
  bindFullscreenMute();
  bindHowTo();
  bindImprint();
}

/**
 * Binds Start, Retry and Back buttons.
 * @function bindStartRetryBack
 */
function bindStartRetryBack() {
  ui.startBtn?.addEventListener('click', startGame);
  ui.retryBtns?.forEach((b) => b.addEventListener('click', restartGame));
  ui.backToStartBtns?.forEach((b) => b.addEventListener('click', backToStart));
}

/**
 * Binds fullscreen and sound toggle.
 * @function bindFullscreenMute
 */
function bindFullscreenMute() {
  ui.fullscreenBtn?.addEventListener('click', toggleFullscreen);
  ui.muteBtn?.addEventListener('click', toggleMute);
}

/**
 * Binds opening and closing of the HowTo dialog.
 * @function bindHowTo
 */
function bindHowTo() {
  ui.howToBtn?.addEventListener('click', openHowTo);
  ui.howToCloseBtn?.addEventListener('click', () => {
    if (ui.howToModal) closeHowTo();
  });
}

/**
 * Binds opening and closing of the Imprint.
 * @function bindImprint
 */
function bindImprint() {
  ui.imprintBtn?.addEventListener('click', openImprint);
  ui.imprintCloseBtn?.addEventListener('click', closeImprint);
}

/**
 * Binds Restart, Exit and Control Mode toggle in the game.
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
 * Binds death buttons for Restart and Back.
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
 * Suppresses the context menu on the stage.
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
 * Initializes Canvas and UI if needed.
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
 * Checks if the game is already running.
 * @function alreadyRunning
 */
function alreadyRunning() {
  return gameState === 'running' && world;
}

/**
 * Fades out the hero area and disables interactions.
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
 * Sets game status and UI to active after start.
 * @function setupGameAfterStart
 */
function setupGameAfterStart() {
  hideAllOverlays();
  gameState = 'running';
  startWorld();
  postStartUi();
}

/**
 * Creates the game world and starts Win/Lose monitoring.
 * @function startWorld
 */
function startWorld() {
  world = new World(canvas, keyboard);
  hookWinLose(world);
  try {
    window.sound?.playMusic('level_start_music', { loop: true, volume: 0.4 });
  } catch (_) {}
}

/**
 * Shows game buttons and sets control display.
 * @function postStartUi
 */
function postStartUi() {
  showRestartBtn();
  showExitBtn();
  showControlsToggleBtn();
  applyControlModeVisuals();
}

/**
 * Stops the game world if it exists.
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
 * Starts the game world without canvas replacement.
 * @function quickStartNewWorld
 */
function quickStartNewWorld() {
  startWorld();
}

/**
 * Creates a new canvas and replaces the old one in the DOM.
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
 * Sets status to idle and clears the canvas.
 * @function softResetToIdle
 */
function softResetToIdle() {
  hideDeathButtons();
  gameState = 'idle';
  clearCanvas();
}

/**
 * Clears the canvas content.
 * @function clearCanvas
 */
function clearCanvas() {
  try {
    const ctx = canvas?.getContext?.('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (_) {}
}

/**
 * Shows the hero area for the start screen.
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
 * Shows the buttons on the start screen.
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
 * Sets button display and adds visibility class.
 * @function showBtnInline
 */
function showBtnInline(el, cls) {
  if (!el) return;
  el.style.display = 'inline-flex';
  el.classList.add(cls);
}

/**
 * Hides game buttons and touch controls in idle state.
 * @function hideUiForIdle
 */
function hideUiForIdle() {
  hideRestartBtn();
  hideExitBtn();
  hideControlsToggleBtn();
  hideTouchControls();
}

/**
 * Reacts to start click, hides buttons and starts the game.
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
 * Hides a list of elements with display:none.
 * @function hideElements
 */
function hideElements(arr) {
  arr.forEach((el) => {
    if (el) el.style.display = 'none';
  });
}

/**
 * Updates icon, label and state of the mute button.
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
 * Binds pointer events for the touch buttons.
 * @function bindTouchButtons
 */
function bindTouchButtons() {
  const tc = ui.touchControls;
  if (!tc) return;
  const btns = tc.querySelectorAll('.touch-btn');
  addTouchListeners(btns, touchOnPress, touchOnRelease);
}

/**
 * Marks the assigned key as pressed for the touch button.
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
 * Marks the assigned key as released for the touch button.
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
 * Binds pointer events to a list of touch buttons.
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
 * Starts periodic checking for win or loss.
 * @function hookWinLose
 */
function hookWinLose() {
  let id;
  id = setInterval(() => evalWinLose(id), 200);
}

/**
 * Checks win/loss and shows the appropriate overlay.
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
