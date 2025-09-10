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
    const imprintBtn = qs('#imprintBtn');
    const fullscreenBtn = qs('#fullscreenBtn');
    const soundBtn = qs('#muteBtn');
    if (imprintBtn) {
      imprintBtn.addEventListener('click', () => {
        console.info('Imprint button clicked (placeholder)');
      });
    }
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', async () => {
        const current = fullscreenBtn.getAttribute('data-state') || 'off';
        try {
          if (current === 'off') {
            await requestFullscreen(document.documentElement);
            fullscreenBtn.setAttribute('data-state', 'on');
            updateFsLabel(fullscreenBtn, true);
          } else {
            await exitFullscreen();
            fullscreenBtn.setAttribute('data-state', 'off');
            updateFsLabel(fullscreenBtn, false);
          }
        } catch (e) {
          console.warn('Fullscreen toggle failed', e);
        }
      });
      document.addEventListener('fullscreenchange', () => {
        const active = !!document.fullscreenElement;
        fullscreenBtn.setAttribute('data-state', active ? 'on' : 'off');
        updateFsLabel(fullscreenBtn, active);
      });
    }
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const current = soundBtn.getAttribute('data-state') || 'on';
        const next = current === 'on' ? 'off' : 'on';
        soundBtn.setAttribute('data-state', next);
        updateSoundBtn(soundBtn, next === 'on');
        // propagate to global isMuted without re-toggling UI twice
        if (typeof window !== 'undefined') {
          try {
            window.isMuted = !(next === 'on');
          } catch (_) {}
        }
        if (typeof toggleMute === 'function') {
          try {
            // call toggleMute only if its internal state differs from desired state
            if (
              (next === 'on' && window.isMuted) ||
              (next === 'off' && !window.isMuted)
            ) {
              toggleMute();
            }
          } catch (e) {
            console.warn('toggleMute failed', e);
          }
        }
      });
      updateSoundBtn(soundBtn, true); // initial on
    }

    function updateSoundBtn(btn, isOn) {
      const img = btn.querySelector('img');
      const span = btn.querySelector('.sound-label');
      if (img)
        img.src = isOn
          ? './assets/img/logos/sound_on.png'
          : './assets/img/logos/sound_off.png';
      if (span) span.textContent = isOn ? 'Sound aus' : 'Sound an';
      btn.setAttribute('aria-label', isOn ? 'Sound aus' : 'Sound an');
    }

    function updateFsLabel(btn, isOn) {
      const span = btn.querySelector('.fullscreen-label');
      if (span) span.textContent = isOn ? 'Fullscreen aus' : 'Fullscreen an';
      btn.setAttribute('aria-label', isOn ? 'Fullscreen aus' : 'Fullscreen an');
    }
    function requestFullscreen(el) {
      if (el.requestFullscreen) return el.requestFullscreen();
      return Promise.reject('Fullscreen API not supported');
    }
    function exitFullscreen() {
      if (document.exitFullscreen) return document.exitFullscreen();
      return Promise.reject('Fullscreen API not supported');
    }

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
      const howToBtn = qs('#howToPlayBtn');
      const imprintBtnLocal = qs('#imprintBtn');
      const fullscreenBtnLocal = qs('#fullscreenBtn');
      const soundBtnLocal = qs('#muteBtn');
      if (startBtn) {
        setTimeout(() => {
          startBtn.style.display = 'inline-flex';
          startBtn.classList.add('stage-start-btn--visible');
          if (howToBtn) {
            howToBtn.style.display = 'inline-flex';
            howToBtn.classList.add('stage-howto-btn--visible');
          }
          if (imprintBtnLocal) {
            imprintBtnLocal.style.display = 'inline-flex';
            imprintBtnLocal.classList.add('stage-imprint-btn--visible');
          }
          if (fullscreenBtnLocal) {
            fullscreenBtnLocal.style.display = 'inline-flex';
            fullscreenBtnLocal.classList.add('stage-fullscreen-btn--visible');
          }
          if (soundBtnLocal) {
            soundBtnLocal.style.display = 'inline-flex';
            soundBtnLocal.classList.add('stage-sound-btn--visible');
          }
        }, 400);

        startBtn.addEventListener(
          'click',
          () => {
            startBtn.style.display = 'none';
            if (howToBtn) howToBtn.style.display = 'none';
            if (imprintBtnLocal) imprintBtnLocal.style.display = 'none';
            if (fullscreenBtnLocal) fullscreenBtnLocal.style.display = 'none';
            // sound button stays visible (persistent)
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
