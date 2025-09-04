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

  function buildGameShell() {
    // Create topbar + stage markup exactly as game.js expects
    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <button id="fullscreenBtn" class="secondary-btn">Fullscreen</button>
      <button id="muteBtn" class="secondary-btn">Mute</button>
    `;

    const stage = document.createElement('div');
    stage.id = 'stage';
    stage.className = 'stage';

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width = 720;
    canvas.height = 480;
    stage.appendChild(canvas);

    // Overlays expected by game.js
    stage.insertAdjacentHTML(
      'beforeend',
      `
      <div id="startOverlay" class="overlay hidden">
        <img src="assets/img/9_intro_outro_screens/start/startscreen_1.png" alt="Startscreen" />
        <div class="overlay-actions">
          <button id="startBtn" class="primary-btn">START</button>
          <button id="howToBtn" class="secondary-btn">HOW TO PLAY</button>
        </div>
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

    document.body.prepend(topbar);
    document.body.appendChild(stage);

    // Now call game init (already added window load listener as fallback)
    if (typeof init === 'function') {
      init();
    }
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
      // Fade out landing, then remove and mount game UI
      if (L.landing) {
        L.landing.style.transition = 'opacity 600ms ease';
        L.landing.style.opacity = '0';
        setTimeout(() => {
          L.landing.remove();
          buildGameShell();
        }, 620);
      } else {
        buildGameShell();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();
