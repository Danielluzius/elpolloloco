/**
 * UI- und Steuerungs-Helferfunktionen für den Spiel-Flow.
 *
 * Dieses Modul kapselt Anzeige-Logik (Overlays, Buttons),
 * Steuerungs-Umschalter (Touch/Keyboard) sowie Fullscreen- und Mute-Schaltungen.
 *
 * Es nutzt die globalen Variablen aus game.js:
 * - canvas, world, keyboard, gameState, ui, isMuted, controlMode
 *
 * Alle Funktionen sind global verfügbar und werden von game.js und
 * game-helpers.js aufgerufen. Reihenfolge der Skripte (defer) in index.html sicherstellt,
 * dass dieses File vor game.js geladen wird.
 */

/**
 * Zeigt den Startbildschirm und blendet alle anderen Overlays aus.
 * @returns {void}
 */
function showStart() {
  hideAllOverlays();
  ui.startOverlay?.classList.remove('hidden');
  ui.imprintBtn?.classList.remove('hidden');
}

/**
 * Zeigt das Game-Over-Overlay und die Todes-Buttons.
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
 * Zeigt das Win-Overlay und die Todes-Buttons.
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
 * Verbirgt alle Overlays und blendet die Todes-Buttons aus.
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
 * Zeigt den Neustart-Button an.
 * @returns {void}
 */
function showRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-restart-btn--visible'));
}

/**
 * Verbirgt den Neustart-Button.
 * @returns {void}
 */
function hideRestartBtn() {
  const b = ui.restartBtn;
  if (!b) return;
  b.classList.remove('stage-restart-btn--visible');
  b.style.display = 'none';
}

/**
 * Zeigt den Exit-Button an.
 * @returns {void}
 */
function showExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.style.display = 'inline-flex';
  requestAnimationFrame(() => b.classList.add('stage-exit-btn--visible'));
}

/**
 * Verbirgt den Exit-Button.
 * @returns {void}
 */
function hideExitBtn() {
  const b = ui.exitBtn;
  if (!b) return;
  b.classList.remove('stage-exit-btn--visible');
  b.style.display = 'none';
}

/**
 * Zeigt den Steuerungs-Umschalter (Touch/Keyboard) und aktualisiert dessen Darstellung.
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
 * Verbirgt den Steuerungs-Umschalter.
 * @returns {void}
 */
function hideControlsToggleBtn() {
  const b = ui.controlsToggleBtn;
  if (!b) return;
  b.classList.remove('stage-controls-btn--visible');
  b.style.display = 'none';
}

/**
 * Blendet die Todes-Buttons ein und fokussiert den Zurück-Button.
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
 * Blendet die Todes-Buttons aus und deaktiviert Interaktionen.
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
 * Wechselt in bzw. aus dem Vollbildmodus.
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
 * Schaltet Ton stumm/aktiv und aktualisiert den Button.
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
 * Wechselt zwischen Touch- und Tastaturmodus und aktualisiert UI.
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
 * Aktualisiert Icons, Label und ARIA des Steuerungs-Umschalters.
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
 * Setzt Bilder und Hinweis-Icons des Steuerungs-Umschalters.
 * @param {HTMLElement} btn - Button-Element
 * @param {boolean} isTouch - true, wenn Touch-Modus aktiv ist
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
 * Setzt Label-Text und ARIA für den Steuerungs-Umschalter.
 * @param {HTMLElement} btn - Button-Element
 * @param {boolean} isTouch - true, wenn Touch-Modus aktiv ist
 * @returns {void}
 */
function _setControlsLabel(btn, isTouch) {
  const span = btn.querySelector('.controls-toggle-label');
  const label = isTouch ? 'Enable keyboard controls' : 'Enable touch controls';
  if (span) span.textContent = label;
  btn.setAttribute('aria-label', label);
}

/**
 * Zeigt oder versteckt die Touch-Steuerung gemäß aktuellem Modus.
 * @returns {void}
 */
function applyControlModeVisuals() {
  if (controlMode === 'touch') showTouchControls();
  else hideTouchControls();
}

/**
 * Zeigt die Touch-Steuerung an.
 * @returns {void}
 */
function showTouchControls() {
  const tc = ui.touchControls;
  if (!tc) return;
  tc.classList.remove('hidden');
  tc.removeAttribute('aria-hidden');
}

/**
 * Verbirgt die Touch-Steuerung und setzt Tasten zurück.
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

// Hinweis: Binding der Touch-Buttons (Event-Listener) ist in scripts/game-helpers.js
// enthalten (bindTouchButtons, touchOnPress, touchOnRelease). Dieses Modul steuert nur
// deren Sichtbarkeit und globale Control-Mode-Zustände.

/**
 * Öffnet das In-Game-HowTo-Overlay und verbirgt Touch-Buttons.
 * @returns {void}
 */
function openHowTo() {
  ui.howToModal?.classList.remove('hidden');
  hideTouchControls();
}

/**
 * Schließt das In-Game-HowTo-Overlay und stellt Controls wieder her.
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
 * Öffnet das Impressum-Overlay.
 * @returns {void}
 */
function openImprint() {
  ui.imprintModal?.classList.remove('hidden');
}

/**
 * Schließt das Impressum-Overlay.
 * @returns {void}
 */
function closeImprint() {
  ui.imprintModal?.classList.add('hidden');
}
