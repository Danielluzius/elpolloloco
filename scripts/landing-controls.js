/**
 * Selects the first element that matches the given CSS selector.
 * @param {string} s - The CSS selector.
 * @returns {HTMLElement|null} The first matching element, or null if none found.
 */
const qs = (s) => document.querySelector(s);

/**
 * Requests fullscreen mode for a given element.
 * @param {HTMLElement} el - The element to request fullscreen for.
 * @returns {Promise} A promise that resolves when fullscreen is activated.
 */
function requestFullscreen(el) {
  if (el.requestFullscreen) return el.requestFullscreen();
  return Promise.reject('no fs');
}

/**
 * Exits fullscreen mode.
 * @returns {Promise} A promise that resolves when fullscreen is exited.
 */
function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  return Promise.reject('no fs');
}

/**
 * Updates the fullscreen button label and ARIA attributes.
 * @param {HTMLElement} btn - The fullscreen button.
 * @param {boolean} on - Whether fullscreen is active.
 */
function updateFsLabel(btn, on) {
  const span = btn.querySelector('.fullscreen-label');
  if (span) span.textContent = on ? 'Exit Fullscreen' : 'Enter Fullscreen';
  btn.setAttribute('aria-label', on ? 'Exit Fullscreen' : 'Enter Fullscreen');
}

/**
 * Sets the fullscreen state and updates the button.
 * @param {HTMLElement} btn - The fullscreen button.
 * @param {boolean} isActive - Whether fullscreen is active.
 */
function setFullscreenState(btn, isActive) {
  btn.setAttribute('data-state', isActive ? 'on' : 'off');
  updateFsLabel(btn, isActive);
}

/**
 * Toggles fullscreen mode on or off.
 * @param {HTMLElement} btn - The fullscreen button.
 */
async function toggleFullscreen(btn) {
  const s = btn.getAttribute('data-state') || 'off';
  try {
    if (s === 'off') {
      await requestFullscreen(document.documentElement);
      setFullscreenState(btn, true);
    } else {
      await exitFullscreen();
      setFullscreenState(btn, false);
    }
  } catch (e) {}
}

/**
 * Handles changes to fullscreen state and updates the button accordingly.
 * @param {HTMLElement} btn - The fullscreen button.
 */
function handleFullscreenChange(btn) {
  const isActive = !!document.fullscreenElement;
  setFullscreenState(btn, isActive);
}

/**
 * Sets up the fullscreen functionality.
 */
function setupFullscreen() {
  const btn = qs('#fullscreenBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => toggleFullscreen(btn));
  document.addEventListener('fullscreenchange', () =>
    handleFullscreenChange(btn)
  );
}

/**
 * Updates the sound button label, image, and ARIA attributes.
 * @param {HTMLElement} btn - The sound button.
 * @param {boolean} on - Whether sound is enabled.
 */
function updateSoundBtn(btn, on) {
  const img = btn.querySelector('img');
  const span = btn.querySelector('.sound-label');
  if (img)
    img.src = on
      ? './assets/img/logos/sound_on.png'
      : './assets/img/logos/sound_off.png';
  if (span) span.textContent = on ? 'Mute' : 'Unmute';
  btn.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
}

/**
 * Toggles the mute state if needed based on the button state.
 * @param {string} next - The next state of the sound button ('on' or 'off').
 */
function toggleMuteIfNeeded(next) {
  if ((next === 'on' && window.isMuted) || (next === 'off' && !window.isMuted))
    if (typeof toggleMute === 'function') toggleMute();
}

/**
 * Updates the global sound state based on the button state.
 * @param {string} next - The next state of the sound button ('on' or 'off').
 */
function updateGlobalSoundState(next) {
  try {
    window.sound?.setMuted(!(next === 'on'));
    if (typeof window !== 'undefined') {
      window.isMuted = !(next === 'on');
    }
    toggleMuteIfNeeded(next);
  } catch (e) {}
}

/**
 * Initializes the sound button state based on the global sound state.
 * @param {HTMLElement} btn - The sound button.
 */
function initializeSoundButtonState(btn) {
  try {
    const muted = !!window.SoundHub?.get()?.isMuted();
    btn.setAttribute('data-state', muted ? 'off' : 'on');
    updateSoundBtn(btn, !muted);
  } catch (e) {
    updateSoundBtn(btn, true);
  }
}

/**
 * Sets up the sound functionality.
 */
function setupSound() {
  const btn = qs('#muteBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = btn.getAttribute('data-state') || 'on';
    const next = cur === 'on' ? 'off' : 'on';
    btn.setAttribute('data-state', next);
    updateSoundBtn(btn, next === 'on');
    updateGlobalSoundState(next);
  });
  initializeSoundButtonState(btn);
}

/**
 * Exposes the setup functions for fullscreen and sound controls.
 * @namespace LandingControls
 */
window.LandingControls = {
  /**
   * Initializes fullscreen functionality.
   * @function
   */
  setupFullscreen,

  /**
   * Initializes sound functionality.
   * @function
   */
  setupSound,
};
