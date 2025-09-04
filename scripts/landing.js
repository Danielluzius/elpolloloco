// Landing page orchestration: reveal layers in order and mount the game UI only after Enter.
(function () {
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

    // Overlays (simplified): we'll omit topbar, start/how-to buttons for now
    stage.insertAdjacentHTML(
      'beforeend',
      `
      <div id="startOverlay" class="overlay hidden">
        <img src="assets/img/5_background/nature/3_layer.png" alt="Startscreen" />
  <button id="startBtn" class="primary-btn">START</button>
      </div>
      <div id="gameOverOverlay" class="overlay hidden">
        <img src="assets/img/9_intro_outro_screens/game_over/game over.png" alt="Game Over" />
        <div class="overlay-actions">
          <button class="retryBtn primary-btn">Retry</button>
          <button class="backToStartBtn secondary-btn">Back to Start</button>
        </div>
      </div>
      <div id="winOverlay" class="overlay hidden">
        <img src="assets/img/You won, you lost/You won A.png" alt="Gewonnen" />
        <div class="overlay-actions">
          <button class="retryBtn primary-btn">Retry</button>
          <button class="backToStartBtn secondary-btn">Back to Start</button>
        </div>
      </div>
      <div id="howToModal" class="modal hidden" role="dialog" aria-labelledby="howToTitle" aria-modal="true">
        <h3 id="howToTitle">How to Play</h3>
        <ul>
          <li>Move: Arrow Left / Right</li>
          <li>Jump: Space</li>
          <li>Throw Bottle: D</li>
          <li>Goal: Collect coins and defeat the Boss Chicken.</li>
        </ul>
        <div class="modal-actions">
          <button id="howToCloseBtn" class="secondary-btn">Close</button>
        </div>
      </div>
    `
    );

    // Place stage within landing so nothing shifts the page
    const container = parent || document.body;
    container.appendChild(stage);

    // Bind immediate title fade on Start click; game.js will also have its own start handler
    const btn = stage.querySelector('#startBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const hero = document.querySelector('#landing .hero');
        if (hero) hero.classList.add('hero--off');
      });
    }

    // Do not auto-init here; Enter handler orchestrates fade timing
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

    // Sequence: 3_layer visible by default; then 1 -> 2 -> Birds -> Clouds -> Hero
    setTimeout(() => show(L.layer1), 600);
    setTimeout(() => show(L.layer2), 1200);
    setTimeout(() => show(layerBirds), 1800);
    setTimeout(() => show(layerClouds), 2400);
    setTimeout(() => show(L.hero), 2800);

    L.enterBtn?.addEventListener('click', () => {
      // Remember hero current center position to place the stage there
      const heroRect = L.hero?.getBoundingClientRect();
      const landingRect = L.landing?.getBoundingClientRect();
      // Fallback to center if rects are missing
      let stageTopPct = 50;
      if (heroRect && landingRect) {
        const heroCenterY = heroRect.top + heroRect.height / 2;
        const relativeY = heroCenterY - landingRect.top; // px within landing
        stageTopPct = (relativeY / landingRect.height) * 100;
      }

      // Hide enter button and move the hero up (visual only)
      L.enterBtn.style.display = 'none';
      L.hero?.classList.add('hero--up');

      // Mount stage at the remembered position, absolutely centered
      L.landing?.classList.add('landing--stage');
      const stage = buildGameShell(L.landing);
      if (stage) {
        stage.classList.add('stage--float');
        L.landing?.style.setProperty('--stage-top', `${stageTopPct}%`);
      }

      // Smooth overlay fade-in: ensure it renders hidden first, then unhide next frame
      const overlay = document.getElementById('startOverlay');
      if (overlay) {
        // Ensure hidden state applied
        overlay.classList.add('hidden');
        // Force reflow
        overlay.getBoundingClientRect();
        // Two rAFs to ensure initial paint at opacity 0 occurred
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.remove('hidden');
          });
        });
      }

      // Call init after fade starts (and largely finishes) to avoid instant toggle
      const FADE_MS = 2000; // keep in sync with CSS
      setTimeout(() => {
        if (typeof init === 'function') init();
      }, FADE_MS + 50);
    });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();
