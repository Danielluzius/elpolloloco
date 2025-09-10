(function () {
  let gameInitialized = false;
  function ensureInit() {
    if (gameInitialized) return;
    if (typeof init === 'function') {
      init();
      gameInitialized = true;
    }
  }

  const L = {
    landing: null,
    hero: null,
    layer2: null,
    layer1: null,
    layerBird: null,
    enterBtn: null,
    stage: null,
  };

  function qs(sel) {
    return document.querySelector(sel);
  }
  function show(el) {
    if (el) el.style.opacity = '1';
  }

  function bind() {
    L.landing = qs('#landing');
    L.hero = qs('#landing .hero');
    L.stage = qs('#stage');
    const layerClouds = qs('.layer-clouds');
    const layerBirds = qs('.layer-bird');
    L.layer2 = qs('.layer-2');
    L.layer1 = qs('.layer-1');
    L.layerBird = qs('.layer-bird');
    L.enterBtn = qs('#enterBtn');

    setTimeout(() => show(L.layer1), 600);
    setTimeout(() => show(L.layer2), 1200);
    setTimeout(() => show(layerBirds), 1800);
    setTimeout(() => show(layerClouds), 2400);
    setTimeout(() => show(L.hero), 2800);

    L.enterBtn?.addEventListener('click', () => {
      const heroRect = L.hero?.getBoundingClientRect();
      const landingRect = L.landing?.getBoundingClientRect();
      let stageTopPct = 50;
      if (heroRect && landingRect) {
        const heroCenterY = heroRect.top + heroRect.height / 2;
        const relativeY = heroCenterY - landingRect.top;
        stageTopPct = (relativeY / landingRect.height) * 100;
      }

      L.enterBtn.style.display = 'none';
      L.hero?.classList.add('hero--up');
      L.landing?.classList.add('landing--stage');

      if (L.stage) {
        L.stage.style.display = '';
        L.stage.classList.add('stage--float');
        L.landing?.style.setProperty('--stage-top', `${stageTopPct}%`);
      }

      const startBtn = qs('#startGameBtn');
      if (startBtn) {
        setTimeout(() => {
          startBtn.style.display = 'inline-flex';
          startBtn.classList.add('stage-start-btn--visible');
        }, 400);

        startBtn.addEventListener(
          'click',
          () => {
            startBtn.style.display = 'none';
            L.hero?.classList.add('hero--off');
            ensureInit();
            if (typeof startGame === 'function') {
              try {
                startGame();
              } catch (e) {
                console.error('Error starting game:', e);
              }
            } else {
              console.warn('startGame() not found');
            }
          },
          { once: true }
        );
      } else {
        ensureInit();
        if (typeof startGame === 'function') {
          try {
            startGame();
          } catch (e) {
            console.error('Error starting game (no btn):', e);
          }
        }
      }
    });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();
