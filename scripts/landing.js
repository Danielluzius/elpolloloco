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
   * Ensures the game is initialized by calling the `init` function if it exists.
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
   * Sets up the imprint modal functionality.
   */
  function setupImprint() {
    const b = qs('#imprintBtn');
    const overlay = qs('#imprintModal');
    const closeBtn = qs('#imprintCloseBtn');
    if (!b || !overlay) return;
    setupImprintEventListeners(b, overlay, closeBtn);
  }

  /**
   * Sets up event listeners for the imprint modal.
   * @param {HTMLElement} b - The button to open the imprint modal.
   * @param {HTMLElement} overlay - The imprint modal overlay.
   * @param {HTMLElement} closeBtn - The button to close the imprint modal.
   */
  function setupImprintEventListeners(b, overlay, closeBtn) {
    const esc = (e) => {
      if (e.key === 'Escape') hideImprint(overlay);
    };
    b.addEventListener('click', () => showImprint(overlay, esc));
    closeBtn?.addEventListener('click', () => hideImprint(overlay, esc));
  }

  /**
   * Displays the imprint modal and hides other buttons and the hero.
   * @param {HTMLElement} overlay - The imprint modal overlay.
   * @param {Function} esc - The function to handle the Escape key event.
   */
  function showImprint(overlay, esc) {
    hideButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    hideHero();
    overlay.classList.remove('hidden');
    document.addEventListener('keydown', esc);
  }

  /**
   * Hides the imprint modal and restores other buttons and the hero.
   * @param {HTMLElement} overlay - The imprint modal overlay.
   * @param {Function} esc - The function to handle the Escape key event.
   */
  function hideImprint(overlay, esc) {
    overlay.classList.add('hidden');
    restoreButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    restoreHero();
    document.removeEventListener('keydown', esc);
  }

  /**
   * Hides the hero element and stores its previous visibility state.
   */
  function hideHero() {
    if (L.hero) {
      L.hero.dataset.prevVisibility = L.hero.style.visibility || '';
      L.hero.style.visibility = 'hidden';
    }
  }

  /**
   * Restores the hero element's visibility state.
   */
  function restoreHero() {
    if (L.hero && !L.hero.classList.contains('hero--off')) {
      L.hero.style.visibility = L.hero.dataset.prevVisibility || '';
      delete L.hero.dataset.prevVisibility;
    }
  }

  // fullscreen and sound controls moved to scripts/landing-controls.js

  /**
   * Animates the intro sequence by showing layers and the hero.
   */
  function animateIntro() {
    setTimeout(() => show(L.layer1), 600);
    setTimeout(() => show(L.layer2), 1200);
    setTimeout(() => show(qs('.layer-bird')), 1800);
    setTimeout(() => show(qs('.layer-clouds')), 2400);
    setTimeout(() => show(L.hero), 2800);
  }

  /**
   * Adds an event listener to the enter button.
   */
  function addEnter() {
    L.enterBtn?.addEventListener('click', onEnter);
  }

  /**
   * Computes the top position of the stage relative to the landing.
   * @returns {number} - The top position as a percentage.
   */
  function computeStageTop() {
    const h = L.hero?.getBoundingClientRect();
    const land = L.landing?.getBoundingClientRect();
    if (!h || !land) return 50;
    const c = h.top + h.height / 2;
    return ((c - land.top) / land.height) * 100;
  }

  /**
   * Prepares the stage for the game by adjusting styles and classes.
   */
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

  /**
   * Caches references to stage-related buttons.
   */
  function grabStageButtons() {
    L.startBtn = qs('#startGameBtn');
    L.howToBtn = qs('#howToPlayBtn');
    L.imprintBtn = qs('#imprintBtn');
    L.fullscreenBtn = qs('#fullscreenBtn');
    L.soundBtn = qs('#muteBtn');
    L.howToOverlay = qs('#howToOverlay');
    L.howToClose = qs('#howToCloseBtn');
  }

  /**
   * Shows the stage buttons with animations.
   */
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

  /**
   * Shows a button with a specific class.
   * @param {HTMLElement} btn - The button to show.
   * @param {string} cls - The class to add to the button.
   */
  function showBtn(btn, cls) {
    if (!btn) return;
    btn.style.display = 'inline-flex';
    btn.classList.add(cls);
  }

  /**
   * Handles the enter button click event.
   */
  function onEnter() {
    prepareStage();
    grabStageButtons();
    showStageButtons();
    bindStart();
    bindHowTo();
  }

  /**
   * Binds the start button click event to start the game.
   */
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

  /**
   * Hides a button if it exists.
   * @param {HTMLElement} btn - The button to hide.
   */
  function hideIf(btn) {
    if (btn) btn.style.display = 'none';
  }

  /**
   * Ensures the game is initialized and starts it if possible.
   */
  function ensureInitAndMaybeStart() {
    ensureInit();
    if (typeof startGame === 'function') {
      try {
        startGame();
      } catch (e) {}
    }
  }

  /**
   * Binds the how-to-play button click event to show the overlay.
   */
  function bindHowTo() {
    if (!L.howToBtn || !L.howToOverlay) return;
    L.howToBtn.addEventListener('click', showHowTo);
    L.howToClose?.addEventListener('click', hideHowTo);
  }

  /**
   * Shows the how-to-play overlay and hides other buttons and the hero.
   */
  function showHowTo() {
    hideButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    hideHero();
    L.howToOverlay.classList.remove('hidden');
    document.addEventListener('keydown', escHowTo);
  }

  /**
   * Hides the how-to-play overlay and restores other buttons and the hero.
   */
  function hideHowTo() {
    L.howToOverlay.classList.add('hidden');
    restoreButtons([
      L.startBtn,
      L.howToBtn,
      L.imprintBtn,
      L.fullscreenBtn,
      L.soundBtn,
    ]);
    restoreHero();
    document.removeEventListener('keydown', escHowTo);
  }

  /**
   * Handles the Escape key event to hide the how-to-play overlay.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  function escHowTo(e) {
    if (e.key === 'Escape') hideHowTo();
  }

  /**
   * Hides an array of buttons and stores their previous display states.
   * @param {HTMLElement[]} arr - The array of buttons to hide.
   */
  function hideButtons(arr) {
    arr.forEach((b) => {
      if (!b) return;
      if (!b.dataset.prevDisplay) b.dataset.prevDisplay = b.style.display || '';
      b.style.display = 'none';
    });
  }

  /**
   * Restores an array of buttons to their previous display states.
   * @param {HTMLElement[]} arr - The array of buttons to restore.
   */
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
   * Binds all necessary event listeners and initializes the landing page.
   */
  function bind() {
    cacheNodes();
    setupImprint();
    try {
      window.LandingControls?.setupFullscreen();
      window.LandingControls?.setupSound();
    } catch (_) {}
    animateIntro();
    addEnter();
    try {
      window.sound?.playMusic('intro_music', { loop: true, volume: 0.4 });
    } catch (_) {}
    setupIntroMusicKickstart();
  }

  /**
   * Sets up a mechanism to kickstart the intro music on user interaction.
   */
  function setupIntroMusicKickstart() {
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
