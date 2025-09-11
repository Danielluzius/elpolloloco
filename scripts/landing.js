(function () {
  let gameInitialized = false;
  const L = {
    landing: null,
    hero: null,
    layer2: null,
    layer1: null,
    layerBird: null,
    enterBtn: null,
    stage: null,
  };

  const qs = (s) => document.querySelector(s);

  /**
   * Ensures the game is initialized by calling the init function if available.
   */
  function ensureInit() {
    if (gameInitialized) return;
    if (typeof init === 'function') {
      init();
      gameInitialized = true;
    }
  }

  /**
   * Sets the opacity of an element to 1, making it visible.
   * @param {HTMLElement} el - The element to show.
   */
  function show(el) {
    if (el) el.style.opacity = '1';
  }

  /**
   * Caches DOM nodes for later use.
   */
  function cacheNodes() {
    L.landing = qs('#landing');
    L.hero = qs('#landing .hero');
    L.stage = qs('#stage');
    L.layer2 = qs('.layer-2');
    L.layer1 = qs('.layer-1');
    L.layerBird = qs('.layer-bird');
    L.enterBtn = qs('#enterBtn');
  }

  /**
   * Sets up the imprint button functionality.
   */
  function setupImprint() {
    const b = qs('#imprintBtn');
    if (!b) return;
    b.addEventListener('click', () => {});
  }

  /**
   * Requests fullscreen mode for a given element.
   * @param {HTMLElement} el - The element to request fullscreen for.
   * @returns {Promise} - Resolves if fullscreen is successful, rejects otherwise.
   */
  function requestFullscreen(el) {
    if (el.requestFullscreen) return el.requestFullscreen();
    return Promise.reject('no fs');
  }

  /**
   * Exits fullscreen mode.
   * @returns {Promise} - Resolves if exiting fullscreen is successful, rejects otherwise.
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
   * Sets up the fullscreen button functionality.
   */
  function setupFullscreen() {
    const btn = qs('#fullscreenBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const s = btn.getAttribute('data-state') || 'off';
      try {
        if (s === 'off') {
          await requestFullscreen(document.documentElement);
          btn.setAttribute('data-state', 'on');
          updateFsLabel(btn, true);
        } else {
          await exitFullscreen();
          btn.setAttribute('data-state', 'off');
          updateFsLabel(btn, false);
        }
      } catch (e) {}
    });
    document.addEventListener('fullscreenchange', () => {
      const a = !!document.fullscreenElement;
      btn.setAttribute('data-state', a ? 'on' : 'off');
      updateFsLabel(btn, a);
    });
  }

  /**
   * Updates the sound button label and ARIA attributes.
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
   * Sets up the sound button functionality.
   */
  function setupSound() {
    const btn = qs('#muteBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cur = btn.getAttribute('data-state') || 'on';
      const next = cur === 'on' ? 'off' : 'on';
      btn.setAttribute('data-state', next);
      updateSoundBtn(btn, next === 'on');
      try {
        window.sound?.setMuted(!(next === 'on'));
      } catch (e) {}
      if (typeof window !== 'undefined') {
        try {
          window.isMuted = !(next === 'on');
        } catch (e) {}
      }
      if (typeof toggleMute === 'function') {
        try {
          if (
            (next === 'on' && window.isMuted) ||
            (next === 'off' && !window.isMuted)
          )
            toggleMute();
        } catch (e) {}
      }
    });
    try {
      const muted = !!window.SoundHub?.get()?.isMuted();
      btn.setAttribute('data-state', muted ? 'off' : 'on');
      updateSoundBtn(btn, !muted);
    } catch (e) {
      updateSoundBtn(btn, true);
    }
  }

  function animateIntro() {
    setTimeout(() => show(L.layer1), 600);
    setTimeout(() => show(L.layer2), 1200);
    setTimeout(() => show(qs('.layer-bird')), 1800);
    setTimeout(() => show(qs('.layer-clouds')), 2400);
    setTimeout(() => show(L.hero), 2800);
  }

  function addEnter() {
    L.enterBtn?.addEventListener('click', onEnter);
  }

  function computeStageTop() {
    const h = L.hero?.getBoundingClientRect();
    const land = L.landing?.getBoundingClientRect();
    if (!h || !land) return 50;
    const c = h.top + h.height / 2;
    return ((c - land.top) / land.height) * 100;
  }

  function prepareStage() {
    const top = computeStageTop();
    L.enterBtn.style.display = 'none';
    L.hero?.classList.add('hero--up');
    L.landing?.classList.add('landing--stage');
    if (L.stage) {
      L.stage.style.display = '';
      L.stage.classList.add('stage--float');
      L.landing?.style.setProperty('--stage-top', `${top}%`);
    }
  }

  function grabStageButtons() {
    L.startBtn = qs('#startGameBtn');
    L.howToBtn = qs('#howToPlayBtn');
    L.imprintBtn = qs('#imprintBtn');
    L.fullscreenBtn = qs('#fullscreenBtn');
    L.soundBtn = qs('#muteBtn');
    L.howToOverlay = qs('#howToOverlay');
    L.howToClose = qs('#howToCloseBtn');
  }

  function showStageButtons() {
    const b = L.startBtn;
    if (!b) return ensureInitAndMaybeStart();
    setTimeout(() => {
      showBtn(b, 'stage-start-btn--visible');
      showBtn(L.howToBtn, 'stage-howto-btn--visible');
      showBtn(L.imprintBtn, 'stage-imprint-btn--visible');
      showBtn(L.fullscreenBtn, 'stage-fullscreen-btn--visible');
      showBtn(L.soundBtn, 'stage-sound-btn--visible');
    }, 400);
  }

  function showBtn(btn, cls) {
    if (!btn) return;
    btn.style.display = 'inline-flex';
    btn.classList.add(cls);
  }

  function onEnter() {
    prepareStage();
    grabStageButtons();
    showStageButtons();
    bindStart();
    bindHowTo();
  }

  function bindStart() {
    const b = L.startBtn;
    if (!b) return;
    b.addEventListener(
      'click',
      () => {
        b.style.display = 'none';
        hideIf(L.howToBtn);
        hideIf(L.imprintBtn);
        hideIf(L.fullscreenBtn);
        L.hero?.classList.add('hero--off');
        ensureInitAndMaybeStart();
      },
      { once: true }
    );
  }

  function hideIf(btn) {
    if (btn) btn.style.display = 'none';
  }

  function ensureInitAndMaybeStart() {
    ensureInit();
    if (typeof startGame === 'function') {
      try {
        startGame();
      } catch (e) {}
    }
  }

  function bindHowTo() {
    if (!L.howToBtn || !L.howToOverlay) return;
    L.howToBtn.addEventListener('click', showHowTo);
    L.howToClose?.addEventListener('click', hideHowTo);
  }

  function showHowTo() {
    hideButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    if (L.hero) {
      L.hero.dataset.prevVisibility = L.hero.style.visibility || '';
      L.hero.style.visibility = 'hidden';
    }
    L.howToOverlay.classList.remove('hidden');
    document.addEventListener('keydown', escHowTo);
  }

  function hideHowTo() {
    L.howToOverlay.classList.add('hidden');
    restoreButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    if (L.hero && !L.hero.classList.contains('hero--off')) {
      L.hero.style.visibility = L.hero.dataset.prevVisibility || '';
      delete L.hero.dataset.prevVisibility;
    }
    document.removeEventListener('keydown', escHowTo);
  }

  function escHowTo(e) {
    if (e.key === 'Escape') hideHowTo();
  }

  function hideButtons(arr) {
    arr.forEach((b) => {
      if (!b) return;
      if (!b.dataset.prevDisplay) b.dataset.prevDisplay = b.style.display || '';
      b.style.display = 'none';
    });
  }

  function restoreButtons(arr) {
    arr.forEach((b) => {
      if (!b) return;
      const prev = b.dataset.prevDisplay;
      if (prev !== undefined) {
        if (prev !== 'none') b.style.display = prev || 'inline-flex';
        delete b.dataset.prevDisplay;
      }
    });
  }

  /**
   * Binds all necessary functionalities on DOMContentLoaded.
   */
  function bind() {
    cacheNodes();
    setupImprint();
    setupFullscreen();
    setupSound();
    animateIntro();
    addEnter();
    try {
      window.sound?.playMusic('intro_music', { loop: true, volume: 0.4 });
    } catch (_) {}
    const kickIntroMusic = () => {
      try {
        if (typeof gameState !== 'undefined' && gameState === 'running') return;
        const cur = window.sound?.channels?.music?.current;
        const paused = cur ? !!cur.paused || cur.currentTime === 0 : true;
        if (paused)
          window.sound?.playMusic('intro_music', { loop: true, volume: 0.4 });
      } catch (_) {}
    };
    window.addEventListener('pointerdown', kickIntroMusic, { once: true });
    window.addEventListener('keydown', kickIntroMusic, { once: true });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();
