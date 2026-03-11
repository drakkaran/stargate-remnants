/**
 * STARGATE: REMNANTS — Intro Sequence  (Phase 8)
 *
 * Four-scene cinematic intro that plays before the first new game.
 * Entirely CSS/HTML/JS — no external assets.
 *
 * Scene 1 — BLACKOUT      : Emergency red flicker, "ALL SYSTEMS OFFLINE"
 * Scene 2 — BOOT SEQUENCE : Green-on-black console text scrolling in
 * Scene 3 — GATE GRAPHIC  : CSS gate ring awakening, chevrons lighting
 * Scene 4 — MISSION BRIEF : Typewriter mission briefing, then Enter Game
 *
 * Public API
 * ──────────
 *   Intro.start()         — begin the intro (called by engine after newGame)
 *   Intro.skip()          — jump straight to game (also wired to skip button)
 *   Intro.shouldShow(s)   — returns true if intro hasn't been seen this save
 *
 * State integration
 *   Sets s.flags.introSeen = true when complete or skipped.
 */

const Intro = (() => {

  // ── Scene data ────────────────────────────────────────────────────────────

  // Boot console lines — rendered one by one with staggered delays
  const BOOT_LINES = [
    { text: 'SGC REMNANTS INSTALLATION — OFFWORLD BASE ALPHA',    cls: 'intro-con-ok',   delay: 0 },
    { text: '',                                                    cls: 'intro-con-blank', delay: 80 },
    { text: '> BIOS v4.21.07  .... [ OK ]',                       cls: 'intro-con-ok',   delay: 100 },
    { text: '> POWER CELL CHECK  .... [ CRITICAL — 12% ]',        cls: 'intro-con-err',  delay: 260 },
    { text: '> CRYO-REVIVAL SEQUENCE  .... [ OK ]',               cls: 'intro-con-ok',   delay: 440 },
    { text: '> GATE ROOM SYSTEMS  .... [ ONLINE ]',               cls: 'intro-con-ok',   delay: 620 },
    { text: '> CONTROL ROOM UPLINK  .... [ OK ]',                 cls: 'intro-con-ok',   delay: 800 },
    { text: '> LIFE SUPPORT  .... [ STABLE ]',                    cls: 'intro-con-ok',   delay: 960 },
    { text: '',                                                    cls: 'intro-con-blank', delay: 1100 },
    { text: '> RUNNING DIAGNOSTIC:',                              cls: 'intro-con-ok',   delay: 1180 },
    { text: '  EARTH GATE ADDRESS  .... [ DISCONNECTED ]',        cls: 'intro-con-err',  delay: 1360 },
    { text: '  ALPHA SITE COMMS  .... [ NO SIGNAL ]',             cls: 'intro-con-err',  delay: 1540 },
    { text: '  IOA SUBSPACE LINK  .... [ CARRIER LOST ]',         cls: 'intro-con-err',  delay: 1720 },
    { text: '',                                                    cls: 'intro-con-blank', delay: 1900 },
    { text: '> DHD PARTIAL MEMORY DUMP  .... [ 7 ADDRESSES FOUND ]', cls: 'intro-con-warn', delay: 2000 },
    { text: '> PERSONNEL STATUS: 4 REVIVED, 0 CASUALTIES',        cls: 'intro-con-ok',   delay: 2200 },
    { text: '',                                                    cls: 'intro-con-blank', delay: 2400 },
    { text: '> INITIATING BASE COMMAND PROTOCOLS...',             cls: 'intro-con-warn',  delay: 2520 },
  ];

  // Mission brief text for scene 4 (typewriter effect)
  const BRIEF_TEXT =
    `You are the senior officer of a stranded SGC installation. ` +
    `Contact with Earth has been lost. ` +
    `The base is operational but under-resourced. ` +
    `Seven gate addresses remain encoded in the DHD's partial memory — ` +
    `locked, corrupted, waiting to be decoded.\n\n` +
    `Rebuild. Research. Explore.\n\n` +
    `Find a way to the Pegasus Galaxy, or die trying.`;

  // ── State ─────────────────────────────────────────────────────────────────

  let _sceneIndex   = 0;
  let _running      = false;
  let _timers       = [];
  let _typeInterval = null;

  // ── Public: should show? ──────────────────────────────────────────────────

  function shouldShow(s) {
    return s && !s.flags.introSeen;
  }

  // ── Public: start ─────────────────────────────────────────────────────────

  function start() {
    const el = document.getElementById('intro-screen');
    if (!el) { console.error('[Intro] #intro-screen not found'); return; }

    // Clear any previous run state
    _clear();
    _running    = true;
    _sceneIndex = 0;

    // Reset built flag so HTML is freshly written each new game
    delete el.dataset.built;

    // Build DOM first (synchronous), then unhide
    _buildHTML();
    el.classList.remove('intro-hidden');

    // Two rAF frames so browser paints the element before we start animating
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!_running) return;

      // Show scene 1 immediately
      _showScene(0);
      try { if (typeof Audio !== 'undefined') Audio.play('intro_alarm'); } catch(e) {}

      // Scene 2: Boot console
      _t(3200, () => {
        if (!_running) return;
        try { if (typeof Audio !== 'undefined') Audio.play('intro_boot'); } catch(e) {}
        _showScene(1);
        _renderBootLines();
      });

      // Scene 3: Gate graphic
      _t(6800, () => {
        if (!_running) return;
        _showScene(2);
        _awakeneGate();
      });

      // Scene 4: Mission brief
      _t(10800, () => {
        if (!_running) return;
        _showScene(3);
        _typewriterBrief();
      });
    }));
  }

  // ── Public: skip ─────────────────────────────────────────────────────────

  function skip() {
    _clear();
    _markSeen();
    const el = document.getElementById('intro-screen');
    if (el) el.classList.add('intro-hidden');
    Audio.play('click');
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _t(ms, fn) {
    const id = setTimeout(fn, ms);
    _timers.push(id);
    return id;
  }

  function _clear() {
    _running = false;
    _timers.forEach(clearTimeout);
    _timers = [];
    if (_typeInterval) { clearInterval(_typeInterval); _typeInterval = null; }
  }

  function _markSeen() {
    if (State.isReady()) State.get().flags.introSeen = true;
  }

  // ── Build the full intro DOM once ─────────────────────────────────────────

  function _buildHTML() {
    const screen = document.getElementById('intro-screen');
    if (!screen || screen.dataset.built) return;
    screen.dataset.built = '1';

    screen.innerHTML = `
      <!-- Skip button -->
      <button id="intro-skip-btn" onclick="Intro.skip()">SKIP ▶</button>

      <div class="intro-stage">

        <!-- Scene 1: Emergency Blackout -->
        <div class="intro-scene" id="intro-scene-1">
          <div class="intro-alert-bar bar-top"></div>
          <div class="intro-alert-bar bar-bottom"></div>
          <div class="intro-red-flicker"></div>
          <div class="intro-scan-sweep"></div>

          <div class="intro-emergency-text">
            <div class="intro-em-label">⚠ EMERGENCY PROTOCOL ACTIVE ⚠</div>
            <div class="intro-em-headline">ALL SYSTEMS<br>OFFLINE</div>
            <div class="intro-em-sub">INITIATING EMERGENCY CRYO-REVIVAL</div>
          </div>
        </div>

        <!-- Scene 2: Boot Console -->
        <div class="intro-scene" id="intro-scene-2">
          <div class="intro-console" id="intro-console-output"></div>
        </div>

        <!-- Scene 3: Gate Graphic -->
        <div class="intro-scene" id="intro-scene-3">
          <div class="intro-gate-ring" id="intro-gate-ring">
            <div class="intro-gate-outer"></div>
            <div class="intro-symbol-ring"></div>
            <div class="intro-gate-inner"></div>
            <div class="intro-wormhole" id="intro-wormhole"></div>
            <!-- 9 chevrons -->
            ${Array.from({length:9}).map((_, i) =>
              `<div class="intro-chevron" id="ichev-${i}"></div>`
            ).join('')}
          </div>

          <div class="intro-gate-caption">
            <div class="cap-title" id="intro-cap-title">Stargate: Remnants</div>
            <div class="cap-sub"   id="intro-cap-sub">
              The gate is active. The gate is waiting.<br>
              Seven worlds. Unknown threats. One chance to reach Pegasus.
            </div>
          </div>
        </div>

        <!-- Scene 4: Mission Brief -->
        <div class="intro-scene" id="intro-scene-4">
          <div class="intro-brief">
            <div class="intro-brief-label">MISSION BRIEFING — CLASSIFIED</div>
            <div class="intro-brief-title">OPERATION: REMNANTS</div>
            <div class="intro-brief-body" id="intro-brief-body"><span class="intro-typewriter-cursor"></span></div>
            <div class="intro-brief-continue" id="intro-brief-continue" style="display:none"
                 onclick="Intro._completeBrief()">
              ▶ ACCEPT MISSION
            </div>
          </div>
        </div>

      </div><!-- .intro-stage -->
    `;
  }

  // ── Scene transitions ──────────────────────────────────────────────────────

  function _showScene(index) {
    const scenes = document.querySelectorAll('.intro-scene');
    scenes.forEach((el, i) => {
      el.classList.toggle('scene-active', i === index);
    });
    _sceneIndex = index;
  }

  // ── Scene 2: Boot console lines ───────────────────────────────────────────

  function _renderBootLines() {
    const container = document.getElementById('intro-console-output');
    if (!container) return;
    container.innerHTML = '';

    BOOT_LINES.forEach(({ text, cls, delay }) => {
      _t(delay, () => {
        if (!_running || _sceneIndex !== 1) return;
        const line = document.createElement('span');
        line.className = `intro-console-line ${cls}`;
        line.style.animationDelay = '0ms';
        if (cls === 'intro-con-blank') {
          line.innerHTML = ' ';
        } else {
          const prefix = `<span class="intro-con-prefix">&gt;&nbsp;</span>`;
          line.innerHTML = (text.startsWith('>') || text.startsWith('  '))
            ? text
            : `${prefix}${text}`;
          if (text.startsWith('> ')) {
            line.innerHTML = `<span class="intro-con-prefix">&gt;&nbsp;</span>${text.slice(2)}`;
          }
        }
        container.appendChild(line);
        // Keep scrolled to bottom
        container.scrollTop = container.scrollHeight;
        // Beep on important lines
        if (cls === 'intro-con-err') Audio.play('intro_boot');
      });
    });

    // Cursor at end
    _t(2700, () => {
      if (!_running || _sceneIndex !== 1) return;
      const cursor = document.createElement('span');
      cursor.innerHTML = '<span class="intro-cursor"></span>';
      container.appendChild(cursor);
    });
  }

  // ── Scene 3: Gate awakening ───────────────────────────────────────────────

  function _awakeneGate() {
    const ring = document.getElementById('intro-gate-ring');
    const wh   = document.getElementById('intro-wormhole');
    const capTitle = document.getElementById('intro-cap-title');
    const capSub   = document.getElementById('intro-cap-sub');

    // Light up chevrons one by one
    for (let i = 0; i < 9; i++) {
      _t(i * 300 + 200, () => {
        if (!_running) return;
        const chev = document.getElementById(`ichev-${i}`);
        if (chev) {
          chev.classList.add('chev-lit');
          Audio.play('chevron');
        }
      });
    }

    // Activate ring
    _t(2900, () => {
      if (!_running) return;
      if (ring) ring.classList.add('ring-active');
    });

    // Wormhole opens
    _t(3400, () => {
      if (!_running) return;
      if (wh) wh.classList.add('wh-active');
      Audio.play('intro_wormhole');
    });

    // Show caption
    _t(3800, () => {
      if (!_running) return;
      if (capTitle) capTitle.classList.add('cap-visible');
    });
    _t(4400, () => {
      if (!_running) return;
      if (capSub) capSub.classList.add('cap-visible');
    });
  }

  // ── Scene 4: Typewriter mission brief ─────────────────────────────────────

  function _typewriterBrief() {
    const body = document.getElementById('intro-brief-body');
    if (!body) return;

    body.innerHTML = '<span class="intro-typewriter-cursor"></span>';
    let charIndex  = 0;
    const text     = BRIEF_TEXT;

    // Type one character every ~30ms (fast but readable)
    _typeInterval = setInterval(() => {
      if (!_running) { clearInterval(_typeInterval); return; }
      if (charIndex >= text.length) {
        clearInterval(_typeInterval);
        _typeInterval = null;
        _showContinue();
        return;
      }

      const ch = text[charIndex++];

      // Build rendered text — replace newlines with <br>
      const rendered = text.slice(0, charIndex).replace(/\n/g, '<br>');
      body.innerHTML = rendered + '<span class="intro-typewriter-cursor"></span>';

    }, 28);
  }

  function _showContinue() {
    const el = document.getElementById('intro-brief-continue');
    if (el) el.style.display = 'block';
  }

  // ── Called when player clicks "Accept Mission" ────────────────────────────

  function _completeBrief() {
    _clear();
    _markSeen();
    Audio.play('confirm');

    // Fade out intro screen
    const el = document.getElementById('intro-screen');
    if (el) {
      el.style.transition = 'opacity 1s ease';
      el.style.opacity    = '0';
      setTimeout(() => {
        el.classList.add('intro-hidden');
        el.style.opacity = '';
        // Chain: after intro, start tutorial if not seen
        const s = State.isReady() ? State.get() : null;
        if (typeof Tutorial !== 'undefined' && Tutorial.shouldShow(s)) {
          setTimeout(() => Tutorial.start(), 300);
        }
      }, 1000);
    }

    // Start music when game begins
    if (Audio.isEnabled()) {
      setTimeout(() => Audio.startMusic(), 800);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    start,
    skip,
    shouldShow,
    _completeBrief,   // exposed for inline onclick
  };

})();
