/**
 * STARGATE: REMNANTS — Tutorial Overlay System  (Phase 8)
 *
 * Spotlights UI elements in sequence with tooltip cards explaining each one.
 * Triggered automatically after the intro on a new game, or manually via the
 * ? help button.
 *
 * Design:
 *   - Dark backdrop with a transparent "cutout" (box-shadow trick) over each target
 *   - Tooltip card positioned intelligently (above/below/left/right) to avoid edges
 *   - Progress dots, Next / Skip buttons
 *   - Scrolls nav tabs into view, navigates scenes as needed
 *   - No external dependencies — pure DOM/CSS
 *
 * Public API
 * ──────────
 *   Tutorial.start()         — begin from step 0
 *   Tutorial.skip()          — dismiss immediately
 *   Tutorial.shouldShow(s)   — true if not yet seen
 *   Tutorial.replay()        — force-restart even if seen
 *
 * State integration
 *   Sets s.flags.tutorialSeen = true when complete or skipped.
 */

const Tutorial = (() => {

  // ── Step definitions ──────────────────────────────────────────────────────
  // Each step: { target, title, body, scene?, position?, wide? }
  //   target   — CSS selector of element to spotlight (null = centred card only)
  //   title    — card heading
  //   body     — card explanation (HTML allowed)
  //   scene    — navigate to this scene before showing (optional)
  //   position — preferred card placement: 'above'|'below'|'left'|'right'|'auto'
  //   wide     — if true, card is wider (up to 420px, clamped to viewport)

  const STEPS = [

    // ── 0: Welcome ──
    {
      target:   null,
      title:    'Welcome to Stargate: Remnants',
      body:     `You are the commanding officer of an isolated SGC installation. ` +
                `Earth is unreachable. Rebuild, explore, and research your way back.<br><br>` +
                `This brief tour covers the key systems. Press <b>Next</b> to continue ` +
                `or <b>Skip</b> to jump straight in.`,
      position: 'center',
      wide:     true,
    },

    // ── 1: Time bar ──
    {
      target:   '#day-night-bar',
      title:    'Day / Night Cycle',
      body:     `This bar tracks the in-game clock. Each real-world second is roughly ` +
                `5 in-game minutes. The moving icon shows the current phase — ` +
                `<b>◑ Dawn · ☀ Day · ◐ Dusk · ☽ Night</b>. ` +
                `Resource consumption, construction, and events all run on this clock.`,
      position: 'below',
    },

    // ── 2: Resource bar ──
    {
      target:   '#resource-bar',
      title:    'Resources',
      body:     `Your key resources at a glance. ` +
                `<b>Power</b> is consumed by each room per day. ` +
                `<b>Food</b> is consumed by personnel. ` +
                `<b>Naquadah</b> is your primary build material. ` +
                `<b>Data</b> fuels research and address decoding.`,
      position: 'below',
    },

    // ── 3: Nav tabs ──
    {
      target:   '#main-nav',
      title:    'Navigation',
      body:     `Switch screens using these tabs: ` +
                `<b>Base</b> · <b>Personnel</b> · <b>Gate</b> · ` +
                `<b>Research</b> · <b>Workshop</b>`,
      position: 'below',
    },

    // ── 4: Base schematic ──
    {
      target:   '#base-diagram',
      title:    'Base Schematic',
      scene:    'home',
      body:     `Your installed rooms are shown here. The <b>Gate Room</b> and <b>Control Room</b> ` +
                `are always present. Each additional room consumes 1 Power per day. ` +
                `Tap <b>+ Build Room</b> to add new facilities — they take a few hours to construct.`,
      position: 'auto',
      wide:     true,
    },

    // ── 5: Control log ──
    {
      target:   '#control-log',
      title:    'Control Room Log',
      scene:    'home',
      body:     `All events and status messages appear here, colour-coded by type:<br>` +
                `<span style="color:#5de878">■ Green</span> — benefit or positive outcome<br>` +
                `<span style="color:#f05858">■ Red</span> — danger, damage, or threat<br>` +
                `<span style="color:var(--c-amber-bright)">■ Cyan/Amber</span> — inbound gate activity`,
      position: 'above',
      wide:     true,
    },

    // ── 6: Personnel (centred — navigates to scene) ──
    {
      target:   null,
      title:    'Personnel',
      scene:    'personnel',
      body:     `Each team member has four stats: <b>Combat</b>, <b>Diplomacy</b>, ` +
                `<b>Science</b>, and <b>Survival</b>. ` +
                `Assign them to training to improve stats, or send them off-world ` +
                `via the Gate screen. Personnel take damage on dangerous missions — ` +
                `keep a <b>Medical Bay</b> stocked.`,
      position: 'center',
      wide:     true,
    },

    // ── 7: Gate (centred — navigates to scene) ──
    {
      target:   null,
      title:    'Stargate',
      scene:    'gate',
      body:     `Dial any decoded address to send a team off-world. Use the <b>DHD</b> ` +
                `to enter symbols manually, or tap a <b>Known Address</b> on the right ` +
                `to auto-dial. Unknown addresses must be decoded — work through the ` +
                `clues in the <b>Unknown Addresses</b> panel below Known Addresses.`,
      position: 'center',
      wide:     true,
    },

    // ── 8: Gate addresses panel ──
    {
      target:   '.speedial-panel',
      title:    'Gate Addresses',
      scene:    'gate',
      body:     `<b>Known Addresses</b> are ready to dial — click any to auto-dial the gate. ` +
                `<b>Unknown Addresses</b> are listed below. Click one to view its decoding ` +
                `puzzle — solve riddles and gather intel to reveal its symbols one by one.`,
      position: 'auto',
      wide:     true,
    },

    // ── 9: Research (centred) ──
    {
      target:   null,
      title:    'Research',
      scene:    'research',
      body:     `Build a <b>Research Lab</b> to unlock the tech tree. Each technology costs ` +
                `Data and takes time. Upgrades improve combat, resource efficiency, and ` +
                `crafting — some are required to progress the main story.`,
      position: 'center',
      wide:     true,
    },

    // ── 10: Workshop (centred) ──
    {
      target:   null,
      title:    'Workshop',
      scene:    'crafting',
      body:     `Build a <b>Workshop</b> room to craft equipment for your team. ` +
                `Crafted items provide combat and stat bonuses when assigned to personnel. ` +
                `Check the recipe list to see what resources each item needs.`,
      position: 'center',
      wide:     true,
    },

    // ── 11: Inbound gate events ──
    {
      target:   '#event-alert-btn',
      title:    'Gate Alerts',
      scene:    'home',
      body:     `When something arrives through the gate, this alert button pulses. ` +
                `The game <b>pauses automatically</b> — you must choose how to respond ` +
                `before time resumes. Choices affect resources, personnel health, and ` +
                `decoding progress. Urgent alerts are shown in red; gate activity in amber.`,
      position: 'below',
      wide:     true,
    },

    // ── 12: Menu / Save ──
    {
      target:   '#app-header .btn-icon',
      title:    'Menu & Saving',
      scene:    'home',
      body:     `Tap <b>☰</b> to open the menu. Save your game to any of the three slots — ` +
                `each slot shows the base name, day, and time of last save. ` +
                `The game also autosaves every 30 seconds.`,
      position: 'below',
    },

    // ── 13: Win condition ──
    {
      target:   null,
      title:    'Your Mission',
      body:     `Decode all gate addresses. Find the <b>Ancient Outpost</b> — it holds ` +
                `the address to the Pegasus Galaxy. Research the <b>ZPM Interface</b>, ` +
                `install a Zero Point Module, and dial the seven-chevron address.<br><br>` +
                `<span style="color:var(--c-amber-bright)">Good luck, Colonel.</span>`,
      position: 'center',
      wide:     true,
    },
  ];

  // ── State ─────────────────────────────────────────────────────────────────

  let _step    = 0;
  let _active  = false;
  let _resizeObserver = null;
  let _resizeTimer    = null;

  // ── Public ────────────────────────────────────────────────────────────────

  function shouldShow(s) {
    return s && !s.flags.tutorialSeen;
  }

  function start() {
    _step   = 0;
    _active = true;
    _ensureDOM();
    document.getElementById('tutorial-overlay').classList.add('tut-active');
    document.getElementById('tut-help-btn')?.classList.add('tut-running');
    _showStep(_step);
    _attachResize();
  }

  function skip() {
    _dismiss();
    Audio.play('cancel');
  }

  function replay() {
    if (State.isReady()) State.get().flags.tutorialSeen = false;
    start();
  }

  // ── Internal: DOM bootstrap ───────────────────────────────────────────────

  function _ensureDOM() {
    if (document.getElementById('tutorial-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.innerHTML = `
      <div class="tut-backdrop"></div>
      <div class="tut-spotlight" id="tut-spotlight"></div>
      <div class="tut-card" id="tut-card">
        <div class="tut-step-badge" id="tut-step-badge"></div>
        <div class="tut-card-title" id="tut-card-title"></div>
        <div class="tut-card-body"  id="tut-card-body"></div>
        <div class="tut-progress"   id="tut-progress"></div>
        <div class="tut-card-actions">
          <button class="tut-btn tut-btn-skip"  onclick="Tutorial.skip()">Skip Tour</button>
          <button class="tut-btn tut-btn-next"  id="tut-next-btn" onclick="Tutorial._next()">Next →</button>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(overlay);
  }

  // ── Internal: show a step ─────────────────────────────────────────────────

  function _showStep(index) {
    const step = STEPS[index];
    if (!step) { _complete(); return; }

    if (step.scene) UI.navigateTo(step.scene);

    // Wait for scene render before measuring positions
    requestAnimationFrame(() => setTimeout(() => _renderStep(step, index), 80));
  }

  function _renderStep(step, index) {
    const badge = document.getElementById('tut-step-badge');
    const title = document.getElementById('tut-card-title');
    const body  = document.getElementById('tut-card-body');
    const next  = document.getElementById('tut-next-btn');
    const card  = document.getElementById('tut-card');
    if (!card) return;

    badge.textContent = `Step ${index + 1} of ${STEPS.length}`;
    title.textContent = step.title;
    body.innerHTML    = step.body;
    next.textContent  = index === STEPS.length - 1 ? 'Begin →' : 'Next →';

    // Card width clamped to viewport — never overflows on narrow screens
    const maxW = step.wide ? 420 : 320;
    card.style.maxWidth = `min(${maxW}px, calc(100vw - 24px))`;

    // Progress dots
    const prog = document.getElementById('tut-progress');
    prog.innerHTML = '';
    STEPS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'tut-dot' +
        (i === index  ? ' tut-dot-active' :
         i <  index   ? ' tut-dot-done'   : '');
      prog.appendChild(dot);
    });

    // Spotlight + card position
    const spotlight = document.getElementById('tut-spotlight');
    const target    = step.target ? document.querySelector(step.target) : null;

    if (!target || step.position === 'center') {
      spotlight.style.display = 'none';
      _positionCardCentre(card);
    } else {
      spotlight.style.display = 'block';
      _positionSpotlight(spotlight, target);
      _positionCard(card, target, step.position || 'auto');
      target.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }

    // Re-trigger enter animation
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
  }

  // ── Spotlight positioning ─────────────────────────────────────────────────

  function _positionSpotlight(el, target) {
    const r   = target.getBoundingClientRect();
    const app = document.getElementById('app').getBoundingClientRect();
    const PAD = 6;

    el.style.left   = `${r.left   - app.left - PAD}px`;
    el.style.top    = `${r.top    - app.top  - PAD}px`;
    el.style.width  = `${r.width  + PAD * 2}px`;
    el.style.height = `${r.height + PAD * 2}px`;
  }

  // ── Card positioning ──────────────────────────────────────────────────────

  function _positionCardCentre(card) {
    card.classList.add('tut-centred');
    card.style.position  = 'fixed';
    card.style.top       = '50%';
    card.style.left      = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.style.right     = '';
    card.style.bottom    = '';
  }

  function _positionCard(card, target, preferred) {
    card.classList.remove('tut-centred');
    card.style.position  = 'absolute';
    card.style.transform = '';

    const appEl = document.getElementById('app');
    const appR  = appEl.getBoundingClientRect();
    const tR    = target.getBoundingClientRect();
    const MARGIN = 12;

    // Convert to app-relative coords
    const tTop    = tR.top    - appR.top;
    const tLeft   = tR.left   - appR.left;
    const tBottom = tTop  + tR.height;
    const tRight  = tLeft + tR.width;
    const appW    = appR.width;
    const appH    = appR.height;

    const cardW = card.offsetWidth  || Math.min(parseInt(card.style.maxWidth) || 320, appW - 24);
    const cardH = card.offsetHeight || 220;

    const spaceBelow = appH - tBottom;
    const spaceAbove = tTop;
    const spaceRight = appW - tRight;
    const spaceLeft  = tLeft;

    let place = preferred;

    // Auto: pick side with most space
    if (place === 'auto') {
      const spaces = { below: spaceBelow, above: spaceAbove, right: spaceRight, left: spaceLeft };
      place = Object.keys(spaces).reduce((a, b) => spaces[a] > spaces[b] ? a : b);
    }

    // Fallback chain: preferred → alternatives → centre
    if (place === 'left'  && spaceLeft  < cardW + MARGIN * 2) place = 'below';
    if (place === 'right' && spaceRight < cardW + MARGIN * 2) place = 'below';
    if (place === 'below' && spaceBelow < cardH + MARGIN * 2) place = 'above';
    if (place === 'above' && spaceAbove < cardH + MARGIN * 2) place = 'below';
    // If still not enough room anywhere, fall back to centred overlay
    if (place === 'below' && spaceBelow < 80 && spaceAbove < 80) {
      _positionCardCentre(card);
      return;
    }

    let top, left;

    switch (place) {
      case 'below':
        top  = tBottom + MARGIN;
        left = tLeft;
        break;
      case 'above':
        top  = tTop - cardH - MARGIN;
        left = tLeft;
        break;
      case 'right':
        top  = tTop;
        left = tRight + MARGIN;
        break;
      case 'left':
        top  = tTop;
        left = tLeft - cardW - MARGIN;
        break;
      default:
        top  = tBottom + MARGIN;
        left = tLeft;
    }

    // Clamp to viewport bounds so card never goes off-screen
    left = Math.max(MARGIN, Math.min(left, appW - cardW - MARGIN));
    top  = Math.max(MARGIN, Math.min(top,  appH - cardH - MARGIN));

    card.style.left   = `${left}px`;
    card.style.top    = `${top}px`;
    card.style.right  = '';
    card.style.bottom = '';
  }

  // ── Next / complete / dismiss ─────────────────────────────────────────────

  function _next() {
    if (!_active) return;
    Audio.play('click');
    _step++;
    if (_step >= STEPS.length) {
      _complete();
    } else {
      _showStep(_step);
    }
  }

  function _complete() {
    _dismiss();
    Audio.play('confirm');
    UI.showNotification('Tour complete. Good luck, Commander.', 'success');
  }

  function _dismiss() {
    _active = false;
    _detachResize();

    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.remove('tut-active');

    document.getElementById('tut-help-btn')?.classList.remove('tut-running');

    if (State.isReady()) State.get().flags.tutorialSeen = true;
  }

  // ── Resize handling ───────────────────────────────────────────────────────

  function _attachResize() {
    _resizeObserver = new ResizeObserver(() => {
      if (!_active) return;
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (_active) _showStep(_step);
      }, 120);
    });
    const appEl = document.getElementById('app');
    if (appEl) _resizeObserver.observe(appEl);
  }

  function _detachResize() {
    if (_resizeObserver) {
      _resizeObserver.disconnect();
      _resizeObserver = null;
    }
    if (_resizeTimer) {
      clearTimeout(_resizeTimer);
      _resizeTimer = null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    start,
    skip,
    replay,
    shouldShow,
    _next,   // exposed for inline onclick
  };

})();
