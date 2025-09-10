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
  };

  function qs(sel) {
    return document.querySelector(sel);
  }
  function show(el) {
    if (!el) return;
    el.style.opacity = '1';
  }

  function buildGameShell(parent) {
    const stage = document.createElement('div');
    stage.id = 'stage';
    stage.className = 'stage';

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width = 720;
    canvas.height = 480;
    stage.appendChild(canvas);

    stage.insertAdjacentHTML(
      'beforeend',
      `
      <div id="startOverlay" class="overlay hidden">
        <img src="assets/img/5_background/nature/3_layer.png" alt="Start Screen" />
        <div class="menu-buttons" role="toolbar" aria-label="Start Menu">
          <button id="startBtn" class="secondary-btn start-main-btn">Start Game</button>
          <button id="howToBtn" class="secondary-btn howto-btn" aria-haspopup="dialog" aria-controls="howToModal">How To Play</button>
        </div>
      </div>
      <div id="gameOverOverlay" class="overlay hidden">
        <img src="assets/img/9_intro_outro_screens/game_over/lost.png" alt="You Lost" />
        <div class="overlay-actions">
          <button class="retryBtn secondary-btn">Retry</button>
          <button class="backToStartBtn secondary-btn">Back to Start</button>
        </div>
      </div>
      <div id="winOverlay" class="overlay hidden">
        <img src="assets/img/9_intro_outro_screens/game_over/won.png" alt="Victory" />
        <div class="overlay-actions">
          <button class="retryBtn secondary-btn">Retry</button>
          <button class="backToStartBtn secondary-btn">Back to Start</button>
        </div>
      </div>
      <div id="howToModal" class="modal hidden" role="dialog" aria-labelledby="howToTitle" aria-modal="true">
        <h3 id="howToTitle">How to Play</h3>
        <ul>
          <li>Move: Arrow Left / Right</li>
          <li>Jump: Arrow Up or Space</li>
          <li>Special: S (requires full charge)</li>
          <li>Block: D</li>
          <li>Attack: A</li>
          <li>Goal: Defeat the Boss Chicken.</li>
        </ul>
        <div class="modal-actions">
          <button id="howToCloseBtn" class="secondary-btn">Close</button>
        </div>
      </div>
      <div id="imprintModal" class="modal hidden" role="dialog" aria-labelledby="imprintTitle" aria-modal="true">
        <h3 id="imprintTitle">Imprint</h3>
  <p><strong>Project:</strong> Goblin Slayer (El Pollo Loco Remake)</p>
  <p><strong>Author:</strong> Your Name – Educational Project</p>
  <p>All graphics & sounds are for practice only. Not for commercial use.</p>
        <div class="modal-actions">
          <button id="imprintCloseBtn" class="secondary-btn">Close</button>
        </div>
      </div>
      <div class="corner-controls" aria-label="Utility Controls">
        <button id="fullscreenBtn" class="secondary-btn tiny-btn" title="Fullscreen">Fullscreen</button>
        <button id="muteBtn" class="secondary-btn tiny-btn" title="Mute/Unmute">Mute</button>
      </div>
      <button id="imprintBtn" class="secondary-btn imprint-btn" aria-haspopup="dialog" aria-controls="imprintModal">Imprint</button>
    `
    );

    const container = parent || document.body;
    container.appendChild(stage);

    ensureInit();

    const btn = stage.querySelector('#startBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const hero = document.querySelector('#landing .hero');
        if (hero) hero.classList.add('hero--off');
      });
    }
    return stage;
  }

  function bind() {
    L.landing = qs('#landing');
    L.hero = qs('#landing .hero');
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
      const stage = buildGameShell(L.landing);
      if (stage) {
        stage.classList.add('stage--float');
        L.landing?.style.setProperty('--stage-top', `${stageTopPct}%`);
      }

      const overlay = document.getElementById('startOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
        overlay.getBoundingClientRect();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.remove('hidden');
          });
        });
      }
    });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();
