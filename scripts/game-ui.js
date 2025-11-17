/**
 * Shows the start screen and hides all other overlays.
 * @returns {void}
 */
function showStart() {
  hideAllOverlays();
  ui.startOverlay?.classList.remove('hidden');
  ui.imprintBtn?.classList.remove('hidden');
}

/**
 * Shows the Game-Over overlay and the death buttons.
 * @returns {void}
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
 * Shows the Win overlay and the death buttons.
 * @returns {void}
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
 * Hides all overlays and fades out the death buttons.
 * @returns {void}
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
 * Shows the restart button.
 * @returns {void}
 */
function showRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-restart-btn--visible'));
}

/**
 * Hides the restart button.
 * @returns {void}
 */
function hideRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.classList.remove('stage-restart-btn--visible');
  b.style.display = 'none';
}

/**
 * Shows the exit button.
 * @returns {void}
 */
function showExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-exit-btn--visible'));
}

/**
 * Hides the exit button.
 * @returns {void}
 */
function hideExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.classList.remove('stage-exit-btn--visible');
  b.style.display = 'none';
}

/**
 * Shows the control toggle button (Touch/Keyboard) and updates its appearance.
 * @returns {void}
 */
function showControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  updateControlsToggleVisuals();
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-controls-btn--visible'));
}

/**
 * Hides the control toggle button.
 * @returns {void}
 */
function hideControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  b.classList.remove('stage-controls-btn--visible');
  b.style.display = 'none';
}

/**
 * Fades in the death buttons and focuses the back button.
 * @returns {void}
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
 * Fades out the death buttons and disables interactions.
 * @returns {void}
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
 * Toggles fullscreen mode on or off.
 * @returns {void}
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
 * Toggles sound mute/unmute and updates the button.
 * @returns {void}
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
 * Switches between touch and keyboard mode and updates UI.
 * @returns {void}
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
 * Updates icons, label and ARIA of the control toggle button.
 * @returns {void}
 */
function updateControlsToggleVisuals() {
  const btn = ui.controlsToggleBtn;
  if (!btn) return;
  const isTouch = controlMode === 'touch';
  _setControlsImages(btn, isTouch);
  _setControlsLabel(btn, isTouch);
}

/**
 * Sets images and hint icons of the control toggle button.
 * @param {HTMLElement} btn - Button element
 * @param {boolean} isTouch - true if touch mode is active
 * @returns {void}
 */
function _setControlsImages(btn, isTouch) {
  const img = btn.querySelector('.btn-image');
  const hint = btn.querySelector('.controls-hint');
  if (img)
    img.src = './assets/img/logos/touch_button/button_toggle_controls.png';
  if (hint) {
    hint.src = isTouch
      ? './assets/img/logos/touch_button/button_activate_keyboard.png'
      : './assets/img/logos/touch_button/button_activate_touch.png';
  }
}

/**
 * Sets label text and ARIA for the control toggle button.
 * @param {HTMLElement} btn - Button element
 * @param {boolean} isTouch - true if touch mode is active
 * @returns {void}
 */
function _setControlsLabel(btn, isTouch) {
  const span = btn.querySelector('.controls-toggle-label');
  const label = isTouch ? 'Enable keyboard controls' : 'Enable touch controls';
  if (span) span.textContent = label;
  btn.setAttribute('aria-label', label);
}

/**
 * Shows or hides the touch controls according to current mode.
 * @returns {void}
 */
function applyControlModeVisuals() {
  if (controlMode === 'touch') showTouchControls();
  else hideTouchControls();
}

/**
 * Shows the touch controls.
 * @returns {void}
 */
function showTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.remove('hidden');
  tc.removeAttribute('aria-hidden');
}

/**
 * Hides the touch controls and resets keys.
 * @returns {void}
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
 * Opens the in-game HowTo overlay and hides touch buttons.
 * @returns {void}
 */
function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
  hideTouchControls();
}

/**
 * Closes the in-game HowTo overlay and restores controls.
 * @returns {void}
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
 * Opens the Imprint overlay.
 * @returns {void}
 */
function openImprint() {
  ui.imprintModal?.classList.remove('hidden');
}

/**
 * Closes the Imprint overlay.
 * @returns {void}
 */
function closeImprint() {
  ui.imprintModal?.classList.add('hidden');
}
